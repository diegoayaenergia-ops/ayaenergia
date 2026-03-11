"use client";

import React, {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Search,
  RefreshCw,
  Eraser,
  FileDown,
  FileSpreadsheet,
  Zap,
  Gauge,
  Activity,
  ChevronRight,
  TrendingUp,
  CalendarDays,
  Maximize2,
  Minimize2,
  LayoutDashboard,
  SunMedium,
  ShieldCheck,
  Database,
  BarChart3,
  Factory,
  Monitor,
  LineChart,
  ClipboardList,
} from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) =>
  p.filter(Boolean).join(" ");

const T = {
  bg: "#F3F6F8",
  bg2: "#EEF2F6",
  pageGlow: "rgba(22, 101, 52, 0.04)",

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
  text4: "rgba(15, 23, 42, 0.38)",
  mutedBg: "rgba(15, 23, 42, 0.035)",

  accent: "#166534",
  accent2: "#14532D",
  accent3: "#1F7A44",
  accentSoft: "rgba(22, 101, 52, 0.08)",
  accentSoft2: "rgba(22, 101, 52, 0.14)",
  accentRing: "rgba(22, 101, 52, 0.18)",

  blue: "#1D4ED8",
  blueSoft: "rgba(29, 78, 216, 0.08)",

  okBg: "rgba(16, 185, 129, 0.10)",
  okBd: "rgba(16, 185, 129, 0.26)",
  okTx: "#065F46",

  warnBg: "rgba(245, 158, 11, 0.10)",
  warnBd: "rgba(245, 158, 11, 0.24)",
  warnTx: "#92400E",

  errBg: "rgba(239, 68, 68, 0.10)",
  errBd: "rgba(239, 68, 68, 0.24)",
  errTx: "#991B1B",

  infoBg: "rgba(37, 99, 235, 0.08)",
  infoBd: "rgba(37, 99, 235, 0.18)",
  infoTx: "#1D4ED8",

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
    "border bg-white min-w-0 rounded-[22px] shadow-[0_2px_12px_rgba(15,23,42,0.04),0_18px_44px_rgba(15,23,42,0.06)]",
  section:
    "border bg-white min-w-0 rounded-[20px] shadow-[0_1px_3px_rgba(15,23,42,0.04),0_10px_28px_rgba(15,23,42,0.05)]",
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

type ChartPoint = Record<string, any>;

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

const PRESENTATION_STATION_SECONDS = 20;

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

function safeNum(v: any): number | null {
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
  if (pct >= 100) return "good";
  if (pct >= 95) return "warn";
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

function svgToString(el: SVGSVGElement, width: number, height: number) {
  const clone = el.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.querySelectorAll("foreignObject").forEach((n) => n.remove());
  return new XMLSerializer().serializeToString(clone);
}

async function svgStringToPngDataUrl(
  svg: string,
  width: number,
  height: number
) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Falha ao renderizar SVG"));
    img.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  URL.revokeObjectURL(url);
  return canvas.toDataURL("image/png");
}

async function svgElementToPng(
  el: SVGSVGElement,
  width?: number,
  height?: number
) {
  const vb = el.viewBox?.baseVal;
  const w = width || vb?.width || el.clientWidth || 1400;
  const h = height || vb?.height || el.clientHeight || 420;
  const svg = svgToString(el, w, h);
  return svgStringToPngDataUrl(svg, w, h);
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

function rangeLabel(start: string, end: string) {
  return `${brDate(start)} — ${brDate(clampEndToToday(end))}`;
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
    if (!ref.current) return;
    const el = ref.current;

    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({
        w: Math.max(360, Math.floor(r.width)),
        h: Math.max(220, Math.floor(r.height)),
      });
    };

    update();

    const ro = new ResizeObserver(update);
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
      const url =
        `/api/tecsci/performance?ps_id=${filters.psId}` +
        `&start_date=${filters.start}` +
        `&end_date=${filters.end}` +
        `&group=${filters.group}`;

      const r = await fetch(url, { cache: "no-store", signal: ctrl.signal });
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
    } catch (e: any) {
      if (e?.name === "AbortError") return;
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

const Pill = memo(function Pill({
  children,
  tone = "soft",
}: {
  children: ReactNode;
  tone?: "soft" | "accent" | "info";
}) {
  const style =
    tone === "accent"
      ? {
          borderColor: T.accentSoft2,
          background: T.accentSoft,
          color: T.accent,
        }
      : tone === "info"
      ? {
          borderColor: T.infoBd,
          background: T.infoBg,
          color: T.infoTx,
        }
      : {
          borderColor: T.border,
          background: T.cardSoft,
          color: T.text2,
        };

  return (
    <span
      className="inline-flex items-center h-8 px-3 text-[11px] font-semibold border rounded-2xl"
      style={style}
    >
      {children}
    </span>
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
      className="rounded-[18px] border px-4 py-4 min-w-0 h-full"
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
          <div className="mt-1 text-[23px] font-bold truncate" style={{ color: T.text }}>
            {value}
          </div>
          {sub ? (
            <div className="mt-1 text-[11px] leading-5" style={{ color: T.text3 }}>
              {sub}
            </div>
          ) : null}
        </div>

        <div
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl"
          style={{ background: T.cardSoft2, color: T.text2 }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
});

const OpsStrip = memo(function OpsStrip({
  stationName,
  lastUpdatedAt,
  generated,
  energyUnit,
  p90Pct,
  prPct,
  availPct,
}: {
  stationName: string;
  lastUpdatedAt: string | null;
  generated: number | null;
  energyUnit: "kWh" | "MWh";
  p90Pct: number | null;
  prPct: number | null;
  availPct: number | null;
}) {
  const status =
    p90Pct != null && prPct != null && availPct != null
      ? (p90Pct + prPct + availPct) / 3
      : null;

  const tone = statusTone(status);
  const style = toneStyles(tone);

  return (
    <div
      className="border rounded-[18px] px-4 py-4"
      style={{ borderColor: T.border, background: T.cardSoft3 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div
          className="lg:col-span-4 border rounded-[16px] p-4"
          style={{ borderColor: T.border, background: T.card }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className={UI.label} style={{ color: T.text3 }}>
                Contexto operacional
              </div>
              <div className="mt-1 text-base font-semibold truncate" style={{ color: T.text }}>
                {stationName}
              </div>
              <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                Última atualização: {brDateTime(lastUpdatedAt)}
              </div>
            </div>
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: T.cardSoft2, color: T.text2 }}
            >
              <Monitor className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>

        <div
          className="lg:col-span-2 border rounded-[16px] p-4"
          style={{ borderColor: T.border, background: T.card }}
        >
          <div className={UI.label} style={{ color: T.text3 }}>
            Geração
          </div>
          <div className="mt-1 text-[22px] font-bold" style={{ color: T.text }}>
            {generated == null ? "—" : brNum(generated, 2)}
          </div>
          <div className="text-xs" style={{ color: T.text3 }}>
            {energyUnit}
          </div>
        </div>

        <div
          className="lg:col-span-2 border rounded-[16px] p-4"
          style={{ borderColor: T.border, background: T.card }}
        >
          <div className={UI.label} style={{ color: T.text3 }}>
            Atingimento P90
          </div>
          <div className="mt-2">
            <StatusChip pct={p90Pct} />
          </div>
        </div>

        <div
          className="lg:col-span-2 border rounded-[16px] p-4"
          style={{ borderColor: T.border, background: T.card }}
        >
          <div className={UI.label} style={{ color: T.text3 }}>
            PR / Meta
          </div>
          <div className="mt-2">
            <StatusChip pct={prPct} />
          </div>
        </div>

        <div
          className="lg:col-span-2 border rounded-[16px] p-4"
          style={{ borderColor: T.border, background: T.card }}
        >
          <div className={UI.label} style={{ color: T.text3 }}>
            Disponibilidade
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <StatusChip pct={availPct} />
            <span
              className="inline-flex items-center h-8 px-3 rounded-2xl border text-[11px] font-semibold"
              style={style}
            >
              {tone === "good"
                ? "Estável"
                : tone === "warn"
                ? "Atenção"
                : tone === "bad"
                ? "Crítico"
                : "Neutro"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

const CompareKpiCard = memo(function CompareKpiCard({
  title,
  aLabel,
  aValue,
  bLabel,
  bValue,
  fmt,
  icon,
}: {
  title: string;
  aLabel: string;
  aValue: number | null;
  bLabel: string;
  bValue: number | null;
  fmt: (n: number) => string;
  icon: ReactNode;
}) {
  const pct = pctVs(aValue, bValue);
  const dlt = aValue != null && bValue != null ? aValue - bValue : null;
  const tone = statusTone(pct);
  const style = toneStyles(tone);
  const good = pct != null ? pct >= 100 : null;
  const barColor = good == null ? T.borderStrong : good ? T.accent2 : T.errBd;

  return (
    <div
      className="border rounded-[20px] p-4 min-w-0 h-full"
      style={{
        borderColor: T.border,
        background: "linear-gradient(180deg, #FFFFFF 0%, #FBFCFD 100%)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 w-full">
          <div className={UI.label} style={{ color: T.text2 }}>
            {title}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px]" style={{ color: T.text3 }}>
                {aLabel}
              </div>
              <div className="text-xl font-extrabold truncate" style={{ color: T.text }}>
                {aValue == null ? "—" : fmt(aValue)}
              </div>
            </div>

            <div>
              <div className="text-[11px]" style={{ color: T.text3 }}>
                {bLabel}
              </div>
              <div className="text-xl font-extrabold truncate" style={{ color: T.text }}>
                {bValue == null ? "—" : fmt(bValue)}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-2xl border text-[11px] font-semibold"
              style={style}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              {pct == null ? "Sem referência" : `${brNum(pct, 1)}% da meta`}
            </span>

            <div
              className="text-[11px] font-semibold"
              style={{
                color: good == null ? T.text3 : good ? T.accent : T.errTx,
              }}
            >
              Δ {dlt == null ? "—" : fmt(dlt)}
            </div>
          </div>

          <div
            className="mt-3 border rounded-2xl overflow-hidden"
            style={{ borderColor: T.border, background: T.mutedBg, height: 10 }}
          >
            <div
              style={{
                width: `${pct == null ? 0 : Math.max(0, Math.min(100, pct))}%`,
                height: "100%",
                background: barColor,
                opacity: 0.95,
              }}
            />
          </div>
        </div>

        <div
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl"
          style={{ background: T.cardSoft2, color: T.text2 }}
        >
          {icon}
        </div>
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
  svgRef,
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
  svgRef?: React.RefObject<SVGSVGElement | null>;
  xLabelCount?: number;
  stackBars?: boolean;
}) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const W = size.w;
  const H = height;

  const n = Math.max(1, data.length);
  const M = { l: 60, r: 16, t: 14, b: 44 };
  const plotW = Math.max(10, W - M.l - M.r);
  const plotH = Math.max(10, H - M.t - M.b);

  const bars = series.filter((s) => s.type === "bar");
  const lines = series.filter((s) => s.type === "line");

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

  const ticks = useMemo(() => niceTicks(dom[0], dom[1], 5), [dom]);
  const fmt = formatterLeft || ((v: number) => brNum(v, 0));

  const y = (v: number) => {
    const [mn, mx] = dom;
    const t = (v - mn) / (mx - mn);
    return M.t + plotH * (1 - t);
  };

  const xBand = plotW / n;
  const xCenter = (i: number) => M.l + i * xBand + xBand / 2;

  const every = useMemo(() => {
    const maxLabelsByWidth = Math.max(2, Math.floor(plotW / 84));
    const target = Math.max(
      2,
      Math.min(xLabelCount, maxLabelsByWidth, data.length || 2)
    );
    return Math.max(1, Math.ceil((data.length || 1) / target));
  }, [plotW, xLabelCount, data.length]);

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
      <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: T.text }}>
        {title}
      </div>
      {subtitle ? (
        <div className="mt-1 text-[11px]" style={{ color: T.text3 }}>
          {subtitle}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {series.map((s) => (
          <div
            key={s.key}
            className="inline-flex items-center gap-2 h-8 px-3 text-[11px] font-semibold border rounded-2xl"
            style={{
              borderColor: T.border,
              background: T.cardSoft,
              color: T.text2,
            }}
          >
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            <span>{s.name}</span>
          </div>
        ))}
      </div>

      <div
        className="mt-3 border rounded-2xl overflow-hidden"
        style={{ borderColor: T.border, background: T.card }}
      >
        <svg
          ref={svgRef}
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ display: "block", width: "100%", height: `${H}px` }}
        >
          <rect x={0} y={0} width={W} height={H} fill={T.card} />

          {ticks.map((v, idx) => {
            const yy = y(v);
            return (
              <g key={idx}>
                <line x1={M.l} y1={yy} x2={M.l + plotW} y2={yy} stroke={T.grid} />
                <text x={M.l - 8} y={yy + 4} fontSize={10} textAnchor="end" fill={T.text3}>
                  {fmt(v)}
                </text>
              </g>
            );
          })}

          {data.map((p, i) => {
            if (i % every !== 0 && i !== data.length - 1) return null;
            return (
              <text
                key={i}
                x={xCenter(i)}
                y={M.t + plotH + 24}
                fontSize={10}
                textAnchor="middle"
                fill={T.text3}
              >
                {String(p[xKey])}
              </text>
            );
          })}

          {data.map((p, i) => {
            if (stackBars) {
              const barWidth = Math.max(10, Math.min(36, xBand * 0.52));
              const x = xCenter(i) - barWidth / 2;
              let acc = 0;

              return (
                <g key={`stack-${i}`}>
                  {bars.map((s, j) => {
                    const v = safeNum(p[s.key]);
                    if (v == null || v <= 0) return null;
                    const yTop = y(acc + v);
                    const yBottom = y(acc);
                    const h = Math.max(0, yBottom - yTop);
                    acc += v;

                    return (
                      <rect
                        key={`${s.key}-${i}`}
                        x={x}
                        y={yTop}
                        width={barWidth}
                        height={h}
                        fill={s.color}
                        opacity={0.92}
                        rx={j === bars.length - 1 ? 4 : 0}
                        ry={j === bars.length - 1 ? 4 : 0}
                      />
                    );
                  })}
                </g>
              );
            }

            const groupW = Math.min(xBand * 0.72, 56);
            const barGap = 4;
            const barW = Math.max(
              4,
              (groupW - barGap * Math.max(0, bars.length - 1)) /
                Math.max(1, bars.length)
            );
            const left =
              xCenter(i) -
              (barW * bars.length + barGap * (bars.length - 1)) / 2;

            return (
              <g key={`bars-${i}`}>
                {bars.map((s, j) => {
                  const v = safeNum(p[s.key]);
                  if (v == null) return null;
                  const y0 = y(0);
                  const yv = y(v);

                  return (
                    <rect
                      key={`${s.key}-${i}`}
                      x={left + j * (barW + barGap)}
                      y={yv}
                      width={barW}
                      height={Math.max(0, y0 - yv)}
                      fill={s.color}
                      opacity={0.92}
                      rx={4}
                      ry={4}
                    />
                  );
                })}
              </g>
            );
          })}

          {lines.map((s) => {
            let d = "";

            data.forEach((p, i) => {
              const v = safeNum(p[s.key]);
              if (v == null) return;
              const xx = xCenter(i);
              const yy = y(v);
              d += d ? ` L ${xx} ${yy}` : `M ${xx} ${yy}`;
            });

            return (
              <path
                key={s.key}
                d={d || "M 0 0"}
                fill="none"
                stroke={s.color}
                strokeWidth={2.6}
                strokeDasharray={s.dashed ? "6 6" : undefined}
                opacity={0.96}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {lines.map((s) =>
            s.showPoints
              ? data.map((p, i) => {
                  const v = safeNum(p[s.key]);
                  if (v == null) return null;

                  return (
                    <circle
                      key={`pt-${s.key}-${i}`}
                      cx={xCenter(i)}
                      cy={y(v)}
                      r={s.pointRadius ?? 3}
                      fill={T.card}
                      stroke={s.color}
                      strokeWidth={2}
                    />
                  );
                })
              : null
          )}
        </svg>
      </div>
    </div>
  );
});

const GerencialTable = memo(function GerencialTable({
  rows,
  energyUnit,
}: {
  rows: TableRow[];
  energyUnit: "kWh" | "MWh";
}) {
  return (
    <div className="border rounded-[20px] overflow-hidden" style={{ borderColor: T.border }}>
      <div className="overflow-auto max-h-[620px]">
        <table className="w-full min-w-[1480px] border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr>
              {[
                "Período",
                `Geração (${energyUnit})`,
                `Perdas AYA (${energyUnit})`,
                `P90 (${energyUnit})`,
                "Geração/P90",
                `Estimado TecSci (${energyUnit})`,
                "Geração/TecSci",
                `Estimado AYA (${energyUnit})`,
                "Geração/AYA",
                "Irradiação",
                "Irrad. Meta",
                "Irrad./Meta",
                "PR",
                "PR Meta",
                "PR/Meta",
                "Disp.",
                "Disp. Meta",
                "Disp./Meta",
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
                <td colSpan={18} className="px-4 py-10 text-center text-sm" style={{ color: T.text3 }}>
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
                const disp = pctVs(r.disponibilidade, r.disponibilidadeMeta);

                return (
                  <tr key={`${r.periodo}-${i}`}>
                    <td
                      className="px-3 py-3 text-sm border-b sticky left-0"
                      style={{
                        borderColor: T.border,
                        color: T.text,
                        background: i % 2 === 0 ? "#FFFFFF" : "#FBFCFD",
                      }}
                    >
                      {r.periodo}
                    </td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.text }}>{brNum(r.geracao, 2)}</td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.errTx }}>{brNum(r.perdasAya, 2)}</td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.text }}>{brNum(r.p90, 2)}</td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border }}><StatusChip pct={genP90} /></td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.text }}>{brNum(r.estimadoTec, 2)}</td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border }}><StatusChip pct={genTec} /></td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.text }}>{brNum(r.estimadoAya, 2)}</td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border }}><StatusChip pct={genAya} /></td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.text }}>{brNum(r.irradiacao, 2)}</td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.text }}>{brNum(r.irradiacaoMeta, 2)}</td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border }}><StatusChip pct={irr} /></td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.text }}>{brPct(r.pr, 1)}</td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.text }}>{brPct(r.prMeta, 1)}</td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border }}><StatusChip pct={pr} /></td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.text }}>{brPct(r.disponibilidade, 1)}</td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border, color: T.text }}>{brPct(r.disponibilidadeMeta, 1)}</td>
                    <td className="px-3 py-3 text-sm border-b" style={{ borderColor: T.border }}><StatusChip pct={disp} /></td>
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
  const [pdfLoading, setPdfLoading] = useState(false);
  const [xlsxLoading, setXlsxLoading] = useState(false);
  const [tableQuery, setTableQuery] = useState("");
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

  const deferredTableQuery = useDeferredValue(tableQuery);

  const svgEnergyRef = useRef<SVGSVGElement | null>(null);
  const svgIrrRef = useRef<SVGSVGElement | null>(null);
  const svgIrrAccRef = useRef<SVGSVGElement | null>(null);
  const svgPrRef = useRef<SVGSVGElement | null>(null);
  const svgAvailRef = useRef<SVGSVGElement | null>(null);

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
      return (s?.monthly || []).map((x) => ({ label: x.month, dto: x }));
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

  const heroMetrics = useMemo(() => {
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
        sub: `P90 ${brNum(kpi.p90, 2)} • TecSci ${brNum(kpi.expectedTec, 2)}`,
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
        label: "Atingimento TecSci",
        value: tecPct == null ? "—" : `${brNum(tecPct, 1)}%`,
        sub: `Gap ${brNum(gapTec, 2)} ${energyUnit}`,
        icon: <Gauge className="w-5 h-5" />,
        tone: statusTone(tecPct),
      },
      {
        label: `Perda estimada (${energyUnit})`,
        value: lossAya == null ? "—" : brNum(lossAya, 2),
        sub: `Referência AYA ${brNum(kpi.estimatedAya, 2)}`,
        icon: <Activity className="w-5 h-5" />,
        tone: statusTone(ayaPct),
      },
      {
        label: "PR / Meta",
        value: prPct == null ? "—" : `${brNum(prPct, 1)}%`,
        sub: `${brPct(kpi.pr, 1)} vs ${brPct(kpi.prMeta, 1)}`,
        icon: <LineChart className="w-5 h-5" />,
        tone: statusTone(prPct),
      },
      {
        label: "Disponibilidade / Meta",
        value: availPct == null ? "—" : `${brNum(availPct, 1)}%`,
        sub: `${brPct(kpi.avail, 1)} vs ${brPct(kpi.availMeta, 1)}`,
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
    return bucket.map((b) => {
      const genKwh = safeNum(b.dto.generated_energy_kwh);
      const expTecKwh = safeNum(b.dto.expected_energy_kwh);
      const p90Kwh = safeNum(b.dto.projected_energy_kwh);
      const poa = safeNum(b.dto.poa_irradiation_kwh);
      const poaMeta = safeNum(b.dto.projected_irradiation_kwh);
      const pr = safeNum(b.dto.pr_percentage);
      const prMeta = prMetaPct(safeNum(b.dto.projected_pr));
      const disp = safeNum(b.dto.availability_percentage);
      const dispMeta = 97;
      const projPr = safeNum(b.dto.projected_pr);
      const dcKw = safeNum(b.dto.dc_power_kw);
      const ayaKwh = estimatedAyaKwh(poa, projPr, dcKw);
      const lossAyaKwh =
        ayaKwh != null && genKwh != null ? clamp0(ayaKwh - genKwh) : null;

      return {
        periodo: b.label,
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
    });
  }, [bucket, energyUnit]);

  const filteredTableRows = useMemo(() => {
    const q = deferredTableQuery.trim().toLowerCase();
    if (!q) return tableRows;
    return tableRows.filter((r) => r.periodo.toLowerCase().includes(q));
  }, [tableRows, deferredTableQuery]);

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
      },
      {
        key: "estimadoAya",
        name: `Estimado AYA (${energyUnit})`,
        type: "line",
        color: T.cAya,
        dashed: true,
        showPoints: true,
        pointRadius: 3.5,
      },
      {
        key: "estimadoTec",
        name: `Estimado TecSci (${energyUnit})`,
        type: "line",
        color: T.cTec,
        dashed: true,
        showPoints: true,
        pointRadius: 3.5,
      },
    ],
    [energyUnit]
  );

  const chartIrr1: ChartSeries[] = useMemo(
    () => [
      { key: "poa", name: "Irradiação real", type: "bar", color: T.cPoa },
      {
        key: "meta",
        name: "Irradiação Meta",
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
        name: "Irradiação acumulada",
        type: "line",
        color: T.cPoa,
      },
      {
        key: "accMeta",
        name: "Irradiação acumulada Meta",
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
        name: "PR Meta",
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
        name: "Disponibilidade Meta",
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
      perdas_aya: r.perdasAya,
      p90: r.p90,
      perc_geracao_p90: pctVs(r.geracao, r.p90),
      estimado_tecsci: r.estimadoTec,
      perc_geracao_tecsci: pctVs(r.geracao, r.estimadoTec),
      estimado_aya: r.estimadoAya,
      perc_geracao_aya: pctVs(r.geracao, r.estimadoAya),
      irradiacao: r.irradiacao,
      irradiacao_meta: r.irradiacaoMeta,
      perc_irradiacao_meta: pctVs(r.irradiacao, r.irradiacaoMeta),
      pr: r.pr,
      pr_meta: r.prMeta,
      perc_pr_meta: pctVs(r.pr, r.prMeta),
      disponibilidade: r.disponibilidade,
      disponibilidade_meta: r.disponibilidadeMeta,
      perc_disponibilidade_meta: pctVs(
        r.disponibilidade,
        r.disponibilidadeMeta
      ),
    }));
  }, [tableRows]);

  const pdfFileName = useMemo(
    () =>
      sanitizeFileName(
        `Relatorio_Gerencial_${selectedStation?.name || "Usina"}_${start}_${clampEndToToday(end)}`
      ),
    [selectedStation, start, end]
  );

  const excelFileName = useMemo(
    () =>
      sanitizeFileName(
        `Tabela_Analitica_${selectedStation?.name || "Usina"}_${start}_${clampEndToToday(end)}`
      ),
    [selectedStation, start, end]
  );

  const captureCharts = useCallback(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const items = [
      { title: "Energia", ref: svgEnergyRef, w: 1600, h: 680 },
      { title: "Irradiação", ref: svgIrrRef, w: 1400, h: 560 },
      { title: "Irradiação acumulada", ref: svgIrrAccRef, w: 1400, h: 560 },
      { title: "PR", ref: svgPrRef, w: 1400, h: 520 },
      { title: "Disponibilidade", ref: svgAvailRef, w: 1400, h: 520 },
    ] as const;

    const out: Array<{ title: string; dataUrl: string; w: number; h: number }> = [];

    for (const item of items) {
      if (!item.ref.current) continue;
      const dataUrl = await svgElementToPng(item.ref.current, item.w, item.h);
      out.push({ title: item.title, dataUrl, w: item.w, h: item.h });
    }

    return out;
  }, []);

  const exportExcel = useCallback(async () => {
    if (!data?.ok || !tableRows.length) {
      setMsg({ type: "err", text: "Sem dados para exportar." });
      return;
    }

    setXlsxLoading(true);

    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      const resumoAOA: any[][] = [
        ["Tabela Analítica"],
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
      XLSX.utils.book_append_sheet(wb, wsSerie, "Tabela");

      XLSX.writeFile(wb, `${excelFileName}.xlsx`, { compression: true });
      setMsg({ type: "ok", text: "Excel gerado com sucesso." });
    } catch {
      setMsg({ type: "err", text: "Falha ao gerar Excel." });
    } finally {
      setXlsxLoading(false);
    }
  }, [
    data,
    tableRows.length,
    setMsg,
    kpi,
    start,
    end,
    resolvedGroup,
    energyUnit,
    lastUpdatedAt,
    exportRows,
    excelFileName,
  ]);

  const exportPdf = useCallback(async () => {
    if (!data?.ok || !tableRows.length) {
      setMsg({ type: "err", text: "Sem dados para gerar PDF." });
      return;
    }

    setPdfLoading(true);

    try {
      const images = await captureCharts();
      if (!images.length) throw new Error();

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 34;
      const usableW = pageW - margin * 2;

      const drawHeader = (title = "Relatório Gerencial") => {
        doc.setFillColor(22, 101, 52);
        doc.rect(0, 0, pageW, 64, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.text(title, margin, 40);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Usina: ${selectedStation?.name || "-"}  •  Período: ${brDate(start)} - ${brDate(
            clampEndToToday(end)
          )}  •  Granularidade: ${groupLabel(resolvedGroup)}`,
          margin,
          84
        );

        doc.setDrawColor(229, 231, 235);
        doc.line(margin, 94, pageW - margin, 94);
      };

      const drawSectionTitle = (text: string, y: number) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(11, 18, 32);
        doc.text(text, margin, y);
      };

      const drawMiniTable = (rows: TableRow[], yStart: number) => {
        const cols = [
          { label: "Período", x: margin, w: 116, align: "left" as const },
          { label: "Geração", x: margin + 122, w: 92, align: "right" as const },
          { label: "% P90", x: margin + 220, w: 70, align: "right" as const },
          { label: "% TecSci", x: margin + 296, w: 78, align: "right" as const },
          { label: "% AYA", x: margin + 380, w: 72, align: "right" as const },
          { label: "% PR", x: margin + 458, w: 62, align: "right" as const },
          { label: "% Disp.", x: margin + 526, w: 70, align: "right" as const },
        ];

        const headerY = yStart;
        const rowH = 20;

        doc.setFillColor(247, 249, 251);
        doc.setDrawColor(229, 231, 235);
        doc.rect(margin, headerY, usableW, rowH, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);

        cols.forEach((c) => {
          doc.text(
            c.label,
            c.align === "left" ? c.x + 4 : c.x + c.w - 4,
            headerY + 13,
            { align: c.align === "left" ? "left" : "right" }
          );
        });

        let y = headerY + rowH;
        const maxRows = Math.min(14, rows.length);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(11, 18, 32);

        for (let i = 0; i < maxRows; i++) {
          const r = rows[i];

          const genP90 = pctVs(r.geracao, r.p90);
          const genTec = pctVs(r.geracao, r.estimadoTec);
          const genAya = pctVs(r.geracao, r.estimadoAya);
          const prPctRow = pctVs(r.pr, r.prMeta);
          const dispPctRow = pctVs(r.disponibilidade, r.disponibilidadeMeta);

          if (i % 2 === 0) {
            doc.setFillColor(252, 253, 254);
            doc.rect(margin, y, usableW, rowH, "F");
          }

          const values = [
            r.periodo,
            brNum(r.geracao, 2),
            genP90 == null ? "—" : `${brNum(genP90, 1)}%`,
            genTec == null ? "—" : `${brNum(genTec, 1)}%`,
            genAya == null ? "—" : `${brNum(genAya, 1)}%`,
            prPctRow == null ? "—" : `${brNum(prPctRow, 1)}%`,
            dispPctRow == null ? "—" : `${brNum(dispPctRow, 1)}%`,
          ];

          values.forEach((v, idx) => {
            const c = cols[idx];
            doc.text(
              v,
              c.align === "left" ? c.x + 4 : c.x + c.w - 4,
              y + 13,
              { align: c.align === "left" ? "left" : "right" }
            );
          });

          doc.setDrawColor(235, 237, 240);
          doc.line(margin, y + rowH, pageW - margin, y + rowH);
          y += rowH;
        }
      };

      drawHeader();
      drawSectionTitle("Resumo executivo", 122);
      drawMiniTable(tableRows, 140);

      images.forEach((img) => {
        doc.addPage();
        drawHeader(`Relatório Gerencial — ${img.title}`);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(11, 18, 32);
        doc.text(img.title, margin, 122);

        const drawW = usableW;
        const drawH = drawW * (img.h / img.w);
        const maxChartH = pageH - 156;
        const finalH = Math.min(drawH, maxChartH);

        doc.addImage(img.dataUrl, "PNG", margin, 138, drawW, finalH);
      });

      doc.save(`${pdfFileName}.pdf`);
      setMsg({ type: "ok", text: "PDF gerado com sucesso." });
    } catch {
      setMsg({ type: "err", text: "Falha ao gerar PDF." });
    } finally {
      setPdfLoading(false);
    }
  }, [
    data,
    tableRows,
    setMsg,
    captureCharts,
    pdfFileName,
    selectedStation,
    start,
    end,
    resolvedGroup,
  ]);

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
            className="px-5 sm:px-6 py-5"
            style={{
              background:
                "linear-gradient(135deg, rgba(22,101,52,0.05) 0%, rgba(22,101,52,0.00) 40%, rgba(15,23,42,0.03) 100%)",
            }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: T.cardSoft2, color: T.accent }}
                  >
                    <Factory className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className={UI.headerTitle} style={{ color: T.text }}>
                      Painel Operacional de Performance
                    </div>
                    <div className="mt-1 text-sm font-semibold truncate" style={{ color: T.text2 }}>
                      {selectedStation ? selectedStation.name : "Selecione a usina"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <Pill tone="accent">
                    <CalendarDays className="w-3.5 h-3.5 mr-1" />
                    {rangeLabel(start, end)}
                  </Pill>
                  <Pill>
                    <Database className="w-3.5 h-3.5 mr-1" />
                    {groupLabel(resolvedGroup)}
                  </Pill>
                  <Pill tone="info">
                    <BarChart3 className="w-3.5 h-3.5 mr-1" />
                    Energia em {energyUnit}
                  </Pill>
                  <Pill>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    {lastUpdatedAt ? brDateTime(lastUpdatedAt) : "Sem atualização"}
                  </Pill>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Btn tone="secondary" onClick={reload} loading={loading} title="Atualizar dados">
                  {!loading && <RefreshCw className="w-4 h-4" />}
                  {!loading && "Atualizar"}
                </Btn>

                <Btn tone="secondary" onClick={startPresentation} title="Modo apresentação">
                  <LayoutDashboard className="w-4 h-4" />
                  Apresentar
                </Btn>

                <Btn
                  tone="primary"
                  onClick={exportPdf}
                  loading={pdfLoading}
                  disabled={!data?.ok || !tableRows.length}
                  title="Gerar relatório em PDF"
                >
                  <FileDown className="w-4 h-4" />
                  Relatório Gerencial
                </Btn>
              </div>
            </div>

            <div className="mt-5">
              <OpsStrip
                stationName={selectedStation?.name || "—"}
                lastUpdatedAt={lastUpdatedAt}
                generated={kpi.geracao}
                energyUnit={energyUnit}
                p90Pct={p90Pct}
                prPct={prPct}
                availPct={availPct}
              />
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
              {heroMetrics.map((item) => (
                <ExecutiveMetric key={item.label} {...item} />
              ))}
            </div>
          </div>
        </div>

        {!presentationActive ? (
          <div className="mt-4 max-w-[520px]">
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
                  title="Filtros e configuração"
                  hint="Selecione a usina, período, granularidade e unidade de energia"
                  right={
                    <Btn
                      tone="secondary"
                      onClick={() => {
                        setMsg(null);
                        setTableQuery("");
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

            {!presentationActive ? (
              <div
                className={UI.section}
                style={{ borderColor: T.border, background: T.card }}
              >
                <SectionHeader
                  title="Resumo executivo"
                  hint="Comparativos consolidados do período e atingimento das metas"
                  right={
                    <Pill tone="accent">
                      <ClipboardList className="w-3.5 h-3.5 mr-1" />
                      Visão consolidada
                    </Pill>
                  }
                />

                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-3">
                  <div className="xl:col-span-4">
                    <CompareKpiCard
                      title={`Geração x P90 (${energyUnit})`}
                      aLabel="Geração"
                      aValue={kpi.geracao}
                      bLabel="P90"
                      bValue={kpi.p90}
                      fmt={(n) => brNum(n, 2)}
                      icon={<Zap className="w-4 h-4" />}
                    />
                  </div>

                  <div className="xl:col-span-4">
                    <CompareKpiCard
                      title={`Geração x Estimado TecSci (${energyUnit})`}
                      aLabel="Geração"
                      aValue={kpi.geracao}
                      bLabel="Estimado TecSci"
                      bValue={kpi.expectedTec}
                      fmt={(n) => brNum(n, 2)}
                      icon={<Gauge className="w-4 h-4" />}
                    />
                  </div>

                  <div className="xl:col-span-4">
                    <CompareKpiCard
                      title={`Geração x Estimado AYA (${energyUnit})`}
                      aLabel="Geração"
                      aValue={kpi.geracao}
                      bLabel="Estimado AYA"
                      bValue={kpi.estimatedAya}
                      fmt={(n) => brNum(n, 2)}
                      icon={<Activity className="w-4 h-4" />}
                    />
                  </div>

                  <div className="xl:col-span-4">
                    <CompareKpiCard
                      title="Irradiação x Meta"
                      aLabel="Irradiação"
                      aValue={kpi.poa}
                      bLabel="Meta"
                      bValue={kpi.poaMeta}
                      fmt={(n) => brNum(n, 2)}
                      icon={<SunMedium className="w-4 h-4" />}
                    />
                  </div>

                  <div className="xl:col-span-4">
                    <CompareKpiCard
                      title="PR x Meta PR"
                      aLabel="PR"
                      aValue={kpi.pr}
                      bLabel="Meta PR"
                      bValue={kpi.prMeta}
                      fmt={(n) => brPct(n, 1)}
                      icon={<LineChart className="w-4 h-4" />}
                    />
                  </div>

                  <div className="xl:col-span-4">
                    <CompareKpiCard
                      title="Disponibilidade x Meta"
                      aLabel="Disponibilidade"
                      aValue={kpi.avail}
                      bLabel="Meta"
                      bValue={kpi.availMeta}
                      fmt={(n) => brPct(n, 1)}
                      icon={<ShieldCheck className="w-4 h-4" />}
                    />
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
                title={
                  presentationActive
                    ? `Modo apresentação — ${selectedStation?.name || "Usina"}`
                    : `Resumo gráfico — ${selectedStation?.name || "Usina"}`
                }
                hint={
                  presentationActive
                    ? "Troca automática de usina a cada 20 segundos"
                    : "Energia, irradiância, PR e disponibilidade operacional"
                }
                right={
                  <div className="flex items-center gap-2 flex-wrap">
                    <Pill>
                      <CalendarDays className="w-3.5 h-3.5 mr-1" />
                      {lastUpdatedAt ? brDateTime(lastUpdatedAt) : "Sem atualização"}
                    </Pill>

                    {presentationActive ? (
                      <>
                        <Pill tone="accent">Próxima usina em {stationCountdown}s</Pill>

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
                        <Maximize2 className="w-4 h-4" />
                        Tela cheia
                      </Btn>
                    )}
                  </div>
                }
              />

              {presentationActive ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-[-100000px] top-0 w-[1400px] opacity-0"
                >
                  <div
                    className="border rounded-[20px] p-4"
                    style={{ borderColor: T.border, background: T.cardSoft }}
                  >
                    <MiniChart
                      title="Irradiação"
                      subtitle="Real versus meta"
                      data={seriesIrr}
                      xKey="periodo"
                      series={chartIrr1}
                      height={320}
                      formatterLeft={(v) => brNum(v, 2)}
                      svgRef={svgIrrRef}
                      xLabelCount={8}
                    />
                  </div>

                  <div
                    className="mt-4 border rounded-[20px] p-4"
                    style={{ borderColor: T.border, background: T.cardSoft }}
                  >
                    <MiniChart
                      title="Disponibilidade"
                      subtitle="Disponibilidade operacional versus meta"
                      data={seriesAvail}
                      xKey="periodo"
                      series={chartAvail}
                      height={300}
                      yDomain={[0, 100]}
                      formatterLeft={(v) => `${brNum(v, 0)}%`}
                      svgRef={svgAvailRef}
                      xLabelCount={8}
                    />
                  </div>
                </div>
              ) : null}

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
                        subtitle="Geração, perdas e referências do período"
                        data={seriesEnergy}
                        xKey="periodo"
                        series={chartEnergySeries}
                        height={360}
                        formatterLeft={(v) => brNum(v, 2)}
                        svgRef={svgEnergyRef}
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
                        subtitle="Curva acumulada do período"
                        data={seriesIrr}
                        xKey="periodo"
                        series={chartIrr2}
                        height={250}
                        formatterLeft={(v) => brNum(v, 2)}
                        svgRef={svgIrrAccRef}
                        xLabelCount={10}
                      />
                    </div>

                    <div
                      className="xl:col-span-6 border rounded-[20px] p-4"
                      style={{ borderColor: T.border, background: T.cardSoft2 }}
                    >
                      <MiniChart
                        title="Performance ratio versus meta"
                        subtitle="PR real comparado com a meta"
                        data={seriesPR}
                        xKey="periodo"
                        series={chartPR}
                        height={250}
                        yDomain={[0, 100]}
                        formatterLeft={(v) => `${brNum(v, 0)}%`}
                        svgRef={svgPrRef}
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
                        subtitle="Barras empilhadas de geração e perdas com linhas de referência"
                        data={seriesEnergy}
                        xKey="periodo"
                        series={chartEnergySeries}
                        height={390}
                        formatterLeft={(v) => brNum(v, 2)}
                        svgRef={svgEnergyRef}
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
                          title="Irradiação"
                          subtitle="Real versus meta"
                          data={seriesIrr}
                          xKey="periodo"
                          series={chartIrr1}
                          height={320}
                          formatterLeft={(v) => brNum(v, 2)}
                          svgRef={svgIrrRef}
                          xLabelCount={8}
                        />
                      </div>

                      <div
                        className="border rounded-[20px] p-4"
                        style={{ borderColor: T.border, background: T.cardSoft2 }}
                      >
                        <MiniChart
                          title="Irradiação acumulada"
                          subtitle="Curva acumulada"
                          data={seriesIrr}
                          xKey="periodo"
                          series={chartIrr2}
                          height={320}
                          formatterLeft={(v) => brNum(v, 2)}
                          svgRef={svgIrrAccRef}
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
                          title="PR"
                          subtitle="Performance ratio versus meta"
                          data={seriesPR}
                          xKey="periodo"
                          series={chartPR}
                          height={300}
                          yDomain={[0, 100]}
                          formatterLeft={(v) => `${brNum(v, 0)}%`}
                          svgRef={svgPrRef}
                          xLabelCount={8}
                        />
                      </div>

                      <div
                        className="border rounded-[20px] p-4"
                        style={{ borderColor: T.border, background: T.cardSoft2 }}
                      >
                        <MiniChart
                          title="Disponibilidade"
                          subtitle="Disponibilidade operacional versus meta"
                          data={seriesAvail}
                          xKey="periodo"
                          series={chartAvail}
                          height={300}
                          yDomain={[0, 100]}
                          formatterLeft={(v) => `${brNum(v, 0)}%`}
                          svgRef={svgAvailRef}
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
                  title="Tabela analítica"
                  hint="Comparativos detalhados por período para conferência e exportação"
                  right={
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative w-full sm:w-[320px]">
                        <input
                          className={cx(UI.input, "pl-10")}
                          style={{ borderColor: T.border }}
                          placeholder="Buscar período…"
                          value={tableQuery}
                          onChange={(e) => setTableQuery(e.target.value)}
                        />
                        <Search
                          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                          style={{ color: T.text3 }}
                        />
                      </div>

                      <Btn
                        tone="secondary"
                        onClick={exportExcel}
                        loading={xlsxLoading}
                        disabled={!data?.ok || !tableRows.length}
                        title="Exportar tabela para Excel"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Excel
                      </Btn>
                    </div>
                  }
                />

                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Pill>{filteredTableRows.length} linhas</Pill>
                    <Pill>{groupLabel(resolvedGroup)}</Pill>
                    <Pill>Energia em {energyUnit}</Pill>
                  </div>

                  <GerencialTable rows={filteredTableRows} energyUnit={energyUnit} />
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
