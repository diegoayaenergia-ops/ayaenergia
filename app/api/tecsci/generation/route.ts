// app/api/tecsci/generation/route.ts
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

function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
}
function isoMonth(iso: string) {
  return String(iso || "").slice(0, 7);
}
function isoYear(iso: string) {
  return String(iso || "").slice(0, 4);
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

function extractKwh(inv: any) {
  const keys = ["power_yields_kwh", "power_yield_kwh", "generation_kwh", "yield_kwh", "kwh", "energy_kwh", "energy"];
  for (const k of keys) {
    if (inv?.[k] != null) {
      const v = Number(inv[k]);
      return Number.isFinite(v) ? v : 0;
    }
  }
  return 0;
}

async function fetchDaily(psId: number, start: string, end: string) {
  const url = `${BASE_URL}${psId}/inverters/generation?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`;
  const res = await tecFetch(url);
  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();

  if (!res.ok) {
    return { ok: false as const, error: `Erro TecSci (${res.status})`, debug: { url, bodyPreview: raw.slice(0, 500) } };
  }

  let payload: any = null;
  try {
    payload = contentType.includes("application/json") ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  const data = Array.isArray(payload?.data) ? payload.data : [];
  const out: Array<{ day: string; kwh: number }> = [];

  for (const d of data) {
    const day = String(d?.date || "").slice(0, 10);
    if (!isIsoDate(day)) continue;
    const invs = Array.isArray(d?.inverters) ? d.inverters : [];
    let sum = 0;
    for (const inv of invs) sum += extractKwh(inv);
    out.push({ day, kwh: sum });
  }

  out.sort((a, b) => a.day.localeCompare(b.day));
  return { ok: true as const, daily: out };
}

function groupMonthly(daily: Array<{ day: string; kwh: number }>) {
  const m = new Map<string, number>();
  for (const d of daily) m.set(isoMonth(d.day), (m.get(isoMonth(d.day)) || 0) + (Number(d.kwh) || 0));
  return Array.from(m.entries()).map(([month, kwh]) => ({ month, kwh })).sort((a, b) => a.month.localeCompare(b.month));
}

function groupYearly(daily: Array<{ day: string; kwh: number }>) {
  const m = new Map<string, number>();
  for (const d of daily) m.set(isoYear(d.day), (m.get(isoYear(d.day)) || 0) + (Number(d.kwh) || 0));
  return Array.from(m.entries()).map(([year, kwh]) => ({ year, kwh })).sort((a, b) => a.year.localeCompare(b.year));
}

function makeKpis(daily: Array<{ day: string; kwh: number }>) {
  const total = daily.reduce((a, x) => a + (Number(x.kwh) || 0), 0);
  const days = daily.length || 1;
  let peak_day: string | null = null;
  let peak_kwh = 0;

  for (const d of daily) {
    const v = Number(d.kwh) || 0;
    if (v > peak_kwh) {
      peak_kwh = v;
      peak_day = d.day;
    }
  }

  return {
    total_kwh: total,
    avg_kwh_day: total / days,
    peak_day,
    peak_kwh,
    source: "inverters/generation",
  };
}

export async function GET(req: Request) {
  if (!API_KEY) {
    return NextResponse.json({ ok: false, error: "Faltou TECSCI_API_KEY nas Environment Variables." }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const ps_id = Number(searchParams.get("ps_id") || "");
  const start_date = String(searchParams.get("start_date") || "");
  const end_date = String(searchParams.get("end_date") || "");

  if (!Number.isFinite(ps_id)) {
    return NextResponse.json({ ok: false, error: "ps_id inválido." }, { status: 400 });
  }
  if (!isIsoDate(start_date) || !isIsoDate(end_date)) {
    return NextResponse.json({ ok: false, error: "start_date e end_date devem estar no formato YYYY-MM-DD." }, { status: 400 });
  }

  const dailyRes = await fetchDaily(ps_id, start_date, end_date);
  if (!dailyRes.ok) {
    return NextResponse.json({ ok: false, error: dailyRes.error, debug: dailyRes.debug }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }

  const daily = dailyRes.daily;
  const monthly = groupMonthly(daily);
  const yearly = groupYearly(daily);
  const kpis = makeKpis(daily);

  // performance: deixe null se você não tiver endpoint garantido ainda
  const performance = null;

  return NextResponse.json(
    {
      ok: true,
      ps_id,
      start_date,
      end_date,
      performance,
      series: { daily, monthly, yearly },
      kpis,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}