import { NextResponse } from "next/server";

const BASE_URL = "https://get.api.sismetro.com/";

const UNIT = process.env.SISMETRO_UNIT ?? "484";
const KEY = process.env.SISMETRO_KEY ?? "SEU_TOKEN_AQUI";

// 27 requisições/minuto aprox. -> fica abaixo do limite de 30/min
const DELAY_BETWEEN_REQUESTS_MS = 2200;
const MAX_RETRIES = 4;
const REQUEST_TIMEOUT_MS = 20_000;
const CACHE_TTL_MS = 60_000;

type Payload = {
  ok: boolean;
  totalPages: number;
  count: number;
  items: any[];
  cached?: boolean;
};

let cache:
  | {
      ts: number;
      payload: Payload;
    }
  | null = null;

let inFlight: Promise<Payload> | null = null;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        unit: UNIT,
        key: KEY,
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err: any = new Error(`Sismetro HTTP ${res.status}: ${text.slice(0, 300)}`);
      err.status = res.status;

      const retryAfter = Number(res.headers.get("retry-after") || 0);
      err.retryAfterMs =
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 0;

      throw err;
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPageWithRetry(page: number, attempt = 1): Promise<any> {
  try {
    return await fetchJson(`${BASE_URL}SS/listAll?page=${pad2(page)}`);
  } catch (err: any) {
    const status = Number(err?.status ?? 0);
    const canRetry =
      err?.name === "AbortError" || status === 429 || status >= 500;

    if (!canRetry || attempt >= MAX_RETRIES) {
      throw err;
    }

    const retryAfterMs = Number(err?.retryAfterMs ?? 0);
    const waitMs =
      retryAfterMs > 0
        ? retryAfterMs
        : DELAY_BETWEEN_REQUESTS_MS * (attempt + 1) * 2;

    await sleep(waitMs);
    return fetchPageWithRetry(page, attempt + 1);
  }
}

async function loadAllPages(): Promise<Payload> {
  const first = await fetchPageWithRetry(1);

  const totalPages = Number(first?.totalPages ?? 1);
  const firstList = Array.isArray(first?.resultList) ? first.resultList : [];

  const all: any[] = [...firstList];

  for (let p = 2; p <= totalPages; p++) {
    await sleep(DELAY_BETWEEN_REQUESTS_MS);

    const pageData = await fetchPageWithRetry(p);
    const list = Array.isArray(pageData?.resultList) ? pageData.resultList : [];
    all.push(...list);
  }

  return {
    ok: true,
    totalPages,
    count: all.length,
    items: all,
  };
}

export async function GET() {
  try {
    if (!KEY || KEY === "SEU_TOKEN_AQUI") {
      return NextResponse.json(
        { ok: false, error: "Configure SISMETRO_KEY no .env.local" },
        { status: 500 }
      );
    }

    const now = Date.now();

    // cache curto para evitar repaginar a API toda hora
    if (cache && now - cache.ts < CACHE_TTL_MS) {
      return NextResponse.json({
        ...cache.payload,
        cached: true,
      });
    }

    // deduplicação: se já existe uma carga em andamento, reaproveita
    if (!inFlight) {
      inFlight = loadAllPages()
        .then((payload) => {
          cache = {
            ts: Date.now(),
            payload,
          };
          return payload;
        })
        .finally(() => {
          inFlight = null;
        });
    }

    const payload = await inFlight;
    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Erro desconhecido" },
      { status: 500 }
    );
  }
}