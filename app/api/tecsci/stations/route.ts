import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

const DEFAULT_BASE = "https://system.tecsci.com.br/openapi/v1/power-stations/";

function normBase(u: string) {
  const s = (u || "").trim();
  return s.endsWith("/") ? s : s + "/";
}

function getCfg() {
  const apiKey = String(process.env.TECSCI_API_KEY || "").trim();
  const baseUrl = normBase(String(process.env.TECSCI_BASE_URL || DEFAULT_BASE).trim());
  return { apiKey, baseUrl };
}

async function fetchWithTimeout(url: string, init: RequestInit, ms = 20000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
  } finally {
    clearTimeout(id);
  }
}

async function tecFetch(url: string, apiKey: string) {
  const headersCandidates: HeadersInit[] = [
    { Accept: "application/json", "X-API-KEY": apiKey },
    { Accept: "application/json", "x-api-key": apiKey },
    { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
  ];

  let last: Response | null = null;

  for (const headers of headersCandidates) {
    const res = await fetchWithTimeout(url, { headers }, 20000);
    last = res;
    if (res.ok) return res;
    if (res.status !== 401 && res.status !== 403) return res;
  }

  return last!;
}

export async function GET(req: Request) {
  const { apiKey, baseUrl } = getCfg();
  const { searchParams } = new URL(req.url);
  const debug = searchParams.get("debug") === "1";

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Faltou TECSCI_API_KEY nas Environment Variables (Vercel).",
        ...(debug
          ? {
              debug: {
                vercelEnv: process.env.VERCEL_ENV || null,
                keyLen: apiKey.length,
                baseUrl,
              },
            }
          : {}),
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const url = `${baseUrl}`;

  const res = await tecFetch(url, apiKey);
  const ct = res.headers.get("content-type") || "";
  const raw = await res.text();

  if (!res.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `TecSci ${res.status} ao buscar usinas.`,
        ...(debug ? { debug: { url, bodyPreview: raw.slice(0, 600), contentType: ct } } : {}),
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  let payload: any = null;
  try {
    payload = ct.includes("application/json") ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

  const stations = list
    .map((x: any) => ({
      id: Number(x?.id),
      code: String(x?.code || "").trim(),
      name: String(x?.name || "").trim(),
      consumer_unit: Array.isArray(x?.consumer_unit) ? x.consumer_unit : [],
    }))
    .filter((s: any) => Number.isFinite(s.id) && s.name);

  stations.sort((a: any, b: any) => a.name.localeCompare(b.name));

  return NextResponse.json({ ok: true, stations }, { status: 200, headers: { "Cache-Control": "no-store" } });
}