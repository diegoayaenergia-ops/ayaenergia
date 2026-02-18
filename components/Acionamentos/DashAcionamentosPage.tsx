// app/acionamentos/dashboard/page.tsx
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Search, RefreshCw, ChevronDown, ChevronUp, X } from "lucide-react";

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
  accentBorder: "rgba(17, 89, 35, 0.30)",

  okBg: "rgba(16, 185, 129, 0.10)",
  okBd: "rgba(16, 185, 129, 0.30)",
  okTx: "#065F46",

  errBg: "rgba(239, 68, 68, 0.10)",
  errBd: "rgba(239, 68, 68, 0.30)",
  errTx: "#7F1D1D",
} as const;

const UI = {
  page: "w-full min-w-0",
  container: "mx-auto w-full max-w-[1480px] px-4 sm:px-6 py-6",
  header: "border bg-white",
  section: "border bg-white",

  headerTitle: "text-base sm:text-lg font-semibold tracking-tight",
  sectionTitle: "text-sm font-semibold",
  sectionHint: "text-xs",
  label: "text-[11px] font-medium",

  input:
    "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2",
  select:
    "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2",

  cardTitle: "text-xs font-semibold",
  mono: "tabular-nums",
} as const;

/* =========================================================
   UI PRIMITIVES
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
    "disabled:opacity-50 disabled:cursor-not-allowed transition active:translate-y-[0.5px]";

  const style =
    tone === "primary"
      ? {
        background: T.accent,
        borderColor: "rgba(17, 89, 35, 0.45)",
        color: "#fff",
      }
      : tone === "danger"
        ? {
          background: "rgba(239, 68, 68, 0.10)",
          borderColor: "rgba(239, 68, 68, 0.35)",
          color: T.errTx,
        }
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
        "inline-flex items-center h-7 px-2.5 text-[11px] font-medium border rounded-md",
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

function MsgBox({ m }: { m: { type: "ok" | "err"; text: string } | null }) {
  if (!m) return null;
  const s =
    m.type === "ok"
      ? { background: T.okBg, borderColor: T.okBd, color: T.okTx }
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
}: {
  title: ReactNode;
  hint?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
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
  );
}

/* =========================================================
   HELPERS
========================================================= */
function clampUpper(s: string) {
  return String(s || "").trim().toUpperCase();
}
function safeText(s?: string | null, fallback = "") {
  const v = String(s ?? "").trim();
  return v ? v : fallback;
}
function safeUpper(s?: string | null, fallback = "—") {
  const v = String(s ?? "").trim();
  return v ? clampUpper(v) : fallback;
}
function brDate(iso?: string | null) {
  if (!iso) return "-";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(iso);
  return `${m[3]}/${m[2]}/${m[1]}`;
}
function toISODateMaybe(v?: string | null) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}
function inRangeISO(d: string, start: string, end: string) {
  return d >= start && d <= end;
}
function includesLoose(hay?: string | null, needle?: string) {
  const n = String(needle || "").trim().toLowerCase();
  if (!n) return true;
  const h = String(hay || "").toLowerCase();
  return h.includes(n);
}
function ssLink(numeroSs: number | string) {
  return `https://br.sismetro.com/indexNEW.php?f=10&e=${encodeURIComponent(
    String(numeroSs || "")
  )}`;
}
function pal(i: number) {
  // paleta suave e profissional
  const palette = [
    "rgba(17, 89, 35, 0.82)",
    "rgba(46, 123, 65, 0.66)",
    "rgba(11, 18, 32, 0.56)",
    "rgba(17, 89, 35, 0.38)",
    "rgba(11, 18, 32, 0.34)",
    "rgba(17, 24, 39, 0.28)",
    "rgba(46, 123, 65, 0.42)",
    "rgba(17, 89, 35, 0.22)",
  ];
  return palette[i % palette.length];
}

