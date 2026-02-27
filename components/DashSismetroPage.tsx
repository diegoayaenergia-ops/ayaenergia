// app/sismetro/visualizacao/page.tsx
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
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Eraser,
  FileDown,
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

  errBg: "rgba(239, 68, 68, 0.10)",
  errBd: "rgba(239, 68, 68, 0.30)",
  errTx: "#7F1D1D",
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

  input:
    "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2 min-w-0",
  select:
    "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2 min-w-0",

  cardTitle: "text-xs font-semibold",
  mono: "tabular-nums",
} as const;

/* =========================================================
   HOOK: MOBILE
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
    "whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition active:translate-y-[0.5px]";

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
      : {
          background: T.card,
          borderColor: T.border,
          color: T.text,
        };

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

function FullscreenToggle({
  active,
  compact,
  onToggle,
}: {
  active: boolean;
  compact?: boolean;
  onToggle: () => void;
}) {
  return (
    <Btn
      tone="secondary"
      onClick={onToggle}
      className={cx(compact ? "h-9 px-3 text-xs" : "")}
      title={active ? "Sair da tela cheia" : "Tela cheia"}
    >
      {active ? (
        <Minimize2 className="w-4 h-4" />
      ) : (
        <Maximize2 className="w-4 h-4" />
      )}
    </Btn>
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
      <div className="min-w-0">
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
   FULLSCREEN SHELL (layout “organizado”)
========================================================= */
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
    <div
      className="fixed inset-0 z-[999] flex flex-col"
      style={{
        background: T.bg, // cobre tudo
        color: T.text,
      }}
    >
      {/* TOPBAR */}
      <div
        className="shrink-0 px-4 sm:px-6 py-3 border-b flex items-start sm:items-center justify-between gap-3 flex-wrap"
        style={{ borderColor: T.border, background: T.card }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-sm sm:text-base font-extrabold truncate">
              {title}
            </div>
            {typeof count === "number" ? (
              <Pill tone="accent">{count} registros</Pill>
            ) : null}
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
            <span className="hidden sm:inline">
              {filtersOpen ? "Ocultar filtros" : "Filtros"}
            </span>
          </Btn>

          {actions}

          <Btn
            tone="secondary"
            onClick={onClose}
            className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
            title="Sair da tela cheia"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Fechar</span>
          </Btn>
        </div>
      </div>

      {/* FILTROS (sem overflow aqui pra não cortar autocomplete) */}
      {filtersOpen && (
        <div
          className="shrink-0 border-b"
          style={{ borderColor: T.border, background: T.card }}
        >
          {filters}
        </div>
      )}

      {/* CONTEÚDO (scroll só aqui) */}
      <div className="flex-1 min-h-0 overflow-auto px-4 sm:px-6 py-4">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */
function clampUpper(s: string) {
  return String(s || "").trim().toUpperCase();
}
function yearRangeISO(year: number) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  return { start, end };
}
function monthRangeISO(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const toISO = (x: Date) => {
    const yy = x.getFullYear();
    const mm = String(x.getMonth() + 1).padStart(2, "0");
    const dd = String(x.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };
  return { start: toISO(start), end: toISO(end) };
}
function rangeFromRows(rows: Array<{ data?: string | null }>) {
  const dates = rows
    .map((r) => String(r?.data || "").trim())
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();
  if (!dates.length) return null;
  return { start: dates[0], end: dates[dates.length - 1] };
}
function brDate(iso?: string | null) {
  if (!iso) return "-";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(iso);
  return `${m[3]}/${m[2]}/${m[1]}`;
}
function brDateTimeFromSismetro(dt?: string | null) {
  const s = String(dt || "").trim();
  if (!s) return "-";
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (!m) return s;
  return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}`;
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
function isHttpUrl(s?: string | null) {
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
function toISODateFromSismetro(dateTime?: string | null) {
  const s = String(dateTime || "").trim();
  if (!s) return "";
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}
function ssLink(idSs: number) {
  return `https://br.sismetro.com/indexNEW.php?f=10&e=${encodeURIComponent(
    String(idSs || "")
  )}`;
}
const decodeHtml = (() => {
  if (typeof document === "undefined") return (s: string) => s;
  const el = document.createElement("textarea");
  return (s: string) => {
    el.innerHTML = s;
    return el.value;
  };
})();
function cleanSismetroHtml(raw?: string | null) {
  const s0 = String(raw ?? "").trim();
  if (!s0) return null;
  const withBreaks = s0.replace(/<br\s*\/?>/gi, "\n");
  const noTags = withBreaks.replace(/<\/?[^>]+>/g, "");
  const decoded = decodeHtml(noTags);
  return decoded
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}
function safeText(s?: string | null, fallback = "—") {
  const v = String(s || "").trim();
  return v ? v : fallback;
}
function safeUpper(s?: string | null, fallback = "—") {
  const v = String(s || "").trim();
  return v ? clampUpper(v) : fallback;
}

/* =========================================================
   TYPES
========================================================= */
type SsItem = {
  idSs: number;
  tipoSs?: string | null;
  dataAbertura?: string | null;
  solicitante?: string | null;
  localizacao?: string | null;
  descricaoSs?: string | null;
  evolucao?: string | null;
  status?: string | null;
  url?: string | null;
  tecnicoDesignado?: string | null;
  matriculaTecnicoDesignado?: string | null;
  [k: string]: any;
};

type ApiResp = {
  ok: boolean;
  totalPages?: number;
  count?: number;
  items?: SsItem[];
  error?: string;
};

type Row = {
  id: string;
  idSs: number;
  data: string;
  dataHora?: string | null;

  cliente: string | null;
  usina: string | null;
  tipo: string | null;
  evolucao: string | null;
  status: string | null;
  descricao: string | null;
  url?: string | null;
  conclusaoTexto?: string | null;
  tecnico: string | null;
  tecnicoMatricula?: string | null;
};

function pickConclusao(it: SsItem): { txt: string | null } {
  const txtRaw =
    (it as any).conclusao ??
    (it as any).conclusaoSs ??
    (it as any).descricaoConclusao ??
    null;
  const txt = txtRaw ? String(txtRaw).trim() : null;
  return { txt: txt || null };
}
function normalizeTecnico(it: SsItem): {
  tecnico: string | null;
  matricula: string | null;
} {
  const name = String(it.tecnicoDesignado || "").trim();
  const mat = String(it.matriculaTecnicoDesignado || "").trim();
  return { tecnico: name ? clampUpper(name) : null, matricula: mat ? mat : null };
}

/* =========================================================
   EXPORT HELPERS
========================================================= */
function fileSafeName(s: string) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_");
}
function exportFileBaseName(args: {
  cliente: string;
  start: string;
  end: string;
  usina?: string;
  tipo?: string;
  tecnico?: string;
}) {
  const parts = [
    "SS",
    args.cliente || "TODOS",
    args.start || "SEM_INICIO",
    args.end || "SEM_FIM",
    args.usina ? `USINA_${args.usina}` : "",
    args.tipo ? `TIPO_${args.tipo}` : "",
    args.tecnico ? `TEC_${args.tecnico}` : "",
  ].filter(Boolean);
  return fileSafeName(parts.join("__"));
}
function rowsToExportData(rows: Row[]) {
  return rows.map((r) => ({
    SS: r.idSs,
    "Data/Hora": brDateTimeFromSismetro(r.dataHora || null),
    Cliente: safeUpper(r.cliente),
    Usina: safeUpper(r.usina),
    Tipo: safeUpper(r.tipo),
    Status: safeUpper(r.status),
    Evolucao: safeUpper(r.evolucao),
    Tecnico: safeUpper(r.tecnico),
    Descricao: safeText(r.descricao, ""),
    Conclusao: r.conclusaoTexto ? safeText(r.conclusaoTexto, "") : "",
  }));
}

/* =========================================================
   FILTER RULES + KANBAN + COLORS
========================================================= */
const TIPO_BAN = new Set(["INCONFORMIDADE"]);
const STATUS_BAN = new Set(["EXCLUÍDA", "CANCELADA"]);

const KANBAN_COLS = [
  "AGUARDANDO AGENDAMENTO",
  "EM EXECUÇÃO",
  "PENDENTE",
  "CONCLUÍDO",
] as const;
type KanbanCol = (typeof KANBAN_COLS)[number];

const TYPE_PALETTE = [
  "#115923",
  "#2563EB",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#14B8A6",
  "#F97316",
  "#64748B",
  "#DB2777",
  "#84CC16",
];
const KANBAN_COLORS: Record<KanbanCol, string> = {
  "AGUARDANDO AGENDAMENTO": "#96D9A7",
  "EM EXECUÇÃO": "#5CAE70",
  PENDENTE: "#939598",
  "CONCLUÍDO": "#2E7B41",
};
const TIPO_COLORS: Record<string, string> = {
  PREVENTIVA: "#96D9A7",
  CORRETIVA: "#5CAE70",
  CONTROLE: "#939598",
  "VISITA TÉCNICA": "#2E7B41",
  HANDOVER: "#DBFFE4",
};
function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
function tipoColor(tpRaw?: string | null) {
  const key = clampUpper(String(tpRaw || "SEM TIPO"));
  if (TIPO_COLORS[key]) return TIPO_COLORS[key];
  return TYPE_PALETTE[hashString(key) % TYPE_PALETTE.length];
}
function normalizeKanban(evoRaw?: string | null): KanbanCol | "OUTROS" {
  const e = clampUpper(String(evoRaw || ""));
  if (e === "AGUARDANDO AGENDAMENTO") return "AGUARDANDO AGENDAMENTO";
  if (e === "EM EXECUCAO" || e === "EM EXECUÇÃO" || e.includes("EXECU"))
    return "EM EXECUÇÃO";
  if (e.includes("PENDENTE")) return "PENDENTE";
  if (e === "CONCLUIDO" || e === "CONCLUÍDO" || e.includes("CONCLU"))
    return "CONCLUÍDO";
  return "OUTROS";
}

/* =========================================================
   AUTOCOMPLETE USINA
========================================================= */
function UsinaAutocomplete({
  value,
  onChange,
  options,
  loading,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  loading?: boolean;
  placeholder?: string;
  className?: string;
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
    <div ref={ref} className={cx("relative min-w-0", className)}>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value.toUpperCase());
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
          style={{ borderColor: T.border, color: T.text, boxShadow: "none" }}
        />
        <div
          className="absolute right-2.5 top-1/2 -translate-y-1/2"
          style={{ color: T.text3 }}
        >
          <Search className="w-4 h-4" />
        </div>
      </div>

      {open && (
        <div
          className="absolute z-[300] mt-1 w-full max-h-64 overflow-auto border bg-white shadow-sm rounded-md"
          style={{ borderColor: T.border }}
        >
          {loading && (
            <div className="px-3 py-2 text-xs" style={{ color: T.text3 }}>
              Carregando…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="px-3 py-2 text-xs" style={{ color: T.text3 }}>
              Nenhuma usina
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
   LEGEND PILLS (GRÁFICOS)
========================================================= */
function LegendPills({
  items,
  onClickItem,
  active,
}: {
  items: Array<{ label: string; value?: number; color: string }>;
  onClickItem?: (label: string) => void;
  active?: string;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((it) => {
        const isActive = !!active && clampUpper(active) === clampUpper(it.label);
        return (
          <button
            key={it.label}
            type="button"
            onClick={() => onClickItem?.(it.label)}
            className="inline-flex items-center gap-2 h-7 px-2.5 text-[11px] font-medium border rounded-md transition max-w-full"
            style={{
              borderColor: isActive ? T.accent : T.border,
              background: isActive ? T.accentSoft : T.card,
              color: isActive ? T.accent : T.text2,
              boxShadow: isActive ? `0 0 0 2px ${T.accentRing}` : "none",
            }}
            title={onClickItem ? "Clique para filtrar" : undefined}
          >
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: it.color }}
            />
            <span className="truncate max-w-[220px]">{it.label}</span>
            {typeof it.value === "number" && (
              <>
                <span style={{ color: T.text3 }}>•</span>
                <span
                  className={UI.mono}
                  style={{ fontWeight: 900, color: T.text }}
                >
                  {it.value}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================
   MOBILE CARD (TABELA)
========================================================= */
function MobileSSCard({
  r,
  onFilterUsina,
  onFilterTecnico,
}: {
  r: Row;
  onFilterUsina: () => void;
  onFilterTecnico: () => void;
}) {
  return (
    <div
      className="border rounded-lg p-3"
      style={{ borderColor: T.border, background: T.card }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={ssLink(r.idSs)}
            target="_blank"
            rel="noreferrer"
            className={cx("text-[12px] font-extrabold underline", UI.mono)}
            style={{ color: T.accent }}
          >
            #{r.idSs}
          </a>

          <div className={cx("mt-1 text-[11px]", UI.mono)} style={{ color: T.text3 }}>
            {brDateTimeFromSismetro(r.dataHora || null)}
          </div>
        </div>

        <a
          href={ssLink(r.idSs)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center h-9 w-10 border rounded-md shrink-0"
          style={{ borderColor: T.border, background: T.accentSoft, color: T.accent }}
          title="Abrir SS"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <button
        type="button"
        onClick={onFilterUsina}
        className="mt-2 w-full text-left"
        title="Filtrar por esta usina"
      >
        <div className="text-[12px] font-extrabold truncate" style={{ color: T.text }}>
          {safeUpper(r.usina)}
        </div>
      </button>

      <div className="mt-2 text-[11px] line-clamp-3" style={{ color: T.text2 }}>
        {safeText(r.descricao)}
      </div>

      <div className="mt-2 border rounded-md p-2" style={{ borderColor: T.border, background: T.cardSoft }}>
        <div className="text-[11px] font-semibold" style={{ color: T.text3 }}>
          Conclusão
        </div>
        <div className="mt-1 text-[11px] whitespace-pre-wrap break-words" style={{ color: T.text2 }}>
          {r.conclusaoTexto ? safeUpper(r.conclusaoTexto, "") : "—"}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <span
          className="inline-flex items-center h-6 px-2 text-[11px] font-semibold border rounded-md"
          style={{ borderColor: T.border, background: T.cardSoft, color: T.text2 }}
        >
          {safeText(r.tipo)}
        </span>
        <span
          className="inline-flex items-center h-6 px-2 text-[11px] font-semibold border rounded-md"
          style={{ borderColor: T.border, background: T.cardSoft, color: T.text2 }}
        >
          {safeText(r.status)}
        </span>
      </div>

      <div className="mt-2 flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onFilterTecnico}
          className="text-left min-w-0"
          title="Filtrar por técnico"
        >
          <div className="text-[11px] font-semibold truncate" style={{ color: T.text }}>
            {safeUpper(r.tecnico)}
          </div>
          <div className="text-[11px] truncate" style={{ color: T.text3 }}>
            {safeText(r.evolucao)}
          </div>
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE COMPONENT
========================================================= */
export function SismetroDashPage() {
  const isMobile = useIsMobile(640);

  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const allRowsRef = useRef<Row[]>([]);

  const DEFAULT_CLIENTE = "INEER ENERGIA";

  const [periodPreset, setPeriodPreset] = useState<
    | "thisMonth"
    | "lastMonth"
    | "last30"
    | "last7"
    | "today"
    | "thisYear"
    | "lastYear"
    | "all"
    | "custom"
  >("thisMonth");

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [cliente, setCliente] = useState(clampUpper(DEFAULT_CLIENTE));
  const [usina, setUsina] = useState("");
  const [tipo, setTipo] = useState("");
  const [evolucao, setEvolucao] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [searchText, setSearchText] = useState("");
  const [kanbanFilter, setKanbanFilter] = useState<KanbanCol | "">("");

  const [clientesList, setClientesList] = useState<string[]>([]);
  const [usinasList, setUsinasList] = useState<string[]>([]);
  const [evolucoesList, setEvolucoesList] = useState<string[]>([]);
  const [tecnicosList, setTecnicosList] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [allRows, setAllRows] = useState<Row[]>([]);

  const limit = isMobile ? 8 : 14;
  const [page, setPage] = useState(1);

  const [filtersOpen, setFiltersOpen] = useState(true);
  const [openCharts, setOpenCharts] = useState(true);
  const [openKanban, setOpenKanban] = useState(true);

  type FullTarget = "charts" | "kanban" | "table" | null;
  const [full, setFull] = useState<FullTarget>(null);

  // filtros dentro do fullscreen (sempre abre ao entrar)
  const [fsFiltersOpen, setFsFiltersOpen] = useState(true);

  // export
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  // boot overlay
  const [bootOverlay, setBootOverlay] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setBootOverlay(false), 5000);
    return () => window.clearTimeout(t);
  }, []);

  const applyPreset = useCallback(
    (
      p:
        | "thisMonth"
        | "lastMonth"
        | "last30"
        | "last7"
        | "today"
        | "thisYear"
        | "lastYear"
        | "all"
        | "custom"
    ) => {
      const now = new Date();
      const toISO = (x: Date) => {
        const yy = x.getFullYear();
        const mm = String(x.getMonth() + 1).padStart(2, "0");
        const dd = String(x.getDate()).padStart(2, "0");
        return `${yy}-${mm}-${dd}`;
      };

      if (p === "custom") return;

      if (p === "today") {
        const d = toISO(now);
        setStart(d);
        setEnd(d);
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
        const yr = yearRangeISO(now.getFullYear());
        setStart(yr.start);
        setEnd(yr.end);
        return;
      }
      if (p === "lastYear") {
        const yr = yearRangeISO(now.getFullYear() - 1);
        setStart(yr.start);
        setEnd(yr.end);
        return;
      }
      if (p === "all") {
        const bounds = rangeFromRows(allRowsRef.current);
        if (bounds) {
          setStart(bounds.start);
          setEnd(bounds.end);
        } else {
          const mr = monthRangeISO(now);
          setStart(mr.start);
          setEnd(mr.end);
        }
      }
    },
    []
  );

  useEffect(() => {
    applyPreset("thisMonth");
  }, [applyPreset]);

  const invalidRange = useMemo(() => {
    if (!start || !end) return false;
    const s = new Date(`${start}T00:00:00`);
    const e = new Date(`${end}T00:00:00`);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return false;
    return s.getTime() > e.getTime();
  }, [start, end]);

  // FULLSCREEN: sempre abre filtros e item expandido (shell)
  const toggleFull = useCallback((target: Exclude<FullTarget, null>) => {
    setFull((prev) => {
      const next = prev === target ? null : target;

      if (next) {
        setFsFiltersOpen(true);
        setFiltersOpen(true);
        if (next === "kanban") setOpenKanban(true);
        if (next === "charts") setOpenCharts(true);
      }

      setExportOpen(false);
      return next;
    });
  }, []);

  // fullscreen: trava scroll body e ESC fecha filtros primeiro
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

  // click fora / ESC fecha export menu
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!exportRef.current) return;
      if (!exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExportOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const load = useCallback(async () => {
    setMsg(null);
    setLoading(true);
    setLoadingOptions(true);

    try {
      const res = await fetch("/api/sismetro/ss", {
        method: "GET",
        cache: "no-store",
      });
      const data: ApiResp = await res.json().catch(() => ({} as any));

      if (!res.ok || !data?.ok) {
        setAllRows([]);
        setClientesList([clampUpper(DEFAULT_CLIENTE)]);
        setUsinasList([]);
        setEvolucoesList([]);
        setTecnicosList([]);
        setMsg({ type: "err", text: data?.error || "Erro ao carregar SS." });
        return;
      }

      const items = Array.isArray(data?.items) ? data.items : [];

      const rows: Row[] = items
        .map((it) => {
          const iso = toISODateFromSismetro(it.dataAbertura);
          const tech = normalizeTecnico(it);
          const concl = pickConclusao(it);

          return {
            id: String(it.idSs),
            idSs: Number(it.idSs),
            data: iso || "",
            dataHora: it.dataAbertura || null,

            cliente: it.solicitante ?? null,
            usina: it.localizacao ?? null,
            tipo: it.tipoSs ? clampUpper(it.tipoSs) : null,
            evolucao: it.evolucao ?? null,
            status: it.status ?? null,
            descricao: it.descricaoSs ?? null,
            url: isHttpUrl(it.url) ? String(it.url) : null,
            conclusaoTexto: cleanSismetroHtml(concl.txt),
            tecnico: tech.tecnico,
            tecnicoMatricula: tech.matricula,
          };
        })
        .filter((r) => Boolean(r.idSs));

      const rowsFiltradas = rows.filter((r) => {
        const tipoNorm = clampUpper(String(r.tipo || ""));
        const statusNorm = clampUpper(String(r.status || ""));
        return !TIPO_BAN.has(tipoNorm) && !STATUS_BAN.has(statusNorm);
      });

      rowsFiltradas.sort((a, b) => {
        const da = a.data || "0000-00-00";
        const db = b.data || "0000-00-00";
        if (da === db) return (b.idSs || 0) - (a.idSs || 0);
        return db.localeCompare(da);
      });

      setAllRows(rowsFiltradas);
      allRowsRef.current = rowsFiltradas;

      const cli = Array.from(
        new Set(rowsFiltradas.map((r) => clampUpper(r.cliente || "")).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));

      const us = Array.from(
        new Set(rowsFiltradas.map((r) => clampUpper(r.usina || "")).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));

      const evo = Array.from(
        new Set(rowsFiltradas.map((r) => clampUpper(r.evolucao || "")).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));

      const techs = Array.from(
        new Set(rowsFiltradas.map((r) => clampUpper(r.tecnico || "")).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));

      const ineer = clampUpper(DEFAULT_CLIENTE);
      const cliFixed = cli.includes(ineer) ? cli : [ineer, ...cli];

      setClientesList(cliFixed);
      setUsinasList(us);
      setEvolucoesList(evo);
      setTecnicosList(techs);
    } catch {
      setAllRows([]);
      setMsg({ type: "err", text: "Erro de conexão." });
    } finally {
      setLoading(false);
      setLoadingOptions(false);
    }
  }, [DEFAULT_CLIENTE]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (periodPreset === "all" && allRowsRef.current.length) applyPreset("all");
  }, [periodPreset, applyPreset]);

  const filteredRows = useMemo(() => {
    let r = allRows;

    if (start && end) r = r.filter((x) => x?.data && inRangeISO(String(x.data), start, end));
    if (cliente) r = r.filter((x) => clampUpper(String(x.cliente || "")) === clampUpper(cliente));
    if (usina) r = r.filter((x) => includesLoose(x.usina, usina));
    if (tipo) r = r.filter((x) => clampUpper(String(x.tipo || "")) === clampUpper(tipo));
    if (evolucao) r = r.filter((x) => clampUpper(String(x.evolucao || "")) === clampUpper(evolucao));
    if (tecnico) r = r.filter((x) => clampUpper(String(x.tecnico || "")) === clampUpper(tecnico));
    if (kanbanFilter) r = r.filter((x) => normalizeKanban(x.evolucao) === kanbanFilter);

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      r = r.filter((x) => {
        const blob = `${x.idSs} ${x.cliente || ""} ${x.usina || ""} ${x.tipo || ""} ${x.evolucao || ""} ${x.status || ""} ${x.descricao || ""} ${x.tecnico || ""} ${x.tecnicoMatricula || ""}`.toLowerCase();
        return blob.includes(q);
      });
    }

    const copy = [...r];
    copy.sort((a, b) => {
      const da = a.data || "0000-00-00";
      const db = b.data || "0000-00-00";
      if (da === db) return (b.idSs || 0) - (a.idSs || 0);
      return db.localeCompare(da);
    });
    return copy;
  }, [allRows, start, end, cliente, usina, tipo, evolucao, tecnico, searchText, kanbanFilter]);

  useEffect(() => setPage(1), [start, end, cliente, usina, tipo, evolucao, tecnico, searchText, kanbanFilter, limit]);

  const count = filteredRows.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / limit)), [count, limit]);
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const offset = (pageSafe - 1) * limit;
  const tableRows = useMemo(() => filteredRows.slice(offset, offset + limit), [filteredRows, offset, limit]);

  const kpis = useMemo(() => {
    const total = filteredRows.length;
    const byTipo: Record<string, number> = {};
    const byKanban: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const r of filteredRows) {
      const tp = clampUpper(String(r.tipo || "SEM TIPO"));
      byTipo[tp] = (byTipo[tp] || 0) + 1;

      const kb = normalizeKanban(r.evolucao);
      if (kb !== "OUTROS") byKanban[kb] = (byKanban[kb] || 0) + 1;

      const st = clampUpper(String(r.status || "—"));
      byStatus[st] = (byStatus[st] || 0) + 1;
    }

    const topStatus =
      Object.entries(byStatus).sort((a, b) => (b[1] || 0) - (a[1] || 0))[0]?.[0] || "—";
    return { total, byTipo, byKanban, topStatus };
  }, [filteredRows]);

  const ssByUsinaTipo = useMemo(() => {
    const byUsina: Record<string, { total: number; byTipo: Record<string, number> }> = {};
    for (const r of filteredRows) {
      const u = clampUpper(r.usina || "");
      if (!u) continue;
      const t = clampUpper(String(r.tipo || "SEM TIPO")) || "SEM TIPO";
      if (!byUsina[u]) byUsina[u] = { total: 0, byTipo: {} };
      byUsina[u].total += 1;
      byUsina[u].byTipo[t] = (byUsina[u].byTipo[t] || 0) + 1;
    }

    const usinas = Object.entries(byUsina)
      .sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]))
      .slice(0, 25)
      .map(([usina, obj]) => ({ usina, ...obj }));

    const totalsByTipo: Record<string, number> = {};
    for (const u of usinas) {
      for (const [t, v] of Object.entries(u.byTipo)) totalsByTipo[t] = (totalsByTipo[t] || 0) + v;
    }
    const tipos = Object.keys(totalsByTipo).sort((a, b) => (totalsByTipo[b] || 0) - (totalsByTipo[a] || 0));
    const legends = tipos.map((tp) => ({ label: tp, value: totalsByTipo[tp] || 0, color: tipoColor(tp) }));

    return { tipos, usinas, legends };
  }, [filteredRows]);

  const ssByUsinaEvolucao = useMemo(() => {
    const byUsina: Record<string, { total: number; byEvo: Record<KanbanCol, number> }> = {};
    for (const r of filteredRows) {
      const u = clampUpper(r.usina || "");
      if (!u) continue;

      const k = normalizeKanban(r.evolucao);
      if (k === "OUTROS") continue;

      if (!byUsina[u]) {
        byUsina[u] = {
          total: 0,
          byEvo: {
            "AGUARDANDO AGENDAMENTO": 0,
            "EM EXECUÇÃO": 0,
            PENDENTE: 0,
            "CONCLUÍDO": 0,
          },
        };
      }
      byUsina[u].total += 1;
      byUsina[u].byEvo[k] = (byUsina[u].byEvo[k] || 0) + 1;
    }

    const usinas = Object.entries(byUsina)
      .sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]))
      .slice(0, 25)
      .map(([usina, obj]) => ({ usina, ...obj }));

    const legends = KANBAN_COLS.map((col) => ({
      label: col,
      value: usinas.reduce((acc, u) => acc + (u.byEvo[col] || 0), 0),
      color: KANBAN_COLORS[col],
    }));

    return { cols: [...KANBAN_COLS], usinas, legends };
  }, [filteredRows]);

  const groupedKanban = useMemo(() => {
    const map = new Map<KanbanCol, Row[]>();
    for (const k of KANBAN_COLS) map.set(k, []);

    for (const r of filteredRows) {
      const k = normalizeKanban(r.evolucao);
      if (k === "OUTROS") continue;
      map.get(k)!.push(r);
    }

    for (const k of KANBAN_COLS) {
      map.get(k)!.sort((a, b) => {
        const da = a.data || "0000-00-00";
        const db = b.data || "0000-00-00";
        if (da === db) return (b.idSs || 0) - (a.idSs || 0);
        return db.localeCompare(da);
      });
    }

    return map;
  }, [filteredRows]);

  const toggleTipo = useCallback((v: string) => setTipo((p) => (clampUpper(p) === clampUpper(v) ? "" : clampUpper(v))), []);
  const toggleKanban = useCallback((v: KanbanCol) => setKanbanFilter((p) => (p === v ? "" : v)), []);
  const applyUsinaFromChart = useCallback((u: string) => setUsina((p) => (clampUpper(p) === clampUpper(u) ? "" : clampUpper(u))), []);

  const handleExportExcel = useCallback(async () => {
    setExporting("xlsx");
    setMsg(null);

    try {
      if (!filteredRows.length) {
        setMsg({ type: "err", text: "Não há registros para exportar." });
        return;
      }

      const XLSX = await import("xlsx");

      const data = rowsToExportData(filteredRows);
      const ws = XLSX.utils.json_to_sheet(data);

      ws["!cols"] = [
        { wch: 8 },
        { wch: 18 },
        { wch: 22 },
        { wch: 28 },
        { wch: 14 },
        { wch: 14 },
        { wch: 22 },
        { wch: 22 },
        { wch: 46 },
        { wch: 46 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "SS");

      const base = exportFileBaseName({ cliente, start, end, usina, tipo, tecnico });
      XLSX.writeFile(wb, `${base}.xlsx`);
    } catch (e) {
      console.error("XLSX export error:", e);
      setMsg({ type: "err", text: "Falha ao exportar Excel." });
    } finally {
      setExporting(null);
    }
  }, [filteredRows, cliente, start, end, usina, tipo, tecnico]);

  const handleExportPDF = useCallback(async () => {
    setExporting("pdf");
    setMsg(null);

    try {
      if (!filteredRows.length) {
        setMsg({ type: "err", text: "Não há registros para exportar." });
        return;
      }

      const jsPDFMod: any = await import("jspdf");
      const JsPDFCtor = jsPDFMod.jsPDF || jsPDFMod.default;
      if (!JsPDFCtor) throw new Error("jsPDF não encontrado no módulo.");

      const autoTableMod: any = await import("jspdf-autotable");
      const autoTableFn = autoTableMod.default || autoTableMod.autoTable || autoTableMod;

      const doc = new JsPDFCtor({ orientation: "landscape", unit: "pt", format: "a4" });

      const base = exportFileBaseName({ cliente, start, end, usina, tipo, tecnico });
      const title = `Ordens de Serviço (SS) — Período: ${brDate(start)} - ${brDate(end)}`;
      doc.setFontSize(12);
      doc.text(title, 40, 34);

      const data = rowsToExportData(filteredRows);
      const head = [[
        "SS", "Data/Hora", "Cliente", "Usina", "Tipo", "Status", "Evolucao", "Tecnico", "Descricao", "Conclusao"
      ]];
      const body = data.map((d) => [
        String(d.SS),
        d["Data/Hora"],
        d.Cliente,
        d.Usina,
        d.Tipo,
        d.Status,
        d.Evolucao,
        d.Tecnico,
        d.Descricao,
        d.Conclusao,
      ]);

      const opts: any = {
        head,
        body,
        startY: 46,
        styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" as const },
        headStyles: { fontStyle: "bold" as const },
        margin: { left: 30, right: 30 },
        didDrawPage: () => {
          doc.setFontSize(8);
          doc.text(
            `Página ${doc.getNumberOfPages()}`,
            doc.internal.pageSize.getWidth() - 90,
            doc.internal.pageSize.getHeight() - 18
          );
        },
      };

      if (typeof autoTableFn === "function") autoTableFn(doc, opts);
      else if (typeof (doc as any).autoTable === "function") (doc as any).autoTable(opts);
      else throw new Error("autoTable não disponível.");

      doc.save(`${base}.pdf`);
    } catch (e: any) {
      console.error("PDF export error:", e);
      setMsg({ type: "err", text: `Falha ao exportar PDF: ${String(e?.message || e)}` });
    } finally {
      setExporting(null);
    }
  }, [filteredRows, cliente, start, end, usina, tipo, tecnico]);

  // bloco de filtros (reuso normal + fullscreen)
  const FiltersBody = (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        <div className="lg:col-span-3 min-w-0">
          <label className={UI.label} style={{ color: T.text2 }}>Período</label>
          <select
            className={cx(UI.select, "mt-1 rounded-md min-w-0 w-full")}
            style={{ borderColor: T.border }}
            value={periodPreset}
            onChange={(e) => {
              const v = e.target.value as typeof periodPreset;
              setPeriodPreset(v);
              applyPreset(v);
            }}
          >
            <option value="today">Hoje</option>
            <option value="thisMonth">Este mês</option>
            <option value="lastMonth">Mês passado</option>
            <option value="thisYear">Ano atual</option>
            <option value="lastYear">Ano passado</option>
            <option value="all">Período completo</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        <div className="lg:col-span-3 min-w-0">
          <label className={UI.label} style={{ color: T.text2 }}>Início</label>
          <input
            type="date"
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              setPeriodPreset("custom");
            }}
            className={cx(UI.input, "mt-1 rounded-md w-full min-w-0 appearance-auto")}
            style={{ borderColor: T.border, WebkitAppearance: "auto" as any }}
          />
        </div>

        <div className="lg:col-span-3 min-w-0">
          <label className={UI.label} style={{ color: T.text2 }}>Fim</label>
          <input
            type="date"
            value={end}
            onChange={(e) => {
              setEnd(e.target.value);
              setPeriodPreset("custom");
            }}
            className={cx(UI.input, "mt-1 rounded-md w-full min-w-0 appearance-auto")}
            style={{ borderColor: T.border, WebkitAppearance: "auto" as any }}
          />
        </div>

        <div className="lg:col-span-3 min-w-0">
          <label className={UI.label} style={{ color: T.text2 }}>Busca (geral)</label>
          <div className="mt-1 relative min-w-0">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={cx(UI.input, "rounded-md pr-9")}
              style={{ borderColor: T.border }}
              placeholder="Ex: INVERSOR, UFV - ITU, #7056…"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: T.text3 }}>
              <Search className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 min-w-0">
          <label className={UI.label} style={{ color: T.text2 }}>Cliente (Solicitante)</label>
          <select
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className={cx(UI.select, "mt-1 rounded-md")}
            style={{ borderColor: T.border }}
          >
            <option value={clampUpper(DEFAULT_CLIENTE)}>{clampUpper(DEFAULT_CLIENTE)}</option>
            <option value="">Todos</option>
            {clientesList
              .filter((c) => c !== clampUpper(DEFAULT_CLIENTE))
              .map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
          </select>
        </div>

        <div className="lg:col-span-3 min-w-0">
          <label className={UI.label} style={{ color: T.text2 }}>Usina (Localização)</label>
          <div className="mt-1 min-w-0">
            <UsinaAutocomplete
              value={usina}
              onChange={setUsina}
              options={usinasList}
              loading={loadingOptions}
              placeholder="Buscar usina…"
            />
          </div>
        </div>

        <div className="lg:col-span-3 min-w-0">
          <label className={UI.label} style={{ color: T.text2 }}>Técnico</label>
          <select
            value={tecnico}
            onChange={(e) => setTecnico(e.target.value)}
            className={cx(UI.select, "mt-1 rounded-md")}
            style={{ borderColor: T.border }}
          >
            <option value="">Todos</option>
            {tecnicosList.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3 min-w-0">
          <label className={UI.label} style={{ color: T.text2 }}>Evolução</label>
          <select
            value={evolucao}
            onChange={(e) => setEvolucao(e.target.value)}
            className={cx(UI.select, "mt-1 rounded-md")}
            style={{ borderColor: T.border }}
          >
            <option value="">Todas</option>
            {evolucoesList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3 min-w-0">
          <div className="text-[11px]" style={{ color: invalidRange ? T.errTx : T.text3 }}>
            {invalidRange ? "Data inicial maior que a final." : " "}
          </div>
          <div className="mt-2">
            <MsgBox m={msg} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section className={UI.page} style={{ background: T.bg, color: T.text }}>
      {/* BOOT OVERLAY */}
      {bootOverlay && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          aria-busy="true"
          aria-live="polite"
        >
          <div
            className="absolute inset-0"
            style={{
              background: "rgba(244, 246, 248, 0.72)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          />
          <div
            className="relative border rounded-2xl px-5 py-4 shadow-sm flex items-center gap-3"
            style={{ borderColor: T.border, background: "rgba(255,255,255,0.86)" }}
          >
            <div
              className="h-10 w-10 rounded-xl border flex items-center justify-center"
              style={{ borderColor: T.border, background: T.card }}
            >
              <RefreshCw className="w-5 h-5 animate-spin" style={{ color: T.accent }} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-extrabold" style={{ color: T.text }}>
                Carregando…
              </div>
              <div className="text-xs" style={{ color: T.text3 }}>
                Preparando os dados do Sismetro
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={UI.container}>
        {/* HEADER */}
        <div className={cx(UI.header, "p-4 sm:p-5 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className={UI.headerTitle} style={{ color: T.text }}>
                Ordens de Serviço
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill tone="accent">Registros: {kpis.total}</Pill>
                <Pill>Período: {start && end ? `${brDate(start)} → ${brDate(end)}` : "—"}</Pill>
                <Pill>Cliente: {cliente || "Todos"}</Pill>
                <Pill>Usina: {usina ? clampUpper(usina) : "Todas"}</Pill>
                <Pill>Tipo: {tipo || "Todos"}</Pill>
                <Pill>Técnico: {tecnico || "Todos"}</Pill>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Btn
                tone="secondary"
                onClick={load}
                disabled={loading}
                className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar
              </Btn>
            </div>
          </div>
        </div>

        {/* FILTROS (na própria página) */}
        <div className={cx(UI.section, "mt-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
          <div className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: T.border }}>
            <div className="flex items-center gap-2 flex-wrap">
              <Pill>Filtros</Pill>
              <Pill>{loadingOptions ? "Carregando…" : `${usinasList.length} usinas`}</Pill>
              <Pill>{tecnicosList.length} técnicos</Pill>
            </div>

            <div className="flex items-center gap-2">
              <Btn
                tone="secondary"
                onClick={() => setFiltersOpen((p) => !p)}
                className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                title={filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
              >
                {filtersOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Btn>

              <Btn
                tone="secondary"
                onClick={() => {
                  setCliente(clampUpper(DEFAULT_CLIENTE));
                  setUsina("");
                  setTipo("");
                  setEvolucao("");
                  setTecnico("");
                  setSearchText("");
                  setKanbanFilter("");
                  setPeriodPreset("thisMonth");
                  applyPreset("thisMonth");
                  setMsg(null);
                }}
                disabled={loading}
                className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                title="Limpar filtros"
              >
                <Eraser className="w-4 h-4" />
              </Btn>
            </div>
          </div>

          {filtersOpen && FiltersBody}
        </div>

        {/* MAIN */}
        <main className="mt-4 grid gap-4">
          {/* KANBAN */}
          {(() => {
            const isFull = full === "kanban";
            const kanbanH = 420; // ✅ normal tem altura; fullscreen NÃO

            const content = (
              <div className="py-4">
                {isMobile ? (
                  <div className="grid gap-3">
                    {KANBAN_COLS.map((col) => {
                      const colRows = groupedKanban.get(col) || [];
                      return (
                        <div
                          key={col}
                          className="border rounded-lg overflow-hidden"
                          style={{ borderColor: T.border, background: T.card }}
                        >
                          <div
                            className="px-3 py-2 border-b flex items-center justify-between"
                            style={{ borderColor: "rgba(17,24,39,0.08)", background: T.cardSoft }}
                          >
                            <div className="text-[11px] font-extrabold truncate pr-2" style={{ color: T.text }}>
                              {col}
                            </div>
                            <span
                              className={cx(
                                "inline-flex items-center justify-center h-6 min-w-[34px] px-2 text-[11px] font-extrabold border rounded-md",
                                UI.mono
                              )}
                              style={{ borderColor: T.border, background: T.card, color: T.text }}
                            >
                              {colRows.length}
                            </span>
                          </div>

                          <div
                            className={cx(
                              "p-2 grid gap-2",
                              isFull ? "" : "max-h-[360px] overflow-auto sismetro-scroll"
                            )}
                          >
                            {colRows.length === 0 && (
                              <div className="border rounded-lg p-3 text-xs" style={{ borderColor: T.border, background: T.mutedBg, color: T.text3 }}>
                                Sem Ordens de Serviço no período filtrado.
                              </div>
                            )}

                            {colRows.map((r) => (
                              <div key={r.id} className="border rounded-lg p-3" style={{ borderColor: T.border, background: T.card }}>
                                <div className="min-w-0">
                                  <div className="text-xs font-extrabold truncate" style={{ color: T.text }}>
                                    {safeText(r.usina ? clampUpper(r.usina) : null)}
                                  </div>
                                  <div className={cx("mt-1 text-[11px]", UI.mono)} style={{ color: T.text3 }}>
                                    {brDate(r.data)} •{" "}
                                    <a
                                      href={ssLink(r.idSs)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="underline font-extrabold"
                                      style={{ color: T.accent }}
                                    >
                                      #{r.idSs}
                                    </a>
                                  </div>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span className="inline-flex items-center h-6 px-2 text-[11px] font-semibold border rounded-md" style={{ borderColor: T.border, background: T.cardSoft, color: T.text2 }}>
                                    {safeText(r.tipo)}
                                  </span>
                                  <span className="inline-flex items-center h-6 px-2 text-[11px] font-semibold border rounded-md" style={{ borderColor: T.border, background: T.cardSoft, color: T.text2 }}>
                                    {safeText(r.status)}
                                  </span>
                                </div>

                                <div className="mt-2 text-[11px] truncate" style={{ color: T.text3 }}>
                                  Técnico: <span className={UI.mono}>{safeText(r.tecnico, "-")}</span>
                                </div>

                                <div className="mt-2 text-[11px] line-clamp-3" style={{ color: T.text2 }}>
                                  {safeText(r.descricao)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-x-auto" style={isFull ? undefined : { height: kanbanH }}>
                    <div
                      className={cx("flex gap-4 pr-2", isFull ? "w-full items-start" : "items-start")}
                      style={isFull ? { minWidth: 1200 } : { minWidth: 340 }}
                    >
                      {KANBAN_COLS.map((col) => {
                        const colRows = groupedKanban.get(col) || [];
                        return (
                          <div
                            key={col}
                            className="border rounded-lg overflow-hidden flex flex-col min-w"
                            style={{
                              borderColor: T.border,
                              background: T.card,

                              // ✅ fullscreen: distribui e ocupa a largura
                              flex: isFull ? "1 1 0" : "0 0 auto",
                              width: isFull ? "auto" : 337,
                              minWidth: isFull ? 300 : 335,

                              // ✅ fullscreen: sem limite de altura
                              height: isFull ? "auto" : kanbanH,
                            }}
                          >
                            <div
                              className="px-3 py-2 border-b flex items-center justify-between"
                              style={{ borderColor: "rgba(17,24,39,0.08)", background: T.cardSoft }}
                            >
                              <div className="text-[11px] font-extrabold truncate pr-2" style={{ color: T.text }} title={col}>
                                {col}
                              </div>
                              <span
                                className={cx(
                                  "inline-flex items-center justify-center h-6 min-w-[34px] px-2 text-[11px] font-extrabold border rounded-md",
                                  UI.mono
                                )}
                                style={{ borderColor: T.border, background: T.card, color: T.text }}
                              >
                                {colRows.length}
                              </span>
                            </div>

                            {/* ✅ fullscreen: sem scroll interno (rola a tela). normal: scroll interno */}
                            <div
                              className={cx("p-2 grid gap-2", isFull ? "" : "overflow-auto sismetro-scroll")}
                              style={isFull ? undefined : { flex: 1, minHeight: 0 }}
                            >
                              {colRows.length === 0 && (
                                <div className="border rounded-lg p-3 text-xs" style={{ borderColor: T.border, background: T.mutedBg, color: T.text3 }}>
                                  Sem Ordens de Serviço no período filtrado.
                                </div>
                              )}

                              {colRows.map((r) => (
                                <div key={r.id} className="border rounded-lg p-3" style={{ borderColor: T.border, background: T.card }}>
                                  <div className="min-w-0">
                                    <div className="text-xs font-extrabold truncate" style={{ color: T.text }}>
                                      {safeText(r.usina ? clampUpper(r.usina) : null)}
                                    </div>

                                    <div className={cx("mt-1 text-[11px]", UI.mono)} style={{ color: T.text3 }}>
                                      {brDate(r.data)} •{" "}
                                      <a
                                        href={ssLink(r.idSs)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="underline font-extrabold"
                                        style={{ color: T.accent }}
                                      >
                                        #{r.idSs}
                                      </a>
                                    </div>
                                  </div>

                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center h-6 px-2 text-[11px] font-semibold border rounded-md" style={{ borderColor: T.border, background: T.cardSoft, color: T.text2 }}>
                                      {safeText(r.tipo)}
                                    </span>
                                    <span className="inline-flex items-center h-6 px-2 text-[11px] font-semibold border rounded-md" style={{ borderColor: T.border, background: T.cardSoft, color: T.text2 }}>
                                      {safeText(r.status)}
                                    </span>
                                  </div>

                                  <div className="mt-2 text-[11px] truncate" style={{ color: T.text3 }}>
                                    Técnico: <span className={UI.mono}>{safeText(r.tecnico, "-")}</span>
                                  </div>

                                  <div className="mt-2 text-[11px] line-clamp-3" style={{ color: T.text2 }}>
                                    {safeText(r.descricao)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );

            if (isFull) {
              return (
                <FullscreenShell
                  title="Status"
                  hint={<>Clique no número da SS para abrir no Sistema</>}
                  count={count}
                  filtersOpen={fsFiltersOpen}
                  onToggleFilters={() => setFsFiltersOpen((v) => !v)}
                  onClose={() => setFull(null)}
                  filters={FiltersBody}
                  actions={
                    <Btn
                      tone="secondary"
                      onClick={() => setOpenKanban((p) => !p)}
                      className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
                      title={openKanban ? "Ocultar Kanban" : "Mostrar Kanban"}
                    >
                      {openKanban ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span className="hidden sm:inline">{openKanban ? "Ocultar" : "Mostrar"}</span>
                    </Btn>
                  }
                >
                  {openKanban ? content : (
                    <div className="border rounded-xl p-4 text-sm" style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}>
                      Kanban oculto.
                    </div>
                  )}
                </FullscreenShell>
              );
            }

            return (
              <div className={cx(UI.section, "p-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
                <SectionHeader
                  title="Evolução por Solicitação de Serviço"
                  hint={<>Clique no número da SS para abrir no Sistema</>}
                  right={
                    <div className="flex items-center gap-2 flex-wrap">
                      <Btn
                        tone="secondary"
                        onClick={() => setOpenKanban((p) => !p)}
                        className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                        title={openKanban ? "Ocultar Kanban" : "Mostrar Kanban"}
                      >
                        {openKanban ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Btn>

                      <FullscreenToggle
                        active={false}
                        compact={isMobile}
                        onToggle={() => toggleFull("kanban")}
                      />
                    </div>
                  }
                />
                {openKanban ? content : null}
              </div>
            );
          })()}

          {/* GRÁFICOS */}
          {(() => {
            const isFull = full === "charts";

            const content = (
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Left */}
                <div className="lg:col-span-6 border rounded-lg p-3 min-w-0" style={{ borderColor: T.border, background: T.cardSoft }}>
                  <div className={UI.cardTitle} style={{ color: T.text }}>Tipos de SS por usina</div>
                  <LegendPills items={ssByUsinaTipo.legends} onClickItem={toggleTipo} active={tipo} />

                  <div className="mt-3 grid gap-2">
                    {!ssByUsinaTipo.usinas.length && (
                      <div className="border rounded-lg p-3 text-sm" style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}>
                        Sem dados.
                      </div>
                    )}

                    {ssByUsinaTipo.usinas.map((u) => (
                      <button
                        key={u.usina}
                        type="button"
                        className={cx("text-left border rounded-lg p-3", isMobile ? "grid gap-2" : "flex items-center gap-3")}
                        onClick={() => applyUsinaFromChart(u.usina)}
                        title="Clique para filtrar por usina"
                        style={{ borderColor: "rgba(17,24,39,0.08)", background: T.card }}
                      >
                        <div className={cx("min-w-0", isMobile ? "" : "w-56")}>
                          <div className="text-[12px] font-extrabold truncate" style={{ color: T.text }} title={u.usina}>
                            {u.usina}
                          </div>
                          <div className={cx("text-[11px]", UI.mono)} style={{ color: T.text3 }}>
                            Total: {u.total}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 border rounded-md overflow-hidden flex" style={{ borderColor: T.border, background: T.mutedBg, height: 28 }}>
                          {ssByUsinaTipo.tipos.map((tp) => {
                            const v = u.byTipo[tp] || 0;
                            if (!v) return null;
                            const w = (v / Math.max(1, u.total)) * 100;
                            return <div key={tp} style={{ width: `${w}%`, background: tipoColor(tp) }} title={`${tp}: ${v}`} />;
                          })}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right */}
                <div className="lg:col-span-6 border rounded-lg p-3 min-w-0" style={{ borderColor: T.border, background: T.cardSoft }}>
                  <div className={UI.cardTitle} style={{ color: T.text }}>Evolução por usina</div>
                  <LegendPills items={ssByUsinaEvolucao.legends} onClickItem={(lbl) => toggleKanban(lbl as KanbanCol)} active={kanbanFilter} />

                  <div className="mt-3 grid gap-2">
                    {!ssByUsinaEvolucao.usinas.length && (
                      <div className="border rounded-lg p-3 text-sm" style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}>
                        Sem dados no período selecionado.
                      </div>
                    )}

                    {ssByUsinaEvolucao.usinas.map((u) => (
                      <button
                        key={u.usina}
                        type="button"
                        className={cx("text-left border rounded-lg p-3", isMobile ? "grid gap-2" : "flex items-center gap-3")}
                        onClick={() => applyUsinaFromChart(u.usina)}
                        title="Clique para filtrar por usina"
                        style={{ borderColor: "rgba(17,24,39,0.08)", background: T.card }}
                      >
                        <div className={cx("min-w-0", isMobile ? "" : "w-56")}>
                          <div className="text-[12px] font-extrabold truncate" style={{ color: T.text }} title={u.usina}>
                            {u.usina}
                          </div>
                          <div className={cx("text-[11px]", UI.mono)} style={{ color: T.text3 }}>
                            Total: {u.total}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 border rounded-md overflow-hidden flex" style={{ borderColor: T.border, background: T.mutedBg, height: 28 }}>
                          {ssByUsinaEvolucao.cols.map((col) => {
                            const v = u.byEvo[col] || 0;
                            if (!v) return null;
                            const w = (v / Math.max(1, u.total)) * 100;
                            return <div key={col} style={{ width: `${w}%`, background: KANBAN_COLORS[col] }} title={`${col}: ${v}`} />;
                          })}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );

            if (isFull) {
              return (
                <FullscreenShell
                  title="Resumo por usina"
                  hint={<>Clique nos itens para filtrar (tipo, usina e evolução).</>}
                  count={count}
                  filtersOpen={fsFiltersOpen}
                  onToggleFilters={() => setFsFiltersOpen((v) => !v)}
                  onClose={() => setFull(null)}
                  filters={FiltersBody}
                  // ✅ sem actions: não aparece o botão "Ocultar"
                >
                  {content}
                </FullscreenShell>
              );
            }

            return (
              <div className={cx(UI.section, "p-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
                <SectionHeader
                  title="Resumo por usina"
                  hint={<>Clique nos itens para filtrar (tipo, usina e evolução).</>}
                  right={
                    <div className="flex items-center gap-2 flex-wrap">
                      <Btn
                        tone="secondary"
                        onClick={() => setOpenCharts((p) => !p)}
                        className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                        title={openCharts ? "Ocultar gráficos" : "Mostrar gráficos"}
                      >
                        {openCharts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Btn>

                      <FullscreenToggle active={false} compact={isMobile} onToggle={() => toggleFull("charts")} />
                    </div>
                  }
                />
                {openCharts ? content : null}
              </div>
            );
          })()}

          {/* TABELA (mantida como você enviou) */}
          {(() => {
            const isFull = full === "table";

            const exportMenu = (
              <div ref={exportRef} className="relative">
                <Btn
                  tone="secondary"
                  disabled={loading || exporting !== null || filteredRows.length === 0}
                  onClick={() => setExportOpen((v) => !v)}
                  className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                  title="Exportar"
                >
                  <FileDown className="w-4 h-4" />
                  <span className={cx(isMobile ? "hidden" : "")}>Exportar</span>
                  <ChevronDown className="w-4 h-4" />
                </Btn>

                {exportOpen && (
                  <div
                    className="absolute right-0 mt-2 w-44 border rounded-lg shadow-sm overflow-hidden z-[160]"
                    style={{ borderColor: T.border, background: T.card }}
                  >
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm font-semibold hover:bg-black/[0.03] flex items-center gap-2"
                      style={{ color: T.text }}
                      onClick={() => {
                        setExportOpen(false);
                        handleExportExcel();
                      }}
                      disabled={exporting !== null}
                    >
                      <FileDown className="w-4 h-4" />
                      Excel (.xlsx)
                    </button>

                    <div style={{ height: 1, background: "rgba(17,24,39,0.06)" }} />

                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm font-semibold hover:bg-black/[0.03] flex items-center gap-2"
                      style={{ color: T.text }}
                      onClick={() => {
                        setExportOpen(false);
                        handleExportPDF();
                      }}
                      disabled={exporting !== null}
                    >
                      <FileDown className="w-4 h-4" />
                      PDF
                    </button>
                  </div>
                )}
              </div>
            );

            const tableContent = (
              <div>
                {!loading && tableRows.length === 0 && (
                  <div className="border rounded-lg p-4 text-sm" style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}>
                    Nenhum registro encontrado para os filtros selecionados.
                  </div>
                )}

                {isMobile && tableRows.length > 0 && (
                  <div className="grid gap-2">
                    {tableRows.map((r) => (
                      <MobileSSCard
                        key={r.id}
                        r={r}
                        onFilterUsina={() => applyUsinaFromChart(safeUpper(r.usina))}
                        onFilterTecnico={() =>
                          setTecnico((p) => (clampUpper(p) === safeUpper(r.tecnico) ? "" : safeUpper(r.tecnico, "")))
                        }
                      />
                    ))}
                  </div>
                )}

                {!isMobile && tableRows.length > 0 && (
                  <div className="border rounded-lg overflow-hidden" style={{ borderColor: T.border }}>
                    <div className="overflow-x-auto">
                      <div className="min-w-[1120px]">
                        <div
                          className="px-3 py-2 text-[11px] font-semibold border-b sticky top-0 z-10"
                          style={{
                            borderColor: T.border,
                            background: "rgba(251,252,253,0.92)",
                            backdropFilter: "blur(6px)",
                            color: T.text2,
                            display: "grid",
                            gridTemplateColumns:
                              "90px 160px minmax(280px, 1.4fr) minmax(240px, 1fr) minmax(180px, 0.8fr) 64px",
                            gap: 0,
                          }}
                        >
                          <div>SS</div>
                          <div>Data/Hora</div>
                          <div>Usina + Descrição</div>
                          <div>Conclusão</div>
                          <div>Técnico + Evolução</div>
                          <div>Abrir</div>
                        </div>

                        {tableRows.map((r) => {
                          const tecnicoActive = tecnico && clampUpper(tecnico) === safeUpper(r.tecnico);
                          const usinaActive = usina && clampUpper(usina) === safeUpper(r.usina);

                          return (
                            <div
                              key={r.id}
                              className="px-3 py-2 text-sm border-b last:border-b-0 hover:bg-black/[0.02] transition"
                              style={{
                                borderColor: "rgba(17,24,39,0.08)",
                                background: T.card,
                                display: "grid",
                                gridTemplateColumns:
                                  "90px 160px minmax(280px, 1.4fr) minmax(240px, 1fr) minmax(180px, 0.8fr) 64px",
                                gap: 0,
                              }}
                            >
                              <div>
                                <a
                                  href={ssLink(r.idSs)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cx("font-extrabold", UI.mono)}
                                  style={{ color: T.accent }}
                                  title="Abrir SS no Sismetro"
                                >
                                  #{r.idSs}
                                </a>
                              </div>

                              <div className={UI.mono} style={{ color: T.text2 }}>
                                {brDateTimeFromSismetro(r.dataHora || null)}
                              </div>

                              <div className="min-w-0">
                                <button
                                  type="button"
                                  className="truncate text-left font-semibold max-w-full"
                                  style={{ color: usinaActive ? T.accent : T.text }}
                                  onClick={() => applyUsinaFromChart(safeUpper(r.usina))}
                                  title="Clique para filtrar por esta usina"
                                >
                                  {safeUpper(r.usina)}
                                </button>

                                <div className="text-[11px] line-clamp-2 mt-0.5 whitespace-pre-line" style={{ color: T.text3 }}>
                                  {safeText(r.descricao)}
                                </div>
                              </div>

                              <div className="min-w-0">
                                <div className="text-[11px] mt-0.5 whitespace-pre-wrap break-words" style={{ color: T.text3 }}>
                                  {r.conclusaoTexto ? safeUpper(r.conclusaoTexto, "") : " "}
                                </div>
                              </div>

                              <div className="min-w-0">
                                <button
                                  type="button"
                                  className="text-[11px] mt-0.5 whitespace-pre-wrap break-words"
                                  style={{ color: tecnicoActive ? T.accent : T.text }}
                                  onClick={() =>
                                    setTecnico((p) =>
                                      clampUpper(p) === safeUpper(r.tecnico) ? "" : safeUpper(r.tecnico, "")
                                    )
                                  }
                                  title="Clique para filtrar por este técnico"
                                >
                                  {safeUpper(r.tecnico)}
                                </button>

                                <div className="text-[11px] mt-0.5 whitespace-pre-wrap break-words" style={{ color: T.text3 }}>
                                  {safeText(r.evolucao)}
                                </div>
                              </div>

                              <div className="flex justify-start">
                                <a
                                  href={ssLink(r.idSs)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center h-8 w-9 border rounded-md"
                                  style={{ borderColor: T.border, background: T.accentSoft, color: T.accent }}
                                  title="Abrir SS no Sismetro"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-[11px]" style={{ color: T.text3 }}>
                    Total (filtro): <span className={UI.mono}>{count}</span> registros • Página{" "}
                    <span className={UI.mono}>{pageSafe}/{totalPages}</span>
                  </div>

                  {(tipo || usina || tecnico || kanbanFilter) && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="accent">Filtros via clique ativos</Pill>
                      <button
                        type="button"
                        onClick={() => {
                          setTipo("");
                          setKanbanFilter("");
                          setUsina("");
                          setTecnico("");
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

                {exporting && (
                  <div className="mt-3 text-[11px]" style={{ color: T.text3 }}>
                    Exportando {exporting === "xlsx" ? "Excel" : "PDF"}…
                  </div>
                )}
              </div>
            );

            const actions = (
              <>
                {exportMenu}

                <Btn
                  tone="secondary"
                  disabled={loading || pageSafe === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className={cx(isMobile ? "hidden" : "")}>Anterior</span>
                </Btn>

                <Btn
                  tone="secondary"
                  disabled={loading || pageSafe >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                >
                  <span className={cx(isMobile ? "hidden" : "")}>Próxima</span>
                  <ChevronRight className="w-4 h-4" />
                </Btn>
              </>
            );

            if (isFull) {
              return (
                <FullscreenShell
                  title="Lista de SS"
                  hint={<>Exporta sempre o conjunto filtrado (não só a página).</>}
                  count={count}
                  filtersOpen={fsFiltersOpen}
                  onToggleFilters={() => setFsFiltersOpen((v) => !v)}
                  onClose={() => setFull(null)}
                  filters={FiltersBody}
                  actions={actions}
                >
                  {tableContent}
                </FullscreenShell>
              );
            }

            return (
              <div className={cx(UI.section, "rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
                <div className="px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ borderColor: T.border }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Pill>Lista de SS</Pill>
                    <Pill tone="accent">{count}</Pill>
                  </div>

                  <div className="flex items-center gap-2 justify-between sm:justify-end flex-wrap">
                    {exportMenu}

                    <Btn
                      tone="secondary"
                      disabled={loading || pageSafe === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className={cx(isMobile ? "hidden" : "")}>Anterior</span>
                    </Btn>

                    <Btn
                      tone="secondary"
                      disabled={loading || pageSafe >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={cx(isMobile ? "h-9 px-3 text-xs" : "")}
                    >
                      <span className={cx(isMobile ? "hidden" : "")}>Próxima</span>
                      <ChevronRight className="w-4 h-4" />
                    </Btn>

                    <FullscreenToggle active={false} compact={isMobile} onToggle={() => toggleFull("table")} />
                  </div>
                </div>

                <div className="p-4">{tableContent}</div>
              </div>
            );
          })()}
        </main>
      </div>

      {/* focus ring + scrollbar + iOS date picker */}
      <style jsx global>{`
        input:focus,
        textarea:focus,
        select:focus {
          outline: none !important;
          box-shadow: 0 0 0 2px ${T.accentRing} !important;
        }

        input[type="date"] {
          -webkit-appearance: auto !important;
          appearance: auto !important;
        }

        .sismetro-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .sismetro-scroll::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.06);
          border-radius: 999px;
        }
        .sismetro-scroll::-webkit-scrollbar-thumb {
          background: rgba(17, 24, 39, 0.28);
          border-radius: 999px;
        }
        .sismetro-scroll::-webkit-scrollbar-thumb:hover {
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
  return <SismetroDashPage />;
}