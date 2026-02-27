// app/financeiro/visualizacao/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Search,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";

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

  input: "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2",
  select: "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2",
} as const;

/* =========================================================
   UI COMPONENTS
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

function MobileAccordion({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: T.border, background: T.cardSoft }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3 py-2 border-b flex items-center justify-between gap-3 text-left"
        style={{ borderColor: "rgba(17,24,39,0.08)" }}
      >
        <div className="min-w-0">
          <div className="text-xs font-semibold truncate" style={{ color: T.text }}>
            {title}
          </div>
          <div className="text-[11px]" style={{ color: T.text3 }}>
            {count} {count === 1 ? "registro" : "registros"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Pill>{count}</Pill>
          {open ? (
            <ChevronUp className="w-4 h-4" style={{ color: T.text3 }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: T.text3 }} />
          )}
        </div>
      </button>

      {open && <div className="p-3">{children}</div>}
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
function safeFileName(name: string) {
  return name
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .trim();
}

/* =========================================================
   TYPES
========================================================= */
type Row = {
  id: string;
  id_compra?: number | string | null;
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

function canShowComprovante(r: Row) {
  return String(r.status_aya || "") === "PAGAMENTO EFETUADO" && isHttpUrl(r.nota_fiscal);
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
   PAGE
========================================================= */
export default function Page() {
  return <ComprasDashPage />;
}

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

  // MOBILE accordion state (por status)
  const [ayaOpenMap, setAyaOpenMap] = useState<Record<string, boolean>>({});
  const [cliOpenMap, setCliOpenMap] = useState<Record<string, boolean>>({});

  // export
  const [exporting, setExporting] = useState<"" | "xlsx" | "pdf">("");
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setExportOpen(false);
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
  }, [filteredRows]);

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
  }, [filteredRows]);

  const exportRows = (scope: "filtered" | "page") => (scope === "filtered" ? filteredRows : tableRows);

  const exportBaseName = () => {
    const s = start || "inicio";
    const e = end || "fim";
    return safeFileName(`compras_${s}_a_${e}`);
  };

  const toExportData = (rows: Row[]) =>
    rows.map((r) => ({
      "ID Compra": fmtCompraId(r.id_compra),
      Usina: r.usina ? clampUpper(r.usina) : "—",
      Data: brDate(r.data),
      Cliente: r.cliente || "—",
      "Serviço/Produto": r.servico || "—",
      Valor: r.valor ?? null,
      "Status AYA": r.status_aya || "—",
      "Status Cliente": r.status_cliente || "—",
      Pagamento: r.forma_de_pag || "—",
      Impacto: r.impacto || "—",
      "Nota/Comprovante": r.nota_fiscal || "",
    }));

  const exportExcel = async (scope: "filtered" | "page" = "filtered") => {
    const rows = exportRows(scope);
    if (!rows.length) return setMsg({ type: "err", text: "Não há dados para exportar." });

    setExporting("xlsx");
    setMsg(null);

    try {
      const XLSX = await import("xlsx");
      const { saveAs } = await import("file-saver");

      const data = toExportData(rows);
      const ws = XLSX.utils.json_to_sheet(data);

      ws["!cols"] = [
        { wch: 10 }, // ID
        { wch: 16 }, // Usina
        { wch: 12 }, // Data
        { wch: 10 }, // Cliente
        { wch: 40 }, // Serviço
        { wch: 14 }, // Valor
        { wch: 22 }, // Status AYA
        { wch: 18 }, // Status Cliente
        { wch: 12 }, // Pagamento
        { wch: 12 }, // Impacto
        { wch: 44 }, // Nota
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Compras");

      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const name = `${exportBaseName()}_${scope === "filtered" ? "filtrado" : "pagina"}.xlsx`;
      saveAs(blob, name);

      setMsg({ type: "ok", text: `Exportado Excel (${scope === "filtered" ? "filtrado" : "página"}) ✅` });
    } catch {
      setMsg({ type: "err", text: "Falha ao exportar Excel." });
    } finally {
      setExporting("");
    }
  };

  const exportPDF = async (scope: "filtered" | "page" = "filtered") => {
    const rows = exportRows(scope);
    if (!rows.length) return setMsg({ type: "err", text: "Não há dados para exportar." });

    setExporting("pdf");
    setMsg(null);

    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      // Retrato A4 (5 colunas)
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

      // ✅ evita “P e r i o d o ...”
      // (algum lugar pode ter setado charSpace; garante normal)
      // @ts-ignore
      doc.setCharSpace?.(0);

      const marginX = 32;
      const pageW = doc.internal.pageSize.getWidth();
      const usableW = pageW - marginX * 2;

      const title = "Compras";
      const subtitle = `Período: ${start && end ? `${brDate(start)} - ${brDate(end)}` : "—"
        }`;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(title, marginX, 38);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      // ✅ quebra linha corretamente e não estoura a largura
      const subLines = doc.splitTextToSize(subtitle, usableW);
      doc.text(subLines, marginX, 58);

      const startY = 58 + subLines.length * 14 + 8;

      // ✅ larguras que cabem (somam usableW)
      const wUsina = 90;
      const wData = 68;
      const wCliente = 80;
      const wValor = 78;
      const wServico = Math.max(160, usableW - (wUsina + wData + wCliente + wValor)); // resto da página

      const head = [["Usina", "Data", "Cliente", "Serviço/Produto", "Valor"]];

      const body = rows.map((r) => [
        r.usina ? clampUpper(r.usina) : "—",
        brDate(r.data),
        r.cliente || "—",
        String(r.servico || "—"),
        r.valor != null ? formatBRL(r.valor) : "—",
      ]);

      autoTable(doc, {
        head,
        body,
        startY,
        margin: { left: marginX, right: marginX, bottom: 36 },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: { fillColor: [17, 89, 35], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 249] },
        columnStyles: {
          0: { cellWidth: wUsina },
          1: { cellWidth: wData },
          2: { cellWidth: wCliente },
          3: { cellWidth: wServico },
          4: { cellWidth: wValor, halign: "right" },
        },
        didDrawPage: () => {
          // @ts-ignore
          doc.setCharSpace?.(0);
          const pageCount = doc.getNumberOfPages();
          const page = (doc as any).internal.getCurrentPageInfo().pageNumber as number;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(120);
          doc.text(
            `Página ${page}/${pageCount}`,
            doc.internal.pageSize.getWidth() - marginX,
            doc.internal.pageSize.getHeight() - 18,
            { align: "right" }
          );
        },
      });

      const name = `${exportBaseName()}_${scope === "filtered" ? "filtrado" : "pagina"}.pdf`;
      doc.save(name);

      setMsg({ type: "ok", text: `Exportado PDF (${scope === "filtered" ? "filtrado" : "página"}) ✅` });
    } catch {
      setMsg({ type: "err", text: "Falha ao exportar PDF." });
    } finally {
      setExporting("");
    }
  };

  const clearFilters = () => {
    setCliente("");
    setUsina("");
    setStatusAya("");
    setStatusCliente("");
    setPeriodPreset("thisMonth");
    applyPreset("thisMonth");
    setMsg(null);
  };

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

            <div className="flex items-center gap-2">
              <Btn tone="secondary" onClick={clearFilters} disabled={loading} className="h-9 px-3 text-[12px]">
                Limpar
              </Btn>
            </div>
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
            <div className="lg:col-span-3">
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
                <div
                  className="border rounded-lg p-4 text-sm"
                  style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}
                >
                  Sem dados para o período.
                </div>
              )}

              {monthSeries.map((m) => (
                <div key={m.key} className="flex items-center gap-3">
                  <div className="w-20 sm:w-28 text-xs" style={{ color: T.text3 }}>
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
                  <div className="w-24 sm:w-28 text-xs text-right" style={{ color: T.text2, fontWeight: 600 }}>
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
              <>
                {/* MOBILE: accordion */}
                <div className="sm:hidden p-4 grid gap-2">
                  {STATUS_AYA.map((s) => {
                    const items = groupedAya.get(s) || [];
                    const isOpen = ayaOpenMap[s] ?? (items.length > 0 && s === "PENDENTE APROVAÇÃO");
                    return (
                      <MobileAccordion
                        key={s}
                        title={s}
                        count={items.length}
                        open={!!isOpen}
                        onToggle={() =>
                          setAyaOpenMap((prev) => ({
                            ...prev,
                            [s]: !(prev[s] ?? (items.length > 0 && s === "PENDENTE APROVAÇÃO")),
                          }))
                        }
                      >
                        {items.length === 0 ? (
                          <div className="text-xs" style={{ color: T.text3 }}>
                            Sem itens.
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            {items.slice(0, 50).map((r) => (
                              <div key={r.id} className="border rounded-lg p-3" style={{ borderColor: T.border, background: T.card }}>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-xs font-semibold min-w-0 truncate" style={{ color: T.text }}>
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

                                <div className="mt-1 text-[11px] truncate" style={{ color: T.text3 }}>
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
                                    className="mt-2 inline-flex items-center justify-center gap-2 h-8 px-3 text-[11px] font-semibold border rounded-md"
                                    style={{ borderColor: T.border, background: T.accentSoft, color: T.accent }}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Abrir comprovante
                                  </a>
                                )}
                              </div>
                            ))}

                            {items.length > 50 && (
                              <div className="text-[11px] text-center" style={{ color: T.text3 }}>
                                Mostrando 50 (use a tabela para ver tudo).
                              </div>
                            )}
                          </div>
                        )}
                      </MobileAccordion>
                    );
                  })}
                </div>

                {/* DESKTOP/TABLET: grid */}
                <div className="hidden sm:block p-4 overflow-x-auto">
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
                                <div className="text-xs font-semibold min-w-0 truncate" style={{ color: T.text }}>
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

                              <div className="mt-1 text-[11px] truncate" style={{ color: T.text3 }}>
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
                                  className="mt-2 inline-flex items-center justify-center gap-2 h-8 px-3 text-[11px] font-semibold border rounded-md"
                                  style={{ borderColor: T.border, background: T.accentSoft, color: T.accent }}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
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
              </>
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
              <>
                {/* MOBILE accordion */}
                <div className="sm:hidden p-4 grid gap-2">
                  {STATUS_CLIENTE.map((s) => {
                    const items = groupedCliente.get(s) || [];
                    const isOpen = cliOpenMap[s] ?? (items.length > 0 && s === "REEMBOLSO PENDENTE");
                    return (
                      <MobileAccordion
                        key={s}
                        title={s}
                        count={items.length}
                        open={!!isOpen}
                        onToggle={() =>
                          setCliOpenMap((prev) => ({
                            ...prev,
                            [s]: !(prev[s] ?? (items.length > 0 && s === "REEMBOLSO PENDENTE")),
                          }))
                        }
                      >
                        {items.length === 0 ? (
                          <div className="text-xs" style={{ color: T.text3 }}>
                            Sem itens.
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            {items.slice(0, 40).map((r) => (
                              <div key={r.id} className="border rounded-lg p-3" style={{ borderColor: T.border, background: T.card }}>
                                <div className="text-xs font-semibold truncate" style={{ color: T.text }}>
                                  {r.usina ? clampUpper(r.usina) : "—"}
                                </div>
                                <div className="mt-1 text-[11px] truncate" style={{ color: T.text3 }}>
                                  {brDate(r.data)} • {r.cliente || "—"} • {r.status_aya || "—"}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Pill>Valor: {formatBRL(r.valor)}</Pill>
                                  <Pill>Pagamento: {r.forma_de_pag || "-"}</Pill>
                                </div>

                                {canShowComprovante(r) && (
                                  <a
                                    href={r.nota_fiscal!}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-flex items-center justify-center gap-2 h-8 px-3 text-[11px] font-semibold border rounded-md"
                                    style={{ borderColor: T.border, background: T.accentSoft, color: T.accent }}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Abrir comprovante
                                  </a>
                                )}
                              </div>
                            ))}

                            {items.length > 40 && (
                              <div className="text-[11px] text-center" style={{ color: T.text3 }}>
                                Mostrando 40 (use a tabela para ver tudo).
                              </div>
                            )}
                          </div>
                        )}
                      </MobileAccordion>
                    );
                  })}
                </div>

                {/* DESKTOP/TABLET */}
                <div className="hidden sm:block p-4 overflow-x-auto">
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

                              {canShowComprovante(r) && (
                                <a
                                  href={r.nota_fiscal!}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center justify-center gap-2 h-8 px-3 text-[11px] font-semibold border rounded-md"
                                  style={{ borderColor: T.border, background: T.accentSoft, color: T.accent }}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Abrir comprovante
                                </a>
                              )}
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
              </>
            )}
          </div>

          {/* TABELA */}
          <div className={cx(UI.section, "rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
            <div className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: T.border }}>
              <div className="flex items-center gap-2">
                <Pill>Lista de compras</Pill>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Export dropdown (Excel + PDF) */}
                <div ref={exportRef} className="relative">
                  <Btn
                    tone="secondary"
                    disabled={loading || !count}
                    loading={exporting !== ""}
                    onClick={() => setExportOpen((v) => !v)}
                    className="h-10"
                    aria-haspopup="menu"
                    aria-expanded={exportOpen}
                    title="Exportar registros filtrados"
                  >
                    <Download className="w-4 h-4" />
                    Exportar
                    <ChevronDown className="w-4 h-4" />
                  </Btn>

                  {exportOpen && exporting === "" && (
                    <div
                      className="absolute right-0 mt-2 w-48 border rounded-lg shadow-sm bg-white overflow-hidden z-50"
                      style={{ borderColor: T.border }}
                      role="menu"
                    >
                      <button
                        type="button"
                        disabled={loading || !count}
                        onClick={() => {
                          setExportOpen(false);
                          exportExcel("filtered");
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-black/[0.03] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ color: T.text }}
                        role="menuitem"
                      >
                        Excel (.xlsx)
                      </button>

                      <button
                        type="button"
                        disabled={loading || !count}
                        onClick={() => {
                          setExportOpen(false);
                          exportPDF("filtered");
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-black/[0.03] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ color: T.text }}
                        role="menuitem"
                      >
                        PDF (.pdf)
                      </button>

                      
                    </div>
                  )}
                </div>

                <Btn tone="secondary" disabled={loading || pageSafe === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
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
                <div className="border rounded-lg p-4 text-sm" style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}>
                  Nenhum registro encontrado para os filtros selecionados.
                </div>
              )}

              {tableRows.length > 0 && (
                <>
                  {/* MOBILE: cards */}
                  <div className="sm:hidden grid gap-2">
                    {tableRows.map((r) => (
                      <div key={r.id} className="border rounded-lg p-3" style={{ borderColor: T.border, background: T.card }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate" style={{ color: T.text }}>
                              {r.usina ? clampUpper(r.usina) : "—"}
                            </div>
                            <div className="mt-0.5 text-[11px] truncate" style={{ color: T.text3 }}>
                              {brDate(r.data)} • {r.cliente || "—"}
                            </div>
                          </div>

                          <div className="text-sm font-semibold whitespace-nowrap" style={{ color: T.text }}>
                            {formatBRL(r.valor)}
                          </div>
                        </div>

                        <div className="mt-2 text-[12px]" style={{ color: T.text2 }}>
                          {r.servico || "—"}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <Pill>AYA: {r.status_aya || "—"}</Pill>
                          <Pill>CLI: {r.status_cliente || "—"}</Pill>
                          <Pill>ID: {fmtCompraId(r.id_compra)}</Pill>
                        </div>

                        {canShowComprovante(r) && (
                          <a
                            href={r.nota_fiscal!}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center justify-center gap-2 h-8 px-3 text-[11px] font-semibold border rounded-md"
                            style={{ borderColor: T.border, background: T.accentSoft, color: T.accent }}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Abrir comprovante
                          </a>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP: tabela */}
                  <div className="hidden sm:block border rounded-lg overflow-hidden" style={{ borderColor: T.border }}>
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
                        <div className="col-span-2 truncate" style={{ color: T.text }}>
                          {r.usina ? clampUpper(r.usina) : "—"}
                        </div>
                        <div className="col-span-2" style={{ color: T.text2 }}>
                          {brDate(r.data)}
                        </div>
                        <div className="col-span-4 truncate" style={{ color: T.text2 }}>
                          {r.servico || "—"}
                        </div>
                        <div className="col-span-2 text-[11px] flex flex-col gap-1" style={{ color: T.text2 }}>
                          <span className="truncate">AYA: {r.status_aya || "—"}</span>
                          <span className="truncate">CLI: {r.status_cliente || "—"}</span>
                        </div>
                        <div className="col-span-2 text-right font-semibold" style={{ color: T.text }}>
                          {formatBRL(r.valor)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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