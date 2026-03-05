// app/api/tecsci/performance/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

const API_KEY = String(process.env.TECSCI_API_KEY || "").trim();
// Deve ser: https://system.tecsci.com.br/openapi/v1/power-stations/
const BASE_URL_RAW = String(
  process.env.TECSCI_BASE_URL || "https://system.tecsci.com.br/openapi/v1/power-stations/"
).trim();

function normBase(u: string) {
  const s = (u || "").trim();
  return s.endsWith("/") ? s : s + "/";
}
const BASE_URL = normBase(BASE_URL_RAW);

function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
}
function toNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function parseISO(iso: string) {
  return new Date(`${iso}T00:00:00Z`);
}
function fmtISO(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function daysBetweenInclusive(start: string, end: string) {
  const s = parseISO(start);
  const e = parseISO(end);
  const out: string[] = [];
  for (let d = new Date(s); d <= e; d.setUTCDate(d.getUTCDate() + 1)) out.push(fmtISO(d));
  return out;
}
function clampRange(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const s = parseISO(aStart) > parseISO(bStart) ? aStart : bStart;
  const e = parseISO(aEnd) < parseISO(bEnd) ? aEnd : bEnd;
  return { start: s, end: e };
}
function monthBuckets(start: string, end: string) {
  const s = parseISO(start);
  const e = parseISO(end);
  const buckets: Array<{ key: string; start: string; end: string }> = [];
  const cur = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1));
  while (cur <= e) {
    const y = cur.getUTCFullYear();
    const m = cur.getUTCMonth();
    const first = new Date(Date.UTC(y, m, 1));
    const last = new Date(Date.UTC(y, m + 1, 0));
    const key = `${y}-${String(m + 1).padStart(2, "0")}`;
    const r = clampRange(fmtISO(first), fmtISO(last), start, end);
    buckets.push({ key, start: r.start, end: r.end });
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return buckets;
}
function yearBuckets(start: string, end: string) {
  const s = parseISO(start);
  const e = parseISO(end);
  const buckets: Array<{ key: string; start: string; end: string }> = [];
  for (let y = s.getUTCFullYear(); y <= e.getUTCFullYear(); y++) {
    const first = `${y}-01-01`;
    const last = `${y}-12-31`;
    const r = clampRange(first, last, start, end);
    buckets.push({ key: String(y), start: r.start, end: r.end });
  }
  return buckets;
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

function mapPerformance(dto: any, ps_id: number) {
  return {
    ps_id: Number(dto?.ps_id ?? ps_id),
    ps_name: dto?.ps_name != null ? String(dto.ps_name) : null,

    availability_percentage: toNum(dto?.availability_percentage),
    pr_percentage: toNum(dto?.pr_percentage),
    projected_pr: toNum(dto?.projected_pr),

    expected_energy_kwh: toNum(dto?.expected_energy_kwh),
    generated_energy_kwh: toNum(dto?.generated_energy_kwh),
    projected_energy_kwh: toNum(dto?.projected_energy_kwh),

    poa_irradiation_kwh: toNum(dto?.poa_irradiation_kwh),
    projected_irradiation_kwh: toNum(dto?.projected_irradiation_kwh),

    capacity_factor_percentage: toNum(dto?.capacity_factor_percentage),
    specific_yield_kwh: toNum(dto?.specific_yield_kwh),
    reference_yield_kwh: toNum(dto?.reference_yield_kwh),

    ac_power_kw: toNum(dto?.ac_power_kw),
    dc_power_kw: toNum(dto?.dc_power_kw),
  };
}

async function fetchPerformanceRange(ps_id: number, start_date: string, end_date: string) {
  const url = `${BASE_URL}${ps_id}/performance?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}`;
  const res = await tecFetch(url);
  const ct = res.headers.get("content-type") || "";
  const raw = await res.text();

  if (!res.ok) {
    return { ok: false as const, url, status: res.status, bodyPreview: raw.slice(0, 600), performance: null as any };
  }

  let payload: any = null;
  try {
    payload = ct.includes("application/json") ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  const dto = payload?.data ?? payload;
  return { ok: true as const, url, status: 200, performance: mapPerformance(dto, ps_id) };
}

async function runPool<T, R>(items: T[], concurrency: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const res: R[] = [];
  let i = 0;

  async function worker() {
    while (i < items.length) {
      const idx = i++;
      res[idx] = await fn(items[idx]);
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  await Promise.all(workers);
  return res;
}

export async function GET(req: Request) {
  if (!API_KEY) return NextResponse.json({ ok: false, error: "Faltou TECSCI_API_KEY." }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const ps_id = Number(searchParams.get("ps_id") || "");
  const start_date = String(searchParams.get("start_date") || "");
  const end_date = String(searchParams.get("end_date") || "");

  // group: auto | day | month | year | aggregate
  const groupRaw = String(searchParams.get("group") || "auto") as "auto" | "day" | "month" | "year" | "aggregate";
  const debug = searchParams.get("debug") === "1";

  if (!Number.isFinite(ps_id)) return NextResponse.json({ ok: false, error: "ps_id inválido." }, { status: 400 });
  if (!isIsoDate(start_date) || !isIsoDate(end_date)) {
    return NextResponse.json({ ok: false, error: "start_date e end_date devem estar no formato YYYY-MM-DD." }, { status: 400 });
  }
  if (start_date > end_date) return NextResponse.json({ ok: false, error: "start_date maior que end_date." }, { status: 400 });

  const days = daysBetweenInclusive(start_date, end_date);
  // TecSci indica máximo 365 dias por request
  if (days.length > 365) {
    return NextResponse.json({ ok: false, error: "Período máximo suportado é 365 dias." }, { status: 400 });
  }

  // auto => Vercel-safe
  let group: "aggregate" | "day" | "month" | "year" = "month";
  if (groupRaw !== "auto") group = groupRaw;
  else {
    if (days.length <= 45) group = "day";
    else if (days.length <= 550) group = "month";
    else group = "year";
  }

  // 1) acumulado do período (sempre)
  const totalRes = await fetchPerformanceRange(ps_id, start_date, end_date);
  if (!totalRes.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `TecSci ${totalRes.status} ao buscar performance.`,
        ...(debug ? { debug: totalRes } : {}),
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (group === "aggregate") {
    return NextResponse.json(
      { ok: true, ps_id, start_date, end_date, group, performance: totalRes.performance },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const diagnostics: any[] = [];
  const out: any = {
    ok: true,
    ps_id,
    start_date,
    end_date,
    group,
    performance: totalRes.performance,
    series: {} as any,
    ...(debug ? { diagnostics } : {}),
  };

  if (group === "day") {
    // proteção adicional serverless
    if (days.length > 90) {
      return NextResponse.json(
        { ok: false, error: "Período grande demais para série diária. Use group=month (ou deixe auto)." },
        { status: 400 }
      );
    }

    const daily = await runPool(days, 3, async (day) => {
      const r = await fetchPerformanceRange(ps_id, day, day);
      if (debug) diagnostics.push({ type: "day", key: day, ok: r.ok, status: r.status });
      return { day, ...(r.ok ? r.performance : {}) };
    });

    out.series.daily = daily;
  }

  if (group === "month") {
    const months = monthBuckets(start_date, end_date);
    const monthly = await runPool(months, 3, async (b) => {
      const r = await fetchPerformanceRange(ps_id, b.start, b.end);
      if (debug) diagnostics.push({ type: "month", key: b.key, ok: r.ok, status: r.status });
      return { month: b.key, ...(r.ok ? r.performance : {}) };
    });

    out.series.monthly = monthly;
  }

  if (group === "year") {
    const years = yearBuckets(start_date, end_date);
    const yearly = await runPool(years, 2, async (b) => {
      const r = await fetchPerformanceRange(ps_id, b.start, b.end);
      if (debug) diagnostics.push({ type: "year", key: b.key, ok: r.ok, status: r.status });
      return { year: b.key, ...(r.ok ? r.performance : {}) };
    });

    out.series.yearly = yearly;
  }

  return NextResponse.json(out, { status: 200, headers: { "Cache-Control": "no-store" } });
}