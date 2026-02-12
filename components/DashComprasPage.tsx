// app/financeiro/visualizacao/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Search, RefreshCw, ExternalLink, Filter } from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

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

  input: "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2",
  select: "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2",
} as const;

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

  return (
    <button
      className={cx(base, className)}
      disabled={disabled || loading}
      style={
        tone === "primary"
          ? { background: T.accent, borderColor: "rgba(17, 89, 35, 0.45)", color: "#fff" }
          : { background: T.card, borderColor: T.border, color: T.text }
      }
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

function Pill({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center h-7 px-2.5 text-[11px] font-medium border rounded-md"
      style={{ borderColor: T.border, background: T.cardSoft, color: T.text2 }}
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
function brDate(iso?: string | null) {
  if (!iso) return "-";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(iso);
  return `${m[3]}/${m[2]}/${m[1]}`;
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
function formatBRL(n?: number | null) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "-";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  const names = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const idx = Math.max(1, Math.min(12, Number(m))) - 1;
  return `${names[idx]} ${y}`;
}
function isoMonth(iso: string) {
  return String(iso || "").slice(0, 7);
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
function fmtCompraId(v?: number | string | null) {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return `${String(n).padStart(4, "0")}`;
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

function canShowComprovante(r: Row) {
  return (
    String(r.status_aya || "") === "PAGAMENTO EFETUADO" &&
    isHttpUrl(r.nota_fiscal)
  );
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
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: T.text3 }}>
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
                  fontWeight: i === highlight ? 600 : 400,
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
   TYPES
========================================================= */
type Row = {
  id: string;
  id_compra?: number | string | null; // ✅ ADD
  created_at?: string | null;
  data: string;
  cliente: string | null;
  usina: string | null;
  impacto: string | null;
  servico: string | null;
  valor: number | null;
  status_cliente: string | null;
  status_aya: string | null;
  forma_de_pag: string | null;
  bdi: number | null;
  nota_fiscal?: string | null;
};


type DashResponse = {
  ok: boolean;
  total?: number;
  resumo_status_aya?: Record<string, number>;
  resumo_status_cliente?: Record<string, number>;
  fluxo_mensal?: Record<string, number>;
  lista?: Row[];
  error?: string;
};

export function ComprasDashPage() {
  const CLIENTES = ["INEER", "KAMAI", "ÉLIS"] as const;

  const STATUS_AYA = ["PENDENTE APROVAÇÃO", "APROVADO", "PAGAMENTO EFETUADO", "REPROVADO", "CANCELADO"] as const;
  const STATUS_CLIENTE = ["REEMBOLSO PENDENTE", "REEMBOLSO EFETUADO"] as const;

  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // filtros
  const [periodPreset, setPeriodPreset] = useState<"thisMonth" | "lastMonth" | "last30" | "last7" | "today">("thisMonth");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [cliente, setCliente] = useState("");
  const [usina, setUsina] = useState("");
  const [statusAya, setStatusAya] = useState("");
  const [statusCliente, setStatusCliente] = useState("");

  // usinas
  const [usinasList, setUsinasList] = useState<string[]>([]);
  const [usinasLoading, setUsinasLoading] = useState(false);

  // dados
  const [loading, setLoading] = useState(false);
  const [allRows, setAllRows] = useState<Row[]>([]);

  // paginação tabela (client-side)
  const limit = 14;
  const [page, setPage] = useState(1);

  // UI
  const [openAya, setOpenAya] = useState(true);
  const [openCliente, setOpenCliente] = useState(true);

  const applyPreset = (p: typeof periodPreset) => {
    const now = new Date();
    const toISO = (x: Date) => {
      const yy = x.getFullYear();
      const mm = String(x.getMonth() + 1).padStart(2, "0");
      const dd = String(x.getDate()).padStart(2, "0");
      return `${yy}-${mm}-${dd}`;
    };

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
  };

  useEffect(() => {
    applyPreset("thisMonth");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invalidRange = useMemo(() => {
    const s = start ? new Date(`${start}T00:00:00`) : null;
    const e = end ? new Date(`${end}T00:00:00`) : null;
    if (!s || !e) return false;
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return false;
    return s.getTime() > e.getTime();
  }, [start, end]);

  const load = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/compras/dash", { method: "GET" });
      const data: DashResponse = await res.json().catch(() => ({} as any));
      if (!res.ok || !data?.ok) return setMsg({ type: "err", text: data?.error || "Erro ao carregar dashboard." });

      const list = Array.isArray(data?.lista) ? (data.lista as Row[]) : [];
      setAllRows(list);

      setUsinasLoading(true);
      const u = Array.from(new Set(list.map((r) => clampUpper(r.usina || "")).filter(Boolean))).sort((a, b) => a.localeCompare(b));
      setUsinasList(u);
      setUsinasLoading(false);

      // setMsg({ type: "ok", text: "Dados carregados ✅" });
    } catch {
      setMsg({ type: "err", text: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // aplica filtros no FRONT
  const filteredRows = useMemo(() => {
    let r = allRows;

    if (start && end) r = r.filter((x) => x?.data && inRangeISO(String(x.data), start, end));
    if (cliente) r = r.filter((x) => String(x.cliente || "") === String(cliente));
    if (usina) r = r.filter((x) => includesLoose(x.usina, usina));
    if (statusAya) r = r.filter((x) => String(x.status_aya || "") === String(statusAya));
    if (statusCliente) r = r.filter((x) => String(x.status_cliente || "") === String(statusCliente));

    return r;
  }, [allRows, start, end, cliente, usina, statusAya, statusCliente]);

  // reset page quando filtro mudar
  useEffect(() => {
    setPage(1);
  }, [start, end, cliente, usina, statusAya, statusCliente]);

  const count = filteredRows.length;

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / limit)), [count, limit]);
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const offset = (pageSafe - 1) * limit;

  const tableRows = useMemo(() => filteredRows.slice(offset, offset + limit), [filteredRows, offset, limit]);

  // dashboard (baseado nos filtrados)
  const dash = useMemo(() => {
    const byMonth: Record<string, number> = {};
    for (const r of filteredRows) {
      const v = Number(r.valor) || 0;
      const m = r.data ? isoMonth(r.data) : "";
      if (m) byMonth[m] = (byMonth[m] || 0) + v;
    }
    return { byMonth };
  }, [filteredRows]);

  const monthSeries = useMemo(() => {
    const entries = Object.entries(dash.byMonth || {});
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    const vals = entries.map(([, v]) => Number(v || 0));
    const max = Math.max(1, ...vals);
    return entries.map(([k, v]) => ({
      key: k,
      label: monthLabel(k),
      value: Number(v || 0),
      pct: (Number(v || 0) / max) * 100,
    }));
  }, [dash.byMonth]);

  const groupedAya = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const s of STATUS_AYA) map.set(s, []);
    map.set("OUTROS", []);
    for (const r of filteredRows) {
      const s = String(r.status_aya ?? "PENDENTE APROVAÇÃO");
      if (map.has(s)) map.get(s)!.push(r);
      else map.get("OUTROS")!.push(r);
    }
    return map;
  }, [filteredRows, STATUS_AYA]);

  const groupedCliente = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const s of STATUS_CLIENTE) map.set(s, []);
    map.set("OUTROS", []);
    for (const r of filteredRows) {
      const s = String(r.status_cliente ?? "REEMBOLSO PENDENTE");
      if (map.has(s)) map.get(s)!.push(r);
      else map.get("OUTROS")!.push(r);
    }
    return map;
  }, [filteredRows, STATUS_CLIENTE]);

  const totalValue = useMemo(() => filteredRows.reduce((acc, r) => acc + (Number(r.valor) || 0), 0), [filteredRows]);

  return (
    <section className={UI.page} style={{ background: T.bg, color: T.text }}>
      <div className={UI.container}>
        {/* HEADER */}
        <div className={cx(UI.header, "p-4 sm:p-5 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className={UI.headerTitle} style={{ color: T.text }}>
                Visualização
              </div>
              <div className={cx(UI.headerSub, "mt-1")} style={{ color: T.text3 }}>
                Separação por <span style={{ color: T.text2, fontWeight: 600 }}>status AYA</span> e{" "}
                <span style={{ color: T.text2, fontWeight: 600 }}>status do cliente</span>, fluxo mensal e tabela.
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill>Período: {start && end ? `${brDate(start)} → ${brDate(end)}` : "—"}</Pill>
                <Pill>Cliente: {cliente || "Todos"}</Pill>
                <Pill>Usina: {usina ? clampUpper(usina) : "Todas"}</Pill>
                <Pill>Total: {formatBRL(totalValue)}</Pill>
                <Pill>
                  Página {pageSafe}/{totalPages}
                </Pill>
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

        {/* FILTROS HORIZONTAIS (top) */}
        <div className={cx(UI.section, "mt-4 p-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className={UI.sectionTitle} style={{ color: T.text }}>
                Filtros
              </div>
              <div className={cx(UI.sectionHint, "mt-1")} style={{ color: T.text3 }}>
                Ajusta e atualiza tudo.
              </div>
            </div>
            <Pill>{usinasLoading ? "Carregando…" : `${usinasList.length} usinas`}</Pill>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            {/* Período preset */}
            <div className="lg:col-span-3">
              <label className={UI.label} style={{ color: T.text2 }}>
                Período
              </label>
              <select
                className={cx(UI.select, "mt-1 rounded-md")}
                style={{ borderColor: T.border }}
                value={periodPreset}
                onChange={(e) => {
                  const v = e.target.value as any;
                  setPeriodPreset(v);
                  applyPreset(v);
                }}
              >
                <option value="today">Hoje</option>
                <option value="thisMonth">Este mês</option>
                <option value="lastMonth">Mês passado</option>
                <option value="last7">Últimos 7 dias</option>
                <option value="last30">Últimos 30 dias</option>
              </select>
            </div>

            {/* Datas */}
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

            {/* Cliente */}
            <div className="lg:col-span-3">
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
                {CLIENTES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Usina */}
            <div className="lg:col-span-3 relative z-40">
              <label className={UI.label} style={{ color: T.text2 }}>
                Usina
              </label>
              <div className="mt-1">
                <UsinaAutocomplete
                  value={usina}
                  onChange={setUsina}
                  options={usinasList}
                  loading={usinasLoading}
                  placeholder="Buscar usina…"
                />
              </div>
              <div className={cx(UI.help, "mt-1")} style={{ color: T.text3 }}>
                ↑ ↓ Enter • Esc
              </div>
            </div>

            {/* Status AYA */}
            <div className="lg:col-span-3">
              <label className={UI.label} style={{ color: T.text2 }}>
                Status AYA
              </label>
              <select
                value={statusAya}
                onChange={(e) => setStatusAya(e.target.value)}
                className={cx(UI.select, "mt-1 rounded-md")}
                style={{ borderColor: T.border }}
              >
                <option value="">Todos</option>
                {STATUS_AYA.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Cliente */}
            <div className="lg:col-span-3">
              <label className={UI.label} style={{ color: T.text2 }}>
                Status Cliente
              </label>
              <select
                value={statusCliente}
                onChange={(e) => setStatusCliente(e.target.value)}
                className={cx(UI.select, "mt-1 rounded-md")}
                style={{ borderColor: T.border }}
              >
                <option value="">Todos</option>
                {STATUS_CLIENTE.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="lg:col-span-3 flex items-end justify-end gap-2 py-6">
              {/* <Btn
                tone="secondary"
                onClick={() => {
                  if (!start || !end) return setMsg({ type: "err", text: "Selecione um período (início e fim)." });
                  if (invalidRange) return setMsg({ type: "err", text: "A data inicial não pode ser maior que a data final." });
                  setMsg({ type: "ok", text: "Filtros aplicados ✅" });
                }}
                disabled={loading}
                className="w-full"
              >
                <Filter className="w-4 h-4" />
                Aplicar
              </Btn> */}

              <Btn
                tone="secondary"
                onClick={() => {
                  setCliente("");
                  setUsina("");
                  setStatusAya("");
                  setStatusCliente("");
                  setPeriodPreset("thisMonth");
                  applyPreset("thisMonth");
                  setMsg(null);
                }}
                disabled={loading}
                className="w-full"
              >
                Limpar
              </Btn>
            </div>
          </div>

          {invalidRange && (
            <div className="mt-2 text-[11px]" style={{ color: T.errTx }}>
              Data inicial maior que a final.
            </div>
          )}

          <div className="mt-3">
            <MsgBox m={msg} />
          </div>
        </div>

        {/* MAIN */}
        <main className="mt-4 grid gap-4">
          {/* FLUXO MENSAL */}
          <div className={cx(UI.section, "p-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className={UI.sectionTitle} style={{ color: T.text }}>
                  Fluxo mensal
                </div>
                <div className={cx(UI.sectionHint, "mt-1")} style={{ color: T.text3 }}>
                  Soma de valores por mês (conforme filtros).
                </div>
              </div>
              <Pill>{monthSeries.length ? `${monthSeries.length} meses` : "—"}</Pill>
            </div>

            <div className="mt-4 grid gap-2">
              {!monthSeries.length && (
                <div className="border rounded-lg p-4 text-sm" style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}>
                  Sem dados para o período.
                </div>
              )}

              {monthSeries.map((m) => (
                <div key={m.key} className="flex items-center gap-3">
                  <div className="w-28 text-xs" style={{ color: T.text3 }}>
                    {m.label}
                  </div>
                  <div className="flex-1 border rounded-md overflow-hidden" style={{ borderColor: T.border, background: T.mutedBg }}>
                    <div
                      className="h-8"
                      style={{
                        width: `${Math.max(2, Math.min(100, m.pct))}%`,
                        background: "rgba(17, 89, 35, 0.75)",
                      }}
                    />
                  </div>
                  <div className="w-28 text-xs text-right" style={{ color: T.text2, fontWeight: 600 }}>
                    {formatBRL(m.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KANBAN AYA */}
          <div className={cx(UI.section, "rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
            <div className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: T.border }}>
              <div className="flex items-center gap-2">
                <Pill>Status AYA</Pill>
                <Pill>{count} registros</Pill>
              </div>
              <Btn tone="secondary" onClick={() => setOpenAya((p) => !p)}>
                {openAya ? "Ocultar" : "Mostrar"}
              </Btn>
            </div>

            {openAya && (
              <div className="p-4 overflow-x-auto">
                <div className="min-w-[900px] grid grid-cols-5 gap-3">
                  {STATUS_AYA.map((s) => (
                    <div key={s} className="border rounded-lg" style={{ borderColor: T.border, background: T.cardSoft }}>
                      <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                        <div className="text-xs font-semibold" style={{ color: T.text }}>
                          {s}
                        </div>
                        <Pill>{groupedAya.get(s)?.length || 0}</Pill>
                      </div>

                      <div className="p-3 grid gap-2 max-h-[360px] overflow-auto">
                        {(groupedAya.get(s) || []).slice(0, 100).map((r) => (
                          <div key={r.id} className="border rounded-lg p-3" style={{ borderColor: T.border, background: T.card }}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-xs font-semibold" style={{ color: T.text }}>
                                {r.usina ? clampUpper(r.usina) : "—"}
                              </div>

                              <span
                                className="inline-flex items-center h-6 px-2 text-[11px] font-semibold border rounded-md"
                                style={{ borderColor: T.border, background: T.cardSoft, color: T.text2 }}
                                title="ID da compra"
                              >
                                {fmtCompraId(r.id_compra)}
                              </span>
                            </div>

                            <div className="mt-1 text-[11px]" style={{ color: T.text3 }}>
                              {brDate(r.data)} • {r.cliente || "—"} • {r.forma_de_pag || "—"}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Pill>Valor: {formatBRL(r.valor)}</Pill>
                              <Pill>Impacto: {r.impacto || "-"}</Pill>
                            </div>
                            <div className="mt-2 text-[11px]" style={{ color: T.text2 }}>
                              {r.servico || "—"}
                            </div>

                            {canShowComprovante(r) && (
                              <a
                                href={r.nota_fiscal!}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center justify-center h-8 px-3 text-[11px] font-semibold border rounded-md"
                                style={{
                                  borderColor: T.border,
                                  background: T.accentSoft,
                                  color: T.accent,
                                }}
                              >
                                Abrir comprovante
                              </a>
                            )}

                          </div>
                        ))}

                        {(groupedAya.get(s)?.length || 0) > 100 && (
                          <div className="text-[11px] text-center" style={{ color: T.text3 }}>
                            Mostrando 100 (use a tabela para ver tudo).
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* KANBAN CLIENTE */}
          <div className={cx(UI.section, "rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
            <div className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: T.border }}>
              <div className="flex items-center gap-2">
                <Pill>Status Cliente</Pill>
                <Pill>{count} registros</Pill>
              </div>
              <Btn tone="secondary" onClick={() => setOpenCliente((p) => !p)}>
                {openCliente ? "Ocultar" : "Mostrar"}
              </Btn>
            </div>

            {openCliente && (
              <div className="p-4 overflow-x-auto">
                <div className="min-w-[700px] grid grid-cols-2 gap-3">
                  {STATUS_CLIENTE.map((s) => (
                    <div key={s} className="border rounded-lg" style={{ borderColor: T.border, background: T.cardSoft }}>
                      <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                        <div className="text-xs font-semibold" style={{ color: T.text }}>
                          {s}
                        </div>
                        <Pill>{groupedCliente.get(s)?.length || 0}</Pill>
                      </div>

                      <div className="p-3 grid gap-2 max-h-[320px] overflow-auto">
                        {(groupedCliente.get(s) || []).slice(0, 25).map((r) => (
                          <div key={r.id} className="border rounded-lg p-3" style={{ borderColor: T.border, background: T.card }}>
                            <div className="text-xs font-semibold" style={{ color: T.text }}>
                              {r.usina ? clampUpper(r.usina) : "—"}
                            </div>
                            <div className="mt-1 text-[11px]" style={{ color: T.text3 }}>
                              {brDate(r.data)} • {r.cliente || "—"} • {r.status_aya || "—"}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Pill>Valor: {formatBRL(r.valor)}</Pill>
                              <Pill>Pagamento: {r.forma_de_pag || "-"}</Pill>
                            </div>
                          </div>
                        ))}

                        {(groupedCliente.get(s)?.length || 0) > 25 && (
                          <div className="text-[11px] text-center" style={{ color: T.text3 }}>
                            Mostrando 25 (use a tabela para ver tudo).
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TABELA */}
          <div className={cx(UI.section, "rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
            <div className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: T.border }}>
              <div className="flex items-center gap-2">
                <Pill>Lista de compras</Pill>
                {/* <Pill>{loading ? "Carregando…" : `${tableRows.length} itens (página)`}</Pill> */}
              </div>

              <div className="flex items-center gap-2">
                <Btn tone="secondary" disabled={loading || pageSafe === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Anterior
                </Btn>
                <Btn tone="secondary" disabled={loading || pageSafe >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Próxima
                </Btn>
              </div>
            </div>

            <div className="p-4">
              {!loading && tableRows.length === 0 && (
                <div className="border rounded-lg p-4 text-sm" style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}>
                  Nenhum registro encontrado para os filtros selecionados.
                </div>
              )}

              {tableRows.length > 0 && (
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: T.border }}>
                  <div
                    className="grid grid-cols-12 gap-0 px-3 py-2 text-[11px] font-semibold border-b"
                    style={{ borderColor: T.border, background: T.cardSoft, color: T.text2 }}
                  >
                    <div className="col-span-2">Usina</div>
                    <div className="col-span-2">Data</div>
                    <div className="col-span-4">Serviço/Produto</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2 text-right">Valor</div>
                  </div>

                  {tableRows.map((r) => (
                    <div
                      key={r.id}
                      className="grid grid-cols-12 gap-0 px-3 py-2 text-sm border-b last:border-b-0"
                      style={{ borderColor: "rgba(17,24,39,0.08)", background: T.card }}
                    >
                      <div className="col-span-2" style={{ color: T.text }}>
                        {r.usina ? clampUpper(r.usina) : "—"}
                      </div>
                      <div className="col-span-2" style={{ color: T.text2 }}>
                        {brDate(r.data)}
                      </div>
                      <div className="col-span-4" style={{ color: T.text2 }}>
                        {r.servico || "—"}
                      </div>
                      <div className="col-span-2 text-[11px] flex flex-col gap-1" style={{ color: T.text2 }}>
                        <span>AYA: {r.status_aya || "—"}</span>
                        <span>CLI: {r.status_cliente || "—"}</span>
                      </div>
                      <div className="col-span-2 text-right font-semibold" style={{ color: T.text }}>
                        {formatBRL(r.valor)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 text-[11px]" style={{ color: T.text3 }}>
                Total (filtro): {count} registros • Página {pageSafe}/{totalPages}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* focus ring */}
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
