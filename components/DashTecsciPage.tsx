"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Eraser,
  FileDown,
  FileSpreadsheet,
  FileImage,
  Zap,
  Gauge,
  Activity,
  ChevronDown,
} from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) =>
  p.filter(Boolean).join(" ");

/* =========================================================
   TOKENS
========================================================= */
const T = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  cardSoft: "#FBFCFD",
  border: "rgba(17, 24, 39, 0.12)",
  borderStrong: "rgba(17, 24, 39, 0.18)",
  text: "#0B1220",
  text2: "rgba(11, 18, 32, 0.70)",
  text3: "rgba(11, 18, 32, 0.55)",
  mutedBg: "rgba(17, 24, 39, 0.035)",

  accent: "#115923",
  accent2: "#2E7B41",
  accentSoft: "rgba(17, 89, 35, 0.08)",
  accentRing: "rgba(17, 89, 35, 0.18)",

  okBg: "rgba(16, 185, 129, 0.10)",
  okBd: "rgba(16, 185, 129, 0.30)",
  okTx: "#065F46",

  warnBg: "rgba(245, 158, 11, 0.10)",
  warnBd: "rgba(245, 158, 11, 0.30)",
  warnTx: "#7C4A03",

  errBg: "rgba(239, 68, 68, 0.10)",
  errBd: "rgba(239, 68, 68, 0.30)",
  errTx: "#7F1D1D",

  grid: "rgba(17,24,39,0.08)",

  cGen: "#115923",
  cLoss: "#EF4444",
  cP90: "#F59E0B",
  cTec: "#64748B",
  cAya: "#111827",

  cPoa: "#F59E0B",
  cPoaMeta: "#EF4444",

  cPR: "#2563EB",
  cAvail: "#10B981",
  cTarget: "#EF4444",
} as const;

const UI = {
  page: "w-full min-w-0",
  container: "mx-auto w-full max-w-[1480px] px-4 sm:px-6 py-6",
  header:
    "border bg-white min-w-0 rounded-2xl shadow-[0_1px_2px_rgba(17,24,39,0.04)]",
  section:
    "border bg-white min-w-0 rounded-2xl shadow-[0_1px_2px_rgba(17,24,39,0.04)]",

  headerTitle: "text-base sm:text-lg font-semibold tracking-tight",
  sectionTitle: "text-sm font-semibold",
  sectionHint: "text-xs",
  label: "text-[11px] font-medium",

  input:
    "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2 min-w-0 rounded-xl",
  select:
    "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2 min-w-0 rounded-xl",

  cardTitle: "text-xs font-semibold",
  mono: "tabular-nums",
} as const;

/* =========================================================
   TYPES
========================================================= */
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
};
type ChartPoint = Record<string, any>;

type TableRow = {
  periodo: string;
  geracao: number | null;
  perdasAya: number | null;
  totalEmpilhado: number | null;
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

/* =========================================================
   HELPERS
========================================================= */
function useIsMobile(maxWidth = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth - 1}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    // @ts-ignore
    mq.addListener?.(onChange);

    return () => {
      mq.removeEventListener?.("change", onChange);
      // @ts-ignore
      mq.removeListener?.(onChange);
    };
  }, [maxWidth]);

  return isMobile;
}

function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
}

function brDate(iso?: string | null) {
  if (!iso) return "-";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(iso);
  return `${m[3]}/${m[2]}/${m[1]}`;
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

function clamp0(n: number) {
  return n < 0 ? 0 : n;
}

function kwhToUnit(kwh: number, unit: "kWh" | "MWh") {
  return unit === "MWh" ? kwh / 1000 : kwh;
}

function safeNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_");
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
  const w = width || vb?.width || el.clientWidth || 1200;
  const h = height || vb?.height || el.clientHeight || 400;
  const svg = svgToString(el, w, h);
  return svgStringToPngDataUrl(svg, w, h);
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ w: 900, h: 300 });

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({
        w: Math.max(360, Math.floor(r.width)),
        h: Math.max(220, Math.floor(r.height)),
      });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}

function niceTicks(min: number, max: number, count = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min)
    return [min, max];

  const span = max - min;
  const step0 = span / Math.max(1, count - 1);
  const pow = Math.pow(10, Math.floor(Math.log10(step0)));
  const err = step0 / pow;
  const step =
    err >= 7.5 ? 10 * pow : err >= 3.5 ? 5 * pow : err >= 1.5 ? 2 * pow : 1 * pow;

  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];

  for (let v = start; v <= end + 1e-9; v += step) ticks.push(v);
  return ticks;
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

/* =========================================================
   UI
========================================================= */
function Btn({
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
    "inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold border rounded-xl " +
    "whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition active:translate-y-[0.5px]";

  const style =
    tone === "primary"
      ? {
        background: T.accent,
        borderColor: "rgba(17, 89, 35, 0.45)",
        color: "#fff",
      }
      : tone === "danger"
        ? { background: T.errBg, borderColor: T.errBd, color: T.errTx }
        : { background: T.card, borderColor: T.border, color: T.text };

  return (
    <button
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
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent";
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center h-7 px-2.5 text-[11px] font-medium border rounded-xl",
        UI.mono
      )}
      style={{
        borderColor: T.border,
        background: tone === "accent" ? T.accentSoft : T.cardSoft,
        color: tone === "accent" ? T.accent : T.text2,
      }}
    >
      {children}
    </span>
  );
}

function MsgBox({
  m,
}: {
  m: { type: "ok" | "warn" | "err"; text: string } | null;
}) {
  if (!m) return null;

  const s =
    m.type === "ok"
      ? { background: T.okBg, borderColor: T.okBd, color: T.okTx }
      : m.type === "warn"
        ? { background: T.warnBg, borderColor: T.warnBd, color: T.warnTx }
        : { background: T.errBg, borderColor: T.errBd, color: T.errTx };

  return (
    <div className="text-sm px-3 py-2 border rounded-xl" style={s}>
      {m.text}
    </div>
  );
}

function SectionHeader({
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
      <div style={{ height: 1, background: T.border, opacity: 0.8 }} />
    </>
  );
}

