
"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  RefreshCw,
  Eraser,
  FileDown,
  FileSpreadsheet,
  Zap,
  Gauge,
  Activity,
  ChevronRight,
  TrendingUp,
  Maximize2,
  Minimize2,
  LayoutDashboard,
  ShieldCheck,
  LineChart,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
  Brush,
} from "recharts";

const cx = (...p: Array<string | false | null | undefined>) =>
  p.filter(Boolean).join(" ");

const T = {
  bg: "#F3F6F8",
  bg2: "#EEF2F6",
  pageGlow: "rgba(22, 101, 52, 0.05)",

  card: "#FFFFFF",
  cardSoft: "#FAFBFC",
  cardSoft2: "#F6F8FA",
  cardSoft3: "#F8FAFC",

  border: "rgba(15, 23, 42, 0.10)",
  borderStrong: "rgba(15, 23, 42, 0.16)",
  divider: "rgba(15, 23, 42, 0.08)",

  text: "#0F172A",
  text2: "rgba(15, 23, 42, 0.74)",
  text3: "rgba(15, 23, 42, 0.56)",

  accent: "#166534",
  accent2: "#14532D",
  accentRing: "rgba(22, 101, 52, 0.18)",

  blue: "#1D4ED8",

  okBg: "rgba(16, 185, 129, 0.10)",
  okBd: "rgba(16, 185, 129, 0.26)",
  okTx: "#065F46",

  warnBg: "rgba(245, 158, 11, 0.10)",
  warnBd: "rgba(245, 158, 11, 0.24)",
  warnTx: "#92400E",

  errBg: "rgba(239, 68, 68, 0.10)",
  errBd: "rgba(239, 68, 68, 0.24)",
  errTx: "#991B1B",

  grid: "rgba(15, 23, 42, 0.08)",

  cGen: "#166534",
  cLoss: "#DC2626",
  cP90: "#D97706",
  cTec: "#64748B",
  cAya: "#0F172A",
  cPoa: "#D97706",
  cPoaMeta: "#DC2626",
  cPR: "#2563EB",
  cAvail: "#059669",
  cTarget: "#DC2626",
} as const;

const UI = {
  page: "w-full min-w-0",
  container: "mx-auto w-full max-w-[1560px] px-4 sm:px-6 py-6",
  hero:
    "border bg-white min-w-0 rounded-[24px] shadow-[0_2px_12px_rgba(15,23,42,0.04),0_18px_44px_rgba(15,23,42,0.06)]",
  section:
    "border bg-white min-w-0 rounded-[22px] shadow-[0_1px_3px_rgba(15,23,42,0.04),0_10px_28px_rgba(15,23,42,0.05)]",
  sectionTitle: "text-[13px] font-semibold tracking-[0.01em]",
  sectionHint: "text-xs",
  headerTitle: "text-[24px] sm:text-[30px] font-semibold tracking-tight",
  label: "text-[11px] font-semibold uppercase tracking-[0.08em]",
  input:
    "w-full h-11 px-3 border bg-white text-sm outline-none transition min-w-0 rounded-xl",
  select:
    "w-full h-11 px-3 border bg-white text-sm outline-none transition min-w-0 rounded-xl",
} as const;

type Station = { id: number; code: string; name: string };

type PerformanceDTO = {
  ps_id: number;
  ps_name?: string | null;
  availability_percentage?: number | null;
  expected_energy_kwh?: number | null;
  generated_energy_kwh?: number | null;
  projected_energy_kwh?: number | null;
  poa_irradiation_kwh?: number | null;
  projected_irradiation_kwh?: number | null;
  pr_percentage?: number | null;
  projected_pr?: number | null;
  dc_power_kw?: number | null;
};

type PerfApiResp = {
  ok: boolean;
  error?: string;
  group?: "day" | "month" | "year" | "aggregate";
  performance?: PerformanceDTO;
  series?: {
    daily?: Array<{ day: string } & PerformanceDTO>;
    monthly?: Array<{ month: string } & PerformanceDTO>;
    yearly?: Array<{ year: string } & PerformanceDTO>;
  };
};

type Preset =
  | "thisMonth"
  | "lastMonth"
  | "last7"
  | "last30"
  | "thisYear"
  | "lastYear"
  | "custom";

type SeriesType = "bar" | "line";

type ChartSeries = {
  key: string;
  name: string;
  type: SeriesType;
  color: string;
  dashed?: boolean;
  showPoints?: boolean;
  pointRadius?: number;
};

type ChartPoint = Record<string, unknown>;

type TableRow = {
  periodo: string;
  geracao: number | null;
  perdasAya: number | null;
  p90: number | null;
  estimadoTec: number | null;
  estimadoAya: number | null;
  irradiacao: number | null;
  irradiacaoMeta: number | null;
  pr: number | null;
  prMeta: number | null;
  disponibilidade: number | null;
  disponibilidadeMeta: number | null;
};

type MessageState = {
  type: "ok" | "warn" | "err";
  text: string;
} | null;

type MultiStationProgress = {
  done: number;
  total: number;
  current: string;
};

type MultiStationFetchResult =
  | {
      ok: true;
      station: Station;
      daily: PerfApiResp;
      monthly: PerfApiResp;
    }
  | {
      ok: false;
      station: Station;
      error: string;
    };

type MonthlyReportRow = {
  usina: string;
  periodo: string;
  sortKey: string;
  geracao: number | null;
  p90Pct: number | null;
  estimadoTec: number | null;
  tecPct: number | null;
  estimadoAya: number | null;
  ayaPct: number | null;
  irrPct: number | null;
  prPct: number | null;
  dispReal: number | null;
};

const PRESENTATION_STATION_SECONDS = 20;
const MULTI_REPORT_REQUEST_INTERVAL_MS = 2200;

function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
}

function brDate(iso?: string | null) {
  if (!iso) return "-";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(iso);
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function brDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function brNum(n?: number | null, digits = 2) {
  if (n == null || !Number.isFinite(n)) return "—";
  return Number(n).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function brPct(n?: number | null, digits = 1) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Number(n).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

function toISO(d: Date) {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function todayISO() {
  return toISO(new Date());
}

function clampEndToToday(isoEnd: string) {
  const t = todayISO();
  return isoEnd > t ? t : isoEnd;
}

function monthRangeISO(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  return { start: toISO(start), end: toISO(end) };
}

function yearRangeISO(year: number) {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

function safeNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clamp0(n: number) {
  return n < 0 ? 0 : n;
}

function kwhToUnit(kwh: number, unit: "kWh" | "MWh") {
  return unit === "MWh" ? kwh / 1000 : kwh;
}

function prToFrac(projectedPr: number | null) {
  const pr = safeNum(projectedPr);
  if (pr == null) return null;
  return pr > 1.5 ? pr / 100 : pr;
}

function prMetaPct(projectedPr: number | null) {
  const v = safeNum(projectedPr);
  if (v == null) return 80;
  return v > 1.5 ? v : v * 100;
}

function estimatedAyaKwh(
  poaKwhm2: number | null,
  projectedPr: number | null,
  dcPowerKw: number | null
) {
  const poa = safeNum(poaKwhm2);
  const pr = prToFrac(projectedPr);
  const pdc = safeNum(dcPowerKw);
  if (poa == null || pr == null || pdc == null) return null;
  return poa * pr * pdc;
}

function pctVs(a: number | null, b: number | null) {
  if (a == null || b == null || b <= 0) return null;
  return (a / b) * 100;
}

function statusTone(pct: number | null) {
  if (pct == null) return "neutral";
  if (pct >= 98) return "good";
  if (pct >= 80) return "warn";
  return "bad";
}

function toneStyles(tone: "good" | "warn" | "bad" | "neutral") {
  if (tone === "good") {
    return { background: T.okBg, borderColor: T.okBd, color: T.okTx };
  }
  if (tone === "warn") {
    return { background: T.warnBg, borderColor: T.warnBd, color: T.warnTx };
  }
  if (tone === "bad") {
    return { background: T.errBg, borderColor: T.errBd, color: T.errTx };
  }
  return { background: T.cardSoft, borderColor: T.border, color: T.text3 };
}

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_");
}

function niceTicks(min: number, max: number, count = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return [min, max];
  }

  const span = max - min;
  const step0 = span / Math.max(1, count - 1);
  const pow = Math.pow(10, Math.floor(Math.log10(step0)));
  const err = step0 / pow;
  const step =
    err >= 7.5
      ? 10 * pow
      : err >= 3.5
        ? 5 * pow
        : err >= 1.5
          ? 2 * pow
          : 1 * pow;

  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];

  for (let v = start; v <= end + 1e-9; v += step) ticks.push(v);
  return ticks;
}

function groupLabel(
  group: "auto" | "day" | "month" | "year" | "aggregate" | undefined
) {
  if (group === "day") return "Diária";
  if (group === "month") return "Mensal";
  if (group === "year") return "Anual";
  if (group === "aggregate") return "Consolidada";
  return "Automática";
}

function brMonthLabel(value?: string | null) {
  if (!value) return "—";

  const ym = String(value).match(/^(\d{4})-(\d{2})$/);
  if (ym) return `${ym[2]}/${ym[1]}`;

  const ymd = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return `${ymd[2]}/${ymd[1]}`;

  return String(value);
}

function wait(ms = 100) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function averageNullable(values: Array<number | null>) {
  const valid = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (!valid.length) return null;
  return valid.reduce((acc, v) => acc + v, 0) / valid.length;
}

function getSheetCols(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return [{ wch: 24 }];

  const keys = Object.keys(rows[0]);
  return keys.map((key) => {
    const maxLen = rows.slice(0, 500).reduce((acc, row) => {
      return Math.max(acc, String(row[key] ?? "").length);
    }, key.length);
    return { wch: Math.min(32, Math.max(12, maxLen + 2)) };
  });
}

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ w: 960, h: 300 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({
        w: Math.max(360, Math.floor(r.width || 960)),
        h: Math.max(220, Math.floor(r.height || 300)),
      });
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  return { ref, size };
}

