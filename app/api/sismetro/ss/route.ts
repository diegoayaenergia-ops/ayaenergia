import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = "https://get.api.sismetro.com/";
const UNIT = process.env.SISMETRO_UNIT ?? "";
const KEY = process.env.SISMETRO_KEY ?? "";

const CACHE_TTL_MS = 5 * 60 * 1000;
const MIN_INTERVAL_MS = 6500; // ~9 req/min, abaixo do limite 10/min

type SismetroListResponse = {
  totalPages?: number | string;
  resultList?: any[];
  [key: string]: any;
};

type SsPayload = {
  ok: boolean;
  totalPages: number;
  loadedPages: number[];
  failedPages: number[];
  count: number;
  items: any[];
  cached?: boolean;
  stale?: boolean;
  partial?: boolean;
  warning?: string;
};

let cache:
  | {
      expiresAt: number;
      payload: SsPayload;
    }
  | null = null;

let inFlight: Promise<NextResponse> | null = null;
let lastRequestAt = 0;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureConfig() {
  if (!UNIT || !KEY || KEY === "SEU_TOKEN_AQUI") {
    throw new Error(
      "Configuração inválida do Sismetro. Verifique SISMETRO_UNIT e SISMETRO_KEY."
    );
  }
}

async function waitForRateLimit() {
  const now = Date.now();
  const diff = now - lastRequestAt;

  if (diff < MIN_INTERVAL_MS) {
    await sleep(MIN_INTERVAL_MS - diff);
  }

  lastRequestAt = Date.now();
}

async function fetchJson(url: string, attempt = 0): Promise<SismetroListResponse> {
  await waitForRateLimit();

  const res = await fetch(url, {
    method: "GET",
    headers: {
      unit: UNIT,
      key: KEY,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after") || 0);
    const waitMs =
      retryAfter > 0 ? retryAfter * 1000 : 10000 + attempt * 5000;

    if (attempt < 3) {
      await sleep(waitMs);
      return fetchJson(url, attempt + 1);
    }

    const text = await res.text().catch(() => "");
    throw new Error(`Sismetro HTTP 429: ${text.slice(0, 300)}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sismetro HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  return (await res.json()) as SismetroListResponse;
}

async function loadAllSs(): Promise<SsPayload> {
  ensureConfig();

  const first = await fetchJson(`${BASE_URL}SS/listAll?page=01`);
  const totalPages = Math.max(1, Number(first?.totalPages ?? 1));
  const firstList = Array.isArray(first?.resultList) ? first.resultList : [];

  const loadedPages: number[] = [1];
  const failedPages: number[] = [];
  const all: any[] = [...firstList];

  for (let p = 2; p <= totalPages; p++) {
    try {
      const pageData = await fetchJson(`${BASE_URL}SS/listAll?page=${pad2(p)}`);
      const list = Array.isArray(pageData?.resultList) ? pageData.resultList : [];
      all.push(...list);
      loadedPages.push(p);
    } catch {
      failedPages.push(p);

      // se começou a falhar, devolve o que já conseguiu em vez de zerar tudo
      break;
    }
  }

  const partial = failedPages.length > 0 || loadedPages.length < totalPages;

  return {
    ok: true,
    totalPages,
    loadedPages,
    failedPages,
    count: all.length,
    items: all,
    partial,
    warning: partial
      ? `Dados parciais carregados. Páginas carregadas: ${loadedPages.length}/${totalPages}.`
      : undefined,
  };
}

export async function GET() {
  const now = Date.now();

  if (cache && cache.expiresAt > now) {
    return NextResponse.json({
      ...cache.payload,
      cached: true,
    });
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    try {
      const payload = await loadAllSs();

      cache = {
        expiresAt: Date.now() + CACHE_TTL_MS,
        payload,
      };

      return NextResponse.json(payload);
    } catch (err: any) {
      const message = err?.message ?? "Erro desconhecido";

      if (cache?.payload) {
        return NextResponse.json({
          ...cache.payload,
          cached: true,
          stale: true,
          warning:
            "Falha temporária ao consultar o Sismetro. Retornando último cache disponível.",
        });
      }

      return NextResponse.json(
        {
          ok: false,
          error: message,
        },
        { status: 500 }
      );
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}