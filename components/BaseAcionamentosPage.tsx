"use client";

import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Search, ChevronDown, Pencil, Trash2 } from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

/* =========================================================
   SAME TOKENS AS CADASTRO (copiado)
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
  panel: "border bg-white",
  panelSoft: "border bg-white",

  headerTitle: "text-base sm:text-lg font-semibold tracking-tight",
  headerSub: "text-xs",
  sectionTitle: "text-sm font-semibold",
  sectionHint: "text-xs",
  label: "text-[11px] font-medium",
  help: "text-[11px]",

  input: "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2",
  textarea: "w-full min-h-[92px] px-3 py-2 border bg-white text-sm outline-none transition focus:ring-2",
  select: "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2",
} as const;

/* =========================================================
   PRIMITIVES (cadastro-like)
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

  const styles = tone === "primary" ? "text-white" : tone === "danger" ? "text-white" : "bg-white";

  return (
    <button
      className={cx(base, styles, className)}
      disabled={disabled || loading}
      style={
        tone === "primary"
          ? { background: T.accent, borderColor: "rgba(17, 89, 35, 0.45)" }
          : tone === "danger"
          ? { background: "#DC2626", borderColor: "rgba(220, 38, 38, 0.55)" }
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

function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useLockBodyScroll(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/55 backdrop-blur-sm p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* ✅ menor e mais compacto */}
      <div className="w-full max-w-[600px] border rounded-lg bg-white shadow-sm" style={{ borderColor: T.border }}>
        <div className="px-4 py-3 border-b flex items-start justify-between gap-3" style={{ borderColor: T.border }}>
          <div className="min-w-0">
            <div className="text-lg font-semibold" style={{ color: T.text }}>
              {title}
            </div>
            {subtitle && (
              <div className="text-[11px] mt-0.5" style={{ color: T.text3 }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            className="h-8 w-8 border rounded-md text-sm"
            style={{ borderColor: T.border, color: T.text2, background: T.card }}
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

type DriveRow = {
  id: string | number;
  [key: string]: any;
};
const rowId = (r: DriveRow) => String(r.id);

function clampUpper(s: string) {
  return String(s || "").trim().toUpperCase();
}

function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
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

function isoWeekCodeUTC(dateStr: string) {
  if (!isIsoDate(dateStr)) return "";
  const d = new Date(`${dateStr}T00:00:00Z`);
  const tmp = new Date(d);
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${week}W${String(tmp.getUTCFullYear()).slice(-2)}`;
}

function cleanLine(v: any) {
  const s = String(v ?? "").trim();
  return s ? s : "-";
}

function rowToClipboardText(r: DriveRow) {
  return [
    `Data: ${cleanLine(brDate((r as any).data))}`,
    `Usina: ${cleanLine((r as any).usina)}`,
    `OSS/SS: ${cleanLine((r as any).ss)}`,
    `Motivo da mobilização: ${cleanLine((r as any).motivo_mobilizacao)}`,
    `Problema identificado: ${cleanLine((r as any).problema_identificado)}`,
    `Solução imediata: ${cleanLine((r as any).solucao_imediata)}`,
    `Solução definitiva: ${cleanLine((r as any).solucao_definitiva)}`,
  ].join("\n");
}

/* =========================================================
   AUTOCOMPLETE (mesmo do cadastro)
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
   PAGE (BASE) — MESMO LAYOUT DO CADASTRO
========================================================= */

export function AcionamentosBasePage() {
  return <AcionamentosBase />;
}

function AcionamentosBase() {
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [usinasList, setUsinasList] = useState<string[]>([]);
  const [usinasLoading, setUsinasLoading] = useState(false);

  const [equipamentos, setEquipamentos] = useState<string[]>([]);
  const [equipLoading, setEquipLoading] = useState(false);

  const [usina, setUsina] = useState("");
  const [equipamento, setEquipamento] = useState("");

  const [periodPreset, setPeriodPreset] = useState<
    "today" | "yesterday" | "thisMonth" | "lastMonth" | "last7" | "last30"
  >("today");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [rows, setRows] = useState<DriveRow[]>([]);
  const [loading, setLoading] = useState(false);

  const limit = 6;
  const [offset, setOffset] = useState(0);

  const [openId, setOpenId] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<DriveRow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setUsinasLoading(true);
      try {
        const res = await fetch("/api/acionamentos/usinas", { method: "GET" });
        const data = await res.json().catch(() => null);
        if (!res.ok) return;
        const raw = Array.isArray(data?.usinas) ? data.usinas : [];
        const list = raw
          .map((x: any) => clampUpper(String(x || "")))
          .filter(Boolean)
          .sort((a: string, b: string) => a.localeCompare(b));
        if (alive) setUsinasList(list);
      } finally {
        if (alive) setUsinasLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setEquipLoading(true);
      try {
        const res = await fetch("/api/acionamentos/equipamentos?mode=drives", { method: "GET" });
        const data = await res.json().catch(() => null);
        if (!res.ok) return;
        const raw = Array.isArray(data?.equipamentos) ? data.equipamentos : [];
        const list = raw
          .map((x: any) => String(x || "").trim())
          .filter(Boolean)
          .sort((a: string, b: string) => a.localeCompare(b));
        if (alive) setEquipamentos(list);
      } finally {
        if (alive) setEquipLoading(false);
      }
    })();
    return () => {
      alive = false;
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
    if (p === "yesterday") {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      const iso = toISO(d);
      setStart(iso);
      setEnd(iso);
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
    setPeriodPreset("today");
    applyPreset("today");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invalidRange = useMemo(() => {
    const s = start ? new Date(`${start}T00:00:00`) : null;
    const e = end ? new Date(`${end}T00:00:00`) : null;
    if (!s || !e) return false;
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return false;
    return s.getTime() > e.getTime();
  }, [start, end]);

  const buildParams = (newOffset: number, newLimit: number) => {
    const params = new URLSearchParams();
    params.set("mode", "drives");
    params.set("limit", String(newLimit));
    params.set("offset", String(newOffset));
    if (usina) params.set("usina", clampUpper(usina));
    if (equipamento) params.set("equipamento", equipamento);
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    return params;
  };

  const loadTable = async (newOffset = 0) => {
    setMsg(null);

    if (!start || !end) return setMsg({ type: "err", text: "Selecione um Período (início e fim)." });
    if (invalidRange) return setMsg({ type: "err", text: "A data inicial não pode ser maior que a data final." });

    setLoading(true);
    try {
      const res = await fetch(`/api/acionamentos?${buildParams(newOffset, limit).toString()}`, { method: "GET" });
      const data = await res.json().catch(() => null);
      if (!res.ok) return setMsg({ type: "err", text: data?.error || "Erro ao carregar base." });

      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setOffset(newOffset);
    } catch {
      setMsg({ type: "err", text: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!start || !end) return;
    if (invalidRange) return;
    const t = window.setTimeout(() => loadTable(0), 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, invalidRange, usina, equipamento]);

  const page = Math.floor(offset / limit) + 1;

  const copyRow = async (r: DriveRow) => {
    setMsg(null);
    try {
      await navigator.clipboard.writeText(rowToClipboardText(r));
      setMsg({ type: "ok", text: "Copiado ✅" });
    } catch {
      setMsg({ type: "err", text: "Não consegui copiar (permissão do navegador)." });
    }
  };

  const openEdit = (r: DriveRow) => {
    if (!(r as any)?.id) return setMsg({ type: "err", text: "Registro sem ID (não veio do banco)." });
    setEditing({ ...(r as any) });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!(editing as any)?.id) return;
    setSaving(true);
    setMsg(null);

    const norm = (v: any) => (v === "" ? null : v);

    const ssSafe =
      (editing as any).ss === null || (editing as any).ss === undefined ? null : Number((editing as any).ss);
    const safeSS = ssSafe === null ? null : Number.isFinite(ssSafe) ? ssSafe : null;

    try {
      const payload = {
        data: (editing as any).data,
        semana: isoWeekCodeUTC((editing as any).data),
        usina: clampUpper(String((editing as any).usina || "")),
        cliente: norm((editing as any).cliente),
        equipamento: norm((editing as any).equipamento),
        alarme: norm((editing as any).alarme),
        motivo_mobilizacao: norm((editing as any).motivo_mobilizacao),
        problema_identificado: norm((editing as any).problema_identificado),
        solucao_imediata: norm((editing as any).solucao_imediata),
        solucao_definitiva: norm((editing as any).solucao_definitiva),
        ss: safeSS,
      };

      const res = await fetch(`/api/acionamentos/${(editing as any).id}?mode=drives`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {}

      if (!res.ok) return setMsg({ type: "err", text: data?.error || raw || `Erro ao salvar (HTTP ${res.status})` });

      const nextRow = { ...(editing as any), ...payload } as DriveRow;
      setRows((p) => p.map((r) => ((r as any).id === (editing as any).id ? nextRow : r)));

      setEditOpen(false);
      setEditing(null);
      setMsg({ type: "ok", text: "Registro atualizado ✅" });
    } catch {
      setMsg({ type: "err", text: "Erro de conexão." });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm("Excluir este registro? Essa ação não pode ser desfeita.");
    if (!ok) return;

    setMsg(null);
    try {
      const res = await fetch(`/api/acionamentos/${id}?mode=drives`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) return setMsg({ type: "err", text: data?.error || "Erro ao excluir." });

      setRows((p) => p.filter((r) => (r as any).id !== id));
      setMsg({ type: "ok", text: "Excluído ✅" });
    } catch {
      setMsg({ type: "err", text: "Erro de conexão." });
    }
  };

  return (
    <section className={UI.page} style={{ background: T.bg, color: T.text }}>
      <div className={UI.container}>
        {/* HEADER (igual cadastro) */}
        <div className={cx(UI.header, "p-4 sm:p-5 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className={UI.headerTitle} style={{ color: T.text }}>
                Base de Acionamentos
              </div>
              <div className={cx(UI.headerSub, "mt-1")} style={{ color: T.text3 }}>
                Filtre por <span style={{ color: T.text2, fontWeight: 600 }}>período</span>,{" "}
                <span style={{ color: T.text2, fontWeight: 600 }}>usina</span> e{" "}
                <span style={{ color: T.text2, fontWeight: 600 }}>equipamento</span>. Clique em um item para copiar.
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill>Período: {start && end ? `${brDate(start)} → ${brDate(end)}` : "Não Selecionado"}</Pill>
                <Pill>Usina: {usina ? clampUpper(usina) : "Não Selecionada"}</Pill>
                <Pill>Equipamento: {equipamento ? equipamento : "Não Selecionado"}</Pill>
              </div>
            </div>

            <div className="flex items-center gap-2">
          
              <Pill>Página {page}</Pill>
            </div>
          </div>
        </div>

        {/* BODY (igual cadastro: aside + main) */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* FILTERS */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className={cx(UI.section, "p-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={UI.sectionTitle} style={{ color: T.text }}>
                    Filtros
                  </div>
                  <div className={cx(UI.sectionHint, "mt-1")} style={{ color: T.text3 }}>
                    Ajusta e a lista atualiza.
                  </div>
                </div>
                <Pill>{usinasLoading ? "Carregando…" : `${usinasList.length} usinas`}</Pill>
              </div>

              <div className="mt-4 grid gap-4">
                <div>
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
                    <option value="yesterday">Ontem</option>
                    <option value="thisMonth">Este mês</option>
                    <option value="lastMonth">Mês passado</option>
                    <option value="last7">Últimos 7 dias</option>
                    <option value="last30">Últimos 30 dias</option>
                  </select>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
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
                    <div>
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
                  </div>

                  {invalidRange && (
                    <div className="mt-2 text-[11px]" style={{ color: T.errTx }}>
                      Data inicial maior que a final.
                    </div>
                  )}
                </div>

                <div className="relative z-40">
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

                <div>
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Equipamento (opcional)
                  </label>
                  <select
                    value={equipamento}
                    onChange={(e) => setEquipamento(e.target.value)}
                    className={cx(UI.select, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                    disabled={equipLoading}
                  >
                    <option value="">{equipLoading ? "Carregando…" : "Todos"}</option>
                    {equipamentos.map((eq) => (
                      <option key={eq} value={eq}>
                        {eq}
                      </option>
                    ))}
                  </select>
                </div>

                {/* <div className="p-3 border rounded-md" style={{ borderColor: T.border, background: T.mutedBg }}>
                  <div className="text-[11px] font-medium" style={{ color: T.text3 }}>
                    Resumo
                  </div>
                  <div className="mt-2 text-xs" style={{ color: T.text2 }}>
                    {summary || "—"}
                  </div>
                </div> */}

                <div className="flex items-center gap-2">
                  <Btn tone="secondary" onClick={() => loadTable(0)} disabled={loading}>
                    Recarregar
                  </Btn>
                  <Btn
                    tone="secondary"
                    onClick={() => {
                      setUsina("");
                      setEquipamento("");
                      setPeriodPreset("today");
                      applyPreset("today");
                    }}
                    disabled={loading}
                  >
                    Limpar
                  </Btn>
                </div>

                <MsgBox m={msg} />
              </div>
            </div>
          </aside>

          {/* LIST */}
          <main className="lg:col-span-8 xl:col-span-9">
            <div className={cx(UI.section, "rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
              <div className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: T.border }}>
                <div className="flex items-center gap-2">
                  <Pill>Editar / Excluir</Pill>
                  <Pill>Clique no item → copiar</Pill>
                </div>

                <div className="flex items-center gap-2">
                  <Btn tone="secondary" disabled={loading || offset === 0} onClick={() => loadTable(Math.max(0, offset - limit))}>
                    Anterior
                  </Btn>
                  <Btn tone="secondary" disabled={loading || rows.length < limit} onClick={() => loadTable(offset + limit)}>
                    Próxima
                  </Btn>
                </div>
              </div>

              <div className="p-4">
                {loading && (
                  <div className="grid gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="border rounded-lg p-4" style={{ borderColor: T.border, background: T.card }}>
                        <div className="h-3 w-56 rounded" style={{ background: "rgba(17,24,39,0.06)" }} />
                        <div className="h-3 w-72 rounded mt-2" style={{ background: "rgba(17,24,39,0.05)" }} />
                        <div className="h-3 w-64 rounded mt-2" style={{ background: "rgba(17,24,39,0.05)" }} />
                      </div>
                    ))}
                  </div>
                )}

                {!loading && rows.length === 0 && (
                  <div className="border rounded-lg p-4 text-sm" style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}>
                    Nenhum registro encontrado para os filtros selecionados.
                  </div>
                )}

                {!loading && rows.length > 0 && (
                  <div className="grid gap-3">
                    {rows.map((r: any) => {
                      const opened = openId === rowId(r);

                      return (
                        <div key={rowId(r)} className="border rounded-lg" style={{ borderColor: T.border, background: T.card }}>
                          {/* ✅ CORRIGIDO: não é mais button (evita button dentro de button) */}
                          <div
                            role="button"
                            tabIndex={0}
                            title="Clique para copiar"
                            className="w-full text-left p-4 transition cursor-copy select-none"
                            style={{ color: T.text }}
                            onClick={() => copyRow(r)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                copyRow(r);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold" style={{ color: T.text }}>
                                    {clampUpper(r.usina || "")}
                                  </span>
                                  <Pill>Data: {brDate(r.data)}</Pill>
                                  <Pill>Equip: {r.equipamento ?? "—"}</Pill>
                                  {r.alarme ? <Pill>Alarme: {r.alarme}</Pill> : <Pill>Alarme: —</Pill>}
                                  {r.ss ? <Pill>SS: {r.ss}</Pill> : null}
                                </div>

                                <div className="mt-2 grid gap-1 text-xs" style={{ color: T.text2 }}>
                                  <div className="truncate">
                                    <span style={{ color: T.text3 }}>Motivo: </span>
                                    {r.motivo_mobilizacao ?? "—"}
                                  </div>
                                  <div className="truncate">
                                    <span style={{ color: T.text3 }}>Problema: </span>
                                    {r.problema_identificado ?? "—"}
                                  </div>
                                </div>
                              </div>

                              {/* ✅ botões continuam button, com stopPropagation */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="h-9 w-9 border rounded-md inline-flex items-center justify-center"
                                  style={{ borderColor: T.border, background: T.card, color: T.text2 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenId((p) => (p === rowId(r) ? null : rowId(r)));
                                  }}
                                  title="Detalhes"
                                >
                                  <ChevronDown className={cx("w-4 h-4 transition", opened && "rotate-180")} />
                                </button>

                                <button
                                  type="button"
                                  className="h-9 w-9 border rounded-md inline-flex items-center justify-center"
                                  style={{ borderColor: T.border, background: T.card, color: T.text2 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEdit(r);
                                  }}
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  className="h-9 w-9 border rounded-md inline-flex items-center justify-center"
                                  style={{ borderColor: "rgba(220,38,38,0.35)", background: T.card, color: "#DC2626" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(rowId(r));
                                  }}
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {opened && (
                            <div className="px-4 pb-4">
                              <div className="border rounded-lg p-4" style={{ borderColor: T.border, background: T.mutedBg }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-[11px] font-medium" style={{ color: T.text3 }}>
                                      Solução imediata
                                    </div>
                                    <div className="mt-1 text-sm whitespace-pre-wrap" style={{ color: T.text2 }}>
                                      {r.solucao_imediata ?? "—"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[11px] font-medium" style={{ color: T.text3 }}>
                                      Solução definitiva
                                    </div>
                                    <div className="mt-1 text-sm whitespace-pre-wrap" style={{ color: T.text2 }}>
                                      {r.solucao_definitiva ?? "—"}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 text-[11px]" style={{ color: T.text3 }}>
                                  Dica: clique no card (parte de cima) para copiar o texto completo.
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* EDIT MODAL (compacto) */}
      {editOpen && editing && (
        <Modal
          title="Editar acionamento"
          onClose={() => {
            setEditOpen(false);
            setEditing(null);
          }}
        >
          <div className="grid gap-4">
            {/* ✅ mais compacto: 2 colunas no sm, sem excesso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["data", "Data", "date"],
                ["usina", "Usina", "text"],
                ["equipamento", "Equipamento", "text"],
                ["ss", "SS", "text"],
                ["cliente", "Cliente", "text"],
                ["alarme", "Alarme", "text"],
              ].map(([k, label, type]) => (
                <div key={k}>
                  <label className={UI.label} style={{ color: T.text2 }}>
                    {label}
                  </label>
                  <input
                    type={type === "date" ? "date" : "text"}
                    value={String((editing as any)[k] ?? "")}
                    onChange={(e) =>
                      setEditing((p) =>
                        p
                          ? ({
                              ...p,
                              [k]:
                                k === "usina" ? clampUpper(e.target.value) : e.target.value,
                            } as any)
                          : p
                      )
                    }
                    className={cx(UI.input, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                    inputMode={k === "ss" ? "numeric" : undefined}
                  />
                </div>
              ))}
            </div>

            {/* ✅ textareas menores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["motivo_mobilizacao", "Motivo da mobilização"],
                ["problema_identificado", "Problema identificado"],
                ["solucao_imediata", "Solução imediata"],
                ["solucao_definitiva", "Solução definitiva"],
              ].map(([k, label]) => (
                <div key={k}>
                  <label className={UI.label} style={{ color: T.text2 }}>
                    {label}
                  </label>
                  <textarea
                    value={String((editing as any)[k] ?? "")}
                    onChange={(e) => setEditing((p) => (p ? ({ ...p, [k]: e.target.value } as any) : p))}
                    className={cx(UI.textarea, "mt-1 rounded-md")}
                    style={{ borderColor: T.border, minHeight: "72px" }}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Btn
                tone="secondary"
                disabled={saving}
                onClick={() => {
                  setEditOpen(false);
                  setEditing(null);
                }}
              >
                Cancelar
              </Btn>
              <Btn tone="primary" loading={saving} disabled={saving} onClick={saveEdit}>
                Salvar
              </Btn>
            </div>

            <MsgBox m={msg} />
          </div>
        </Modal>
      )}

      {/* Global focus ring token */}
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