function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggle = useCallback(async () => {
    const el = ref.current;
    if (!el) return;

    if (document.fullscreenElement === el) {
      await document.exitFullscreen();
      return;
    }

    if (el.requestFullscreen) {
      await el.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(document.fullscreenElement === ref.current);
    };

    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return { ref, isFullscreen, toggle };
}

function useStations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();

    (async () => {
      try {
        const r = await fetch("/api/tecsci/stations", {
          cache: "no-store",
          signal: ctrl.signal,
        });
        const j = await r.json();

        if (j?.ok) {
          const items = Array.isArray(j.stations) ? j.stations : [];
          setStations(
            items
              .filter((s: any) => s && Number.isFinite(Number(s.id)))
              .sort((a: Station, b: Station) =>
                String(a.name || "").localeCompare(String(b.name || ""), "pt-BR")
              )
          );
        }
      } catch {
      } finally {
        setStationsLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, []);

  return { stations, stationsLoading };
}

async function fetchPerformanceByGroup({
  psId,
  start,
  end,
  group,
  signal,
}: {
  psId: number;
  start: string;
  end: string;
  group: "day" | "month";
  signal?: AbortSignal;
}) {
  const params = new URLSearchParams({
    ps_id: String(psId),
    start_date: start,
    end_date: clampEndToToday(end),
    group,
  });

  const r = await fetch(`/api/tecsci/performance?${params.toString()}`, {
    cache: "no-store",
    signal,
  });

  const j: PerfApiResp = await r.json().catch(
    () => ({ ok: false } as PerfApiResp)
  );

  if (!r.ok || !j?.ok) {
    throw new Error(
      j?.error || `Falha ao carregar dados ${group === "day" ? "diários" : "mensais"}`
    );
  }

  return j;
}

function buildTableRowFromDto(
  periodo: string,
  dto: PerformanceDTO,
  energyUnit: "kWh" | "MWh"
): TableRow {
  const genKwh = safeNum(dto.generated_energy_kwh);
  const expTecKwh = safeNum(dto.expected_energy_kwh);
  const p90Kwh = safeNum(dto.projected_energy_kwh);
  const poa = safeNum(dto.poa_irradiation_kwh);
  const poaMeta = safeNum(dto.projected_irradiation_kwh);
  const pr = safeNum(dto.pr_percentage);
  const prMeta = prMetaPct(safeNum(dto.projected_pr));
  const disp = safeNum(dto.availability_percentage);
  const dispMeta = 97;
  const projPr = safeNum(dto.projected_pr);
  const dcKw = safeNum(dto.dc_power_kw);
  const ayaKwh = estimatedAyaKwh(poa, projPr, dcKw);
  const lossAyaKwh =
    ayaKwh != null && genKwh != null ? clamp0(ayaKwh - genKwh) : null;

  return {
    periodo,
    geracao: genKwh == null ? null : kwhToUnit(genKwh, energyUnit),
    perdasAya: lossAyaKwh == null ? null : kwhToUnit(lossAyaKwh, energyUnit),
    p90: p90Kwh == null ? null : kwhToUnit(p90Kwh, energyUnit),
    estimadoTec: expTecKwh == null ? null : kwhToUnit(expTecKwh, energyUnit),
    estimadoAya: ayaKwh == null ? null : kwhToUnit(ayaKwh, energyUnit),
    irradiacao: poa,
    irradiacaoMeta: poaMeta,
    pr,
    prMeta,
    disponibilidade: disp,
    disponibilidadeMeta: dispMeta,
  };
}

function buildConsolidatedReportRow(
  station: Station,
  periodo: string,
  sortKey: string,
  dto: PerformanceDTO
): MonthlyReportRow {
  const row = buildTableRowFromDto(periodo, dto, "MWh");

  return {
    usina: station.name,
    periodo: row.periodo,
    sortKey,
    geracao: row.geracao,
    p90Pct: pctVs(row.geracao, row.p90),
    estimadoTec: row.estimadoTec,
    tecPct: pctVs(row.geracao, row.estimadoTec),
    estimadoAya: row.estimadoAya,
    ayaPct: pctVs(row.geracao, row.estimadoAya),
    irrPct: pctVs(row.irradiacao, row.irradiacaoMeta),
    prPct: pctVs(row.pr, row.prMeta),
    dispReal: row.disponibilidade,
  };
}

function buildMonthlyReportRow(
  station: Station,
  dto: { month: string } & PerformanceDTO
): MonthlyReportRow {
  return buildConsolidatedReportRow(
    station,
    brMonthLabel(dto.month),
    String(dto.month || ""),
    dto
  );
}

function buildDailyReportRow(
  station: Station,
  dto: { day: string } & PerformanceDTO
): MonthlyReportRow {
  return buildConsolidatedReportRow(
    station,
    brDate(dto.day),
    String(dto.day || ""),
    dto
  );
}

function usePerformanceData({
  psId,
  start,
  end,
  group,
  enabled = true,
}: {
  psId: number;
  start: string;
  end: string;
  group: "auto" | "day" | "month" | "year";
  enabled?: boolean;
}) {
  const [data, setData] = useState<PerfApiResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<MessageState>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const requestFilters = useMemo(
    () => ({
      psId,
      start,
      end: clampEndToToday(end),
      group,
    }),
    [psId, start, end, group]
  );

  const debouncedFilters = useDebouncedValue(requestFilters, 320);

  const fetchData = useCallback(async (filters: typeof requestFilters) => {
    setMsg(null);

    if (!filters.psId || !Number.isFinite(filters.psId)) {
      setData(null);
      setMsg({ type: "err", text: "Selecione uma usina válida." });
      return;
    }

    if (!isIsoDate(filters.start) || !isIsoDate(filters.end)) {
      setData(null);
      setMsg({ type: "err", text: "As datas informadas são inválidas." });
      return;
    }

    if (filters.start > filters.end) {
      setData(null);
      setMsg({
        type: "err",
        text: "A data inicial não pode ser maior que a final.",
      });
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        ps_id: String(filters.psId),
        start_date: filters.start,
        end_date: filters.end,
        group: filters.group,
      });

      const r = await fetch(`/api/tecsci/performance?${params.toString()}`, {
        cache: "no-store",
        signal: ctrl.signal,
      });

      const j: PerfApiResp = await r.json().catch(
        () => ({ ok: false } as PerfApiResp)
      );

      if (!r.ok || !j?.ok) {
        setData(null);
        setMsg({
          type: "err",
          text: j?.error || "Não foi possível carregar os dados de performance.",
        });
        return;
      }

      setData(j);
      setLastUpdatedAt(new Date().toISOString());
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;

      setData(null);
      setMsg({
        type: "err",
        text: "Erro de conexão ao carregar a performance.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(() => {
    if (!enabled) return;
    void fetchData(requestFilters);
  }, [enabled, fetchData, requestFilters]);

  useEffect(() => {
    if (!enabled) return;
    void fetchData(debouncedFilters);
  }, [enabled, debouncedFilters, fetchData]);

  return { data, loading, msg, setMsg, lastUpdatedAt, reload };
}

const Btn = memo(function Btn({
  tone = "primary",
  loading,
  disabled,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "danger";
  loading?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 h-11 px-4 text-sm font-semibold border rounded-2xl whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition hover:shadow-sm active:scale-[0.99]";

  const style =
    tone === "primary"
      ? {
          background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accent2} 100%)`,
          borderColor: "rgba(22, 101, 52, 0.34)",
          color: "#FFFFFF",
        }
      : tone === "danger"
        ? { background: T.errBg, borderColor: T.errBd, color: T.errTx }
        : { background: T.card, borderColor: T.border, color: T.text };

  return (
    <button
      type="button"
      className={cx(base, className)}
      disabled={disabled || loading}
      style={style}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          <span>Processando…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

const MsgBox = memo(function MsgBox({ m }: { m: MessageState }) {
  if (!m) return null;

  const s =
    m.type === "ok"
      ? { background: T.okBg, borderColor: T.okBd, color: T.okTx }
      : m.type === "warn"
        ? { background: T.warnBg, borderColor: T.warnBd, color: T.warnTx }
        : { background: T.errBg, borderColor: T.errBd, color: T.errTx };

  return (
    <div className="text-sm px-3 py-2.5 border rounded-2xl" style={s}>
      {m.text}
    </div>
  );
});

const SectionHeader = memo(function SectionHeader({
  title,
  hint,
  right,
}: {
  title: ReactNode;
  hint?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3 flex-wrap px-5 py-4">
        <div>
          <div className={UI.sectionTitle} style={{ color: T.text }}>
            {title}
          </div>
          {hint ? (
            <div className={cx(UI.sectionHint, "mt-1")} style={{ color: T.text3 }}>
              {hint}
            </div>
          ) : null}
        </div>
        {right}
      </div>
      <div style={{ height: 1, background: T.divider }} />
    </>
  );
});

const Segmented = memo(function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div
      className="inline-flex border rounded-2xl overflow-hidden w-full"
      style={{ borderColor: T.border }}
    >
      {options.map((o, idx) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="h-10 px-3 text-sm font-semibold flex-1 transition"
            style={{
              background: active ? T.cardSoft2 : T.card,
              color: active ? T.text : T.text2,
              borderRight:
                idx === options.length - 1 ? "none" : `1px solid ${T.border}`,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
});

const StatusChip = memo(function StatusChip({ pct }: { pct: number | null }) {
  const style = toneStyles(statusTone(pct));

  return (
    <span
      className="inline-flex items-center justify-center h-8 px-3 text-[11px] font-semibold border rounded-2xl tabular-nums"
      style={style}
    >
      {pct == null ? "—" : `${brNum(pct, 1)}%`}
    </span>
  );
});

const ExecutiveMetric = memo(function ExecutiveMetric({
  label,
  value,
  sub,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  tone?: "good" | "warn" | "bad" | "neutral";
}) {
  const leftBorder =
    tone === "good"
      ? T.accent
      : tone === "warn"
        ? "#D97706"
        : tone === "bad"
          ? "#DC2626"
          : T.blue;

  return (
    <div
      className="rounded-[20px] border px-4 py-4 min-w-0 h-full"
      style={{
        borderColor: T.border,
        background: "linear-gradient(180deg, #FFFFFF 0%, #FBFCFD 100%)",
        boxShadow: `inset 3px 0 0 ${leftBorder}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: T.text3 }}
          >
            {label}
          </div>
          <div className="mt-1 text-[24px] font-bold truncate" style={{ color: T.text }}>
            {value}
          </div>
          {sub ? (
            <div className="mt-1 text-[11px] leading-5" style={{ color: T.text3 }}>
              {sub}
            </div>
          ) : null}
        </div>

        <div
          className="shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl"
          style={{ background: T.cardSoft2, color: T.text2 }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
});

const ContextMetric = memo(function ContextMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-[18px] border px-4 py-3"
      style={{ borderColor: T.border, background: T.cardSoft3 }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: T.text3 }}>
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold truncate" style={{ color: T.text }}>
        {value}
      </div>
    </div>
  );
});