function Segmented({
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
      className="inline-flex border rounded-xl overflow-hidden"
      style={{ borderColor: T.border }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="h-9 px-3 text-sm font-semibold"
            style={{
              background: active ? T.accentSoft : T.card,
              color: active ? T.accent : T.text2,
              borderRight:
                o.value === options[options.length - 1].value
                  ? "none"
                  : `1px solid ${T.border}`,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function StatusChip({ pct }: { pct: number | null }) {
  const tone = statusTone(pct);

  const style =
    tone === "good"
      ? { background: T.okBg, borderColor: T.okBd, color: T.okTx }
      : tone === "warn"
        ? { background: T.warnBg, borderColor: T.warnBd, color: T.warnTx }
        : tone === "bad"
          ? { background: T.errBg, borderColor: T.errBd, color: T.errTx }
          : { background: T.cardSoft, borderColor: T.border, color: T.text3 };

  return (
    <span
      className="inline-flex items-center justify-center h-7 px-2.5 text-[11px] font-semibold border rounded-xl tabular-nums"
      style={style}
    >
      {pct == null ? "—" : `${brNum(pct, 1)}%`}
    </span>
  );
}

function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cx("animate-pulse rounded-xl", className)}
      style={{ background: "rgba(17,24,39,0.06)", ...style }}
    />
  );
}

/* =========================================================
   STATION PICKER
========================================================= */
const RECENT_KEY = "aya_scada_recent_stations";

function StationPicker({
  stations,
  valueId,
  onChangeId,
  disabled,
}: {
  stations: Station[];
  valueId: number;
  onChangeId: (id: number) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const [recentIds, setRecentIds] = useState<number[]>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const selected = stations.find((s) => s.id === valueId) || null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const ids = raw ? (JSON.parse(raw) as number[]) : [];
      setRecentIds(ids);
    } catch {
      setRecentIds([]);
    }
  }, []);

  const recents = useMemo(() => {
    return recentIds.filter((id) => stations.some((s) => s.id === id)).slice(0, 6);
  }, [recentIds, stations]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();

    if (!needle && recents.length) {
      const recentStations = recents
        .map((id) => stations.find((s) => s.id === id))
        .filter(Boolean) as Station[];
      const rest = stations.filter((s) => !recents.includes(s.id));
      return [...recentStations, ...rest].slice(0, 100);
    }

    if (!needle) return stations.slice(0, 100);

    return stations
      .filter((s) => `${s.name} ${s.code}`.toLowerCase().includes(needle))
      .slice(0, 150);
  }, [stations, q, recents]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    setHi((h) => Math.min(h, Math.max(0, list.length - 1)));
  }, [open, list.length]);

  const commit = (id: number) => {
    onChangeId(id);
    setOpen(false);
    setQ("");

    try {
      const next = [id, ...recentIds.filter((x) => x !== id)].slice(0, 12);
      setRecentIds(next);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch { }
  };

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <label className={UI.label} style={{ color: T.text2 }}>
        Usina
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cx(UI.input, "flex items-center justify-between gap-2")}
        style={{ borderColor: T.border, textAlign: "left", opacity: disabled ? 0.6 : 1 }}
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: T.text }}>
            {selected ? selected.name : disabled ? "Carregando usinas…" : "Selecione uma usina"}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 shrink-0" style={{ color: T.text3 }} />
      </button>

      {open && !disabled && (
        <div
          className="absolute z-[300] mt-2 w-full border rounded-2xl shadow-lg overflow-hidden"
          style={{ borderColor: T.border, background: T.card }}
        >
          <div className="p-2 border-b" style={{ borderColor: "rgba(17,24,39,0.06)" }}>
            <div className="relative">
              <input
                className={cx(UI.input, "pr-9")}
                style={{ borderColor: T.border }}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setHi(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setOpen(false);
                    return;
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHi((h) => Math.min(h + 1, list.length - 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHi((h) => Math.max(h - 1, 0));
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const sel = list[hi];
                    if (sel) commit(sel.id);
                  }
                }}
                placeholder="Buscar por nome ou código…"
                autoFocus
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: T.text3 }}>
                <Search className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-auto">
            {list.length === 0 ? (
              <div className="px-3 py-3 text-sm" style={{ color: T.text2 }}>
                Nenhuma usina encontrada.
              </div>
            ) : (
              list.map((s, idx) => {
                const active = s.id === valueId;
                const highlight = idx === hi;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onMouseEnter={() => setHi(idx)}
                    onClick={() => commit(s.id)}
                    className="w-full px-3 py-2.5 text-left border-b last:border-b-0"
                    style={{
                      borderColor: "rgba(17,24,39,0.06)",
                      background: highlight
                        ? "rgba(17,89,35,0.08)"
                        : active
                          ? T.accentSoft
                          : "transparent",
                    }}
                  >
                    <div className="text-sm font-semibold" style={{ color: active ? T.accent : T.text }}>
                      {s.name}
                    </div>
                    <div className="text-[11px]" style={{ color: T.text3 }}>
                      {s.code}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MINI CHART
========================================================= */
function MiniChart({
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
  const M = { l: 56, r: 14, t: 14, b: 40 };
  const plotW = Math.max(10, W - M.l - M.r);
  const plotH = Math.max(10, H - M.t - M.b);

  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const visible = useMemo(() => series.filter((s) => !hidden[s.key]), [series, hidden]);
  const bars = visible.filter((s) => s.type === "bar");
  const lines = visible.filter((s) => s.type === "line");

  const dom = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    for (const p of data) {
      if (stackBars && bars.length) {
        const stackedTotal = bars.reduce((acc, s) => {
          const v = safeNum(p[s.key]);
          return acc + (v ?? 0);
        }, 0);

        min = Math.min(min, 0);
        max = Math.max(max, stackedTotal);

        for (const s of lines) {
          const v = safeNum(p[s.key]);
          if (v == null) continue;
          min = Math.min(min, v);
          max = Math.max(max, v);
        }
      } else {
        for (const s of visible) {
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

    return yDomain ? yDomain : ([Math.min(0, min), max * 1.06] as [number, number]);
  }, [data, visible, bars, lines, yDomain, stackBars]);

  const ticks = useMemo(() => niceTicks(dom[0], dom[1], 5), [dom]);
  const fmt = formatterLeft || ((v: number) => brNum(v, 0));

  const y = (v: number) => {
    const [mn, mx] = dom;
    const t = (v - mn) / (mx - mn);
    return M.t + plotH * (1 - t);
  };

  const xBand = plotW / n;

  const barCount = Math.max(1, bars.length);
  const barGap = Math.max(2, Math.min(10, xBand * 0.08));
  const groupMaxW = Math.min(xBand * 0.72, 56);
  const barW = Math.max(2, (groupMaxW - barGap * (barCount - 1)) / barCount);
  const groupW = barW * barCount + barGap * (barCount - 1);

  const xCenter = (i: number) => M.l + i * xBand + xBand / 2;
  const xGroupLeft = (i: number) => xCenter(i) - groupW / 2;

  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(
    null
  );

  const onMove = (e: React.MouseEvent) => {
    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (px < M.l || px > M.l + plotW || py < M.t || py > M.t + plotH) {
      setHover(null);
      return;
    }

    const i = Math.max(0, Math.min(data.length - 1, Math.floor((px - M.l) / xBand)));
    setHover({ i, x: px, y: py });
  };

  const hoverPoint = hover ? data[hover.i] : null;
  const hoverX = hover ? xCenter(hover.i) : null;

  const every = useMemo(() => {
    const maxLabelsByWidth = Math.max(2, Math.floor(plotW / 84));
    const target = Math.max(2, Math.min(xLabelCount, maxLabelsByWidth, data.length || 2));
    return Math.max(1, Math.ceil((data.length || 1) / target));
  }, [plotW, xLabelCount, data.length]);

  if (!data.length) {
    return (
      <div ref={ref} className="min-w-0">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className={UI.cardTitle} style={{ color: T.text }}>
              {title}
            </div>
            {subtitle ? (
              <div className="mt-1 text-[11px]" style={{ color: T.text3 }}>
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>

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
          <div className={UI.cardTitle} style={{ color: T.text }}>
            {title}
          </div>
          {subtitle ? (
            <div className="mt-1 text-[11px]" style={{ color: T.text3 }}>
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {series.map((s) => {
          const off = !!hidden[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setHidden((m) => ({ ...m, [s.key]: !m[s.key] }))}
              className="inline-flex items-center gap-2 h-7 px-2.5 text-[11px] font-medium border rounded-xl transition"
              style={{
                borderColor: off ? T.border : T.borderStrong,
                background: off ? T.card : T.cardSoft,
                color: off ? T.text3 : T.text2,
              }}
              title="Ocultar/mostrar série"
            >
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: s.color, opacity: off ? 0.35 : 1 }}
              />
              <span>{s.name}</span>
            </button>
          );
        })}
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
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          style={{ display: "block", width: "100%", height: `${H}px` }}
        >
          <rect x={0} y={0} width={W} height={H} fill={T.card} />

          {ticks.map((v, idx) => {
            const yy = y(v);
            return (
              <g key={`g-${idx}`}>
                <line x1={M.l} y1={yy} x2={M.l + plotW} y2={yy} stroke={T.grid} />
                <text x={M.l - 8} y={yy + 4} fontSize={10} textAnchor="end" fill={T.text3}>
                  {fmt(v)}
                </text>
              </g>
            );
          })}

          {data.map((p, i) => {
            if (i % every !== 0 && i !== data.length - 1) return null;
            const x = xCenter(i);

            return (
              <text
                key={`xl-${i}`}
                x={x}
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
                <g key={`b-${i}`}>
                  {bars.map((s, j) => {
                    const v = safeNum(p[s.key]);
                    if (v == null || v <= 0) return null;

                    const yTop = y(acc + v);
                    const yBottom = y(acc);
                    const h = Math.max(0, yBottom - yTop);
                    const isTopSegment = j === bars.length - 1;

                    const node = (
                      <rect
                        key={`${s.key}-${i}`}
                        x={x}
                        y={yTop}
                        width={barWidth}
                        height={h}
                        fill={s.color}
                        opacity={0.92}
                        rx={isTopSegment ? Math.min(4, barWidth / 2) : 0}
                        ry={isTopSegment ? Math.min(4, barWidth / 2) : 0}
                      />
                    );

                    acc += v;
                    return node;
                  })}
                </g>
              );
            }

            const left = xGroupLeft(i);

            return (
              <g key={`b-${i}`}>
                {bars.map((s, j) => {
                  const v = safeNum(p[s.key]);
                  if (v == null) return null;

                  const y0 = y(0);
                  const yv = y(v);
                  const h = Math.max(0, y0 - yv);
                  const x = left + j * (barW + barGap);

                  return (
                    <rect
                      key={`${s.key}-${i}`}
                      x={x}
                      y={yv}
                      width={barW}
                      height={h}
                      fill={s.color}
                      opacity={0.92}
                      rx={Math.min(4, barW / 2)}
                      ry={Math.min(4, barW / 2)}
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
                key={`l-${s.key}`}
                d={d || "M 0 0"}
                fill="none"
                stroke={s.color}
                strokeWidth={2.6}
                strokeDasharray={s.dashed ? "6 6" : undefined}
                opacity={0.95}
              />
            );
          })}

          {hover && hoverX != null ? (
            <line
              x1={hoverX}
              y1={M.t}
              x2={hoverX}
              y2={M.t + plotH}
              stroke="rgba(17,24,39,0.18)"
              strokeDasharray="4 4"
            />
          ) : null}

          {hoverPoint && hoverX != null ? (
            <foreignObject
              x={Math.min(W - 290, Math.max(8, hoverX + 12))}
              y={Math.max(8, M.t + 8)}
              width={280}
              height={230}
            >
              <div
                style={{
                  border: `1px solid ${T.border}`,
                  background: T.card,
                  borderRadius: 14,
                  padding: 10,
                  fontSize: 12,
                  boxShadow: "0 10px 22px rgba(17,24,39,0.12)",
                }}
              >
                <div style={{ fontWeight: 900, color: T.text, marginBottom: 6 }}>
                  {String(hoverPoint[xKey])}
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  {visible.map((s) => {
                    const v = safeNum(hoverPoint[s.key]);
                    return (
                      <div
                        key={`tt-${s.key}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            color: T.text2,
                          }}
                        >
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              background: s.color,
                              borderRadius: 3,
                            }}
                          />
                          <span style={{ fontWeight: 700 }}>{s.name}</span>
                        </div>
                        <div style={{ fontWeight: 900, color: T.text }}>
                          {v == null ? "—" : brNum(v, 2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </foreignObject>
          ) : null}
        </svg>
      </div>
    </div>
  );
}

/* =========================================================
   KPI CARD
========================================================= */
function CompareKpiCard({
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
  const good = pct != null ? pct >= 100 : null;
  const barColor = good == null ? T.borderStrong : good ? T.accent2 : T.errBd;

  return (
    <div
      className="border rounded-2xl p-4 min-w-0 h-full"
      style={{ borderColor: T.border, background: T.card }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 w-full">
          <div className={UI.label} style={{ color: T.text2 }}>
            {title}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-3">
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

          <div className="mt-3">
            <div
              className="flex items-center justify-between text-[11px]"
              style={{ color: T.text3 }}
            >
              <span>Δ</span>
              <span
                className={UI.mono}
                style={{ color: good == null ? T.text3 : good ? T.accent : T.errTx }}
              >
                {dlt == null ? "—" : fmt(dlt)}
              </span>
            </div>

            <div
              className="mt-1 border rounded-xl overflow-hidden"
              style={{ borderColor: T.border, background: T.mutedBg, height: 10 }}
            >
              <div
                style={{
                  width: `${pct == null ? 0 : Math.max(0, Math.min(100, pct))}%`,
                  height: "100%",
                  background: barColor,
                  opacity: 0.9,
                }}
              />
            </div>

            <div className="mt-1 text-[11px] flex justify-end" style={{ color: T.text3 }}>
              {pct == null ? "—" : `${brNum(pct, 1)}%`}
            </div>
          </div>
        </div>

        <div className="shrink-0" style={{ color: T.text3 }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TABLE
========================================================= */
function GerencialTable({
  rows,
  energyUnit,
}: {
  rows: TableRow[];
  energyUnit: "kWh" | "MWh";
}) {
  return (
    <div className="border rounded-2xl overflow-hidden" style={{ borderColor: T.border }}>
      <div className="overflow-auto max-h-[620px]">
        <table className="w-full min-w-[1480px] border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr>
              {[
                "Período",
                `Geração`,
                // `Perdas AYA`,
                // `Topo Pilha (${energyUnit})`,
                `P90 (${energyUnit})`,
                "Geração/P90",
                `Estimado Tecsci`,
                "Geração/Tecsci",
                `Estimado AYA`,
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
                  key={idx}
                  className="px-3 py-3 text-left text-[11px] font-semibold border-b whitespace-nowrap"
                  style={{
                    background: T.cardSoft,
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
                <td
                  colSpan={19}
                  className="px-4 py-10 text-center text-sm"
                  style={{ color: T.text3 }}
                >
                  Sem dados para exibir.
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
                  <tr
                    key={`${r.periodo}-${i}`}
                    className="hover:bg-[rgba(17,24,39,0.018)]"
                  >
                    <td
                      className="px-3 py-3 text-sm  border-b whitespace-nowrap"
                      style={{ borderColor: T.border, color: T.text }}
                    >
                      {r.periodo}
                    </td>

                    <td className="px-3 py-3 text-sm border-b tabular-nums whitespace-nowrap" style={{ borderColor: T.border, color: T.text }}>
                      {brNum(r.geracao, 2)}
                    </td>
                    <td className="px-3 py-3 text-sm border-b tabular-nums whitespace-nowrap" style={{ borderColor: T.border, color: T.errTx }}>
                      {brNum(r.perdasAya, 2)}
                    </td>
                    {/* <td className="px-3 py-3 text-sm border-b tabular-nums whitespace-nowrap font-semibold" style={{ borderColor: T.border, color: T.text }}>
                      {brNum(r.totalEmpilhado, 2)}
                    </td> */}
                    <td className="px-3 py-3 text-sm border-b tabular-nums whitespace-nowrap" style={{ borderColor: T.border, color: T.text }}>
                      {brNum(r.p90, 2)}
                    </td>
                    <td className="px-3 py-3 text-sm border-b whitespace-nowrap" style={{ borderColor: T.border }}>
                      <StatusChip pct={genP90} />
                    </td>

                    <td className="px-3 py-3 text-sm border-b tabular-nums whitespace-nowrap" style={{ borderColor: T.border, color: T.text }}>
                      {brNum(r.estimadoTec, 2)}
                    </td>
                    <td className="px-3 py-3 text-sm border-b whitespace-nowrap" style={{ borderColor: T.border }}>
                      <StatusChip pct={genTec} />
                    </td>

                    <td className="px-3 py-3 text-sm border-b tabular-nums whitespace-nowrap" style={{ borderColor: T.border, color: T.text }}>
                      {brNum(r.estimadoAya, 2)}
                    </td>
                    <td className="px-3 py-3 text-sm border-b whitespace-nowrap" style={{ borderColor: T.border }}>
                      <StatusChip pct={genAya} />
                    </td>

                    <td className="px-3 py-3 text-sm border-b tabular-nums whitespace-nowrap" style={{ borderColor: T.border, color: T.text }}>
                      {brNum(r.irradiacao, 2)}
                    </td>
                    <td className="px-3 py-3 text-sm border-b tabular-nums whitespace-nowrap" style={{ borderColor: T.border, color: T.text }}>
                      {brNum(r.irradiacaoMeta, 2)}
                    </td>
                    <td className="px-3 py-3 text-sm border-b whitespace-nowrap" style={{ borderColor: T.border }}>
                      <StatusChip pct={irr} />
                    </td>

                    <td className="px-3 py-3 text-sm border-b tabular-nums whitespace-nowrap" style={{ borderColor: T.border, color: T.text }}>
                      {brPct(r.pr, 1)}
                    </td>
                    <td className="px-3 py-3 text-sm border-b tabular-nums whitespace-nowrap" style={{ borderColor: T.border, color: T.text }}>
                      {brPct(r.prMeta, 1)}
                    </td>
                    <td className="px-3 py-3 text-sm border-b whitespace-nowrap" style={{ borderColor: T.border }}>
                      <StatusChip pct={pr} />
                    </td>

                    <td className="px-3 py-3 text-sm border-b tabular-nums whitespace-nowrap" style={{ borderColor: T.border, color: T.text }}>
                      {brPct(r.disponibilidade, 1)}
                    </td>
                    <td className="px-3 py-3 text-sm border-b tabular-nums whitespace-nowrap" style={{ borderColor: T.border, color: T.text }}>
                      {brPct(r.disponibilidadeMeta, 1)}
                    </td>
                    <td className="px-3 py-3 text-sm border-b whitespace-nowrap" style={{ borderColor: T.border }}>
                      <StatusChip pct={disp} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN
========================================================= */
export function TecsciPage() {
  const isMobile = useIsMobile(640);

  const [msg, setMsg] = useState<{ type: "ok" | "warn" | "err"; text: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [xlsxLoading, setXlsxLoading] = useState(false);
  const [pngLoading, setPngLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const [stations, setStations] = useState<Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);

  const [psId, setPsId] = useState<number>(1);
  const selectedStation = useMemo(
    () => stations.find((s) => s.id === psId) || null,
    [stations, psId]
  );

  const initialRange = useMemo(() => {
    const r = monthRangeISO(new Date());
    return { start: r.start, end: clampEndToToday(r.end) };
  }, []);

  const [periodPreset, setPeriodPreset] = useState<Preset>("thisMonth");
  const [start, setStart] = useState(initialRange.start);
  const [end, setEnd] = useState(initialRange.end);

  const [group, setGroup] = useState<"auto" | "day" | "month" | "year">("auto");
  const [energyUnit, setEnergyUnit] = useState<"kWh" | "MWh">("MWh");

  const [data, setData] = useState<PerfApiResp | null>(null);
  const [openCharts, setOpenCharts] = useState(true);

  const svgEnergyRef = useRef<SVGSVGElement | null>(null);
  const svgIrrRef = useRef<SVGSVGElement | null>(null);
  const svgIrrAccRef = useRef<SVGSVGElement | null>(null);
  const svgPrRef = useRef<SVGSVGElement | null>(null);
  const svgAvailRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/tecsci/stations", { cache: "no-store" });
        const j = await r.json();
        if (j?.ok) setStations(j.stations || []);
      } catch { }
      setStationsLoading(false);
    })();
  }, []);

  const applyPreset = useCallback((p: Preset) => {
    const now = new Date();
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
      return;
    }
  }, []);

  const load = useCallback(async () => {
    setMsg(null);

    const today = todayISO();
    const endClamped = end > today ? today : end;

    if (!psId || !Number.isFinite(psId)) {
      setMsg({ type: "err", text: "Selecione uma usina." });
      return;
    }

    if (!isIsoDate(start) || !isIsoDate(endClamped)) {
      setMsg({ type: "err", text: "Datas inválidas." });
      return;
    }

    if (start > endClamped) {
      setMsg({ type: "err", text: "Data inicial maior que a final." });
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);

    try {
      const url = `/api/tecsci/performance?ps_id=${psId}&start_date=${start}&end_date=${endClamped}&group=${group}`;
      const r = await fetch(url, { cache: "no-store", signal: ctrl.signal });
      const j: PerfApiResp = await r.json().catch(() => ({ ok: false } as any));

      if (!r.ok || !j?.ok) {
        setData(null);
        setMsg({ type: "err", text: j?.error || "Erro ao carregar performance." });
        return;
      }

      setData(j);
      setMsg({ type: "ok", text: "Atualizado ✅" });
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setData(null);
      setMsg({ type: "err", text: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  }, [psId, start, end, group]);

  useEffect(() => {
    const t = setTimeout(load, 450);
    return () => clearTimeout(t);
  }, [load]);

  const perf = data?.performance || null;

  const bucket = useMemo(() => {
    const s = data?.series;
    if (!s || !data?.group) return [];
    if (data.group === "day") return (s.daily || []).map((x) => ({ label: brDate(x.day), dto: x }));
    if (data.group === "month") return (s.monthly || []).map((x) => ({ label: x.month, dto: x }));
    if (data.group === "year") return (s.yearly || []).map((x) => ({ label: x.year, dto: x }));
    return [];
  }, [data]);

  const seriesEnergy = useMemo(() => {
    return bucket.map((b) => {
      const genKwh = safeNum(b.dto.generated_energy_kwh);
      const expTecKwh = safeNum(b.dto.expected_energy_kwh);

      // TROCAR AQUI se vier um campo real de P90 na API
      const p90Kwh = safeNum(b.dto.projected_energy_kwh);

      const poa = safeNum(b.dto.poa_irradiation_kwh);
      const projPr = safeNum(b.dto.projected_pr);
      const dcKw = safeNum(b.dto.dc_power_kw);

      const ayaKwh = estimatedAyaKwh(poa, projPr, dcKw);
      const lossAyaKwh = ayaKwh != null && genKwh != null ? clamp0(ayaKwh - genKwh) : null;

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

  const kpi = useMemo(() => {
    const genKwh = safeNum(perf?.generated_energy_kwh);
    const expKwh = safeNum(perf?.expected_energy_kwh);

    // TROCAR AQUI se vier um campo real de P90 na API
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
      psLabel: selectedStation ? `${selectedStation.name} (${selectedStation.code})` : "—",

      geracao: genKwh == null ? null : kwhToUnit(genKwh, energyUnit),
      p90: p90Kwh == null ? null : kwhToUnit(p90Kwh, energyUnit),
      expectedTec: expKwh == null ? null : kwhToUnit(expKwh, energyUnit),
      estimatedAya: estimatedAya == null ? null : kwhToUnit(estimatedAya, energyUnit),

      poa,
      poaMeta,
      pr,
      prMeta,
      avail,
      availMeta,
    };
  }, [perf, selectedStation, energyUnit]);

  const tableRows = useMemo<TableRow[]>(() => {
    return bucket.map((b) => {
      const genKwh = safeNum(b.dto.generated_energy_kwh);
      const expTecKwh = safeNum(b.dto.expected_energy_kwh);

      // TROCAR AQUI se vier um campo real de P90 na API
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
      const lossAyaKwh = ayaKwh != null && genKwh != null ? clamp0(ayaKwh - genKwh) : null;

      const geracao = genKwh == null ? null : kwhToUnit(genKwh, energyUnit);
      const perdasAya = lossAyaKwh == null ? null : kwhToUnit(lossAyaKwh, energyUnit);

      return {
        periodo: b.label,
        geracao,
        perdasAya,
        totalEmpilhado:
          geracao != null && perdasAya != null ? geracao + perdasAya : geracao,
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

  const chartEnergySeries: ChartSeries[] = useMemo(
    () => [
      { key: "geracao", name: `Geração (${energyUnit})`, type: "bar", color: T.cGen },
      { key: "perdasAya", name: `Perdas (${energyUnit})`, type: "bar", color: T.cLoss },
      { key: "p90", name: `P90 (${energyUnit})`, type: "line", color: T.cP90, dashed: true },
      { key: "estimadoAya", name: `Estimado AYA (${energyUnit})`, type: "line", color: T.cAya },
      { key: "estimadoTec", name: `Estimado TecSci (${energyUnit})`, type: "line", color: T.cTec, dashed: true },
    ],
    [energyUnit]
  );

  const chartIrr1: ChartSeries[] = useMemo(
    () => [
      { key: "poa", name: "Irradiação Real", type: "bar", color: T.cPoa },
      { key: "meta", name: "Irradiação Meta", type: "line", color: T.cPoaMeta, dashed: true },
    ],
    []
  );

  const chartIrr2: ChartSeries[] = useMemo(
    () => [
      { key: "accPoa", name: "Irradiação Acumulada", type: "line", color: T.cPoa },
      { key: "accMeta", name: "Irradiação Meta Acumulada", type: "line", color: T.cPoaMeta, dashed: true },
    ],
    []
  );

  const chartPR: ChartSeries[] = useMemo(
    () => [
      { key: "pr", name: "PR (%)", type: "bar", color: T.cPR },
      { key: "meta", name: "Meta PR", type: "line", color: T.cTarget, dashed: true },
    ],
    []
  );

  const chartAvail: ChartSeries[] = useMemo(
    () => [
      { key: "disponibilidade", name: "Disponibilidade (%)", type: "bar", color: T.cAvail },
      { key: "meta", name: "Meta", type: "line", color: T.cTarget, dashed: true },
    ],
    []
  );

  const exportRows = useMemo(() => {
    return tableRows.map((r) => ({
      periodo: r.periodo,
      geracao: r.geracao,
      perdas_aya: r.perdasAya,
      topo_pilha: r.totalEmpilhado,
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
      perc_disponibilidade_meta: pctVs(r.disponibilidade, r.disponibilidadeMeta),
    }));
  }, [tableRows]);

  const baseFileName = useMemo(() => {
    return sanitizeFileName(
      `Relatorio_${selectedStation?.name || "Usina"}_${start}_${end}`
    );
  }, [selectedStation, start, end]);

  const loadingInitial = loading && !data;
  const isReloading = loading && !!data;

  const captureVisibleCharts = useCallback(async () => {
    const charts = [
      { ref: svgEnergyRef, w: 1600, h: 680, title: "Energia" },
      { ref: svgIrrRef, w: 1400, h: 560, title: "Irradiação" },
      { ref: svgIrrAccRef, w: 1400, h: 560, title: "Irradiação Acumulada" },
      { ref: svgPrRef, w: 1400, h: 520, title: "PR" },
      { ref: svgAvailRef, w: 1400, h: 520, title: "Disponibilidade" },
    ] as const;

    const out: Array<{ title: string; dataUrl: string; w: number; h: number }> = [];

    for (const c of charts) {
      if (!c.ref.current) continue;
      const dataUrl = await svgElementToPng(c.ref.current, c.w, c.h);
      out.push({ title: c.title, dataUrl, w: c.w, h: c.h });
    }

    return out;
  }, []);

  const exportExcel = useCallback(async () => {
    if (!data?.ok) {
      setMsg({ type: "err", text: "Sem dados para exportar." });
      return;
    }

    setXlsxLoading(true);

    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      const resumoAOA: any[][] = [
        ["Relatório — TecSci Performance"],
        [],
        ["Usina", kpi.psLabel],
        ["Período", `${start} → ${end}`],
        ["Granularidade", data.group || group],
        ["Unidade de Energia", energyUnit],
        [],
        ["Comparativos", ""],
        ["Geração", kpi.geracao],
        ["P90", kpi.p90],
        ["Estimado TecSci", kpi.expectedTec],
        ["Estimado AYA", kpi.estimatedAya],
        ["Irradiação", kpi.poa],
        ["Meta Irradiação", kpi.poaMeta],
        ["PR (%)", kpi.pr],
        ["Meta PR (%)", kpi.prMeta],
        ["Disponibilidade (%)", kpi.avail],
        ["Meta Disponibilidade (%)", kpi.availMeta],
      ];

      const wsResumo = XLSX.utils.aoa_to_sheet(resumoAOA);
      wsResumo["!cols"] = [{ wch: 28 }, { wch: 28 }];
      XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

      const wsSerie = XLSX.utils.json_to_sheet(exportRows);
      wsSerie["!cols"] = [
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
        { wch: 16 },
        { wch: 18 },
        { wch: 12 },
        { wch: 14 },
        { wch: 16 },
        { wch: 10 },
        { wch: 12 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, wsSerie, "Tabela");

      XLSX.writeFile(wb, `${baseFileName}.xlsx`, { compression: true });
      setMsg({ type: "ok", text: "Excel gerado ✅" });
    } catch {
      setMsg({ type: "err", text: "Falha ao gerar Excel." });
    } finally {
      setXlsxLoading(false);
    }
  }, [data, kpi, start, end, group, energyUnit, exportRows, baseFileName]);

  const exportPng = useCallback(async () => {
    if (!data?.ok) {
      setMsg({ type: "err", text: "Sem dados para exportar." });
      return;
    }

    if (!openCharts) setOpenCharts(true);

    setPngLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 320));
      const images = await captureVisibleCharts();

      if (!images.length) {
        setMsg({ type: "err", text: "Gráficos não disponíveis para exportar PNG." });
        return;
      }

      const canvas = document.createElement("canvas");
      const width = 1600;
      const padding = 40;
      const headerH = 180;
      const gap = 28;

      const scaledHeights = images.map((img) =>
        Math.round((width - padding * 2) * (img.h / img.w))
      );

      const totalH =
        headerH +
        scaledHeights.reduce((acc, h) => acc + h, 0) +
        gap * (images.length - 1) +
        padding * 2;

      canvas.width = width;
      canvas.height = totalH;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas não suportado");

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = T.text;
      ctx.font = "700 34px Inter, Arial, sans-serif";
      ctx.fillText("Relatório — TecSci Performance", padding, 54);

      ctx.fillStyle = T.text2;
      ctx.font = "500 20px Inter, Arial, sans-serif";
      ctx.fillText(selectedStation?.name || "Usina", padding, 90);
      ctx.fillText(`Período: ${brDate(start)} → ${brDate(end)}`, padding, 118);
      ctx.fillText(`Granularidade: ${data.group || group}`, 980, 90);
      ctx.fillText(`Energia: ${energyUnit}`, 980, 118);

      let y = headerH;

      for (let i = 0; i < images.length; i++) {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Falha ao carregar imagem"));
          img.src = images[i].dataUrl;
        });

        const drawW = width - padding * 2;
        const drawH = scaledHeights[i];

        ctx.fillStyle = "#F7F9FB";
        ctx.fillRect(padding, y - 8, drawW, drawH + 16);

        ctx.fillStyle = T.text;
        ctx.font = "700 20px Inter, Arial, sans-serif";
        ctx.fillText(images[i].title, padding + 16, y + 24);

        ctx.drawImage(img, padding, y + 36, drawW, drawH - 36);
        y += drawH + gap;
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 1)
      );
      if (!blob) throw new Error("Falha ao gerar PNG");

      downloadBlob(`${baseFileName}.png`, blob);
      setMsg({ type: "ok", text: "PNG gerado ✅" });
    } catch {
      setMsg({ type: "err", text: "Falha ao gerar PNG." });
    } finally {
      setPngLoading(false);
    }
  }, [data, openCharts, captureVisibleCharts, baseFileName, selectedStation, start, end, group, energyUnit]);

  const exportPdf = useCallback(async () => {
    if (!data?.ok) {
      setMsg({ type: "err", text: "Sem dados para gerar PDF." });
      return;
    }

    if (!openCharts) setOpenCharts(true);
    setPdfLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 320));

      const energyEl = svgEnergyRef.current;
      const irrEl = svgIrrRef.current;
      const irrAccEl = svgIrrAccRef.current;
      const prEl = svgPrRef.current;
      const availEl = svgAvailRef.current;

      if (!energyEl || !irrEl || !irrAccEl || !prEl || !availEl) {
        setMsg({
          type: "err",
          text: "Gráficos não disponíveis. Mostre os gráficos e tente novamente.",
        });
        return;
      }

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 36;
      const chartW = pageW - margin * 2;

      const title = "Relatório — TecSci Performance";
      const infoText = `${kpi.psLabel} • Período: ${brDate(start)} → ${brDate(end)} • Granularidade: ${data.group || group}`;

      const drawHeader = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(11, 18, 32);
        doc.text(title, margin, margin + 10);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        const lines = doc.splitTextToSize(infoText, pageW - margin * 2);
        doc.text(lines, margin, margin + 28);

        const lineY = margin + 40 + (Array.isArray(lines) ? (lines.length - 1) * 10 : 0);
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, lineY, pageW - margin, lineY);

        return lineY;
      };

      const drawComparePdfCard = (
        x: number,
        y: number,
        w: number,
        h: number,
        titleTxt: string,
        aLabel: string,
        aValue: string,
        bLabel: string,
        bValue: string,
        pct: number | null,
        delta: string
      ) => {
        doc.setFillColor(251, 252, 253);
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(x, y, w, h, 12, 12, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(11, 18, 32);
        doc.text(titleTxt, x + 12, y + 18);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(aLabel, x + 12, y + 36);
        doc.text(bLabel, x + w / 2, y + 36);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(11, 18, 32);
        doc.text(aValue, x + 12, y + 56);
        doc.text(bValue, x + w / 2, y + 56);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Δ ${delta}`, x + 12, y + 76);

        doc.setDrawColor(229, 231, 235);
        doc.setFillColor(240, 242, 245);
        doc.roundedRect(x + 12, y + 86, w - 24, 8, 4, 4, "FD");

        const widthPct = pct == null ? 0 : Math.max(0, Math.min(100, pct));
        if (widthPct > 0) {
          if (widthPct >= 100) doc.setFillColor(46, 123, 65);
          else if (widthPct >= 95) doc.setFillColor(245, 158, 11);
          else doc.setFillColor(239, 68, 68);

          doc.roundedRect(x + 12, y + 86, ((w - 24) * widthPct) / 100, 8, 4, 4, "F");
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(pct == null ? "—" : `${brNum(pct, 1)}%`, x + w - 34, y + 104);
      };

      const drawMiniTable = (startY: number) => {
        const headerY = startY;
        const rowH = 18;

        const cols = [
          { label: "Período", x: margin, w: 70, align: "left" as const },
          { label: "Geração", x: margin + 75, w: 66, align: "right" as const },
          { label: "P90", x: margin + 147, w: 66, align: "right" as const },
          { label: "%", x: margin + 219, w: 42, align: "right" as const },
          { label: "TecSci", x: margin + 267, w: 72, align: "right" as const },
          { label: "%", x: margin + 345, w: 42, align: "right" as const },
          { label: "AYA", x: margin + 393, w: 72, align: "right" as const },
          { label: "%", x: margin + 471, w: 42, align: "right" as const },
        ];

        doc.setFillColor(247, 249, 251);
        doc.setDrawColor(229, 231, 235);
        doc.rect(margin, headerY, pageW - margin * 2, rowH, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);

        cols.forEach((c) => {
          doc.text(
            c.label,
            c.align === "left" ? c.x + 4 : c.x + c.w - 4,
            headerY + 12,
            { align: c.align === "left" ? "left" : "right" }
          );
        });

        const maxRows = Math.min(16, tableRows.length);
        let y = headerY + rowH;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(11, 18, 32);

        for (let i = 0; i < maxRows; i++) {
          const r = tableRows[i];
          const genP90 = pctVs(r.geracao, r.p90);
          const genTec = pctVs(r.geracao, r.estimadoTec);
          const genAya = pctVs(r.geracao, r.estimadoAya);

          if (y + rowH > pageH - 40) break;

          if (i % 2 === 0) {
            doc.setFillColor(252, 253, 254);
            doc.rect(margin, y, pageW - margin * 2, rowH, "F");
          }

          const vals = [
            r.periodo,
            brNum(r.geracao, 2),
            brNum(r.p90, 2),
            genP90 == null ? "—" : `${brNum(genP90, 1)}%`,
            brNum(r.estimadoTec, 2),
            genTec == null ? "—" : `${brNum(genTec, 1)}%`,
            brNum(r.estimadoAya, 2),
            genAya == null ? "—" : `${brNum(genAya, 1)}%`,
          ];

          vals.forEach((v, idx) => {
            const c = cols[idx];
            doc.text(
              v,
              c.align === "left" ? c.x + 4 : c.x + c.w - 4,
              y + 12,
              { align: c.align === "left" ? "left" : "right" }
            );
          });

          doc.setDrawColor(235, 237, 240);
          doc.line(margin, y + rowH, pageW - margin, y + rowH);
          y += rowH;
        }

        if (tableRows.length > 16) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(
            `Tabela resumida: exibindo 16 de ${tableRows.length} linhas. O arquivo Excel contém a tabela completa.`,
            margin,
            y + 14
          );
        }
      };

      const lineY = drawHeader();

      let y = lineY + 22;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(11, 18, 32);
      doc.text("Resumo comparativo", margin, y);
      y += 14;

      const cardGap = 14;
      const cardW = (pageW - margin * 2 - cardGap) / 2;
      const cardH = 112;

      const compareData = [
        {
          title: `Geração x P90 (${energyUnit})`,
          aLabel: "Geração",
          aValue: kpi.geracao,
          bLabel: "P90",
          bValue: kpi.p90,
          fmt: (n: number) => brNum(n, 2),
        },
        {
          title: `Geração x Estimado TecSci (${energyUnit})`,
          aLabel: "Geração",
          aValue: kpi.geracao,
          bLabel: "Estimado TecSci",
          bValue: kpi.expectedTec,
          fmt: (n: number) => brNum(n, 2),
        },
        {
          title: `Geração x Estimado AYA (${energyUnit})`,
          aLabel: "Geração",
          aValue: kpi.geracao,
          bLabel: "Estimado AYA",
          bValue: kpi.estimatedAya,
          fmt: (n: number) => brNum(n, 2),
        },
        {
          title: "Irradiação x Meta",
          aLabel: "Irradiação",
          aValue: kpi.poa,
          bLabel: "Meta",
          bValue: kpi.poaMeta,
          fmt: (n: number) => brNum(n, 2),
        },
        {
          title: "PR x Meta PR",
          aLabel: "PR",
          aValue: kpi.pr,
          bLabel: "Meta PR",
          bValue: kpi.prMeta,
          fmt: (n: number) => brPct(n, 1),
        },
        {
          title: "Disponibilidade x Meta",
          aLabel: "Disp.",
          aValue: kpi.avail,
          bLabel: "Meta",
          bValue: kpi.availMeta,
          fmt: (n: number) => brPct(n, 1),
        },
      ];

      compareData.forEach((c, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = margin + col * (cardW + cardGap);
        const yy = y + row * (cardH + 12);

        const pct = pctVs(c.aValue, c.bValue);
        const delta =
          c.aValue != null && c.bValue != null ? c.fmt(c.aValue - c.bValue) : "—";

        drawComparePdfCard(
          x,
          yy,
          cardW,
          cardH,
          c.title,
          c.aLabel,
          c.aValue == null ? "—" : c.fmt(c.aValue),
          c.bLabel,
          c.bValue == null ? "—" : c.fmt(c.bValue),
          pct,
          delta
        );
      });

      doc.addPage();
      const line2 = drawHeader();
      y = line2 + 22;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(11, 18, 32);
      doc.text("Tabela resumida", margin, y);
      y += 14;
      drawMiniTable(y);

      doc.addPage();
      drawHeader();
      y = 92;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(11, 18, 32);
      doc.text("Energia", margin, y);

      {
        const png = await svgElementToPng(energyEl, 1600, 680);
        const imgH = (chartW * 680) / 1600;
        doc.addImage(png, "PNG", margin, y + 10, chartW, imgH);
      }

      doc.addPage();
      drawHeader();
      y = 92;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(11, 18, 32);
      doc.text("Irradiação", margin, y);

      {
        const png = await svgElementToPng(irrEl, 1400, 560);
        const imgH = (chartW * 560) / 1400;
        doc.addImage(png, "PNG", margin, y + 10, chartW, imgH);
        y += imgH + 34;
      }

      doc.text("Irradiação acumulada", margin, y);

      {
        const png = await svgElementToPng(irrAccEl, 1400, 560);
        const imgH = (chartW * 560) / 1400;
        doc.addImage(png, "PNG", margin, y + 10, chartW, imgH);
      }

      doc.addPage();
      drawHeader();
      y = 92;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(11, 18, 32);
      doc.text("PR", margin, y);

      {
        const png = await svgElementToPng(prEl, 1400, 520);
        const imgH = (chartW * 520) / 1400;
        doc.addImage(png, "PNG", margin, y + 10, chartW, imgH);
        y += imgH + 34;
      }

      doc.text("Disponibilidade", margin, y);

      {
        const png = await svgElementToPng(availEl, 1400, 520);
        const imgH = (chartW * 520) / 1400;
        doc.addImage(png, "PNG", margin, y + 10, chartW, imgH);
      }

      doc.save(`${baseFileName}.pdf`);
      setMsg({ type: "ok", text: "PDF gerado ✅" });
    } catch {
      setMsg({ type: "err", text: "Falha ao gerar PDF." });
    } finally {
      setPdfLoading(false);
    }
  }, [data, openCharts, kpi, start, end, group, energyUnit, baseFileName, tableRows]);

  const FiltersBody = (
    <div className="p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-20 gap-3 items-end">
        <div className="xl:col-span-5 min-w-0">
          <StationPicker
            stations={stations}
            valueId={psId}
            onChangeId={setPsId}
            disabled={stationsLoading}
          />
        </div>

        <div className="xl:col-span-4">
          <label className={UI.label} style={{ color: T.text2 }}>
            Período
          </label>
          <select
            className={UI.select}
            style={{ borderColor: T.border }}
            value={periodPreset}
            onChange={(e) => {
              const v = e.target.value as Preset;
              setPeriodPreset(v);
              applyPreset(v);
            }}
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

        <div className="xl:col-span-3">
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

        <div className="xl:col-span-3">
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

        

        <div className="xl:col-span-2">
          <label className={UI.label} style={{ color: T.text2 }}>
            Unidade de Energia
          </label>
          <div className="mt-1">
            <Segmented
              value={energyUnit}
              onChange={(v) => setEnergyUnit(v as any)}
              options={[
                { value: "MWh", label: "MWh" },
                { value: "kWh", label: "kWh" },
              ]}
            />
          </div>
        </div>
        <div className="xl:col-span-3">
          <label className={UI.label} style={{ color: T.text2 }}>
            Granularidade
          </label>
          <div className="mt-1">
            <Segmented
              value={group}
              onChange={(v) => setGroup(v as any)}
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
  );

  const KpisBody = (
    <div className="p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-3 items-stretch">
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
            icon={<Activity className="w-4 h-4" />}
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
            icon={<Activity className="w-4 h-4" />}
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
            icon={<Activity className="w-4 h-4" />}
          />
        </div>
      </div>
    </div>
  );

  const TableBody = (
    <div className="p-5">
      <GerencialTable rows={tableRows} energyUnit={energyUnit} />
    </div>
  );

  const ChartsBody = (
    <div className="p-5 grid gap-4">
      <div
        className="border rounded-2xl p-4"
        style={{ borderColor: T.border, background: T.cardSoft }}
      >
        <MiniChart
          title="Performance energética"
          // subtitle="Barras empilhadas: Geração + Perdas • Linhas: Estimado TecSci, Estimado AYA e P90"
          data={seriesEnergy}
          xKey="periodo"
          series={chartEnergySeries}
          height={380}
          formatterLeft={(v) => brNum(v, 2)}
          svgRef={svgEnergyRef}
          xLabelCount={10}
          stackBars
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div
          className="border rounded-2xl p-4"
          style={{ borderColor: T.border, background: T.cardSoft }}
        >
          <MiniChart
            title="Irradiação"
            // subtitle="Irradiação x Meta"
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
          className="border rounded-2xl p-4"
          style={{ borderColor: T.border, background: T.cardSoft }}
        >
          <MiniChart
            title="Irradiação acumulada"
            // subtitle="Acumulado de irradiação x acumulado da meta"
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
          className="border rounded-2xl p-4"
          style={{ borderColor: T.border, background: T.cardSoft }}
        >
          <MiniChart
            title="PR"
            // subtitle="PR x Meta PR"
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
          className="border rounded-2xl p-4"
          style={{ borderColor: T.border, background: T.cardSoft }}
        >
          <MiniChart
            title="Disponibilidade"
            // subtitle="Disponibilidade x Meta"
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
    </div>
  );

  const InitialLoadingBody = (
    <div className="grid gap-4">
      <div className={UI.section} style={{ borderColor: T.border, background: T.card }}>
        <SectionHeader title="Filtros" hint="Carregando interface…" />
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3">
          <Skeleton className="xl:col-span-4 h-10" />
          <Skeleton className="xl:col-span-2 h-10" />
          <Skeleton className="xl:col-span-2 h-10" />
          <Skeleton className="xl:col-span-2 h-10" />
          <Skeleton className="xl:col-span-6 h-10" />
          <Skeleton className="xl:col-span-6 h-10" />
        </div>
      </div>

      <div className={UI.section} style={{ borderColor: T.border, background: T.card }}>
        <SectionHeader title="KPIs" hint="Carregando indicadores…" />
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="xl:col-span-4 h-40" />
          ))}
        </div>
      </div>

      <div className={UI.section} style={{ borderColor: T.border, background: T.card }}>
        <SectionHeader title="Tabela" hint="Carregando dados…" />
        <div className="p-5">
          <Skeleton className="h-[380px] w-full" />
        </div>
      </div>
    </div>
  );

  return (
    <section className={UI.page} style={{ background: T.bg, color: T.text }}>
      <div className={UI.container}>
        <div
          className={cx(UI.header, "p-4 sm:p-5")}
          style={{ borderColor: T.border, background: T.card }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className={UI.headerTitle} style={{ color: T.text }}>
                Painel de Performance 
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill tone="accent">
                  {selectedStation
                    ? selectedStation.name
                    : stationsLoading
                      ? "Carregando usinas…"
                      : "Selecione a usina"}
                </Pill>
                <Pill>
                  Período: {start && end ? `${brDate(start)} - ${brDate(end)}` : "—"}
                </Pill>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Btn tone="secondary" onClick={load} loading={loading} title="Recarregar">
                <RefreshCw className="w-4 h-4" />
              </Btn>

              <Btn tone="secondary" onClick={exportPng} loading={pngLoading} title="Gerar PNG">
                <FileImage className="w-4 h-4" />
                PNG
              </Btn>

              <Btn tone="secondary" onClick={exportPdf} loading={pdfLoading} title="Gerar PDF">
                <FileDown className="w-4 h-4" />
                PDF
              </Btn>

              <Btn tone="secondary" onClick={exportExcel} loading={xlsxLoading} title="Gerar Excel">
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Btn>

              <Btn
                tone="secondary"
                onClick={() => setOpenCharts((p) => !p)}
                title="Mostrar/ocultar gráficos"
              >
                {openCharts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Btn>
            </div>
          </div>

          <div className="mt-3">
            <MsgBox m={msg} />
          </div>
        </div>

        {loadingInitial ? (
          <div className="mt-4">{InitialLoadingBody}</div>
        ) : (
          <div className="relative mt-4">
            <div
              style={{
                filter: isReloading ? "blur(2px)" : "none",
                opacity: isReloading ? 0.72 : 1,
                pointerEvents: isReloading ? "none" : "auto",
                transition: "all 180ms ease",
              }}
            >
              <div
                className={UI.section}
                style={{ borderColor: T.border, background: T.card }}
              >
                <SectionHeader
                  title="Filtros"
                  hint="Seleção de usina, período, granularidade e unidade de energia"
                  right={
                    <Btn
                      tone="secondary"
                      onClick={() => {
                        setMsg(null);
                        setPeriodPreset("thisMonth");
                        applyPreset("thisMonth");
                      }}
                      className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                      title="Limpar"
                    >
                      <Eraser className="w-4 h-4" />
                    </Btn>
                  }
                />
                {FiltersBody}
              </div>

              <div
                className={cx(UI.section, "mt-4")}
                style={{ borderColor: T.border, background: T.card }}
              >
                <SectionHeader
                  title="KPIs"
                  hint="Comparativos consolidados do período"
                />
                {KpisBody}
              </div>
              {openCharts ? (
                <div
                  className={cx(UI.section, "mt-4")}
                  style={{ borderColor: T.border, background: T.card }}
                >
                  <SectionHeader
                    title="Gráficos"
                    hint="Energia, irradiância, PR e disponibilidade"
                    // right={
                    //   <div className="flex items-center gap-2">
                    //     <Pill>pontos: {bucket.length}</Pill>
                    //     <Pill>{data?.group || group}</Pill>
                    //   </div>
                    // }
                  />
                  {ChartsBody}
                </div>
              ) : null}
              <div
                className={cx(UI.section, "mt-4")}
                style={{ borderColor: T.border, background: T.card }}
              >
                <SectionHeader
                  title="Tabela"
                  hint="Comparativos detalhados por período"
                // right={
                //   <div className="flex items-center gap-2">
                //     <Pill>{tableRows.length} linhas</Pill>
                //     <Pill>{data?.group || group}</Pill>
                //   </div>
                // }
                />
                {TableBody}
              </div>


            </div>

            {isReloading ? (
              <div
                className="absolute inset-0 z-20 flex items-start justify-center"
                style={{
                  background: "rgba(244,246,248,0.18)",
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
      `}</style>
    </section>
  );
}