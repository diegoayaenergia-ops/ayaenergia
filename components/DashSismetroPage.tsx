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
  ChevronUp,
  X,
} from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) =>
  p.filter(Boolean).join(" ");

/* =========================================================
   TOKENS (seu padrão)
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

  header: "border bg-white",
  section: "border bg-white",

  headerTitle: "text-base sm:text-lg font-semibold tracking-tight",
  headerSub: "text-xs",
  sectionTitle: "text-sm font-semibold",
  sectionHint: "text-xs",
  label: "text-[11px] font-medium",
  help: "text-[11px]",

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

// ✅ NOVO: range completo baseado nas SS carregadas (min/max)
function rangeFromRows(rows: Array<{ data?: string | null }>) {
  const dates = rows
    .map((r) => String(r?.data || "").trim())
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort(); // ISO => ordena correto

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
// Converte HTML leve do Sismetro em texto seguro
const decodeHtml = (() => {
  if (typeof document === "undefined") return (s: string) => s; // fallback
  const el = document.createElement("textarea");
  return (s: string) => {
    el.innerHTML = s;
    return el.value;
  };
})();

function cleanSismetroHtml(raw?: string | null) {
  const s0 = String(raw ?? "").trim();
  if (!s0) return null;

  // 1) <br> vira quebra de linha
  const withBreaks = s0.replace(/<br\s*\/?>/gi, "\n");

  // 2) remove outras tags
  const noTags = withBreaks.replace(/<\/?[^>]+>/g, "");

  // 3) decodifica entidades (&nbsp;, &amp;, etc.)
  const decoded = decodeHtml(noTags);

  // 4) normaliza espaços (inclui NBSP real \u00A0)
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

function pickConclusao(it: SsItem): { txt: string | null } {
  const txtRaw =
    (it as any).conclusao ??
    (it as any).conclusaoSs ??
    (it as any).descricaoConclusao ??
    null;

  const txt = txtRaw ? String(txtRaw).trim() : null;

  return { txt: txt || null };
}


/* =========================================================
   COLORS
========================================================= */
function pal(i: number) {
  const palette = [
    "rgba(58, 131, 82, 0.78)",
    "rgba(85, 145, 77, 0.62)",
    "rgba(235, 202, 58, 0.95)",
    "rgba(17, 89, 35, 0.38)",
    "rgba(11, 18, 32, 0.34)",
    "rgba(17, 24, 39, 0.28)",
  ];
  return palette[i % palette.length];
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
    <div ref={ref} className={cx("relative", className)}>
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
   TYPES — Sismetro SS
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
  data: string; // ISO YYYY-MM-DD
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

// desconsiderar no dashboard
const TIPO_BAN = new Set(["INCONFORMIDADE"]);
// desconsiderar status no dashboard
const STATUS_BAN = new Set(["EXCLUÍDA", "CANCELADA"]);

// Kanban fixo (só esses 4)
const KANBAN_COLS = [
  "AGUARDANDO AGENDAMENTO",
  "EM EXECUÇÃO",
  "PENDENTE",
  "CONCLUÍDO",
] as const;
type KanbanCol = (typeof KANBAN_COLS)[number];

// Paleta “fixa” para TIPOS (você pode ajustar as cores)
const TYPE_PALETTE = [
  "#115923", // verde (sua cor)
  "#2563EB", // azul
  "#F59E0B", // âmbar
  "#EF4444", // vermelho
  "#8B5CF6", // roxo
  "#14B8A6", // teal
  "#F97316", // laranja
  "#64748B", // slate
  "#DB2777", // pink
  "#84CC16", // lime
];
const KANBAN_COLORS: Record<KanbanCol, string> = {
  "AGUARDANDO AGENDAMENTO": "#96D9A7", // âmbar
  "EM EXECUÇÃO": "#5CAE70", // azul
  "PENDENTE": "#939598", // slate
  "CONCLUÍDO": "#2E7B41", // verde (sua cor)
};
// (Opcional) Overrides: se quiser forçar tipo específico
const TIPO_COLORS: Record<string, string> = {
  "PREVENTIVA": "#96D9A7", // azul
  "CORRETIVA": "#5CAE70", // verde (sua cor)
  "CONTROLE": "#939598", // slate
  "VISITA TÉCNICA": "#2E7B41", // âmbar
  "HANDOVER": "#DBFFE4", // laranja
};

function hashString(s: string) {
  // hash simples, estável
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

function normalizeTecnico(it: SsItem): {
  tecnico: string | null;
  matricula: string | null;
} {
  const name = String(it.tecnicoDesignado || "").trim();
  const mat = String(it.matriculaTecnicoDesignado || "").trim();

  return {
    tecnico: name ? clampUpper(name) : null,
    matricula: mat ? mat : null,
  };
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */
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
        const isActive =
          !!active && clampUpper(active) === clampUpper(it.label);
        return (
          <button
            key={it.label}
            type="button"
            onClick={() => onClickItem?.(it.label)}
            className="inline-flex items-center gap-2 h-7 px-2.5 text-[11px] font-medium border rounded-md transition"
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
            <span className="truncate max-w-[210px]">{it.label}</span>
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
   PAGE COMPONENT
========================================================= */
export function SismetroDashPage() {
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const allRowsRef = useRef<Row[]>([]);

  // ✅ default INEER
  const DEFAULT_CLIENTE = "INEER ENERGIA";

  // filtros
  const [periodPreset, setPeriodPreset] = useState<
    | "thisMonth"
    | "lastMonth"
    | "last30"
    | "last7"
    | "today"
    | "thisYear"   // ✅ novo
    | "lastYear"   // ✅ novo
    | "all"        // ✅ novo
    | "custom"     // ✅ novo (personalizado)
  >("thisMonth");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [cliente, setCliente] = useState(clampUpper(DEFAULT_CLIENTE));
  const [usina, setUsina] = useState("");
  const [tipo, setTipo] = useState("");
  const [evolucao, setEvolucao] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [searchText, setSearchText] = useState("");

  // filtro adicional via gráfico (kanban col)
  const [kanbanFilter, setKanbanFilter] = useState<KanbanCol | "">("");

  // options
  const [clientesList, setClientesList] = useState<string[]>([]);
  const [usinasList, setUsinasList] = useState<string[]>([]);
  const [evolucoesList, setEvolucoesList] = useState<string[]>([]);
  const [tecnicosList, setTecnicosList] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // dados
  const [loading, setLoading] = useState(false);
  const [allRows, setAllRows] = useState<Row[]>([]);

  // paginação tabela
  const limit = 14;
  const [page, setPage] = useState(1);

  // UI
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [openKanban, setOpenKanban] = useState(true);

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

      // ✅ custom não mexe em start/end
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

      // ✅ NOVOS PRESETS
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
          // fallback: este mês (caso ainda não tenha dados carregados)
          const mr = monthRangeISO(now);
          setStart(mr.start);
          setEnd(mr.end);
        }
        return;
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

      // ✅ remove INCONFORMIDADE do dashboard
      // ✅ remove tipos e status indesejados do dashboard
      const rowsFiltradas = rows.filter((r) => {
        const tipoNorm = clampUpper(String(r.tipo || ""));
        const statusNorm = clampUpper(String(r.status || ""));

        return (
          !TIPO_BAN.has(tipoNorm) &&
          !STATUS_BAN.has(statusNorm)
        );
      });

      // ✅ ordena desc por data
      rowsFiltradas.sort((a, b) => {
        const da = a.data || "0000-00-00";
        const db = b.data || "0000-00-00";
        if (da === db) return (b.idSs || 0) - (a.idSs || 0);
        return db.localeCompare(da);
      });

      setAllRows(rowsFiltradas);
      allRowsRef.current = rowsFiltradas;

      // options
      const cli = Array.from(
        new Set(
          rowsFiltradas
            .map((r) => clampUpper(r.cliente || ""))
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b));

      const us = Array.from(
        new Set(
          rowsFiltradas
            .map((r) => clampUpper(r.usina || ""))
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b));

      const evo = Array.from(
        new Set(
          rowsFiltradas
            .map((r) => clampUpper(r.evolucao || ""))
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b));

      const techs = Array.from(
        new Set(
          rowsFiltradas
            .map((r) => clampUpper(r.tecnico || ""))
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b));

      // garante INEER no select
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
    if (periodPreset === "all" && allRowsRef.current.length) {
      applyPreset("all");
    }
  }, [periodPreset, applyPreset]);

  // ✅ FILTROS (inclui kanbanFilter)

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
        const blob = `${x.idSs} ${x.cliente || ""} ${x.usina || ""} ${x.tipo || ""} ${x.evolucao || ""} ${x.status || ""} ${x.descricao || ""
          } ${x.tecnico || ""} ${x.tecnicoMatricula || ""}`.toLowerCase();
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

  useEffect(() => setPage(1), [start, end, cliente, usina, tipo, evolucao, tecnico, searchText, kanbanFilter]);

  const count = filteredRows.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / limit)), [count, limit]);
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const offset = (pageSafe - 1) * limit;
  const tableRows = useMemo(() => filteredRows.slice(offset, offset + limit), [filteredRows, offset, limit]);

  // KPIs
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

    const topStatus = Object.entries(byStatus).sort((a, b) => (b[1] || 0) - (a[1] || 0))[0]?.[0] || "—";
    return { total, byTipo, byKanban, topStatus };
  }, [filteredRows]);

  // Chart A: SS por usina empilhado por tipo (Top 25)
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
    const legends = tipos.map((tp) => ({
      label: tp,
      value: totalsByTipo[tp] || 0,
      color: tipoColor(tp),
    }));


    return { tipos, usinas, legends };
  }, [filteredRows]);

  // Chart B: Por evolução (4 colunas) (Top 25)
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
            CONCLUÍDO: 0,
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

  // ✅ Kanban: TODAS as SS filtradas (sem last20)
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

  // helpers: clique para filtrar
  const toggleTipo = useCallback(
    (v: string) => setTipo((p) => (clampUpper(p) === clampUpper(v) ? "" : clampUpper(v))),
    []
  );
  const toggleKanban = useCallback((v: KanbanCol) => setKanbanFilter((p) => (p === v ? "" : v)), []);
  const applyUsinaFromChart = useCallback(
    (u: string) => setUsina((p) => (clampUpper(p) === clampUpper(u) ? "" : clampUpper(u))),
    []
  );

  return (
    <section className={UI.page} style={{ background: T.bg, color: T.text }}>
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
              <Btn tone="secondary" onClick={load} disabled={loading}>
                <RefreshCw className="w-4 h-4" />
                Recarregar
              </Btn>
            </div>
          </div>
        </div>

        {/* FILTROS */}
        <div className={cx(UI.section, "mt-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
          <div
            className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap"
            style={{ borderColor: T.border }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Pill>Filtros</Pill>
              <Pill>{loadingOptions ? "Carregando…" : `${usinasList.length} usinas`}</Pill>
              <Pill>{tecnicosList.length} técnicos</Pill>
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
                    <option value="thisMonth">Este mês</option>
                    <option value="lastMonth">Mês passado</option>
                    <option value="thisYear">Ano atual</option>
                    <option value="lastYear">Ano passado</option>
                    <option value="all">Período completo</option>
                    {/* <option value="last7">Últimos 7 dias</option>
                    <option value="last30">Últimos 30 dias</option> */}
                    <option value="custom">Personalizado</option>
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Início
                  </label>
                  <input
                    type="date"
                    value={start}
                    onChange={(e) => {
                      setStart(e.target.value);
                      setPeriodPreset("custom");
                    }}
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
                    onChange={(e) => {
                      setEnd(e.target.value);
                      setPeriodPreset("custom"); 
                    }}
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
                      placeholder="Ex: INVERSOR, UFV - ITU, #7056…"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: T.text3 }}>
                      <Search className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Cliente (Solicitante)
                  </label>
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
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="lg:col-span-3 relative z-40">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Usina (Localização)
                  </label>
                  <div className="mt-1">
                    <UsinaAutocomplete
                      value={usina}
                      onChange={setUsina}
                      options={usinasList}
                      loading={loadingOptions}
                      placeholder="Buscar usina…"
                    />
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Técnico
                  </label>
                  <select
                    value={tecnico}
                    onChange={(e) => setTecnico(e.target.value)}
                    className={cx(UI.select, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                  >
                    <option value="">Todos</option>
                    {tecnicosList.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Evolução
                  </label>
                  <select
                    value={evolucao}
                    onChange={(e) => setEvolucao(e.target.value)}
                    className={cx(UI.select, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                  >
                    <option value="">Todas</option>
                    {evolucoesList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <div className="text-[11px]" style={{ color: invalidRange ? T.errTx : T.text3 }}>
                    {invalidRange ? "Data inicial maior que a final." : " "}
                  </div>
                  <div className="mt-2">
                    <MsgBox m={msg} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MAIN */}
        <main className="mt-4 grid gap-4">
          {/* GRÁFICOS */}
          <div className={cx(UI.section, "p-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
            <SectionHeader
              title="Resumo por usina"
              hint={<>Clique nos itens para filtrar (tipo, usina e evolução).</>}
              right={<Pill tone="accent">{count} registros (filtro)</Pill>}
            />

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left: por tipo */}
              <div className="lg:col-span-6 border rounded-lg p-3" style={{ borderColor: T.border, background: T.cardSoft }}>
                <div className={UI.cardTitle} style={{ color: T.text }}>
                  Tipos de SS por usina
                </div>

                <LegendPills items={ssByUsinaTipo.legends} onClickItem={toggleTipo} active={tipo} />

                <div className="mt-3 grid gap-2">
                  {!ssByUsinaTipo.usinas.length && (
                    <div
                      className="border rounded-lg p-3 text-sm"
                      style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}
                    >
                      Sem dados.
                    </div>
                  )}

                  {ssByUsinaTipo.usinas.map((u) => (
                    <button
                      key={u.usina}
                      type="button"
                      className="flex items-center gap-3 text-left"
                      onClick={() => applyUsinaFromChart(u.usina)}
                      title="Clique para filtrar por usina"
                    >
                      <div className="w-56 text-xs truncate" style={{ color: T.text3 }} title={u.usina}>
                        {u.usina}
                      </div>

                      <div
                        className="flex-1 border rounded-md overflow-hidden flex"
                        style={{ borderColor: T.border, background: T.mutedBg, height: 28 }}
                      >
                        {ssByUsinaTipo.tipos.map((tp) => {
                          const v = u.byTipo[tp] || 0;
                          if (!v) return null;
                          const w = (v / Math.max(1, u.total)) * 100;

                          return (
                            <div
                              key={tp}
                              style={{ width: `${w}%`, background: tipoColor(tp) }}
                              title={`${tp}: ${v}`}
                            />
                          );
                        })}


                      </div>

                      <div className={cx("w-12 text-xs text-right", UI.mono)} style={{ color: T.text, fontWeight: 900 }}>
                        {u.total}
                      </div>
                    </button>
                  ))}
                </div>

                {usina && (
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Pill tone="accent">Filtro por usina: {safeUpper(usina)}</Pill>
                    <button
                      type="button"
                      onClick={() => setUsina("")}
                      className="inline-flex items-center gap-2 text-[11px] font-semibold underline"
                      style={{ color: T.accent }}
                    >
                      <X className="w-3.5 h-3.5" />
                      Remover filtro
                    </button>
                  </div>
                )}
              </div>

              {/* Right: por evolução/kanban */}
              <div className="lg:col-span-6 border rounded-lg p-3" style={{ borderColor: T.border, background: T.cardSoft }}>
                <div className={UI.cardTitle} style={{ color: T.text }}>
                  Evolução por usina
                </div>

                <LegendPills
                  items={ssByUsinaEvolucao.legends}
                  onClickItem={(lbl) => toggleKanban(lbl as KanbanCol)}
                  active={kanbanFilter}
                />

                <div className="mt-3 grid gap-2">
                  {!ssByUsinaEvolucao.usinas.length && (
                    <div
                      className="border rounded-lg p-3 text-sm"
                      style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}
                    >
                      Sem dados no período selecionado.
                    </div>
                  )}

                  {ssByUsinaEvolucao.usinas.map((u) => (
                    <button
                      key={u.usina}
                      type="button"
                      className="flex items-center gap-3 text-left"
                      onClick={() => applyUsinaFromChart(u.usina)}
                      title="Clique para filtrar por usina"
                    >
                      <div className="w-56 text-xs truncate" style={{ color: T.text3 }} title={u.usina}>
                        {u.usina}
                      </div>

                      <div
                        className="flex-1 border rounded-md overflow-hidden flex"
                        style={{ borderColor: T.border, background: T.mutedBg, height: 28 }}
                      >
                        {ssByUsinaEvolucao.cols.map((col, i) => {
                          const v = u.byEvo[col] || 0;
                          if (!v) return null;
                          const w = (v / Math.max(1, u.total)) * 100;
                          return (
                            <div
                              key={col}
                              style={{ width: `${w}%`, background: KANBAN_COLORS[col] }}
                              title={`${col}: ${v}`}
                            />
                          );

                        })}
                      </div>

                      <div className={cx("w-12 text-xs text-right", UI.mono)} style={{ color: T.text, fontWeight: 900 }}>
                        {u.total}
                      </div>
                    </button>
                  ))}
                </div>

                {kanbanFilter && (
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Pill tone="accent">Filtro: {kanbanFilter}</Pill>
                    <button
                      type="button"
                      onClick={() => setKanbanFilter("")}
                      className="inline-flex items-center gap-2 text-[11px] font-semibold underline"
                      style={{ color: T.accent }}
                    >
                      <X className="w-3.5 h-3.5" />
                      Remover filtro
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KANBAN — TODAS SS */}
          <div className={cx(UI.section, "rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
            <div
              className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap"
              style={{ borderColor: T.border }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Pill tone="accent">{filteredRows.length} registros</Pill>
              </div>

              <Btn tone="secondary" onClick={() => setOpenKanban((p) => !p)}>
                {openKanban ? "Ocultar" : "Mostrar"}
              </Btn>
            </div>

            {openKanban && (
              <div className="p-4">
                <div className="overflow-x-auto" style={{ height: 400 }}>
                  <div className="flex gap-4 pr-2" style={{ minWidth: 400 }}>
                    {KANBAN_COLS.map((col) => {
                      const colRows = groupedKanban.get(col) || [];

                      return (
                        <div
                          key={col}
                          className="border rounded-lg overflow-hidden flex flex-col"
                          style={{
                            borderColor: T.border,
                            background: T.card,
                            width: 330,
                            flex: "0 0 auto",
                            height: 400,
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

                          <div className="p-2 grid gap-2 overflow-auto sismetro-scroll" style={{ flex: 1, minHeight: 0 }}>
                            {colRows.length === 0 && (
                              <div
                                className="border rounded-lg p-3 text-xs"
                                style={{ borderColor: T.border, background: T.mutedBg, color: T.text3 }}
                              >
                                Sem Ordens de Serviço no periodo filtrado.
                              </div>
                            )}

                            {colRows.map((r) => (
                              <div key={r.id} className="border rounded-lg p-3" style={{ borderColor: T.border, background: T.card }}>
                                <div className="flex items-start justify-between gap-2">
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

                                <div className="mt-2 text-[11px] truncate" style={{ color: T.text3 }}>
                                  Técnico:{" "}
                                  <span className={UI.mono} style={{ color: T.text3 }}>
                                    {safeText(r.tecnico, "-")}
                                  </span>
                                  {r.tecnicoMatricula ? (
                                    <span className={cx("ml-2", UI.mono)} style={{ color: T.text }}>
                                      • {r.tecnicoMatricula}
                                    </span>
                                  ) : null}
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
              </div>
            )}
          </div>

          {/* TABELA */}
          <div className={cx(UI.section, "rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
            <div
              className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap"
              style={{ borderColor: T.border }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Pill>Lista de SS</Pill>
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
                  style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}
                >
                  Nenhum registro encontrado para os filtros selecionados.
                </div>
              )}

              {tableRows.length > 0 && (
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: T.border }}>
                  <div className="overflow-x-auto">
                    <div className="min-w-[1120px]">
                      {/* HEADER */}
                      <div
                        className="grid grid-cols-20 gap-0 px-3 py-2 text-[11px] font-semibold border-b sticky top-0 z-10"
                        style={{
                          borderColor: T.border,
                          background: "rgba(251,252,253,0.92)",
                          backdropFilter: "blur(6px)",
                          color: T.text2,
                        }}
                      >
                        <div className="col-span-2">SS</div>
                        <div className="col-span-3">Data/Hora</div>
                        <div className="col-span-6">Usina + Descrição</div>
                        <div className="col-span-5">Conclusão</div>
                        <div className="col-span-3">Técnico + Evolução</div>
                        <div className="col-span-1">Abrir</div>
                        {/* <div className="col-span-1 text-right">Abrir</div> */}
                      </div>

                      {/* ROWS */}
                      {tableRows.map((r) => {
                        const tecnicoActive = tecnico && clampUpper(tecnico) === safeUpper(r.tecnico);
                        const usinaActive = usina && clampUpper(usina) === safeUpper(r.usina);

                        return (
                          <div
                            key={r.id}
                            className="grid grid-cols-20 gap-0 px-3 py-2 text-sm border-b last:border-b-0 hover:bg-black/[0.02] transition"
                            style={{ borderColor: "rgba(17,24,39,0.08)", background: T.card }}
                          >
                            {/* SS */}
                            <div className="col-span-2">
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

                              {/* <div className="text-[11px] mt-0.5 flex flex-wrap gap-1" style={{ color: T.text3 }}>
                                <span className="truncate max-w-[140px]" title={safeText(r.evolucao)}>
                                  {safeText(r.evolucao)}
                                </span>
                                <span>•</span>
                                <span className="font-semibold" title={safeText(r.tipo)}>
                                  {safeText(r.tipo)}
                                </span>
                              </div> */}
                            </div>

                            {/* Data/Hora */}
                            <div className={cx("col-span-3", UI.mono)} style={{ color: T.text2 }}>
                              {brDateTimeFromSismetro(r.dataHora || null)}
                            </div>

                            {/* Usina + Descrição */}
                            <div className="col-span-6 min-w-0">
                              <button
                                type="button"
                                className="truncate text-left font-semibold max-w-full"
                                style={{ color: usinaActive ? T.accent : T.text }}
                                onClick={() => applyUsinaFromChart(safeUpper(r.usina))}
                                title="Clique para filtrar por esta usina"
                              >
                                {safeUpper(r.usina)}
                              </button>

                              <div
                                className="text-[11px] line-clamp-2 mt-0.5 whitespace-pre-line"
                                style={{ color: T.text3 }}
                                title={safeText(r.descricao, "")}
                              >
                                {safeText(r.descricao)}
                              </div>
                            </div>

                            {/* Conclusão */}
                            <div className="col-span-5 min-w-0">

                              <div
                                className="text-[11px] mt-0.5 whitespace-pre-wrap break-words"
                                style={{ color: T.text3 }}
                                title={r.conclusaoTexto ? String(r.conclusaoTexto) : undefined}
                              >
                                {r.conclusaoTexto ? safeUpper(r.conclusaoTexto, "") : " "}
                              </div>
                            </div>

                            {/* Técnico */}
                            <div className="col-span-3 min-w-0">
                              <button
                                type="button"
                                className="text-[11px] mt-0.5 whitespace-pre-wrap break-words"
                                style={{ color: tecnicoActive ? T.accent : T.text }}
                                onClick={() =>
                                  setTecnico((p) => (clampUpper(p) === safeUpper(r.tecnico) ? "" : safeUpper(r.tecnico, "")))
                                }
                                title="Clique para filtrar por este técnico"
                              >
                                {safeUpper(r.tecnico)}
                              </button>

                              <div className="text-[11px] mt-0.5 whitespace-pre-wrap break-words" style={{ color: T.text3 }}>
                                <span className="truncate max-w-[140px]" title={safeText(r.evolucao)}>
                                  {safeText(r.evolucao)}
                                </span>

                              </div>

                            </div>

                            {/* Abrir */}
                            <div className="col-span-1 flex justify-start">
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
                  <span className={UI.mono}>
                    {pageSafe}/{totalPages}
                  </span>
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
            </div>
          </div>
        </main>
      </div>

      {/* focus ring + scrollbar estilo print */}
      <style jsx global>{`
        input:focus,
        textarea:focus,
        select:focus {
          outline: none !important;
          box-shadow: 0 0 0 2px ${T.accentRing} !important;
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
