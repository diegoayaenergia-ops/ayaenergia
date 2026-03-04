// app/api/tecsci/energy/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

const API_KEY = String(process.env.TECSCI_API_KEY || "").trim();
const BASE_URL_RAW = String(process.env.TECSCI_BASE_URL || "https://system.tecsci.com.br/openapi/v1/power-stations/").trim();

function normBase(u: string) {
  const s = (u || "").trim();
  return s.endsWith("/") ? s : s + "/";
}
const BASE_URL = normBase(BASE_URL_RAW);

// fallback (caso o endpoint de listagem não retorne como esperado)
const DEFAULT_STATIONS: Array<{ id: number; code: string; name: string }> = [
  { id: 1, code: "RBB", name: "RBB" },
  { id: 7, code: "BLH", name: "BLH" },
  { id: 8, code: "BES", name: "BES" },
  { id: 9, code: "SB3", name: "SB3" },
  { id: 10, code: "RGN", name: "RGN" },
  { id: 11, code: "MAP", name: "MAP" },
  { id: 12, code: "LRJ", name: "LRJ" },
  { id: 13, code: "GAR", name: "GAR" },
  { id: 14, code: "MNR", name: "MNR" },
  { id: 15, code: "PRG", name: "PRG" },
  { id: 42, code: "RIN", name: "RIN" },
  { id: 43, code: "PPL", name: "PPL" },
  { id: 44, code: "SB6", name: "SB6" },
  { id: 45, code: "GUA", name: "GUA" },
  { id: 46, code: "ITU", name: "ITU" },
  { id: 65, code: "CON", name: "CON" },
  { id: 68, code: "PIR", name: "PIR" },
];

async function fetchWithTimeout(url: string, init: RequestInit, ms = 20000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
  } finally {
    clearTimeout(id);
  }
}

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

function pickStationFields(x: any) {
  const id = Number(x?.id);
  const code = String(x?.code || x?.short_code || x?.abbreviation || x?.slug || "").trim();
  const name = String(x?.name || x?.title || code || `ID ${id}`).trim();
  if (!Number.isFinite(id) || !code) return null;
  return { id, code, name };
}

export async function GET(req: Request) {
  if (!API_KEY) {
    return NextResponse.json({ ok: false, error: "Faltou TECSCI_API_KEY nas Environment Variables." }, { status: 500 });
  }

  // tenta listar no endpoint BASE_URL (normalmente /power-stations/)
  try {
    const res = await tecFetch(BASE_URL);
    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();

    if (res.ok && contentType.includes("application/json")) {
      const payload = JSON.parse(raw);

      // APIs variam: {data:[...]} ou [...]
      const arr = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      const stations = arr.map(pickStationFields).filter(Boolean);

      if (stations.length > 0) {
        return NextResponse.json({ ok: true, stations }, { status: 200, headers: { "Cache-Control": "no-store" } });
      }
    }
  } catch {
    // cai no fallback
  }

  return NextResponse.json({ ok: true, stations: DEFAULT_STATIONS }, { status: 200, headers: { "Cache-Control": "no-store" } });
}