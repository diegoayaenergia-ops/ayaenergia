// app/api/tecsci/stations/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

/**
 * ENV
 * - TECSCI_API_KEY
 * - TECSCI_BASE_URL (ex: https://system.tecsci.com.br/openapi/v1/power-stations/)
 */
const API_KEY = String(process.env.TECSCI_API_KEY || "").trim();
const BASE_URL_RAW = String(
  process.env.TECSCI_BASE_URL || "https://system.tecsci.com.br/openapi/v1/power-stations/"
).trim();

function normBase(u: string) {
  const s = (u || "").trim();
  return s.endsWith("/") ? s : s + "/";
}
const BASE_URL = normBase(BASE_URL_RAW);

async function fetchWithTimeout(url: string, init: RequestInit, ms = 20000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
  } finally {
    clearTimeout(id);
  }
}

/**
 * Tenta 3 formatos comuns de auth:
 * - X-API-KEY
 * - x-api-key
 * - Authorization: Bearer
 */
async function tecFetch(url: string) {
  const headersCandidates: HeadersInit[] = [
    { Accept: "application/json", "X-API-KEY": API_KEY },
    { Accept: "application/json", "x-api-key": API_KEY },
    { Accept: "application/json", Authorization: `Bearer ${API_KEY}` },
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

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(
      { ok: false, error: "Faltou TECSCI_API_KEY nas Environment Variables." },
      { status: 500 }
    );
  }

  const url = `${BASE_URL}`; // lista de power-stations

  const res = await tecFetch(url);
  const ct = res.headers.get("content-type") || "";
  const raw = await res.text();

  if (!res.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `TecSci ${res.status} ao buscar usinas.`,
        debug: { url, bodyPreview: raw.slice(0, 600), contentType: ct },
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

  return NextResponse.json(
    { ok: true, stations },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}