const MiniChart = memo(function MiniChart({
  title,
  subtitle,
  data,
  xKey,
  series,
  height = 340,
  yDomain,
  formatterLeft,
  xLabelCount = 10,
  stackBars = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  data: ChartPoint[];
  xKey: string;
  series: ChartSeries[];
  height?: number;
  yDomain?: [number, number] | null;
  formatterLeft?: (v: number) => string;
  xLabelCount?: number;
  stackBars?: boolean;
}) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const bars = series.filter((s) => s.type === "bar");
  const lines = series.filter((s) => s.type === "line");
  const fmt = formatterLeft || ((v: number) => brNum(v, 0));

  const dom = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    for (const p of data) {
      if (stackBars && bars.length) {
        const stackedTotal = bars.reduce((acc, s) => acc + (safeNum(p[s.key]) ?? 0), 0);
        min = Math.min(min, 0);
        max = Math.max(max, stackedTotal);

        for (const s of lines) {
          const v = safeNum(p[s.key]);
          if (v == null) continue;
          min = Math.min(min, v);
          max = Math.max(max, v);
        }
      } else {
        for (const s of series) {
          const v = safeNum(p[s.key]);
          if (v == null) continue;
          min = Math.min(min, v);
          max = Math.max(max, v);
        }
      }
    }

    if (!Number.isFinite(min)) {
      min = 0;
      max = 1;
    }
    if (!Number.isFinite(max) || max <= min) max = min + 1;

    return yDomain ? yDomain : ([Math.min(0, min), max * 1.08] as [number, number]);
  }, [data, series, bars, lines, yDomain, stackBars]);

  const interval = useMemo(() => {
    const width = Math.max(size.w, 360);
    const maxLabelsByWidth = Math.max(2, Math.floor(width / 92));
    const target = Math.max(2, Math.min(xLabelCount, maxLabelsByWidth, data.length || 2));
    return Math.max(0, Math.ceil((data.length || 1) / target) - 1);
  }, [size.w, xLabelCount, data.length]);

  const tooltipFormatter = useCallback(
    (value: unknown, name: string) => {
      const num = safeNum(value);
      return [num == null ? "—" : fmt(num), name];
    },
    [fmt]
  );

  if (!data.length) {
    return (
      <div ref={ref} className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: T.text }}>
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1 text-[11px]" style={{ color: T.text3 }}>
            {subtitle}
          </div>
        ) : null}
        <div
          className="mt-3 border rounded-2xl h-[260px] flex items-center justify-center text-sm"
          style={{ borderColor: T.border, background: T.card, color: T.text3 }}
        >
          Sem dados para o período selecionado.
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="min-w-0">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: T.text }}>
            {title}
          </div>
          {subtitle ? (
            <div className="mt-1 text-[11px]" style={{ color: T.text3 }}>
              {subtitle}
            </div>
          ) : null}
        </div>
        <div className="text-[10px] font-semibold" style={{ color: T.text3 }}>
          Passe o mouse para detalhes • arraste o zoom quando disponível
        </div>
      </div>

      <div
        className="mt-3 border rounded-2xl overflow-hidden"
        style={{ borderColor: T.border, background: T.card }}
      >
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer>
            <ComposedChart
              data={data}
              margin={{ top: 18, right: 18, left: 8, bottom: data.length > 12 ? 42 : 18 }}
            >
              <CartesianGrid stroke={T.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={{ fill: T.text3, fontSize: 11 }}
                axisLine={{ stroke: T.border }}
                tickLine={{ stroke: T.border }}
                interval={interval}
                minTickGap={18}
              />
              <YAxis
                tick={{ fill: T.text3, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={dom as [number, number]}
                tickFormatter={(v) => fmt(Number(v))}
                width={72}
              />
              <Tooltip
                cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                contentStyle={{
                  borderRadius: 16,
                  border: `1px solid ${T.border}`,
                  boxShadow: "0 18px 44px rgba(15,23,42,0.12)",
                  background: "#FFFFFF",
                }}
                labelStyle={{ color: T.text, fontWeight: 700, marginBottom: 8 }}
                itemStyle={{ color: T.text2 }}
                formatter={tooltipFormatter}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: 11, color: T.text2, paddingBottom: 10 }}
              />
              {bars.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  fill={s.color}
                  radius={[8, 8, 0, 0]}
                  maxBarSize={34}
                  stackId={stackBars ? "stack" : undefined}
                  fillOpacity={0.92}
                />
              ))}
              {lines.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2.5}
                  strokeDasharray={s.dashed ? "6 6" : undefined}
                  dot={s.showPoints ? { r: s.pointRadius ?? 3, strokeWidth: 2, fill: "#FFFFFF" } : false}
                  activeDot={{ r: (s.pointRadius ?? 3) + 2 }}
                  connectNulls
                />
              ))}
              {data.length > 12 ? (
                <Brush
                  dataKey={xKey}
                  height={24}
                  stroke={T.accent}
                  travellerWidth={10}
                  fill="rgba(22, 101, 52, 0.08)"
                />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});