/* =========================================================
   RANGE: SEMANA / MÊS
========================================================= */
function toISODate(d: Date) {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
function startOfWeekSunday(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}
function endOfWeekSaturday(d: Date) {
  const s = startOfWeekSunday(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  return e;
}
function monthRangeISO(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  return { start: toISODate(start), end: toISODate(end) };
}

/* =========================================================
   AUTOCOMPLETE (GENÉRICO)
========================================================= */
function Autocomplete({
  value,
  onChange,
  options,
  loading,
  placeholder,
  className,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  loading?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const v = value.trim().toLowerCase();
    if (!v) return options;
    return options.filter((u) => u.toLowerCase().includes(v));
  }, [value, options]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    setHighlight((h) => Math.min(h, Math.max(0, filtered.length - 1)));
  }, [open, filtered.length]);

  return (
    <div ref={ref} className={cx("relative", className)}>
      <div className="relative">
        <input
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open) return;

            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, filtered.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            }
            if (e.key === "Enter") {
              e.preventDefault();
              const sel = filtered[highlight];
              if (sel) {
                onChange(sel);
                setOpen(false);
              }
            }
            if (e.key === "Escape") setOpen(false);
          }}
          className={cx(UI.input, "pr-9 rounded-md")}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            borderColor: T.border,
            color: T.text,
            boxShadow: "none",
            opacity: disabled ? 0.6 : 1,
          }}
        />
        <div
          className="absolute right-2.5 top-1/2 -translate-y-1/2"
          style={{ color: T.text3 }}
        >
          <Search className="w-4 h-4" />
        </div>
      </div>

      {open && !disabled && (
        <div
          className="absolute z-40 mt-1 w-full max-h-64 overflow-auto border bg-white shadow-sm rounded-md"
          style={{ borderColor: T.border }}
        >
          {loading && (
            <div className="px-3 py-2 text-xs" style={{ color: T.text3 }}>
              Carregando…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="px-3 py-2 text-xs" style={{ color: T.text3 }}>
              Nenhum item
            </div>
          )}

          {!loading &&
            filtered.map((u, i) => (
              <button
                key={u}
                type="button"
                onMouseDown={() => {
                  onChange(u);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm border-b last:border-b-0"
                style={{
                  borderColor: "rgba(17,24,39,0.06)",
                  background: i === highlight ? T.accentSoft : "transparent",
                  color: i === highlight ? T.accent : T.text2,
                  fontWeight: i === highlight ? 700 : 500,
                }}
              >
                {u}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TYPES — ACIONAMENTOS
========================================================= */
type AcRow = {
  id: string;
  data: string; // ISO YYYY-MM-DD

  cliente: string | null;
  usina: string | null;

  ss: number | null;

  equipamento: string | null;
  alarme: string | null;

  motivoMobilizacao: string | null;
  problemaIdentificado: string | null;
  solucaoImediata: string | null;
  solucaoDefinitiva: string | null;

  [k: string]: any;
};

/* =========================================================
   LEGEND PILLS (clicável)
========================================================= */
function LegendPills({
  items,
  active,
  onClickItem,
  max = 10,
}: {
  items: Array<{ label: string; total: number }>;
  active?: string;
  onClickItem: (lbl: string) => void;
  max?: number;
}) {
  const show = items.slice(0, max);
  const rest = items.length - show.length;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {show.map((x, i) => {
        const isActive =
          !!active && clampUpper(active) === clampUpper(x.label);
        return (
          <button
            key={x.label}
            type="button"
            onClick={() => onClickItem(x.label)}
            className="inline-flex items-center gap-2 h-8 px-2.5 rounded-md border text-[11px] font-semibold"
            style={{
              borderColor: isActive ? T.accentBorder : T.border,
              background: isActive ? T.accentSoft : T.card,
              color: isActive ? T.accent : T.text2,
            }}
            title="Clique para filtrar"
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ background: pal(i) }}
            />
            <span className="max-w-[140px] truncate">{x.label}</span>
            <span className={UI.mono} style={{ color: isActive ? T.accent : T.text3 }}>
              {x.total}
            </span>
          </button>
        );
      })}

      {rest > 0 && (
        <span
          className="inline-flex items-center h-8 px-2.5 rounded-md border text-[11px] font-semibold"
          style={{ borderColor: T.border, background: T.cardSoft, color: T.text3 }}
          title={`${rest} itens adicionais (use busca no gráfico)`}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}

/* =========================================================
   GRÁFICO MELHOR (STACKED) — LISTA + BARRA SEGMENTADA
========================================================= */
type StackedRow = {
  label: string;
  total: number;
  bySeg: Record<string, number>;
};

function buildStacked(
  rows: AcRow[],
  getGroup: (r: AcRow) => string,
  getSeg: (r: AcRow) => string
) {
  const map: Record<string, StackedRow> = {};
  const segTotals: Record<string, number> = {};

  for (const r of rows) {
    const g = String(getGroup(r) || "").trim();
    const s = String(getSeg(r) || "").trim();

    const group = clampUpper(g).replace(/\s+/g, " ").trim();
    const seg = clampUpper(s).replace(/\s+/g, " ").trim();

    if (!group) continue;

    if (!map[group]) map[group] = { label: group, total: 0, bySeg: {} };

    map[group].total += 1;

    const segKey = seg || "SEM CLIENTE";
    map[group].bySeg[segKey] = (map[group].bySeg[segKey] || 0) + 1;
    segTotals[segKey] = (segTotals[segKey] || 0) + 1;
  }

  const groups = Object.values(map).sort(
    (a, b) => b.total - a.total || a.label.localeCompare(b.label)
  );

  const segs = Object.entries(segTotals)
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));

  return { groups, segs };
}

function StackedBarsCard({
  title,
  hint,
  groups,
  segs,
  segActive,
  onClickSeg,
  onClickGroup,
  groupActive,
  searchPlaceholder,
  maxSegs = 6,
  maxHeight = 560,
}: {
  title: string;
  hint?: ReactNode;

  groups: StackedRow[];
  segs: Array<{ label: string; total: number }>;

  segActive?: string;
  onClickSeg: (lbl: string) => void;

  onClickGroup: (lbl: string) => void;
  groupActive?: string;

  searchPlaceholder: string;

  maxSegs?: number;
  maxHeight?: number;
}) {
  const [q, setQ] = useState("");

  const visibleGroups = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return groups;
    return groups.filter((g) => g.label.toLowerCase().includes(s));
  }, [groups, q]);

  const shownSegs = useMemo(() => segs.slice(0, maxSegs), [segs, maxSegs]);
  const shownSegLabels = useMemo(
    () => new Set(shownSegs.map((x) => x.label)),
    [shownSegs]
  );

  return (
    <div
      className="border rounded-lg p-3"
      style={{
        borderColor: T.border,
        background: T.cardSoft,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={UI.cardTitle} style={{ color: T.text }}>
            {title}
          </div>
          {hint ? (
            <div className="mt-1 text-[11px]" style={{ color: T.text3 }}>
              {hint}
            </div>
          ) : (
            <div className="mt-1 text-[11px]" style={{ color: T.text3 }}>
              Clique na linha para filtrar • Barra segmentada por cliente
            </div>
          )}
        </div>

        <span
          className={cx(
            "inline-flex items-center h-6 px-2 text-[11px] font-extrabold border rounded-md",
            UI.mono
          )}
          style={{ borderColor: T.border, background: T.card, color: T.text }}
          title="Itens distintos"
        >
          {groups.length}
        </span>
      </div>

      {/* legenda (clientes) */}
      <LegendPills
        items={segs}
        active={segActive}
        onClickItem={onClickSeg}
        max={maxSegs}
      />

      {/* busca interna */}
      <div className="mt-3 relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={cx(UI.input, "rounded-md pr-9")}
          style={{ borderColor: T.border }}
          placeholder={searchPlaceholder}
        />
        <div
          className="absolute right-2.5 top-1/2 -translate-y-1/2"
          style={{ color: T.text3 }}
        >
          <Search className="w-4 h-4" />
        </div>
      </div>

      {/* lista */}
      <div
        className="mt-3 grid gap-2 overflow-y-auto overflow-x-hidden pr-3 acion-scroll"
        style={{
          maxHeight,            // altura do miolo rolável
          scrollbarGutter: "stable", // reserva espaço pro scroll (Chrome/Edge)
        }}
      >

        {!visibleGroups.length && (
          <div
            className="border rounded-lg p-3 text-sm"
            style={{
              borderColor: T.border,
              background: T.mutedBg,
              color: T.text2,
            }}
          >
            Sem dados.
          </div>
        )}

        {visibleGroups.map((g) => {
          const isActive =
            !!groupActive && clampUpper(groupActive) === clampUpper(g.label);

          return (
            <button
              key={g.label}
              type="button"
              className="flex items-center gap-3 text-left"
              onClick={() => onClickGroup(g.label)}
              title="Clique para filtrar"
            >
              <div
                className="w-56 text-xs truncate"
                style={{
                  color: isActive ? T.accent : T.text3,
                  fontWeight: isActive ? 900 : 650,
                }}
                title={g.label}
              >
                {g.label}
              </div>

              <div
                className="flex-1 border rounded-md overflow-hidden flex"
                style={{
                  borderColor: isActive ? T.accentBorder : T.border,
                  background: T.mutedBg,
                  height: 30,
                }}
              >
                {shownSegs.map((s, i) => {
                  const v = g.bySeg[s.label] || 0;
                  if (!v) return null;

                  // se existir filtro por cliente (segActive), destacamos só o segmento selecionado
                  const activeSeg =
                    !!segActive && clampUpper(segActive) === clampUpper(s.label);

                  const w = (v / Math.max(1, g.total)) * 100;
                  return (
                    <div
                      key={`${g.label}-${s.label}`}
                      style={{
                        width: `${w}%`,
                        background: pal(i),
                        opacity: segActive ? (activeSeg ? 1 : 0.18) : 1,
                      }}
                      title={`${s.label}: ${v}`}
                    />
                  );
                })}

                {/* outros */}
                {(() => {
                  const other = Object.entries(g.bySeg)
                    .filter(([lbl]) => !shownSegLabels.has(lbl))
                    .reduce((acc, [, v]) => acc + (v || 0), 0);

                  if (!other) return null;
                  const w = (other / Math.max(1, g.total)) * 100;
                  const activeOther =
                    !!segActive && clampUpper(segActive) === "OUTROS";

                  return (
                    <div
                      key={`${g.label}-OUTROS`}
                      style={{
                        width: `${w}%`,
                        background: "rgba(17,24,39,0.22)",
                        opacity: segActive ? (activeOther ? 1 : 0.18) : 1,
                      }}
                      title={`OUTROS: ${other}`}
                    />
                  );
                })()}
              </div>

              <div
                className={cx("w-12 text-xs text-right", UI.mono)}
                style={{ color: T.text, fontWeight: 900 }}
              >
                {g.total}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */
export function AcionamentosDashPage() {
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  // filtros
  const [periodPreset, setPeriodPreset] = useState<
    "today" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "last7" | "last30"
  >("thisMonth");

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [cliente, setCliente] = useState("");
  const [usina, setUsina] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [alarme, setAlarme] = useState("");

  const [searchText, setSearchText] = useState("");

  // UI
  const [filtersOpen, setFiltersOpen] = useState(true);

  // filtros rápidos (clique em legenda dos gráficos)
  const [clienteQuick, setClienteQuick] = useState("");

  // options (puxadas da base carregada)
  const [clientesList, setClientesList] = useState<string[]>([]);
  const [usinasList, setUsinasList] = useState<string[]>([]);
  const [equipamentosList, setEquipamentosList] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // dados
  const [loading, setLoading] = useState(false);
  const [allRows, setAllRows] = useState<AcRow[]>([]);

  // paginação tabela
  const limit = 14;
  const [page, setPage] = useState(1);

  const abortRef = useRef<AbortController | null>(null);

  const applyPreset = useCallback((p: typeof periodPreset) => {
    const now = new Date();

    if (p === "today") {
      const d = toISODate(now);
      setStart(d);
      setEnd(d);
      return;
    }

    if (p === "thisWeek") {
      const s = startOfWeekSunday(now);
      const e = endOfWeekSaturday(now);
      setStart(toISODate(s));
      setEnd(toISODate(e));
      return;
    }

    if (p === "lastWeek") {
      const base = new Date(now);
      base.setDate(base.getDate() - 7);
      const s = startOfWeekSunday(base);
      const e = endOfWeekSaturday(base);
      setStart(toISODate(s));
      setEnd(toISODate(e));
      return;
    }

    if (p === "thisMonth") {
      const mr = monthRangeISO(now);
      setStart(mr.start);
      setEnd(mr.end);
      return;
    }

    if (p === "lastMonth") {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const mr = monthRangeISO(d);
      setStart(mr.start);
      setEnd(mr.end);
      return;
    }

    if (p === "last7") {
      const e = new Date(now);
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      setStart(toISODate(s));
      setEnd(toISODate(e));
      return;
    }

    if (p === "last30") {
      const e = new Date(now);
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      setStart(toISODate(s));
      setEnd(toISODate(e));
      return;
    }
  }, []);

  useEffect(() => {
    setPeriodPreset("thisMonth");
    applyPreset("thisMonth");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const invalidRange = useMemo(() => {
    if (!start || !end) return false;
    const s = new Date(`${start}T00:00:00`);
    const e = new Date(`${end}T00:00:00`);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return false;
    return s.getTime() > e.getTime();
  }, [start, end]);

  // normaliza resposta do backend
  const normalizeRows = (data: any): AcRow[] => {
    const cand = Array.isArray(data?.rows)
      ? data.rows
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
          ? data
          : [];

    return cand
      .map((r: any) => {
        const iso =
          toISODateMaybe(r?.data) ||
          toISODateMaybe(r?.date) ||
          toISODateMaybe(r?.dia) ||
          toISODateMaybe(r?.createdAt) ||
          toISODateMaybe(r?.criadoEm) ||
          "";

        const ssNum =
          r?.ss ?? r?.SS ?? r?.idSs ?? r?.numeroSs ?? r?.numero_ss ?? null;

        const cli =
          r?.cliente ??
          r?.Cliente ??
          r?.solicitante ??
          r?.empresa ??
          r?.company ??
          r?.customer ??
          null;

        const eq =
          r?.equipamento ??
          r?.equip ??
          r?.equipment ??
          r?.device ??
          r?.ativo ??
          r?.componente ??
          null;

        const al =
          r?.alarme ??
          r?.alarm ??
          r?.alarmeDescricao ??
          r?.descricaoAlarme ??
          r?.fault ??
          null;

        return {
          id: String(
            r?.id ??
            r?._id ??
            r?.uuid ??
            r?.ID ??
            `${iso}-${ssNum ?? Math.random()}`
          ),

          data: iso,
          cliente: cli ? String(cli).trim() : null,
          usina: r?.usina ?? r?.UFV ?? r?.ufv ?? r?.localizacao ?? null,

          ss:
            ssNum !== null &&
              ssNum !== undefined &&
              String(ssNum).trim() !== ""
              ? Number(ssNum)
              : null,

          equipamento: eq ? String(eq).trim() : null,
          alarme: al ? String(al).trim() : null,

          motivoMobilizacao:
            r?.motivoMobilizacao ??
            r?.motivo_mobilizacao ??
            r?.motivo ??
            r?.motivoAcionamento ??
            null,
          problemaIdentificado:
            r?.problemaIdentificado ??
            r?.problema_identificado ??
            r?.problema ??
            null,
          solucaoImediata:
            r?.solucaoImediata ??
            r?.solucao_imediata ??
            r?.acaoImediata ??
            null,
          solucaoDefinitiva:
            r?.solucaoDefinitiva ??
            r?.solucao_definitiva ??
            r?.acaoDefinitiva ??
            null,
        } as AcRow;
      })
      .filter((x: AcRow) => Boolean(x.data));
  };

  const fetchBatch = useCallback(
    async (offset: number, batchLimit: number, signal?: AbortSignal) => {
      const params = new URLSearchParams();
      params.set("mode", "dash");
      params.set("limit", String(batchLimit));
      params.set("offset", String(offset));
      if (start) params.set("start", start);
      if (end) params.set("end", end);

      let res = await fetch(`/api/acionamentos?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
        signal,
      });

      let raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch { }

      if (!res.ok) {
        // fallback sem mode
        const p2 = new URLSearchParams(params);
        p2.delete("mode");

        res = await fetch(`/api/acionamentos?${p2.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal,
        });

        raw = await res.text();
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch { }
      }

      if (!res.ok)
        throw new Error(
          data?.error || raw || `Erro ao carregar (HTTP ${res.status}).`
        );

      return normalizeRows(data);
    },
    [start, end]
  );

  const buildOptionsFromRows = useCallback((rows: AcRow[]) => {
    const uniq = (arr: string[]) =>
      Array.from(new Set(arr.map((x) => clampUpper(x)).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      );

    setClientesList(uniq(rows.map((r) => String(r.cliente ?? "").trim())));
    setUsinasList(uniq(rows.map((r) => String(r.usina ?? "").trim())));
    setEquipamentosList(uniq(rows.map((r) => String(r.equipamento ?? "").trim())));
  }, []);

  const loadAll = useCallback(async () => {
    setMsg(null);
    if (!start || !end)
      return setMsg({ type: "err", text: "Selecione início e fim." });
    if (invalidRange)
      return setMsg({
        type: "err",
        text: "A data inicial não pode ser maior que a data final.",
      });

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setLoadingOptions(true);

    const BATCH = 1000;
    const MAX_ROWS = 60000;

    try {
      const all: AcRow[] = [];
      let off = 0;

      while (true) {
        const batch = await fetchBatch(off, BATCH, ac.signal);
        all.push(...batch);

        if (all.length >= MAX_ROWS) {
          setMsg({
            type: "err",
            text: `Muitos registros (${all.length}+). Limitei em ${MAX_ROWS} por performance.`,
          });
          break;
        }

        if (batch.length < BATCH) break;
        off += BATCH;
      }

      const byDate = all.filter(
        (x) => x.data && inRangeISO(String(x.data).slice(0, 10), start, end)
      );

      byDate.sort((a, b) => {
        const da = a.data || "0000-00-00";
        const db = b.data || "0000-00-00";
        if (da === db) return String(b.id).localeCompare(String(a.id));
        return db.localeCompare(da);
      });

      setAllRows(byDate);
      buildOptionsFromRows(byDate);

      if (byDate.length === 0)
        setMsg({ type: "err", text: "Nenhum acionamento no período selecionado." });
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setAllRows([]);
      setMsg({
        type: "err",
        text: e?.message || "Erro ao carregar acionamentos.",
      });
    } finally {
      setLoading(false);
      setLoadingOptions(false);
    }
  }, [start, end, invalidRange, fetchBatch, buildOptionsFromRows]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // filtros locais
  const filteredRows = useMemo(() => {
    let r = allRows;

    if (start && end)
      r = r.filter(
        (x) => x.data && inRangeISO(String(x.data).slice(0, 10), start, end)
      );

    // cliente select (filtro principal)
    if (cliente)
      r = r.filter(
        (x) => clampUpper(String(x.cliente ?? "")) === clampUpper(cliente)
      );

    // cliente quick (por legenda do gráfico)
    if (clienteQuick)
      r = r.filter(
        (x) => clampUpper(String(x.cliente ?? "")) === clampUpper(clienteQuick)
      );

    if (usina) r = r.filter((x) => includesLoose(x.usina ?? "", usina));

    // equipamento = escolha da base (igual pedido)
    if (equipamento)
      r = r.filter(
        (x) =>
          clampUpper(String(x.equipamento ?? "")) === clampUpper(equipamento)
      );

    if (alarme) r = r.filter((x) => includesLoose(x.alarme ?? "", alarme));

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      r = r.filter((x) => {
        const blob =
          `${x.data} ${x.cliente ?? ""} ${x.usina ?? ""} ${x.ss ?? ""} ${x.equipamento ?? ""} ${x.alarme ?? ""} ` +
          `${x.motivoMobilizacao ?? ""} ${x.problemaIdentificado ?? ""} ${x.solucaoImediata ?? ""} ${x.solucaoDefinitiva ?? ""}`.toLowerCase();
        return blob.includes(q);
      });
    }

    const copy = [...r];
    copy.sort((a, b) => {
      const da = a.data || "0000-00-00";
      const db = b.data || "0000-00-00";
      if (da === db) return String(b.id).localeCompare(String(a.id));
      return db.localeCompare(da);
    });

    return copy;
  }, [allRows, start, end, cliente, clienteQuick, usina, equipamento, alarme, searchText]);

  useEffect(() => setPage(1), [start, end, cliente, clienteQuick, usina, equipamento, alarme, searchText]);

  // tabela
  const count = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(count / limit));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const offset = (pageSafe - 1) * limit;
  const tableRows = filteredRows.slice(offset, offset + limit);

  /* =========================
     GRÁFICOS MELHORES (STACKED)
     segmentação = cliente
  ========================= */
  const stackedByUsina = useMemo(
    () => buildStacked(filteredRows, (r) => safeUpper(r.usina, ""), (r) => safeUpper(r.cliente, "")),
    [filteredRows]
  );
  const stackedByEquip = useMemo(
    () => buildStacked(filteredRows, (r) => safeUpper(r.equipamento, ""), (r) => safeUpper(r.cliente, "")),
    [filteredRows]
  );
  const stackedByAlarm = useMemo(
    () => buildStacked(filteredRows, (r) => safeUpper(r.alarme, ""), (r) => safeUpper(r.cliente, "")),
    [filteredRows]
  );

  // clique em legenda (cliente quick)
  const toggleClienteQuick = useCallback((lbl: string) => {
    setClienteQuick((p) => (clampUpper(p) === clampUpper(lbl) ? "" : lbl));
  }, []);

  // clique em linhas
  const toggleUsina = useCallback((lbl: string) => {
    setUsina((p) => (clampUpper(p) === clampUpper(lbl) ? "" : lbl));
  }, []);
  const toggleEquip = useCallback((lbl: string) => {
    setEquipamento((p) => (clampUpper(p) === clampUpper(lbl) ? "" : lbl));
  }, []);
  const toggleAlarm = useCallback((lbl: string) => {
    setAlarme((p) => (clampUpper(p) === clampUpper(lbl) ? "" : lbl));
  }, []);

  return (
    <section className={UI.page} style={{ background: T.bg, color: T.text }}>
      <div className={UI.container}>
        {/* HEADER */}
        <div
          className={cx(UI.header, "p-4 sm:p-5 rounded-lg")}
          style={{ borderColor: T.border, background: T.card }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className={UI.headerTitle} style={{ color: T.text }}>
                Dashboard de Acionamentos
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill tone="accent">Registros: {count}</Pill>
                <Pill>
                  Período:{" "}
                  {start && end ? `${brDate(start)} → ${brDate(end)}` : "—"}
                </Pill>
                <Pill>Cliente: {cliente ? clampUpper(cliente) : "Todos"}</Pill>
                <Pill>Cliente rápido: {clienteQuick ? clampUpper(clienteQuick) : "Todos"}</Pill>
                <Pill>Usina: {usina ? clampUpper(usina) : "Todas"}</Pill>
                <Pill>
                  Equipamento: {equipamento ? clampUpper(equipamento) : "Todos"}
                </Pill>
                <Pill>Alarme: {alarme ? clampUpper(alarme) : "Todos"}</Pill>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Btn tone="secondary" onClick={loadAll} disabled={loading}>
                <RefreshCw className="w-4 h-4" />
                Recarregar
              </Btn>
            </div>
          </div>
        </div>

        {/* FILTROS */}
        <div
          className={cx(UI.section, "mt-4 rounded-lg")}
          style={{ borderColor: T.border, background: T.card }}
        >
          <div
            className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap"
            style={{ borderColor: T.border }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Pill>Filtros</Pill>

            </div>

            <div className="flex items-center gap-2">
              <Btn tone="secondary" onClick={() => setFiltersOpen((p) => !p)}>
                {filtersOpen ? (
                  <>
                    <ChevronUp className="w-4 h-4" /> Ocultar
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" /> Mostrar
                  </>
                )}
              </Btn>

              <Btn
                tone="secondary"
                onClick={() => {
                  setCliente("");
                  setClienteQuick("");
                  setUsina("");
                  setEquipamento("");
                  setAlarme("");
                  setSearchText("");
                  setPeriodPreset("thisMonth");
                  applyPreset("thisMonth");
                  setMsg(null);
                }}
                disabled={loading}
              >
                Limpar
              </Btn>
            </div>
          </div>

          {filtersOpen && (
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                <div className="lg:col-span-3">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Período
                  </label>
                  <select
                    className={cx(UI.select, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                    value={periodPreset}
                    onChange={(e) => {
                      const v = e.target.value as typeof periodPreset;
                      setPeriodPreset(v);
                      applyPreset(v);
                    }}
                  >
                    <option value="today">Hoje</option>
                    <option value="thisWeek">Semana atual</option>
                    <option value="lastWeek">Semana passada</option>
                    <option value="thisMonth">Este mês</option>
                    <option value="lastMonth">Mês passado</option>
                    <option value="last7">Últimos 7 dias</option>
                    <option value="last30">Últimos 30 dias</option>
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Início
                  </label>
                  <input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className={cx(UI.input, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Fim
                  </label>
                  <input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className={cx(UI.input, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Busca (geral)
                  </label>
                  <div className="mt-1 relative">
                    <input
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className={cx(UI.input, "rounded-md pr-9")}
                      style={{ borderColor: T.border }}
                      placeholder="Ex: ITU, SS 7056, inversor…"
                    />
                    <div
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                      style={{ color: T.text3 }}
                    >
                      <Search className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* CLIENTE (select) */}
                <div className="lg:col-span-4">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Cliente
                  </label>
                  <select
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    className={cx(UI.select, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                  >
                    <option value="">Todos</option>
                    {clientesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* USINA */}
                <div className="lg:col-span-4 relative z-40">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Usina
                  </label>
                  <div className="mt-1">
                    <Autocomplete
                      value={usina}
                      onChange={setUsina}
                      options={usinasList}
                      loading={loadingOptions}
                      placeholder="Buscar usina…"
                    />
                  </div>
                </div>

                {/* EQUIPAMENTO (da base) */}
                <div className="lg:col-span-4 relative z-30">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Equipamento
                  </label>
                  <div className="mt-1">
                    <Autocomplete
                      value={equipamento}
                      onChange={setEquipamento}
                      options={equipamentosList}
                      loading={loadingOptions}
                      placeholder="Selecione um equipamento…"
                      disabled={!equipamentosList.length && !loadingOptions}
                    />
                  </div>

                </div>


                <div className="lg:col-span-8">
                  <MsgBox m={msg} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MAIN */}
        <main className="mt-4 grid gap-4">
          {/* GRÁFICOS — FIXOS, MELHORES, SEM MODOS */}
          <div
            className={cx(UI.section, "p-4 rounded-lg")}
            style={{ borderColor: T.border, background: T.card }}
          >
            <SectionHeader
              title="Resumo por acionamentos"
              hint={
                <>
                  Clique na <b>legenda</b> para filtrar por cliente e clique na <b>linha</b> para filtrar por usina/equipamento/alarme.
                </>
              }
              right={<Pill tone="accent">{count} registros (filtro)</Pill>}
            />

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-4">
                <StackedBarsCard
                  title="Acionamentos por usina"
                  hint={<>Barra segmentada por cliente.</>}
                  groups={stackedByUsina.groups}
                  segs={stackedByUsina.segs}
                  segActive={clienteQuick}
                  onClickSeg={toggleClienteQuick}
                  onClickGroup={toggleUsina}
                  groupActive={usina}
                  searchPlaceholder="Buscar usina no gráfico…"
                  maxSegs={6}
                  maxHeight={2000}
                />
              </div>

              <div className="lg:col-span-4">
                <StackedBarsCard
                  title="Acionamentos por equipamento"
                  hint={<>Barra segmentada por cliente.</>}
                  groups={stackedByEquip.groups}
                  segs={stackedByEquip.segs}
                  segActive={clienteQuick}
                  onClickSeg={toggleClienteQuick}
                  onClickGroup={toggleEquip}
                  groupActive={equipamento}
                  searchPlaceholder="Buscar equipamento no gráfico…"
                  maxSegs={6}
                  maxHeight={2000}
                />
              </div>

              <div className="lg:col-span-4">
                <StackedBarsCard
                  title="Acionamentos por alarme"
                  hint={<>Barra segmentada por cliente.</>}
                  groups={stackedByAlarm.groups}
                  segs={stackedByAlarm.segs}
                  segActive={clienteQuick}
                  onClickSeg={toggleClienteQuick}
                  onClickGroup={toggleAlarm}
                  groupActive={alarme}
                  searchPlaceholder="Buscar alarme no gráfico…"
                  maxSegs={6}
                  maxHeight={2000}
                />
              </div>
            </div>

            {(clienteQuick || usina || equipamento || alarme) && (
              <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="accent">Filtros rápidos</Pill>
                  {clienteQuick ? <Pill>Cliente: {clampUpper(clienteQuick)}</Pill> : null}
                  {usina ? <Pill>Usina: {clampUpper(usina)}</Pill> : null}
                  {equipamento ? <Pill>Equip.: {clampUpper(equipamento)}</Pill> : null}
                  {alarme ? <Pill>Alarme: {clampUpper(alarme)}</Pill> : null}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setClienteQuick("");
                    setUsina("");
                    setEquipamento("");
                    setAlarme("");
                  }}
                  className="inline-flex items-center gap-2 text-[11px] font-semibold underline"
                  style={{ color: T.accent }}
                >
                  <X className="w-3.5 h-3.5" />
                  Limpar filtros rápidos
                </button>
              </div>
            )}
          </div>

          {/* TABELA — MANTIDA COMO ESTAVA */}
          <div
            className={cx(UI.section, "rounded-lg")}
            style={{ borderColor: T.border, background: T.card }}
          >
            <div
              className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap"
              style={{ borderColor: T.border }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Pill>Lista de Acionamentos</Pill>
                <Pill tone="accent">{count}</Pill>
              </div>

              <div className="flex items-center gap-2">
                <Btn
                  tone="secondary"
                  disabled={loading || pageSafe === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Btn>
                <Btn
                  tone="secondary"
                  disabled={loading || pageSafe >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próxima
                </Btn>
              </div>
            </div>

            <div className="p-4">
              {!loading && tableRows.length === 0 && (
                <div
                  className="border rounded-lg p-4 text-sm"
                  style={{
                    borderColor: T.border,
                    background: T.mutedBg,
                    color: T.text2,
                  }}
                >
                  Nenhum registro encontrado para os filtros selecionados.
                </div>
              )}

              {tableRows.length > 0 && (
                <div
                  className="border rounded-lg overflow-hidden"
                  style={{ borderColor: T.border }}
                >
                  <div className="overflow-x-auto">
                    <div className="min-w-[1750px]">
                      <div
                        className="grid grid-cols-12 gap-0 px-3 py-2 text-[11px] font-semibold border-b sticky top-0 z-10"
                        style={{
                          borderColor: T.border,
                          background: "rgba(251,252,253,0.92)",
                          backdropFilter: "blur(6px)",
                          color: T.text2,
                        }}
                      >
                        <div className="col-span-1">Data</div>
                        <div className="col-span-2">Usina</div>
                        <div className="col-span-2">Motivo</div>
                        <div className="col-span-2">Problema Identificado</div>
                        <div className="col-span-2">Solução Imediata</div>
                        <div className="col-span-2">Solução Definitiva</div>
                        <div className="col-span-1">Ordem de Serviço</div>
                      </div>

                      {tableRows.map((r) => (
                        <div
                          key={r.id}
                          className="grid grid-cols-12 gap-0 px-3 py-2 text-sm border-b last:border-b-0 hover:bg-black/[0.02] transition"
                          style={{
                            borderColor: "rgba(17,24,39,0.08)",
                            background: T.card,
                          }}
                        >
                          <div
                            className={cx("text-[11px] col-span-1", UI.mono)}
                            style={{ color: T.text2 }}
                          >
                            {brDate(r.data)}
                          </div>

                          <div className="col-span-2">
                            <button
                              type="button"
                              className="truncate text-left"
                              style={{ color: T.text2 }}
                              onClick={() => toggleUsina(safeUpper(r.usina, ""))}
                              title="Clique para filtrar por esta usina"
                            >
                              {safeText(r.usina).toLowerCase()}
                            </button>
                          </div>

                          <div className="col-span-2">
                            <span
                              className="text-[11px] line-clamp-2"
                              style={{ color: T.text2 }}
                            >
                              {safeText(r.motivoMobilizacao)}
                            </span>
                          </div>

                          <div className="col-span-2">
                            <span
                              className="text-[11px] line-clamp-2"
                              style={{ color: T.text2 }}
                            >
                              {safeText(r.problemaIdentificado)}
                            </span>
                          </div>

                          <div className="col-span-2">
                            <span
                              className="text-[11px] line-clamp-2"
                              style={{ color: T.text2 }}
                            >
                              {safeText(r.solucaoImediata)}
                            </span>
                          </div>

                          <div className="col-span-2">
                            <span
                              className="text-[11px] line-clamp-2"
                              style={{ color: T.text2 }}
                            >
                              {safeText(r.solucaoDefinitiva)}
                            </span>
                          </div>

                          <div className="col-span-1">
                            {typeof r.ss === "number" &&
                              Number.isFinite(r.ss) ? (
                              <a
                                href={ssLink(r.ss)}
                                target="_blank"
                                rel="noreferrer"
                                className={cx(
                                  "text-[11px] inline-flex text-left gap-2 underline",
                                  UI.mono
                                )}
                                style={{ color: T.accent }}
                                title="Abrir SS no Sismetro"
                              >
                                {r.ss}
                              </a>
                            ) : (
                              <span className={UI.mono} style={{ color: T.text3 }}>
                                —
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-[11px]" style={{ color: T.text3 }}>
                  Total (filtro): <span className={UI.mono}>{count}</span> • Página{" "}
                  <span className={UI.mono}>
                    {pageSafe}/{totalPages}
                  </span>
                </div>

                {(cliente || clienteQuick || usina || equipamento || alarme) && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="accent">Filtros ativos</Pill>
                    <button
                      type="button"
                      onClick={() => {
                        setCliente("");
                        setClienteQuick("");
                        setUsina("");
                        setEquipamento("");
                        setAlarme("");
                      }}
                      className="inline-flex items-center gap-2 text-[11px] font-semibold underline"
                      style={{ color: T.accent }}
                    >
                      <X className="w-3.5 h-3.5" />
                      Limpar filtros
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* focus ring + scrollbar */}
      <style jsx global>{`
        input:focus,
        textarea:focus,
        select:focus {
          outline: none !important;
          box-shadow: 0 0 0 2px ${T.accentRing} !important;
        }

        .acion-scroll::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .acion-scroll::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.06);
          border-radius: 999px;
        }
        .acion-scroll::-webkit-scrollbar-thumb {
          background: rgba(17, 24, 39, 0.28);
          border-radius: 999px;
        }
        .acion-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(17, 24, 39, 0.38);
        }
      `}</style>
    </section>
  );
}

/* =========================================================
   NEXT PAGE EXPORT
========================================================= */
export default function Page() {
  return <AcionamentosDashPage />;
}
