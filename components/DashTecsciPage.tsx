// app/tecsci/page.tsx  (ou onde estiver sua page)
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Search,
  RefreshCw,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Eraser,
  FileDown,
  LayoutGrid,
  Table as TableIcon,
  Zap,
  Gauge,
  Activity,
  Sun,
  ChevronDown,
} from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

/* =========================================================
   TOKENS (SCADA clean, cinza claro)
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

  // Energia
  cGen: "#115923",
  cLoss: "#EF4444",
  cP90: "#F59E0B", // P90 line
  cTec: "#64748B", // expected TecSci line
  cAya: "#111827", // AYA line

  // Irrad
  cPoa: "#F59E0B",
  cPoaMeta: "#EF4444",

  // %
  cPR: "#2563EB",
  cAvail: "#10B981",
  cTarget: "#EF4444",
} as const;

const UI = {
  page: "w-full min-w-0",
  container: "mx-auto w-full max-w-[1480px] px-4 sm:px-6 py-6",
  header: "border bg-white min-w-0",
  section: "border bg-white min-w-0",

  headerTitle: "text-base sm:text-lg font-semibold tracking-tight",
  sectionTitle: "text-sm font-semibold",
  sectionHint: "text-xs",
  label: "text-[11px] font-medium",

  input: "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2 min-w-0 rounded-md",
  select: "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2 min-w-0 rounded-md",

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
  projected_energy_kwh?: number | null; // P90

  capacity_factor_percentage?: number | null;
  poa_irradiation_kwh?: number | null;
  projected_irradiation_kwh?: number | null;

  pr_percentage?: number | null;
  ac_power_kw?: number | null;
  dc_power_kw?: number | null;

  projected_pr?: number | null;
  specific_yield_kwh?: number | null;
  reference_yield_kwh?: number | null;
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

type Preset = "thisMonth" | "lastMonth" | "last7" | "last30" | "thisYear" | "lastYear" | "custom";

/* =========================================================
   HELPERS
========================================================= */
function useIsMobile(maxWidth = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth - 1}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
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
  return Number(n).toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function brInt(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString("pt-BR");
}
function toISO(d: Date) {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
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

/* =========================================================
   ESTIMADO AYA
   Estimado AYA (kWh) = poa_irradiation_kwh × projected_pr × dc_power_kw
   projected_pr pode vir em % (82) ou fração (0.82)
========================================================= */
function prToFrac(projectedPr: number | null) {
  const pr = safeNum(projectedPr);
  if (pr == null) return null;
  return pr > 1.5 ? pr / 100 : pr;
}
function estimatedAyaKwh(poaKwhm2: number | null, projectedPr: number | null, dcPowerKw: number | null) {
  const poa = safeNum(poaKwhm2);
  const pr = prToFrac(projectedPr);
  const pdc = safeNum(dcPowerKw);
  if (poa == null || pr == null || pdc == null) return null;
  return poa * pr * pdc;
}

/* =========================================================
   EXPORT CSV (analista)
========================================================= */
function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Array<Record<string, unknown>>) {
  const colsSet = new Set<string>();

  for (const r of rows) {
    for (const k of Object.keys(r)) colsSet.add(k);
  }

  const cols = Array.from(colsSet);

  const esc = (v: unknown) => {
    const s = String(v ?? "");
    if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const head = cols.map(esc).join(";");
  const body = rows.map((r) => cols.map((c) => esc((r as any)[c])).join(";")).join("\n");
  return head + "\n" + body;
}

/* =========================================================
   UI primitives
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
    "inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold border rounded-md " +
    "whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition active:translate-y-[0.5px]";

  const style =
    tone === "primary"
      ? { background: T.accent, borderColor: "rgba(17, 89, 35, 0.45)", color: "#fff" }
      : tone === "danger"
      ? { background: T.errBg, borderColor: T.errBd, color: T.errTx }
      : { background: T.card, borderColor: T.border, color: T.text };

  return (
    <button className={cx(base, className)} disabled={disabled || loading} style={style} {...props}>
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

function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" }) {
  return (
    <span
      className={cx("inline-flex items-center h-7 px-2.5 text-[11px] font-medium border rounded-md", UI.mono)}
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

function MsgBox({ m }: { m: { type: "ok" | "warn" | "err"; text: string } | null }) {
  if (!m) return null;
  const s =
    m.type === "ok"
      ? { background: T.okBg, borderColor: T.okBd, color: T.okTx }
      : m.type === "warn"
      ? { background: T.warnBg, borderColor: T.warnBd, color: T.warnTx }
      : { background: T.errBg, borderColor: T.errBd, color: T.errTx };
  return (
    <div className="text-sm px-3 py-2 border rounded-md" style={s}>
      {m.text}
    </div>
  );
}

function SectionHeader({
  title,
  hint,
  right,
  divider = true,
}: {
  title: ReactNode;
  hint?: ReactNode;
  right?: ReactNode;
  divider?: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3 flex-wrap px-4 py-3">
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
      {divider && <div style={{ height: 1, background: T.border, opacity: 0.8 }} />}
    </>
  );
}

function FullscreenToggle({ active, compact, onToggle }: { active: boolean; compact?: boolean; onToggle: () => void }) {
  return (
    <Btn
      tone="secondary"
      onClick={onToggle}
      className={cx(compact ? "h-9 px-3 text-xs" : "")}
      title={active ? "Sair" : "Tela cheia"}
    >
      {active ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
    </Btn>
  );
}

function FullscreenShell({
  title,
  hint,
  count,
  filtersOpen,
  onToggleFilters,
  onClose,
  actions,
  filters,
  children,
}: {
  title: string;
  hint?: ReactNode;
  count?: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  onClose: () => void;
  actions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col" style={{ background: T.bg, color: T.text }}>
      <div
        className="shrink-0 px-4 sm:px-6 py-3 border-b flex items-start sm:items-center justify-between gap-3 flex-wrap"
        style={{ borderColor: T.border, background: T.card }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-sm sm:text-base font-extrabold truncate">{title}</div>
            {typeof count === "number" ? <Pill tone="accent">{count} itens</Pill> : null}
          </div>
          {hint ? (
            <div className="mt-1 text-xs" style={{ color: T.text3 }}>
              {hint}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Btn
            tone="secondary"
            onClick={onToggleFilters}
            className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
            title={filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">{filtersOpen ? "Ocultar" : "Filtros"}</span>
          </Btn>

          {actions}

          <Btn tone="secondary" onClick={onClose} className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm" title="Sair">
            <Minimize2 className="w-4 h-4" />
          </Btn>
        </div>
      </div>

      {filtersOpen ? (
        <div className="shrink-0 border-b" style={{ borderColor: T.border, background: T.card }}>
          {filters}
        </div>
      ) : null}
      <div className="flex-1 min-h-0 overflow-auto px-4 sm:px-6 py-4">{children}</div>
    </div>
  );
}

/* =========================================================
   StationPicker FAST (sem ID na UI)
   - busca + teclado (↑ ↓ Enter Esc)
   - recentes (localStorage)
========================================================= */
const RECENT_KEY = "aya_scada_recent_stations";

function StationPicker({
  stations,
  valueId,
  onChangeId,
}: {
  stations: Station[];
  valueId: number;
  onChangeId: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const selected = stations.find((s) => s.id === valueId) || null;

  const recents = useMemo(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const ids = raw ? (JSON.parse(raw) as number[]) : [];
      return ids.filter((id) => stations.some((s) => s.id === id)).slice(0, 6);
    } catch {
      return [];
    }
  }, [stations]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let base = stations;

    // recents first when empty query
    if (!needle && recents.length) {
      const recentStations = recents.map((id) => stations.find((s) => s.id === id)!).filter(Boolean);
      const rest = stations.filter((s) => !recents.includes(s.id));
      base = [...recentStations, ...rest];
    }

    if (!needle) return base.slice(0, 60);
    return stations.filter((s) => `${s.name} ${s.code}`.toLowerCase().includes(needle)).slice(0, 60);
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
      const raw = localStorage.getItem(RECENT_KEY);
      const arr = raw ? (JSON.parse(raw) as number[]) : [];
      const next = [id, ...arr.filter((x) => x !== id)].slice(0, 12);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <label className={UI.label} style={{ color: T.text2 }}>
        Usina
      </label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(UI.input, "flex items-center justify-between gap-2")}
        style={{ borderColor: T.border, textAlign: "left" }}
        title="Selecionar usina"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: T.text }}>
            {selected ? selected.name : "Selecione uma usina"}
          </div>
          <div className="text-[11px] truncate" style={{ color: T.text3 }}>
            {selected ? selected.code : "—"}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 shrink-0" style={{ color: T.text3 }} />
      </button>

      {open && (
        <div
          className="absolute z-[300] mt-2 w-full border rounded-lg shadow-sm overflow-hidden"
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
                placeholder="Digite para buscar (nome ou código)…"
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
                    className="w-full px-3 py-2 text-left border-b last:border-b-0"
                    style={{
                      borderColor: "rgba(17,24,39,0.06)",
                      background: highlight ? "rgba(17,89,35,0.08)" : active ? T.accentSoft : "transparent",
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
   MiniChart (SVG) — interativo sem zoom
========================================================= */
type SeriesType = "bar" | "line";
type ChartSeries = { key: string; name: string; type: SeriesType; color: string; dashed?: boolean };
type ChartPoint = Record<string, any>;

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ w: 800, h: 300 });
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(320, Math.floor(r.width)), h: Math.max(220, Math.floor(r.height)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}

function niceTicks(min: number, max: number, count = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [min, max];
  const span = max - min;
  const step0 = span / Math.max(1, count - 1);
  const pow = Math.pow(10, Math.floor(Math.log10(step0)));
  const err = step0 / pow;
  const step = err >= 7.5 ? 10 * pow : err >= 3.5 ? 5 * pow : err >= 1.5 ? 2 * pow : 1 * pow;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + 1e-9; v += step) ticks.push(v);
  return ticks;
}

function MiniChart({
  title,
  subtitle,
  data,
  xKey,
  series,
  height = 340,
  yDomain,
  formatterLeft,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  data: ChartPoint[];
  xKey: string;
  series: ChartSeries[];
  height?: number;
  yDomain?: [number, number] | null;
  formatterLeft?: (v: number) => string;
}) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const W = size.w;
  const H = height;

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
      for (const s of visible) {
        const v = safeNum(p[s.key]);
        if (v == null) continue;
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
    }
    if (!Number.isFinite(min)) {
      min = 0;
      max = 1;
    }
    if (!Number.isFinite(max) || max <= min) max = min + 1;
    return yDomain ? yDomain : ([Math.min(0, min), max * 1.06] as [number, number]);
  }, [data, visible, yDomain]);

  const ticks = useMemo(() => niceTicks(dom[0], dom[1], 5), [dom]);
  const fmt = formatterLeft || ((v: number) => brNum(v, 0));

  const y = (v: number) => {
    const [mn, mx] = dom;
    const t = (v - mn) / (mx - mn);
    return M.t + plotH * (1 - t);
  };

  const n = Math.max(1, data.length);
  const xBand = plotW / n;

  const barCount = Math.max(1, bars.length);
  const barW = Math.max(6, Math.min(18, (xBand * 0.7) / barCount));
  const barGap = Math.max(2, Math.min(8, (xBand - barW * barCount) / (barCount + 1)));

  const xCenter = (i: number) => M.l + i * xBand + xBand / 2;

  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);

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

      {/* legenda clicável */}
      <div className="mt-2 flex flex-wrap gap-2">
        {series.map((s) => {
          const off = !!hidden[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setHidden((m) => ({ ...m, [s.key]: !m[s.key] }))}
              className="inline-flex items-center gap-2 h-7 px-2.5 text-[11px] font-medium border rounded-md transition"
              style={{
                borderColor: off ? T.border : T.borderStrong,
                background: off ? T.card : T.cardSoft,
                color: off ? T.text3 : T.text2,
              }}
              title="Clique para ocultar/mostrar"
            >
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color, opacity: off ? 0.35 : 1 }} />
              <span>{s.name}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 border rounded-lg overflow-hidden" style={{ borderColor: T.border, background: T.card }}>
        <svg
          width="100%"
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          style={{ display: "block" }}
        >
          <rect x={0} y={0} width={W} height={H} fill={T.card} />

          {/* grid */}
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

          {/* x labels sparse */}
          {data.map((p, i) => {
            const every = Math.max(1, Math.floor(data.length / 8));
            if (i % every !== 0 && i !== data.length - 1) return null;
            const x = xCenter(i);
            return (
              <text key={`xl-${i}`} x={x} y={M.t + plotH + 24} fontSize={10} textAnchor="middle" fill={T.text3}>
                {String(p[xKey])}
              </text>
            );
          })}

          {/* bars */}
          {data.map((p, i) => {
            const baseX = M.l + i * xBand;
            return (
              <g key={`b-${i}`}>
                {bars.map((s, j) => {
                  const v = safeNum(p[s.key]);
                  if (v == null) return null;
                  const y0 = y(0);
                  const yv = y(v);
                  const h = Math.max(0, y0 - yv);
                  const x = baseX + barGap + j * barW;
                  const w = Math.max(1, barW - 1);
                  return <rect key={`${s.key}-${i}`} x={x} y={yv} width={w} height={h} fill={s.color} opacity={0.92} rx={4} ry={4} />;
                })}
              </g>
            );
          })}

          {/* lines */}
          {lines.map((s) => {
            let d = "";
            data.forEach((p, i) => {
              const v = safeNum(p[s.key]);
              if (v == null) return;
              const x = xCenter(i);
              const yy = y(v);
              d += d ? ` L ${x} ${yy}` : `M ${x} ${yy}`;
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

          {/* crosshair */}
          {hover && hoverX != null ? (
            <line x1={hoverX} y1={M.t} x2={hoverX} y2={M.t + plotH} stroke="rgba(17,24,39,0.18)" strokeDasharray="4 4" />
          ) : null}

          {/* tooltip */}
          {hoverPoint && hoverX != null ? (
            <foreignObject x={Math.min(W - 280, hoverX + 12)} y={Math.max(8, M.t + 8)} width={270} height={190}>
  <div
    style={{
      border: `1px solid ${T.border}`,
      background: T.card,
      borderRadius: 10,
      padding: 10,
      fontSize: 12,
      boxShadow: "0 10px 22px rgba(17,24,39,0.12)",
    }}
  >
    <div style={{ fontWeight: 900, color: T.text, marginBottom: 6 }}>{String(hoverPoint[xKey])}</div>

    <div style={{ display: "grid", gap: 6 }}>
      {visible.map((s) => {
        const v = safeNum(hoverPoint[s.key]);
        return (
          <div key={`tt-${s.key}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.text2 }}>
              <span style={{ width: 10, height: 10, background: s.color, borderRadius: 3 }} />
              <span style={{ fontWeight: 700 }}>{s.name}</span>
            </div>
            <div style={{ fontWeight: 900, color: T.text }}>{v == null ? "—" : brNum(v, 2)}</div>
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
   KPI cards
========================================================= */
function ProgressBar({
  valuePct,
  labelLeft,
  labelRight,
  color,
}: {
  valuePct: number | null;
  labelLeft: string;
  labelRight?: string;
  color: string;
}) {
  const v = valuePct == null ? null : Math.max(0, Math.min(100, valuePct));
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]" style={{ color: T.text3 }}>
        <span>{labelLeft}</span>
        <span className={UI.mono}>{labelRight || (v == null ? "—" : `${brNum(v, 1)}%`)}</span>
      </div>
      <div className="mt-1 border rounded-md overflow-hidden" style={{ borderColor: T.border, background: T.mutedBg, height: 10 }}>
        <div style={{ width: `${v == null ? 0 : v}%`, height: "100%", background: color, opacity: 0.85 }} />
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
  icon,
  footer,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="border rounded-lg p-4 min-w-0" style={{ borderColor: T.border, background: T.card }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={UI.label} style={{ color: T.text2 }}>
            {title}
          </div>
          <div className="mt-1 text-2xl font-extrabold truncate" style={{ color: T.text }}>
            {value}
          </div>
          <div className="mt-1 text-[11px] truncate" style={{ color: T.text3 }}>
            {sub || " "}
          </div>
        </div>
        <div className="shrink-0" style={{ color: T.text3 }}>
          {icon}
        </div>
      </div>
      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */
export function TecsciPage() {
  const isMobile = useIsMobile(640);

  type FullTarget = "charts" | "table" | null;

  const [full, setFull] = useState<FullTarget>(null);
  const [fsFiltersOpen, setFsFiltersOpen] = useState(false);

  const [msg, setMsg] = useState<{ type: "ok" | "warn" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [stations, setStations] = useState<Station[]>([]);
  const [psId, setPsId] = useState<number>(46);
  const selectedStation = useMemo(() => stations.find((s) => s.id === psId) || null, [stations, psId]);

  // ✅ inicializa datas válidas já no primeiro render (evita erro inicial)
  const initialRange = useMemo(() => monthRangeISO(new Date()), []);
  const [periodPreset, setPeriodPreset] = useState<Preset>("thisMonth");
  const [start, setStart] = useState(initialRange.start);
  const [end, setEnd] = useState(initialRange.end);

  const [group, setGroup] = useState<"auto" | "day" | "month" | "year">("auto");
  const [energyUnit, setEnergyUnit] = useState<"kWh" | "MWh">("MWh");

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshSec, setRefreshSec] = useState(20);

  const [data, setData] = useState<PerfApiResp | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false); // por padrão FECHADO
  const [openCharts, setOpenCharts] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [mode, setMode] = useState<"gerencial" | "analista">("gerencial");

  // load stations
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/tecsci/stations", { cache: "no-store" });
        const j = await r.json();
        if (j?.ok) setStations(j.stations || []);
      } catch {}
    })();
  }, []);

  // presets
  const applyPreset = useCallback((p: Preset) => {
    const now = new Date();
    if (p === "custom") return;

    if (p === "thisMonth") {
      const r = monthRangeISO(now);
      setStart(r.start);
      setEnd(r.end);
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
      setEnd(r.end);
      return;
    }
    if (p === "lastYear") {
      const r = yearRangeISO(now.getFullYear() - 1);
      setStart(r.start);
      setEnd(r.end);
      return;
    }
  }, []);

  const invalidRange = useMemo(() => (isIsoDate(start) && isIsoDate(end) ? start > end : false), [start, end]);

  const toggleFull = useCallback((target: Exclude<FullTarget, null>) => {
    setFull((prev) => {
      const next = prev === target ? null : target;
      if (next) {
        setFsFiltersOpen(true);
        setFiltersOpen(true);
        setOpenCharts(true);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (fsFiltersOpen) setFsFiltersOpen(false);
      else setFull(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [full, fsFiltersOpen]);

  const load = useCallback(async () => {
    setMsg(null);

    if (!psId || !Number.isFinite(psId)) return setMsg({ type: "err", text: "Selecione uma usina." });
    if (!isIsoDate(start) || !isIsoDate(end)) return setMsg({ type: "err", text: "Datas inválidas." });
    if (invalidRange) return setMsg({ type: "err", text: "Data inicial maior que a final." });

    setLoading(true);
    try {
      const url = `/api/tecsci/performance?ps_id=${psId}&start_date=${start}&end_date=${end}&group=${group}`;
      const r = await fetch(url, { cache: "no-store" });
      const j: PerfApiResp = await r.json().catch(() => ({ ok: false } as any));
      if (!r.ok || !j?.ok) {
        setData(null);
        setMsg({ type: "err", text: j?.error || "Erro ao carregar performance." });
        return;
      }
      setData(j);
      setMsg({ type: "ok", text: "Atualizado ✅" });
    } catch {
      setData(null);
      setMsg({ type: "err", text: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  }, [psId, start, end, group, invalidRange]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const ms = Math.max(10, Number(refreshSec) || 20) * 1000;
    const id = setInterval(load, ms);
    return () => clearInterval(id);
  }, [autoRefresh, refreshSec, load]);

  const perf = data?.performance || null;

  // buckets
  const bucket = useMemo(() => {
    const s = data?.series;
    if (!s || !data?.group) return [];
    if (data.group === "day") return (s.daily || []).map((x) => ({ label: brDate(x.day), dto: x }));
    if (data.group === "month") return (s.monthly || []).map((x) => ({ label: x.month, dto: x }));
    if (data.group === "year") return (s.yearly || []).map((x) => ({ label: x.year, dto: x }));
    return [];
  }, [data]);

  const filtered = useMemo(() => {
    const q = String(searchText || "").trim().toLowerCase();
    if (!q) return bucket;
    return bucket.filter((b) => String(b.label).toLowerCase().includes(q));
  }, [bucket, searchText]);

  // charts data
  const seriesEnergy = useMemo(() => {
    return filtered.map((b) => {
      const genKwh = safeNum(b.dto.generated_energy_kwh);
      const expTecKwh = safeNum(b.dto.expected_energy_kwh);
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
        p90: p90Kwh == null ? null : kwhToUnit(p90Kwh, energyUnit), // P90 line
      };
    });
  }, [filtered, energyUnit]);

  const seriesIrr = useMemo(() => {
    let accP = 0;
    let accM = 0;
    return filtered.map((b) => {
      const poa = safeNum(b.dto.poa_irradiation_kwh) || 0;
      const meta = safeNum(b.dto.projected_irradiation_kwh) || 0;
      accP += poa;
      accM += meta;
      return { periodo: b.label, poa, meta, accPoa: accP, accMeta: accM };
    });
  }, [filtered]);

  const seriesPR = useMemo(() => filtered.map((b) => ({ periodo: b.label, pr: safeNum(b.dto.pr_percentage), meta: 80 })), [filtered]);
  const seriesAvail = useMemo(
    () => filtered.map((b) => ({ periodo: b.label, disponibilidade: safeNum(b.dto.availability_percentage), meta: 97 })),
    [filtered]
  );

  // kpis
  const kpi = useMemo(() => {
    const genKwh = safeNum(perf?.generated_energy_kwh);
    const expKwh = safeNum(perf?.expected_energy_kwh);
    const p90Kwh = safeNum(perf?.projected_energy_kwh);

    const poa = safeNum(perf?.poa_irradiation_kwh);
    const projPr = safeNum(perf?.projected_pr);
    const dcKw = safeNum(perf?.dc_power_kw);

    const ayaKwh = estimatedAyaKwh(poa, projPr, dcKw);
    const lossAyaKwh = ayaKwh != null && genKwh != null ? clamp0(ayaKwh - genKwh) : null;

    const achAya = genKwh != null && ayaKwh != null && ayaKwh > 0 ? (genKwh / ayaKwh) * 100 : null;
    const achTec = genKwh != null && expKwh != null && expKwh > 0 ? (genKwh / expKwh) * 100 : null;

    return {
      psLabel: selectedStation ? `${selectedStation.name} (${selectedStation.code})` : "—",
      genKwh,
      expKwh,
      p90Kwh,
      ayaKwh,
      lossAyaKwh,
      achAya,
      achTec,
    };
  }, [perf, selectedStation]);

  // chart series configs
  const chartEnergySeries: ChartSeries[] = useMemo(
    () => [
      { key: "geracao", name: `Geração (${energyUnit})`, type: "bar", color: T.cGen },
      { key: "perdasAya", name: `Perdas AYA (${energyUnit})`, type: "bar", color: T.cLoss },
      { key: "estimadoTec", name: `Estimado TecSci (${energyUnit})`, type: "line", color: T.cTec, dashed: true },
      { key: "estimadoAya", name: `Estimado AYA (${energyUnit})`, type: "line", color: T.cAya },
      { key: "p90", name: `P90 (${energyUnit})`, type: "line", color: T.cP90, dashed: true },
    ],
    [energyUnit]
  );

  const chartIrr1: ChartSeries[] = useMemo(
    () => [
      { key: "poa", name: "POA (kWh/m²)", type: "bar", color: T.cPoa },
      { key: "meta", name: "Meta (kWh/m²)", type: "line", color: T.cPoaMeta, dashed: true },
    ],
    []
  );

  const chartIrr2: ChartSeries[] = useMemo(
    () => [
      { key: "accPoa", name: "Acum. POA", type: "line", color: T.cPoa },
      { key: "accMeta", name: "Acum. Meta", type: "line", color: T.cPoaMeta, dashed: true },
    ],
    []
  );

  const chartPR: ChartSeries[] = useMemo(
    () => [
      { key: "pr", name: "PR (%)", type: "bar", color: T.cPR },
      { key: "meta", name: "Meta", type: "line", color: T.cTarget, dashed: true },
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

  // Filters body (compact)
  const FiltersBody = (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        <div className="lg:col-span-5 min-w-0">
          <StationPicker stations={stations} valueId={psId} onChangeId={setPsId} />
        </div>

        <div className="lg:col-span-3">
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

        <div className="lg:col-span-2">
          <label className={UI.label} style={{ color: T.text2 }}>
            Início
          </label>
          <input
            className={UI.input}
            style={{ borderColor: T.border }}
            type="date"
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              setPeriodPreset("custom");
            }}
          />
        </div>

        <div className="lg:col-span-2">
          <label className={UI.label} style={{ color: T.text2 }}>
            Fim
          </label>
          <input
            className={UI.input}
            style={{ borderColor: T.border }}
            type="date"
            value={end}
            onChange={(e) => {
              setEnd(e.target.value);
              setPeriodPreset("custom");
            }}
          />
        </div>

        <div className="lg:col-span-2">
          <label className={UI.label} style={{ color: T.text2 }}>
            Group
          </label>
          <select className={UI.select} style={{ borderColor: T.border }} value={group} onChange={(e) => setGroup(e.target.value as any)}>
            <option value="auto">Auto</option>
            <option value="day">Dia</option>
            <option value="month">Mês</option>
            <option value="year">Ano</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className={UI.label} style={{ color: T.text2 }}>
            Energia
          </label>
          <select
            className={UI.select}
            style={{ borderColor: T.border }}
            value={energyUnit}
            onChange={(e) => setEnergyUnit(e.target.value as any)}
          >
            <option value="MWh">MWh</option>
            <option value="kWh">kWh</option>
          </select>
        </div>

        <div className="lg:col-span-8">
          <label className={UI.label} style={{ color: T.text2 }}>
            Buscar período
          </label>
          <div className="relative">
            <input
              className={cx(UI.input, "pr-9")}
              style={{ borderColor: T.border }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Ex: 2026-01, 02/2026..."
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: T.text3 }}>
              <Search className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex items-end justify-end gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setAutoRefresh((v) => !v)}
            className="h-10 px-3 border rounded-md text-sm font-semibold"
            style={{
              borderColor: T.border,
              background: autoRefresh ? T.accentSoft : T.card,
              color: autoRefresh ? T.accent : T.text2,
            }}
            title="Auto refresh"
          >
            Auto: {autoRefresh ? "ON" : "OFF"}
          </button>

          <input
            className="h-10 w-20 px-2 border rounded-md text-sm font-semibold bg-white"
            style={{ borderColor: T.border, color: T.text }}
            type="number"
            min={10}
            value={refreshSec}
            onChange={(e) => setRefreshSec(Math.max(10, Number(e.target.value) || 20))}
            title="Intervalo (s)"
          />

          <Btn tone="secondary" onClick={load} loading={loading} title="Atualizar">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Btn>
        </div>

        {invalidRange ? (
          <div className="lg:col-span-12 text-[11px]" style={{ color: T.errTx }}>
            Data inicial maior que a final.
          </div>
        ) : null}

        <div className="lg:col-span-12">
          <MsgBox m={msg} />
        </div>
      </div>
    </div>
  );

  // ChartsBody (ÚNICO)
  const ChartsBody = (
    <div className="p-4 grid gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-12 border rounded-lg p-4" style={{ borderColor: T.border, background: T.cardSoft }}>
          <MiniChart
            title="Energia (Gerencial)"
            subtitle="Barras: Geração/Perdas • Linhas: Estimado TecSci, Estimado AYA, P90"
            data={seriesEnergy}
            xKey="periodo"
            series={chartEnergySeries}
            height={380}
            formatterLeft={(v) => brNum(v, 2)}
          />
        </div>

        <div className="lg:col-span-6 border rounded-lg p-4" style={{ borderColor: T.border, background: T.cardSoft }}>
          <MiniChart
            title="Irradiação (POA)"
            subtitle="POA vs Meta (TecSci)"
            data={seriesIrr}
            xKey="periodo"
            series={chartIrr1}
            height={320}
            formatterLeft={(v) => brNum(v, 2)}
          />
        </div>

        <div className="lg:col-span-6 border rounded-lg p-4" style={{ borderColor: T.border, background: T.cardSoft }}>
          <MiniChart
            title="Irradiação acumulada"
            subtitle="Acumulado POA vs Meta"
            data={seriesIrr}
            xKey="periodo"
            series={chartIrr2}
            height={320}
            formatterLeft={(v) => brNum(v, 2)}
          />
        </div>

        <div className="lg:col-span-6 border rounded-lg p-4" style={{ borderColor: T.border, background: T.cardSoft }}>
          <MiniChart
            title="PR"
            subtitle="PR vs Meta"
            data={seriesPR}
            xKey="periodo"
            series={chartPR}
            height={300}
            yDomain={[0, 100]}
            formatterLeft={(v) => `${brNum(v, 0)}%`}
          />
        </div>

        <div className="lg:col-span-6 border rounded-lg p-4" style={{ borderColor: T.border, background: T.cardSoft }}>
          <MiniChart
            title="Disponibilidade"
            subtitle="Disponibilidade vs Meta"
            data={seriesAvail}
            xKey="periodo"
            series={chartAvail}
            height={300}
            yDomain={[0, 100]}
            formatterLeft={(v) => `${brNum(v, 0)}%`}
          />
        </div>
      </div>
    </div>
  );

  // TableBody
  const tableRows = useMemo(() => {
    return filtered.map((b) => {
      const gen = safeNum(b.dto.generated_energy_kwh);
      const exp = safeNum(b.dto.expected_energy_kwh);
      const p90 = safeNum(b.dto.projected_energy_kwh);
      const poa = safeNum(b.dto.poa_irradiation_kwh);
      const projPr = safeNum(b.dto.projected_pr);
      const dcKw = safeNum(b.dto.dc_power_kw);
      const aya = estimatedAyaKwh(poa, projPr, dcKw);
      const loss = aya != null && gen != null ? clamp0(aya - gen) : null;

      return {
        periodo: b.label,
        generated_kwh: gen,
        expected_kwh: exp,
        p90_kwh: p90,
        poa_kwh_m2: poa,
        projected_pr: projPr,
        dc_power_kw: dcKw,
        estimated_aya_kwh: aya,
        loss_aya_kwh: loss,
      };
    });
  }, [filtered]);

  const TableBody = (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[11px]" style={{ color: T.text3 }}>
          Itens: <span className={UI.mono}>{tableRows.length}</span>
        </div>

        <Btn
          tone="secondary"
          onClick={() => downloadTextFile(`AYA_SCADA_${start}_${end}.csv`, toCsv(tableRows), "text/csv;charset=utf-8")}
          title="Exportar CSV"
        >
          <FileDown className="w-4 h-4" />
          CSV
        </Btn>
      </div>

      <div className="mt-3 border rounded-lg overflow-hidden" style={{ borderColor: T.border }}>
        <div
          className="px-3 py-2 text-[11px] font-semibold border-b"
          style={{
            borderColor: T.border,
            background: "rgba(251,252,253,0.95)",
            color: T.text2,
            display: "grid",
            gridTemplateColumns: "140px 130px 130px 130px 130px 120px 120px 150px 150px",
            gap: 10,
          }}
        >
          <div>Período</div>
          <div style={{ textAlign: "right" }}>Gerado</div>
          <div style={{ textAlign: "right" }}>Esperado</div>
          <div style={{ textAlign: "right" }}>P90</div>
          <div style={{ textAlign: "right" }}>POA</div>
          <div style={{ textAlign: "right" }}>proj_pr</div>
          <div style={{ textAlign: "right" }}>dc_kW</div>
          <div style={{ textAlign: "right" }}>Est. AYA</div>
          <div style={{ textAlign: "right" }}>Perdas</div>
        </div>

        {tableRows.length === 0 ? (
          <div className="px-3 py-6 text-sm" style={{ color: T.text2 }}>
            Sem dados.
          </div>
        ) : (
          tableRows.map((r, idx) => (
            <div
              key={`${r.periodo}-${idx}`}
              className="px-3 py-2 text-sm border-b last:border-b-0"
              style={{
                borderColor: "rgba(17,24,39,0.08)",
                background: T.card,
                display: "grid",
                gridTemplateColumns: "140px 130px 130px 130px 130px 120px 120px 150px 150px",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 800, color: T.text }}>{r.periodo}</div>
              <div className={UI.mono} style={{ textAlign: "right" }}>
                {r.generated_kwh != null ? brInt(r.generated_kwh) : "—"}
              </div>
              <div className={UI.mono} style={{ textAlign: "right" }}>
                {r.expected_kwh != null ? brInt(r.expected_kwh) : "—"}
              </div>
              <div className={UI.mono} style={{ textAlign: "right" }}>
                {r.p90_kwh != null ? brInt(r.p90_kwh) : "—"}
              </div>
              <div className={UI.mono} style={{ textAlign: "right" }}>
                {r.poa_kwh_m2 != null ? brNum(r.poa_kwh_m2, 2) : "—"}
              </div>
              <div className={UI.mono} style={{ textAlign: "right" }}>
                {r.projected_pr != null ? brNum(r.projected_pr, 2) : "—"}
              </div>
              <div className={UI.mono} style={{ textAlign: "right" }}>
                {r.dc_power_kw != null ? brNum(r.dc_power_kw, 2) : "—"}
              </div>
              <div className={UI.mono} style={{ textAlign: "right", fontWeight: 900 }}>
                {r.estimated_aya_kwh != null ? brInt(r.estimated_aya_kwh) : "—"}
              </div>
              <div
                className={UI.mono}
                style={{
                  textAlign: "right",
                  fontWeight: 900,
                  color: r.loss_aya_kwh != null && r.loss_aya_kwh > 0 ? T.errTx : T.text,
                }}
              >
                {r.loss_aya_kwh != null ? brInt(r.loss_aya_kwh) : "—"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Header actions
  const headerRight = (
    <div className="flex items-center gap-2 flex-wrap">
      <Btn tone="secondary" onClick={load} loading={loading} title="Recarregar">
        <RefreshCw className="w-4 h-4" />
      </Btn>

      <Btn tone="secondary" onClick={() => setMode((m) => (m === "gerencial" ? "analista" : "gerencial"))} title="Alternar modo">
        {mode === "gerencial" ? <LayoutGrid className="w-4 h-4" /> : <TableIcon className="w-4 h-4" />}
        {mode === "gerencial" ? "Gerencial" : "Analista"}
      </Btn>
    </div>
  );

  // KPI block
  const KpisBody = (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-4">
          <KpiCard title="Usina" value={kpi.psLabel} sub={`Período: ${brDate(start)} → ${brDate(end)}`} icon={<Sun className="w-4 h-4" />} />
        </div>

        <div className="lg:col-span-4">
          <KpiCard
            title={`Geração (${energyUnit})`}
            value={kpi.genKwh != null ? brNum(kwhToUnit(kpi.genKwh, energyUnit), 2) : "—"}
            sub="Total do período"
            icon={<Zap className="w-4 h-4" />}
            footer={
              <ProgressBar
                valuePct={kpi.achTec}
                labelLeft="Ating. vs Esperado (TecSci)"
                labelRight={kpi.achTec == null ? "—" : `${brNum(kpi.achTec, 1)}%`}
                color={T.accent2}
              />
            }
          />
        </div>

        <div className="lg:col-span-4">
          <KpiCard
            title={`Estimado AYA (${energyUnit})`}
            value={kpi.ayaKwh != null ? brNum(kwhToUnit(kpi.ayaKwh, energyUnit), 2) : "—"}
            sub="POA × projected_pr × dc_power_kw"
            icon={<Gauge className="w-4 h-4" />}
            footer={
              <ProgressBar
                valuePct={kpi.achAya}
                labelLeft="Ating. vs Estimado AYA"
                labelRight={kpi.achAya == null ? "—" : `${brNum(kpi.achAya, 1)}%`}
                color={T.accent}
              />
            }
          />
        </div>

        <div className="lg:col-span-4">
          <KpiCard title={`P90 (${energyUnit})`} value={kpi.p90Kwh != null ? brNum(kwhToUnit(kpi.p90Kwh, energyUnit), 2) : "—"} sub="projected_energy_kwh" icon={<Activity className="w-4 h-4" />} />
        </div>

        <div className="lg:col-span-4">
          <KpiCard title={`Perdas AYA (${energyUnit})`} value={kpi.lossAyaKwh != null ? brNum(kwhToUnit(kpi.lossAyaKwh, energyUnit), 2) : "—"} sub="max(0, Estimado AYA − Gerado)" icon={<Activity className="w-4 h-4" />} />
        </div>

        <div className="lg:col-span-4">
          <KpiCard title="Notas" value={data?.group || "—"} sub={`group (resposta): ${data?.group || "—"} • group (req): ${group}`} icon={<Gauge className="w-4 h-4" />} />
        </div>
      </div>
    </div>
  );

  // Sections
  const ChartsSection = (
    <div className={cx(UI.section, "rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
      <SectionHeader
        title="Gráficos (SCADA)"
        hint="Interativos sem zoom • P90 é linha"
        right={
          <div className="flex items-center gap-2 flex-wrap">
            <Btn tone="secondary" onClick={() => setOpenCharts((p) => !p)} className={cx(isMobile ? "h-9 px-3 text-xs" : "")}>
              {openCharts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Btn>
            <FullscreenToggle active={false} compact={isMobile} onToggle={() => toggleFull("charts")} />
          </div>
        }
      />
      {openCharts ? ChartsBody : null}
    </div>
  );

  const TableSection = (
    <div className={cx(UI.section, "rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
      <SectionHeader title="Tabela (Analista)" hint="Export CSV" right={<FullscreenToggle active={false} compact={isMobile} onToggle={() => toggleFull("table")} />} />
      {TableBody}
    </div>
  );

  // Fullscreen render
  if (full === "charts") {
    return (
      <FullscreenShell
        title="SCADA — Gráficos"
        hint="Sem zoom. Tooltip + crosshair + legenda clicável."
        count={filtered.length}
        filtersOpen={fsFiltersOpen}
        onToggleFilters={() => setFsFiltersOpen((v) => !v)}
        onClose={() => setFull(null)}
        filters={FiltersBody}
      >
        {ChartsBody}
      </FullscreenShell>
    );
  }

  if (full === "table") {
    return (
      <FullscreenShell
        title="SCADA — Tabela"
        hint="Export CSV."
        count={tableRows.length}
        filtersOpen={fsFiltersOpen}
        onToggleFilters={() => setFsFiltersOpen((v) => !v)}
        onClose={() => setFull(null)}
        filters={FiltersBody}
      >
        {TableBody}
      </FullscreenShell>
    );
  }

  return (
    <section className={UI.page} style={{ background: T.bg, color: T.text }}>
      <div className={UI.container}>
        {/* HEADER */}
        <div className={cx(UI.header, "p-4 sm:p-5 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className={UI.headerTitle} style={{ color: T.text }}>
                SCADA Solar — TecSci Performance • Estimado AYA
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill tone="accent">{selectedStation ? selectedStation.name : "Selecione a usina"}</Pill>
                <Pill>Período: {start && end ? `${brDate(start)} → ${brDate(end)}` : "—"}</Pill>
                <Pill tone="accent">AYA = POA × projected_pr × dc_power_kw</Pill>
              </div>
            </div>

            {headerRight}
          </div>

          <div className="mt-3">
            <MsgBox m={msg} />
          </div>
        </div>

        {/* QUICK FILTER BAR */}
        <div className={cx(UI.section, "mt-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
          <SectionHeader
            title="Seleção rápida"
            hint="Usina + período (o resto fica em 'Filtros avançados')"
            right={
              <div className="flex items-center gap-2">
                <Btn tone="secondary" onClick={() => setFiltersOpen((p) => !p)} className={cx(isMobile ? "h-9 px-3 text-xs" : "")}>
                  <SlidersHorizontal className="w-4 h-4" />
                  {filtersOpen ? "Ocultar" : "Filtros"}
                </Btn>

                <Btn
                  tone="secondary"
                  onClick={() => {
                    setMsg(null);
                    setSearchText("");
                    setPeriodPreset("thisMonth");
                    applyPreset("thisMonth");
                  }}
                  className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                  title="Limpar"
                >
                  <Eraser className="w-4 h-4" />
                </Btn>

                <Btn
                  tone="secondary"
                  onClick={() => setMode((m) => (m === "gerencial" ? "analista" : "gerencial"))}
                  className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                  title="Modo"
                >
                  {mode === "gerencial" ? <LayoutGrid className="w-4 h-4" /> : <TableIcon className="w-4 h-4" />}
                  {mode === "gerencial" ? "Gerencial" : "Analista"}
                </Btn>
              </div>
            }
          />

          {/* sempre visível: usina + preset */}
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-6 min-w-0">
                <StationPicker stations={stations} valueId={psId} onChangeId={setPsId} />
              </div>

              <div className="lg:col-span-3">
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

              <div className="lg:col-span-3 flex items-end justify-end gap-2">
                <Btn tone="secondary" onClick={load} loading={loading} title="Atualizar">
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </Btn>
              </div>
            </div>
          </div>

          {/* avançados */}
          {filtersOpen ? (
            <div className="border-t" style={{ borderColor: T.border }}>
              {FiltersBody}
            </div>
          ) : null}
        </div>

        {/* KPI */}
        <div className={cx(UI.section, "mt-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
          <SectionHeader title="KPIs (Gerencial)" hint="Leitura rápida do período" />
          {KpisBody}
        </div>

        {/* Charts */}
        <div className="mt-4">{ChartsSection}</div>

        {/* Table only in analista */}
        {mode === "analista" ? <div className="mt-4">{TableSection}</div> : null}
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

/** ✅ obrigatório no Next: page precisa ter default export */
export default function Page() {
  return <TecsciPage />;
}