const GerencialTable = memo(function GerencialTable({
  rows,
}: {
  rows: TableRow[];
}) {
  return (
    <div className="border rounded-[20px] overflow-hidden" style={{ borderColor: T.border }}>
      <div className="overflow-auto max-h-[620px]">
        <table className="w-full min-w-[1280px] border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr>
              {[
                "Período",
                "Geração",
                "% P90",
                "Estimado AYA",
                "% AYA",
                "Estimado Tecsci",
                "% Tecsci",
                "Irradiação",
                "% Irradiação",
                "PR",
                "% PR",
                "Disp. real",
              ].map((h, idx) => (
                <th
                  key={h}
                  className={cx(
                    "px-3 py-3 text-left text-[11px] font-semibold border-b whitespace-nowrap",
                    idx === 0 ? "sticky left-0 z-20" : ""
                  )}
                  style={{
                    background: T.cardSoft2,
                    borderColor: T.border,
                    color: T.text2,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-sm" style={{ color: T.text3 }}>
                  Sem dados para exibir no período selecionado.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const genP90 = pctVs(r.geracao, r.p90);
                const genTec = pctVs(r.geracao, r.estimadoTec);
                const genAya = pctVs(r.geracao, r.estimadoAya);
                const irr = pctVs(r.irradiacao, r.irradiacaoMeta);
                const pr = pctVs(r.pr, r.prMeta);

                return (
                  <tr key={`${r.periodo}-${i}`}>
                    <td
                      className="px-3 py-3 text-sm border-b sticky left-0 z-[1]"
                      style={{
                        borderColor: T.border,
                        color: T.text,
                        background: i % 2 === 0 ? "#FFFFFF" : "#FBFCFD",
                      }}
                    >
                      {r.periodo}
                    </td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.text }}>{brNum(r.geracao, 2)}</td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border }}><StatusChip pct={genP90} /></td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.text }}>{brNum(r.estimadoAya, 2)}</td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border }}><StatusChip pct={genAya} /></td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.text }}>{brNum(r.estimadoTec, 2)}</td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border }}><StatusChip pct={genTec} /></td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.text }}>{brNum(r.irradiacao, 2)}</td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border }}><StatusChip pct={irr} /></td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.text }}>{brPct(r.pr, 1)}</td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border }}><StatusChip pct={pr} /></td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.text }}>{brPct(r.disponibilidade, 1)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export function TecsciPage() {
  const [xlsxLoading, setXlsxLoading] = useState(false);
  const [reportBundleLoading, setReportBundleLoading] = useState(false);
  const [reportBundleProgress, setReportBundleProgress] = useState<MultiStationProgress>({
    done: 0,
    total: 0,
    current: "",
  });

  const [presentMode, setPresentMode] = useState(false);
  const [stationCountdown, setStationCountdown] = useState(
    PRESENTATION_STATION_SECONDS
  );
  const [periodPreset, setPeriodPreset] = useState<Preset>("thisMonth");
  const [group, setGroup] = useState<"auto" | "day" | "month" | "year">("auto");
  const [energyUnit, setEnergyUnit] = useState<"kWh" | "MWh">("MWh");

  const { stations, stationsLoading } = useStations();
  const [psId, setPsId] = useState<number>(0);
  const chartsFullscreen = useFullscreen<HTMLDivElement>();
  const presentationActive = presentMode || chartsFullscreen.isFullscreen;

  const initialRange = useMemo(() => {
    const r = monthRangeISO(new Date());
    return { start: r.start, end: clampEndToToday(r.end) };
  }, []);

  const [start, setStart] = useState(initialRange.start);
  const [end, setEnd] = useState(initialRange.end);

  useEffect(() => {
    if (!stations.length) return;
    setPsId((curr) => (stations.some((s) => s.id === curr) ? curr : stations[0]?.id || 0));
  }, [stations]);

  const { data, loading, msg, setMsg, reload, lastUpdatedAt } =
    usePerformanceData({
      psId,
      start,
      end,
      group,
      enabled: !!psId,
    });

  const selectedStation = useMemo(
    () => stations.find((s) => s.id === psId) || null,
    [stations, psId]
  );

  const nextStation = useCallback(() => {
    if (!stations.length) return;

    setPsId((curr) => {
      const idx = stations.findIndex((s) => s.id === curr);
      if (idx < 0) return stations[0]?.id || curr;
      return stations[(idx + 1) % stations.length]?.id || curr;
    });

    setStationCountdown(PRESENTATION_STATION_SECONDS);
  }, [stations]);

  useEffect(() => {
    if (!presentationActive || stations.length <= 1) {
      setStationCountdown(PRESENTATION_STATION_SECONDS);
      return;
    }

    const id = window.setInterval(() => {
      setStationCountdown((prev) => {
        if (prev <= 1) {
          setPsId((curr) => {
            const idx = stations.findIndex((s) => s.id === curr);
            if (idx < 0) return stations[0]?.id || curr;
            return stations[(idx + 1) % stations.length]?.id || curr;
          });
          return PRESENTATION_STATION_SECONDS;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [presentationActive, stations]);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setPresentMode(false);
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const applyPreset = useCallback((p: Preset) => {
    const now = new Date();
    setPeriodPreset(p);

    if (p === "custom") return;

    if (p === "thisMonth") {
      const r = monthRangeISO(now);
      setStart(r.start);
      setEnd(clampEndToToday(r.end));
      return;
    }

    if (p === "lastMonth") {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const r = monthRangeISO(d);
      setStart(r.start);
      setEnd(r.end);
      return;
    }

    if (p === "last7") {
      const e = new Date(now);
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      setStart(toISO(s));
      setEnd(toISO(e));
      return;
    }

    if (p === "last30") {
      const e = new Date(now);
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      setStart(toISO(s));
      setEnd(toISO(e));
      return;
    }

    if (p === "thisYear") {
      const r = yearRangeISO(now.getFullYear());
      setStart(r.start);
      setEnd(clampEndToToday(r.end));
      return;
    }

    if (p === "lastYear") {
      const r = yearRangeISO(now.getFullYear() - 1);
      setStart(r.start);
      setEnd(r.end);
    }
  }, []);

  const startPresentation = useCallback(async () => {
    setPresentMode(true);
    setStationCountdown(PRESENTATION_STATION_SECONDS);

    try {
      if (!chartsFullscreen.isFullscreen) {
        await chartsFullscreen.toggle();
      }
    } catch {
      setMsg({
        type: "warn",
        text: "Modo apresentação ativado. Caso a tela cheia não abra automaticamente, use o botão de tela cheia.",
      });
    }
  }, [chartsFullscreen, setMsg]);

  const stopPresentation = useCallback(async () => {
    setPresentMode(false);
    setStationCountdown(PRESENTATION_STATION_SECONDS);

    try {
      if (chartsFullscreen.isFullscreen) {
        await chartsFullscreen.toggle();
      }
    } catch {}
  }, [chartsFullscreen]);

  const perf = data?.performance || null;

  const resolvedGroup = useMemo<"day" | "month" | "year" | "aggregate">(() => {
    if (data?.group === "day" || data?.group === "month" || data?.group === "year") {
      return data.group;
    }

    if (data?.series?.daily?.length) return "day";
    if (data?.series?.monthly?.length) return "month";
    if (data?.series?.yearly?.length) return "year";
    return "aggregate";
  }, [data]);

  const bucket = useMemo(() => {
    const s = data?.series;

    if (resolvedGroup === "day") {
      return (s?.daily || []).map((x) => ({ label: brDate(x.day), dto: x }));
    }

    if (resolvedGroup === "month") {
      return (s?.monthly || []).map((x) => ({ label: brMonthLabel(x.month), dto: x }));
    }

    if (resolvedGroup === "year") {
      return (s?.yearly || []).map((x) => ({ label: x.year, dto: x }));
    }

    return perf ? [{ label: "Consolidado", dto: perf }] : [];
  }, [data, resolvedGroup, perf]);

  const kpi = useMemo(() => {
    const genKwh = safeNum(perf?.generated_energy_kwh);
    const expKwh = safeNum(perf?.expected_energy_kwh);
    const p90Kwh = safeNum(perf?.projected_energy_kwh);
    const poa = safeNum(perf?.poa_irradiation_kwh);
    const poaMeta = safeNum(perf?.projected_irradiation_kwh);
    const pr = safeNum(perf?.pr_percentage);
    const prMeta = prMetaPct(safeNum(perf?.projected_pr));
    const avail = safeNum(perf?.availability_percentage);
    const availMeta = 97;
    const dcKw = safeNum(perf?.dc_power_kw);
    const estimatedAya = estimatedAyaKwh(poa, safeNum(perf?.projected_pr), dcKw);

    return {
      psLabel: selectedStation ? selectedStation.name : "—",
      geracao: genKwh == null ? null : kwhToUnit(genKwh, energyUnit),
      p90: p90Kwh == null ? null : kwhToUnit(p90Kwh, energyUnit),
      expectedTec: expKwh == null ? null : kwhToUnit(expKwh, energyUnit),
      estimatedAya:
        estimatedAya == null ? null : kwhToUnit(estimatedAya, energyUnit),
      poa,
      poaMeta,
      pr,
      prMeta,
      avail,
      availMeta,
    };
  }, [perf, selectedStation, energyUnit]);

  const p90Pct = pctVs(kpi.geracao, kpi.p90);
  const tecPct = pctVs(kpi.geracao, kpi.expectedTec);
  const ayaPct = pctVs(kpi.geracao, kpi.estimatedAya);
  const prPct = pctVs(kpi.pr, kpi.prMeta);
  const availPct = pctVs(kpi.avail, kpi.availMeta);

  const heroMetrics = useMemo<
    Array<{
      label: string;
      value: string;
      sub: string;
      icon: ReactNode;
      tone: "good" | "warn" | "bad" | "neutral";
    }>
  >(() => {
    const gapP90 =
      kpi.geracao != null && kpi.p90 != null ? kpi.geracao - kpi.p90 : null;

    const gapTec =
      kpi.geracao != null && kpi.expectedTec != null
        ? kpi.geracao - kpi.expectedTec
        : null;

    const lossAya =
      kpi.estimatedAya != null && kpi.geracao != null
        ? Math.max(0, kpi.estimatedAya - kpi.geracao)
        : null;

    return [
      {
        label: `Geração (${energyUnit})`,
        value: kpi.geracao == null ? "—" : brNum(kpi.geracao, 2),
        sub: `P90 ${brNum(kpi.p90, 2)} • Tecsci ${brNum(kpi.expectedTec, 2)}`,
        icon: <Zap className="w-5 h-5" />,
        tone: statusTone(p90Pct),
      },
      {
        label: "Atingimento P90",
        value: p90Pct == null ? "—" : `${brNum(p90Pct, 1)}%`,
        sub: `Gap ${brNum(gapP90, 2)} ${energyUnit}`,
        icon: <TrendingUp className="w-5 h-5" />,
        tone: statusTone(p90Pct),
      },
      {
        label: "Atingimento Tecsci",
        value: tecPct == null ? "—" : `${brNum(tecPct, 1)}%`,
        sub: `Gap ${brNum(gapTec, 2)} ${energyUnit}`,
        icon: <Gauge className="w-5 h-5" />,
        tone: statusTone(tecPct),
      },
      {
        label: `Perda estimada (${energyUnit})`,
        value: lossAya == null ? "—" : brNum(lossAya, 2),
        sub: `AYA ${brNum(kpi.estimatedAya, 2)} ${energyUnit}`,
        icon: <Activity className="w-5 h-5" />,
        tone: statusTone(ayaPct),
      },
      {
        label: "PR",
        value: prPct == null ? "—" : `${brNum(prPct, 1)}%`,
        sub: `${brPct(kpi.pr, 1)} vs meta ${brPct(kpi.prMeta, 1)}`,
        icon: <LineChart className="w-5 h-5" />,
        tone: statusTone(prPct),
      },
      {
        label: "Disponibilidade",
        value: availPct == null ? "—" : `${brNum(availPct, 1)}%`,
        sub: `${brPct(kpi.avail, 1)} vs meta ${brPct(kpi.availMeta, 1)}`,
        icon: <ShieldCheck className="w-5 h-5" />,
        tone: statusTone(availPct),
      },
    ];
  }, [kpi, energyUnit, p90Pct, tecPct, ayaPct, prPct, availPct]);

  const seriesEnergy = useMemo(() => {
    return bucket.map((b) => {
      const genKwh = safeNum(b.dto.generated_energy_kwh);
      const expTecKwh = safeNum(b.dto.expected_energy_kwh);
      const p90Kwh = safeNum(b.dto.projected_energy_kwh);
      const poa = safeNum(b.dto.poa_irradiation_kwh);
      const projPr = safeNum(b.dto.projected_pr);
      const dcKw = safeNum(b.dto.dc_power_kw);
      const ayaKwh = estimatedAyaKwh(poa, projPr, dcKw);
      const lossAyaKwh =
        ayaKwh != null && genKwh != null ? clamp0(ayaKwh - genKwh) : null;

      return {
        periodo: b.label,
        geracao: genKwh == null ? null : kwhToUnit(genKwh, energyUnit),
        perdasAya: lossAyaKwh == null ? null : kwhToUnit(lossAyaKwh, energyUnit),
        estimadoTec: expTecKwh == null ? null : kwhToUnit(expTecKwh, energyUnit),
        estimadoAya: ayaKwh == null ? null : kwhToUnit(ayaKwh, energyUnit),
        p90: p90Kwh == null ? null : kwhToUnit(p90Kwh, energyUnit),
      };
    });
  }, [bucket, energyUnit]);

  const seriesIrr = useMemo(() => {
    let accP = 0;
    let accM = 0;

    return bucket.map((b) => {
      const poa = safeNum(b.dto.poa_irradiation_kwh) || 0;
      const meta = safeNum(b.dto.projected_irradiation_kwh) || 0;
      accP += poa;
      accM += meta;
      return { periodo: b.label, poa, meta, accPoa: accP, accMeta: accM };
    });
  }, [bucket]);

  const seriesPR = useMemo(() => {
    return bucket.map((b) => ({
      periodo: b.label,
      pr: safeNum(b.dto.pr_percentage),
      meta: prMetaPct(safeNum(b.dto.projected_pr)),
    }));
  }, [bucket]);

  const seriesAvail = useMemo(() => {
    return bucket.map((b) => ({
      periodo: b.label,
      disponibilidade: safeNum(b.dto.availability_percentage),
      meta: 97,
    }));
  }, [bucket]);

  const tableRows = useMemo<TableRow[]>(() => {
    return bucket.map((b) => buildTableRowFromDto(b.label, b.dto, energyUnit));
  }, [bucket, energyUnit]);

  const chartEnergySeries: ChartSeries[] = useMemo(
    () => [
      {
        key: "geracao",
        name: `Geração (${energyUnit})`,
        type: "bar",
        color: T.cGen,
      },
      {
        key: "perdasAya",
        name: `Perdas (${energyUnit})`,
        type: "bar",
        color: T.cLoss,
      },
      {
        key: "p90",
        name: `P90 (${energyUnit})`,
        type: "line",
        color: T.cP90,
        dashed: true,
      },
      {
        key: "estimadoAya",
        name: `Estimado (${energyUnit})`,
        type: "line",
        color: T.cTec,
        dashed: true,
      },
      // {
      //   key: "estimadoTec",
      //   name: `Estimado Tecsci (${energyUnit})`,
      //   type: "line",
      //   color: T.cTec,
      //   dashed: true,
      // },
    ],
    [energyUnit]
  );

  const chartIrr1: ChartSeries[] = useMemo(
    () => [
      { key: "poa", name: "Irradiação real", type: "bar", color: T.cPoa },
      {
        key: "meta",
        name: "Irradiação meta",
        type: "line",
        color: T.cPoaMeta,
        dashed: true,
      },
    ],
    []
  );

  const chartIrr2: ChartSeries[] = useMemo(
    () => [
      {
        key: "accPoa",
        name: "Acumulada real",
        type: "line",
        color: T.cPoa,
      },
      {
        key: "accMeta",
        name: "Acumulada meta",
        type: "line",
        color: T.cPoaMeta,
        dashed: true,
      },
    ],
    []
  );

  const chartPR: ChartSeries[] = useMemo(
    () => [
      { key: "pr", name: "PR", type: "bar", color: T.cPR },
      {
        key: "meta",
        name: "Meta PR",
        type: "line",
        color: T.cTarget,
        dashed: true,
      },
    ],
    []
  );

  const chartAvail: ChartSeries[] = useMemo(
    () => [
      {
        key: "disponibilidade",
        name: "Disponibilidade",
        type: "bar",
        color: T.cAvail,
      },
      {
        key: "meta",
        name: "Meta",
        type: "line",
        color: T.cTarget,
        dashed: true,
      },
    ],
    []
  );

  const exportRows = useMemo(() => {
    return tableRows.map((r) => ({
      periodo: r.periodo,
      geracao: r.geracao,
      estimado_aya: r.estimadoAya,
      perc_geracao_aya: pctVs(r.geracao, r.estimadoAya),
      estimado_tecsci: r.estimadoTec,
      perc_geracao_tecsci: pctVs(r.geracao, r.estimadoTec),
      perc_geracao_p90: pctVs(r.geracao, r.p90),
      irradiacao: r.irradiacao,
      perc_irradiacao_meta: pctVs(r.irradiacao, r.irradiacaoMeta),
      pr: r.pr,
      perc_pr_meta: pctVs(r.pr, r.prMeta),
      disponibilidade: r.disponibilidade,
    }));
  }, [tableRows]);

  const excelFileName = useMemo(
    () =>
      sanitizeFileName(
        `Historico_Performance_${selectedStation?.name || "Usina"}_${start}_${clampEndToToday(end)}`
      ),
    [selectedStation, start, end]
  );

  const monthlyReportBaseName = useMemo(
    () =>
      sanitizeFileName(
        `Relatorio_Mensal_Multiusinas_AYA_Ineer_${start}_${clampEndToToday(end)}`
      ),
    [start, end]
  );

  const exportExcel = useCallback(async () => {
    if (!data?.ok || !tableRows.length) {
      setMsg({ type: "err", text: "Sem dados para exportar." });
      return;
    }

    setXlsxLoading(true);

    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      const resumoAOA: (string | number)[][] = [
        ["Histórico analítico de performance"],
        [],
        ["Usina", kpi.psLabel],
        ["Período", `${start} → ${clampEndToToday(end)}`],
        ["Granularidade", groupLabel(resolvedGroup)],
        ["Unidade de Energia", energyUnit],
        ["Última atualização", brDateTime(lastUpdatedAt)],
      ];

      const wsResumo = XLSX.utils.aoa_to_sheet(resumoAOA);
      wsResumo["!cols"] = [{ wch: 28 }, { wch: 34 }];
      XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

      const wsSerie = XLSX.utils.json_to_sheet(exportRows);
      wsSerie["!cols"] = getSheetCols(exportRows);
      if (wsSerie["!ref"]) wsSerie["!autofilter"] = { ref: wsSerie["!ref"] };
      XLSX.utils.book_append_sheet(wb, wsSerie, "Historico");

      XLSX.writeFile(wb, `${excelFileName}.xlsx`, { compression: true });
      setMsg({ type: "ok", text: "Excel analítico gerado com sucesso." });
    } catch (error) {
      console.error(error);
      setMsg({ type: "err", text: "Falha ao gerar Excel." });
    } finally {
      setXlsxLoading(false);
    }
  }, [
    data,
    tableRows,
    setMsg,
    kpi.psLabel,
    start,
    end,
    resolvedGroup,
    energyUnit,
    lastUpdatedAt,
    exportRows,
    excelFileName,
  ]);

  const exportMonthlyBundle = useCallback(async () => {
    const endSafe = clampEndToToday(end);

    if (!stations.length) {
      setMsg({ type: "err", text: "Nenhuma usina disponível para exportação." });
      return;
    }

    if (!isIsoDate(start) || !isIsoDate(endSafe) || start > endSafe) {
      setMsg({ type: "err", text: "Período inválido para gerar o relatório." });
      return;
    }

    setReportBundleLoading(true);
    setReportBundleProgress({
      done: 0,
      total: stations.length,
      current: "",
    });

    try {
      const [{ jsPDF }, XLSX] = await Promise.all([
        import("jspdf"),
        import("xlsx"),
      ]);

      const results: MultiStationFetchResult[] = [];

      for (let index = 0; index < stations.length; index++) {
        const station = stations[index];

        setReportBundleProgress({
          done: index,
          total: stations.length,
          current: station.name,
        });

        try {
          const monthly = await fetchPerformanceByGroup({
            psId: station.id,
            start,
            end: endSafe,
            group: "month",
          });

          await wait(MULTI_REPORT_REQUEST_INTERVAL_MS);

          const daily = await fetchPerformanceByGroup({
            psId: station.id,
            start,
            end: endSafe,
            group: "day",
          });

          results.push({
            ok: true,
            station,
            daily,
            monthly,
          });
        } catch (error) {
          results.push({
            ok: false,
            station,
            error:
              error instanceof Error
                ? error.message
                : "Falha ao carregar usina",
          });
        }

        setReportBundleProgress({
          done: index + 1,
          total: stations.length,
          current: station.name,
        });

        if (index < stations.length - 1) {
          await wait(MULTI_REPORT_REQUEST_INTERVAL_MS);
        }
      }

      const success = results.filter(
        (item): item is Extract<MultiStationFetchResult, { ok: true }> => item.ok
      );
      const failures = results.filter(
        (item): item is Extract<MultiStationFetchResult, { ok: false }> => !item.ok
      );

      if (!success.length) {
        throw new Error("Nenhuma usina retornou dados válidos para o período.");
      }

      const monthlyRows = success
        .flatMap((item) =>
          (item.monthly.series?.monthly || []).map((dto) =>
            buildMonthlyReportRow(item.station, dto)
          )
        )
        .sort((a, b) => {
          const byStation = a.usina.localeCompare(b.usina, "pt-BR");
          if (byStation !== 0) return byStation;
          return a.sortKey.localeCompare(b.sortKey, "pt-BR");
        });

      const dailyRows = success
        .flatMap((item) =>
          (item.daily.series?.daily || []).map((dto) =>
            buildDailyReportRow(item.station, dto)
          )
        )
        .sort((a, b) => {
          const byStation = a.usina.localeCompare(b.usina, "pt-BR");
          if (byStation !== 0) return byStation;
          return a.sortKey.localeCompare(b.sortKey, "pt-BR");
        });

      const mapExcelRow = ({ sortKey: _sortKey, ...row }: MonthlyReportRow) => ({
        Usina: row.usina,
        Período: row.periodo,
        "Geração (MWh)": row.geracao,
        "% P90": row.p90Pct,
        "Estimado Tecsci": row.estimadoTec,
        "% Tecsci": row.tecPct,
        "Estimado AYA": row.estimadoAya,
        "% AYA": row.ayaPct,
        "% Irrad": row.irrPct,
        "% PR": row.prPct,
        "Disp real": row.dispReal,
      });

      const monthlyExcelRows = monthlyRows.map(mapExcelRow);
      const dailyExcelRows = dailyRows.map(mapExcelRow);

      const totalGeneration = monthlyRows.reduce(
        (acc, row) => acc + (row.geracao ?? 0),
        0
      );
      const avgP90 = averageNullable(monthlyRows.map((row) => row.p90Pct));
      const avgPr = averageNullable(monthlyRows.map((row) => row.prPct));
      const avgDisp = averageNullable(monthlyRows.map((row) => row.dispReal));

      const wb = XLSX.utils.book_new();
      const wsResumo = XLSX.utils.aoa_to_sheet([
        ["Relatório mensal consolidado"],
        [],
        ["Cliente", "Ineer Energia"],
        ["Período", `${brDate(start)} - ${brDate(endSafe)}`],
        ["Usinas válidas", success.length],
        ["Usinas com falha", failures.length],
        ["Linhas mensais", monthlyRows.length],
        ["Linhas diárias", dailyRows.length],
        ["Geração total (MWh)", totalGeneration],
        ["% P90 médio", avgP90],
        ["% PR médio", avgPr],
        ["Disponibilidade média", avgDisp],
      ]);
      wsResumo["!cols"] = [{ wch: 24 }, { wch: 24 }];
      XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

      const wsMensal = monthlyExcelRows.length
        ? XLSX.utils.json_to_sheet(monthlyExcelRows)
        : XLSX.utils.aoa_to_sheet([["Sem dados mensais para o período"]]);
      wsMensal["!cols"] = getSheetCols(monthlyExcelRows);
      if (wsMensal["!ref"]) wsMensal["!autofilter"] = { ref: wsMensal["!ref"] };
      XLSX.utils.book_append_sheet(wb, wsMensal, "Mensal");

      const wsDiario = dailyExcelRows.length
        ? XLSX.utils.json_to_sheet(dailyExcelRows)
        : XLSX.utils.aoa_to_sheet([["Sem dados diários para o período"]]);
      wsDiario["!cols"] = getSheetCols(dailyExcelRows);
      if (wsDiario["!ref"]) wsDiario["!autofilter"] = { ref: wsDiario["!ref"] };
      XLSX.utils.book_append_sheet(wb, wsDiario, "Diario");

      if (failures.length) {
        const wsFalhas = XLSX.utils.json_to_sheet(
          failures.map((item) => ({
            Usina: item.station.name,
            Código: item.station.code,
            Erro: item.error,
          }))
        );
        XLSX.utils.book_append_sheet(wb, wsFalhas, "Falhas");
      }

      XLSX.writeFile(wb, `${monthlyReportBaseName}.xlsx`, {
        compression: true,
      });

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
        compress: true,
      });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 24;
      const usableW = pageW - margin * 2;
      const footerY = pageH - 22;
      let pageNo = 1;
      let hasStarted = false;

      const fitText = (value: string, width: number) => {
        const textValue = String(value || "");
        if (doc.getTextWidth(textValue) <= width) return textValue;
        let out = textValue;
        while (out.length > 0 && doc.getTextWidth(`${out}…`) > width) {
          out = out.slice(0, -1);
        }
        return out ? `${out}…` : "";
      };

      const drawAyaLogo = (x: number, y: number) => {
        doc.setFillColor(22, 101, 52);
        doc.roundedRect(x, y, 42, 42, 10, 10, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);
        doc.setTextColor(255, 255, 255);
        doc.text("AYA", x + 21, y + 27, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(11, 18, 32);
        doc.text("AYA Energia", x + 54, y + 17);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("Relatório gerencial consolidado", x + 54, y + 32);
      };

      const drawFooter = () => {
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, footerY - 10, pageW - margin, footerY - 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text("AYA Energia • Cliente: Ineer Energia", margin, footerY);
        doc.text(`Página ${pageNo}`, pageW - margin, footerY, { align: "right" });
      };

      const drawHeader = (title: string, subtitle: string) => {
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 0, pageW, 74, "F");
        drawAyaLogo(margin, 14);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(11, 18, 32);
        doc.text(title, pageW - margin, 28, { align: "right" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(100, 116, 139);
        doc.text(subtitle, pageW - margin, 44, { align: "right" });
        doc.text(`Emitido em ${brDateTime(new Date().toISOString())}`, pageW - margin, 58, {
          align: "right",
        });

        doc.setFillColor(22, 101, 52);
        doc.rect(0, 74, pageW, 4, "F");
        drawFooter();
      };

      const openSectionPage = (title: string, subtitle: string) => {
        if (!hasStarted) {
          hasStarted = true;
          drawHeader(title, subtitle);
          return;
        }
        doc.addPage();
        pageNo += 1;
        drawHeader(title, subtitle);
      };

      const cols = [
        { key: "usina", label: "Usina", width: 146, align: "left" as const },
        { key: "periodo", label: "Período", width: 64, align: "left" as const },
        { key: "geracao", label: "Geração (MWh)", width: 72, align: "right" as const },
        { key: "p90Pct", label: "% P90", width: 50, align: "right" as const },
        { key: "estimadoTec", label: "Estimado Tecsci", width: 74, align: "right" as const },
        { key: "tecPct", label: "% Tecsci", width: 52, align: "right" as const },
        { key: "estimadoAya", label: "Estimado AYA", width: 72, align: "right" as const },
        { key: "ayaPct", label: "% AYA", width: 50, align: "right" as const },
        { key: "irrPct", label: "% Irrad", width: 50, align: "right" as const },
        { key: "prPct", label: "% PR", width: 44, align: "right" as const },
        { key: "dispReal", label: "Disp real", width: 54, align: "right" as const },
      ];

      const drawTableSection = (
        title: string,
        subtitle: string,
        rows: MonthlyReportRow[]
      ) => {
        openSectionPage(title, subtitle);
        let y = 96;
        const rowH = 20;

        const drawTableHeader = () => {
          doc.setFillColor(241, 245, 249);
          doc.setDrawColor(226, 232, 240);
          doc.rect(margin, y, usableW, rowH, "FD");

          let x = margin;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.2);
          doc.setTextColor(71, 85, 105);

          cols.forEach((col) => {
            const tx = col.align === "left" ? x + 6 : x + col.width - 6;
            doc.text(col.label, tx, y + 13, { align: col.align === "left" ? "left" : "right" });
            x += col.width;
          });

          y += rowH;
        };

        drawTableHeader();

        if (!rows.length) {
          doc.setDrawColor(226, 232, 240);
          doc.rect(margin, y, usableW, 40);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text("Sem dados para o período selecionado.", margin + 12, y + 24);
          return;
        }

        rows.forEach((row, index) => {
          if (y + rowH > pageH - 40) {
            openSectionPage(title, `${subtitle} • Continuação`);
            y = 96;
            drawTableHeader();
          }

          if (index % 2 === 0) {
            doc.setFillColor(252, 253, 254);
            doc.rect(margin, y, usableW, rowH, "F");
          }

          doc.setDrawColor(241, 245, 249);
          doc.line(margin, y + rowH, pageW - margin, y + rowH);

          const values = {
            usina: fitText(row.usina, 140),
            periodo: row.periodo,
            geracao: row.geracao == null ? "—" : brNum(row.geracao, 2),
            p90Pct: row.p90Pct == null ? "—" : `${brNum(row.p90Pct, 1)}%`,
            estimadoTec: row.estimadoTec == null ? "—" : brNum(row.estimadoTec, 2),
            tecPct: row.tecPct == null ? "—" : `${brNum(row.tecPct, 1)}%`,
            estimadoAya: row.estimadoAya == null ? "—" : brNum(row.estimadoAya, 2),
            ayaPct: row.ayaPct == null ? "—" : `${brNum(row.ayaPct, 1)}%`,
            irrPct: row.irrPct == null ? "—" : `${brNum(row.irrPct, 1)}%`,
            prPct: row.prPct == null ? "—" : `${brNum(row.prPct, 1)}%`,
            dispReal: row.dispReal == null ? "—" : `${brNum(row.dispReal, 1)}%`,
          } as const;

          let x = margin;
          cols.forEach((col) => {
            const tx = col.align === "left" ? x + 6 : x + col.width - 6;
            doc.setFont("helvetica", col.key === "usina" ? "bold" : "normal");
            doc.setFontSize(8.7);
            doc.setTextColor(15, 23, 42);
            doc.text(String(values[col.key as keyof typeof values]), tx, y + 13, {
              align: col.align === "left" ? "left" : "right",
            });
            x += col.width;
          });

          y += rowH;
        });
      };

      drawTableSection(
        "Visão Mensal Consolidada",
        `Período ${brDate(start)} - ${brDate(endSafe)}`,
        monthlyRows
      );

      drawTableSection(
        "Visão Diária Consolidada",
        `Período ${brDate(start)} - ${brDate(endSafe)}`,
        dailyRows
      );

      if (failures.length) {
        openSectionPage("Falhas de coleta", `Período ${brDate(start)} - ${brDate(endSafe)}`);
        let yFail = 96;

        failures.forEach((item, index) => {
          if (yFail + 44 > pageH - 40) {
            openSectionPage("Falhas de coleta", "Continuação");
            yFail = 96;
          }

          doc.setFillColor(index % 2 === 0 ? 252 : 255, 253, 254);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(margin, yFail, usableW, 38, 10, 10, "FD");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(11, 18, 32);
          doc.text(item.station.name, margin + 12, yFail + 15);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text(fitText(item.error, usableW - 24), margin + 12, yFail + 28);
          yFail += 46;
        });
      }

      doc.save(`${monthlyReportBaseName}.pdf`);

      setMsg({
        type: "ok",
        text: `Relatório consolidado mensal e diário exportado em PDF e Excel. Usinas válidas: ${success.length}${
          failures.length ? ` • Falhas: ${failures.length}` : ""
        }.`,
      });
    } catch (error) {
      console.error(error);
      setMsg({
        type: "err",
        text:
          error instanceof Error
            ? error.message
            : "Falha ao gerar relatório consolidado.",
      });
    } finally {
      setReportBundleLoading(false);
      setReportBundleProgress({
        done: 0,
        total: 0,
        current: "",
      });
    }
  }, [stations, start, end, monthlyReportBaseName, setMsg]);

  const loadingInitial = loading && !data;
  const isReloading = loading && !!data;

  return (
    <section
      className={UI.page}
      style={{
        background: `radial-gradient(circle at top left, ${T.pageGlow} 0%, transparent 26%), linear-gradient(180deg, ${T.bg} 0%, ${T.bg2} 100%)`,
        color: T.text,
      }}
    >
      <div className={UI.container}>
        <div
          className={cx(UI.hero, "overflow-hidden")}
          style={{ borderColor: T.border, background: T.card }}
        >
          <div
            className="px-5 sm:px-6 py-6"
            style={{
              background:
                "linear-gradient(135deg, rgba(22,101,52,0.06) 0%, rgba(22,101,52,0.00) 42%, rgba(15,23,42,0.03) 100%)",
            }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className={UI.headerTitle} style={{ color: T.text }}>
                  Dashboard de Performance
                </div>
                <div className="mt-1 text-sm font-semibold truncate" style={{ color: T.text2 }}>
                  Cliente Ineer Energia
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Btn tone="secondary" onClick={reload} loading={loading} title="Atualizar dados">
                  {!loading && <RefreshCw className="w-4 h-4" />}
                  {!loading && "Atualizar"}
                </Btn>

                <Btn
                  tone="primary"
                  onClick={exportMonthlyBundle}
                  disabled={reportBundleLoading || !stations.length}
                  title="Exportar relatório consolidado mensal e diário em PDF e Excel"
                >
                  {reportBundleLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      {`Exportando ${reportBundleProgress.done}/${reportBundleProgress.total}`}
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      Relatório 
                    </>
                  )}
                </Btn>

                <Btn tone="secondary" onClick={startPresentation} title="Modo apresentação">
                  <LayoutDashboard className="w-4 h-4" />
                  Modo Dashboard
                </Btn>
              </div>
            </div>

            {/* <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <ContextMetric label="Usina selecionada" value={selectedStation?.name || "—"} />
              <ContextMetric label="Período" value={`${brDate(start)} — ${brDate(clampEndToToday(end))}`} />
              <ContextMetric label="Granularidade" value={groupLabel(resolvedGroup)} />
              <ContextMetric label="Atualização" value={lastUpdatedAt ? brDateTime(lastUpdatedAt) : "Sem atualização"} />
            </div> */}
          </div>
        </div>

        {!presentationActive ? (
          <div className="mt-4 max-w-[760px]">
            <MsgBox m={msg} />
          </div>
        ) : null}

        {loadingInitial ? (
          <div
            className="mt-4 border rounded-[20px] bg-white p-12 text-center"
            style={{ borderColor: T.border }}
          >
            <div className="inline-flex items-center gap-3 text-sm" style={{ color: T.text2 }}>
              <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Carregando dados do painel...
            </div>
          </div>
        ) : (
          <div className="relative mt-4 space-y-4">
            {!presentationActive ? (
              <div
                className={UI.section}
                style={{ borderColor: T.border, background: T.card }}
              >
                <SectionHeader
                  title="Filtros"
                  hint="Defina o período, a usina, a granularidade e a unidade de exibição"
                  right={
                    <Btn
                      tone="secondary"
                      onClick={() => {
                        setMsg(null);
                        applyPreset("thisMonth");
                      }}
                      title="Restaurar filtro padrão"
                    >
                      <Eraser className="w-4 h-4" />
                      Limpar
                    </Btn>
                  }
                />

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 items-end">
                    <div className="xl:col-span-2">
                      <label className={UI.label} style={{ color: T.text2 }}>
                        Usina
                      </label>
                      <select
                        className={UI.select}
                        style={{ borderColor: T.border }}
                        value={psId}
                        onChange={(e) => setPsId(Number(e.target.value))}
                        disabled={stationsLoading}
                      >
                        {stations.length === 0 ? (
                          <option value="">Carregando...</option>
                        ) : null}
                        {stations.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={UI.label} style={{ color: T.text2 }}>
                        Período
                      </label>
                      <select
                        className={UI.select}
                        style={{ borderColor: T.border }}
                        value={periodPreset}
                        onChange={(e) => applyPreset(e.target.value as Preset)}
                      >
                        <option value="thisMonth">Este mês</option>
                        <option value="lastMonth">Mês passado</option>
                        <option value="last7">Últimos 7 dias</option>
                        <option value="last30">Últimos 30 dias</option>
                        <option value="thisYear">Ano atual</option>
                        <option value="lastYear">Ano passado</option>
                        <option value="custom">Personalizado</option>
                      </select>
                    </div>

                    <div>
                      <label className={UI.label} style={{ color: T.text2 }}>
                        Início
                      </label>
                      <input
                        className={UI.input}
                        style={{ borderColor: T.border }}
                        type="date"
                        value={start}
                        max={todayISO()}
                        onChange={(e) => {
                          setStart(e.target.value);
                          setPeriodPreset("custom");
                        }}
                      />
                    </div>

                    <div>
                      <label className={UI.label} style={{ color: T.text2 }}>
                        Fim
                      </label>
                      <input
                        className={UI.input}
                        style={{ borderColor: T.border }}
                        type="date"
                        value={end}
                        max={todayISO()}
                        onChange={(e) => {
                          const v = e.target.value;
                          const t = todayISO();
                          setEnd(v > t ? t : v);
                          setPeriodPreset("custom");
                        }}
                      />
                    </div>

                    <div>
                      <label className={UI.label} style={{ color: T.text2 }}>
                        Unidade
                      </label>
                      <Segmented
                        value={energyUnit}
                        onChange={(v) => setEnergyUnit(v as "kWh" | "MWh")}
                        options={[
                          { value: "MWh", label: "MWh" },
                          { value: "kWh", label: "kWh" },
                        ]}
                      />
                    </div>

                    <div>
                      <label className={UI.label} style={{ color: T.text2 }}>
                        Granularidade
                      </label>
                      <Segmented
                        value={group}
                        onChange={(v) => setGroup(v as "auto" | "day" | "month" | "year")}
                        options={[
                          { value: "auto", label: "Auto" },
                          { value: "day", label: "Dia" },
                          { value: "month", label: "Mês" },
                          { value: "year", label: "Ano" },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div
              ref={chartsFullscreen.ref}
              className={cx(
                UI.section,
                "relative",
                chartsFullscreen.isFullscreen ? "rounded-none border-0 min-h-screen" : ""
              )}
              style={{
                borderColor: T.border,
                background: chartsFullscreen.isFullscreen ? T.bg : T.card,
              }}
            >
              <SectionHeader
                title={presentationActive ? "Modo apresentação" : "Performance operacional"}
                hint={
                  presentationActive
                    ? `Troca automática de usina a cada ${PRESENTATION_STATION_SECONDS} segundos`
                    : "Geração, irradiação, performance ratio e disponibilidade"
                }
                right={
                  <div className="flex items-center gap-2 flex-wrap">
                    <div
                      className="rounded-2xl border px-3 py-2 text-[11px] font-semibold"
                      style={{ borderColor: T.border, background: T.cardSoft2, color: T.text2 }}
                    >
                      {presentationActive
                        ? `Próxima usina em ${stationCountdown}s`
                        : `Atualizado em ${lastUpdatedAt ? brDateTime(lastUpdatedAt) : "—"}`}
                    </div>

                    {presentationActive ? (
                      <>
                        <Btn tone="secondary" onClick={nextStation} title="Próxima usina">
                          Próxima
                          <ChevronRight className="w-4 h-4" />
                        </Btn>

                        <Btn tone="secondary" onClick={stopPresentation} title="Sair da apresentação">
                          <Minimize2 className="w-4 h-4" />
                          Sair
                        </Btn>
                      </>
                    ) : (
                      <Btn tone="secondary" onClick={chartsFullscreen.toggle} title="Tela cheia">
                        <LayoutDashboard className="w-4 h-4" />
                        Modo Dashboard
                      </Btn>
                    )}
                  </div>
                }
              />

              <div
                className={cx(
                  "p-5 grid gap-4",
                  presentationActive ? "h-[calc(100vh-150px)] overflow-hidden" : ""
                )}
              >
                {presentationActive ? (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-full">
                    <div
                      className="xl:col-span-12 border rounded-[20px] p-4"
                      style={{ borderColor: T.border, background: T.cardSoft2 }}
                    >
                      <MiniChart
                        title="Performance energética"
                        subtitle="Geração, perdas e curvas de referência"
                        data={seriesEnergy}
                        xKey="periodo"
                        series={chartEnergySeries}
                        height={360}
                        formatterLeft={(v) => brNum(v, 2)}
                        xLabelCount={14}
                        stackBars
                      />
                    </div>

                    <div
                      className="xl:col-span-6 border rounded-[20px] p-4"
                      style={{ borderColor: T.border, background: T.cardSoft2 }}
                    >
                      <MiniChart
                        title="Irradiação acumulada"
                        subtitle="Ritmo acumulado do período"
                        data={seriesIrr}
                        xKey="periodo"
                        series={chartIrr2}
                        height={250}
                        formatterLeft={(v) => brNum(v, 2)}
                        xLabelCount={10}
                      />
                    </div>

                    <div
                      className="xl:col-span-6 border rounded-[20px] p-4"
                      style={{ borderColor: T.border, background: T.cardSoft2 }}
                    >
                      <MiniChart
                        title="Performance Ratio"
                        subtitle="PR real comparado à meta"
                        data={seriesPR}
                        xKey="periodo"
                        series={chartPR}
                        height={250}
                        yDomain={[0, 100]}
                        formatterLeft={(v) => `${brNum(v, 0)}%`}
                        xLabelCount={10}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="border rounded-[20px] p-4"
                      style={{ borderColor: T.border, background: T.cardSoft2 }}
                    >
                      <MiniChart
                        title="Performance energética"
                        subtitle="Geração real, perdas estimadas e curvas de referência"
                        data={seriesEnergy}
                        xKey="periodo"
                        series={chartEnergySeries}
                        height={390}
                        formatterLeft={(v) => brNum(v, 2)}
                        xLabelCount={10}
                        stackBars
                      />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div
                        className="border rounded-[20px] p-4"
                        style={{ borderColor: T.border, background: T.cardSoft2 }}
                      >
                        <MiniChart
                          title="Irradiação POA"
                          subtitle="Real versus meta do período"
                          data={seriesIrr}
                          xKey="periodo"
                          series={chartIrr1}
                          height={320}
                          formatterLeft={(v) => brNum(v, 2)}
                          xLabelCount={8}
                        />
                      </div>

                      <div
                        className="border rounded-[20px] p-4"
                        style={{ borderColor: T.border, background: T.cardSoft2 }}
                      >
                        <MiniChart
                          title="Irradiação acumulada"
                          subtitle="Ritmo acumulado frente à referência"
                          data={seriesIrr}
                          xKey="periodo"
                          series={chartIrr2}
                          height={320}
                          formatterLeft={(v) => brNum(v, 2)}
                          xLabelCount={8}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div
                        className="border rounded-[20px] p-4"
                        style={{ borderColor: T.border, background: T.cardSoft2 }}
                      >
                        <MiniChart
                          title="Performance Ratio"
                          subtitle="Eficiência operacional comparada à meta"
                          data={seriesPR}
                          xKey="periodo"
                          series={chartPR}
                          height={300}
                          yDomain={[0, 100]}
                          formatterLeft={(v) => `${brNum(v, 0)}%`}
                          xLabelCount={8}
                        />
                      </div>

                      <div
                        className="border rounded-[20px] p-4"
                        style={{ borderColor: T.border, background: T.cardSoft2 }}
                      >
                        <MiniChart
                          title="Disponibilidade operacional"
                          subtitle="Disponibilidade real frente à meta"
                          data={seriesAvail}
                          xKey="periodo"
                          series={chartAvail}
                          height={300}
                          yDomain={[0, 100]}
                          formatterLeft={(v) => `${brNum(v, 0)}%`}
                          xLabelCount={8}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!presentationActive ? (
              <div
                className={UI.section}
                style={{ borderColor: T.border, background: T.card }}
              >
                <SectionHeader
                  title="Histórico analítico"
                  hint="Base detalhada da usina selecionada para conferência e exportação"
                  right={
                    <Btn
                      tone="secondary"
                      onClick={exportExcel}
                      loading={xlsxLoading}
                      disabled={!data?.ok || !tableRows.length}
                      title="Exportar histórico para Excel"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Excel
                    </Btn>
                  }
                />

                <div className="p-5 space-y-4">
                  <GerencialTable rows={tableRows} />
                </div>
              </div>
            ) : null}

            {isReloading ? (
              <div
                className="absolute inset-0 z-20 flex items-start justify-center"
                style={{
                  background: "rgba(243,246,248,0.18)",
                  backdropFilter: "blur(2px)",
                  WebkitBackdropFilter: "blur(2px)",
                }}
              >
                <div
                  className="mt-8 border rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
                  style={{ borderColor: T.border, background: T.card }}
                >
                  <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  <div className="text-sm font-medium" style={{ color: T.text }}>
                    Atualizando dados…
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <style jsx global>{`
        input:focus,
        textarea:focus,
        select:focus {
          outline: none !important;
          box-shadow: 0 0 0 2px ${T.accentRing} !important;
        }

        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(15, 23, 42, 0.16);
          border-radius: 999px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </section>
  );
}

export default function Page() {
  return <TecsciPage />;
}
