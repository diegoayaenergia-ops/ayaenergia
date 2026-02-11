"use client";

import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Search } from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

/* =========================================================
   PROFESSIONAL COLOR TOKENS (subtle green accent)
   -> ajuste aqui e a tela inteira acompanha
========================================================= */

const T = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  cardSoft: "#FBFCFD",
  border: "rgba(17, 24, 39, 0.12)", // black/12
  borderStrong: "rgba(17, 24, 39, 0.18)",
  text: "#0B1220",
  text2: "rgba(11, 18, 32, 0.70)",
  text3: "rgba(11, 18, 32, 0.55)",
  mutedBg: "rgba(17, 24, 39, 0.035)",

  // accent (verde discreto)
  accent: "#115923",
  accent2: "#2E7B41",
  accentSoft: "rgba(17, 89, 35, 0.08)",
  accentRing: "rgba(17, 89, 35, 0.18)",

  // states
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

  // surfaces
  header: "border bg-white",
  section: "border bg-white",
  panel: "border bg-white",
  panelSoft: "border bg-white",

  // text
  headerTitle: "text-base sm:text-lg font-semibold tracking-tight",
  headerSub: "text-xs",
  sectionTitle: "text-sm font-semibold",
  sectionHint: "text-xs",
  label: "text-[11px] font-medium",
  help: "text-[11px]",

  // controls
  input:
    "w-full h-10 px-3 border bg-white text-sm outline-none transition " +
    "focus:ring-2",
  textarea:
    "w-full min-h-[92px] px-3 py-2 border bg-white text-sm outline-none transition " +
    "focus:ring-2",
  select:
    "w-full h-10 px-3 border bg-white text-sm outline-none transition " +
    "focus:ring-2",
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

  const styles =
    tone === "primary"
      ? "text-white"
      : tone === "danger"
        ? "text-white"
        : "bg-white";

  return (
    <button
      className={cx(base, styles, className)}
      disabled={disabled || loading}
      style={
        tone === "primary"
          ? {
            background: T.accent,
            borderColor: "rgba(17, 89, 35, 0.45)",
          }
          : tone === "danger"
            ? {
              background: "#DC2626",
              borderColor: "rgba(220, 38, 38, 0.55)",
            }
            : {
              background: T.card,
              borderColor: T.border,
              color: T.text,
            }
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

function TabBtn({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 px-3 text-sm font-semibold border rounded-md transition"
      style={
        active
          ? { background: T.accentSoft, borderColor: "rgba(17, 89, 35, 0.30)", color: T.accent }
          : { background: T.card, borderColor: T.border, color: T.text2 }
      }
    >
      {children}
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
function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
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
function brDate(iso?: string | null) {
  if (!iso) return "-";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(iso);
  return `${m[3]}/${m[2]}/${m[1]}`;
}
function todayISO() {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

type LossKey = "cmp" | "skid" | "inversor" | "tcu" | "ncu" | "string";

function eachDayISO(inicio: string, fim: string) {
  const s = new Date(`${inicio}T00:00:00Z`);
  const e = new Date(`${fim}T00:00:00Z`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return [];
  if (s.getTime() > e.getTime()) return [];
  const out: string[] = [];
  const d = new Date(s);
  while (d.getTime() <= e.getTime()) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

function splitTotalAcrossDays(total: number, nDays: number) {
  if (nDays <= 0) return [];
  const base = Math.floor((total / nDays) * 100) / 100;
  const arr = Array.from({ length: nDays }, () => base);
  const sum = arr.reduce((a, b) => a + b, 0);
  const diff = Math.round((total - sum) * 100) / 100;
  arr[arr.length - 1] = Math.round((arr[arr.length - 1] + diff) * 100) / 100;
  return arr;
}

/* =========================================================
   AUTOCOMPLETE USINA (subtle accent)
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
          style={{
            borderColor: T.border,
            color: T.text,
            boxShadow: "none",
          }}
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
          {loading && <div className="px-3 py-2 text-xs" style={{ color: T.text3 }}>Carregando…</div>}
          {!loading && filtered.length === 0 && <div className="px-3 py-2 text-xs" style={{ color: T.text3 }}>Nenhuma usina</div>}

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

export function AcionamentosCadastroPage() {
  return <AcionamentosCadastro />;
}

function AcionamentosCadastro() {
  const CLIENTES = ["INEER", "KAMAI", "ÉLIS"] as const;

  const EQUIPAMENTOS = [
    "CMP",
    "SKID",
    "INVERSOR",
    "TCU",
    "NCU",
    "STRING",
    "ESTAÇÃO SOLARIMÉTRICA",
    "PC DE O&M",
    "CAMERA",
    "LOGGER",
    "RELÉ",
    "DISJUNTOR",
    "MODEM",
    "SCADA",
    "INFRAESTRUTURA",
    "N/A",
  ] as const;

  const ALARME_TO_MOTIVO: Record<string, string> = {
    "27": "Subtensão",
    "59": "Sobretensão",
    "74": "Temperatura",
    "50": "Sobrecorrente instantânea",
    "51": "Sobrecorrente temporizada",
    PROGRAMADO: "Desligamento programado",
    COMUNICAÇÃO: "Falha de comunicação / internet",
    GERAL: "Falta de energia / eventos externos", "46": "Corrente de sequência negativa", "81": "Proteção de frequência", "50/51N": "Falta à terra", "32": "Potência direcional", "49": "Sobrecarga térmica", "78": "Falha de sincronismo", "52": "Disjuntor aberto/fechado", "78VS": "Proteção por variação brusca de ângulo de tensão", "86": "Bloqueio", "67": "Direcional de sobrecorrente de fase", "TRACKER": "Tracker sem comunicação", "SOBRE-TEMPERATURA": "Sobretemperatura do SKID", "SS_INCOMPLETA": "SS sem informações sobre a ocorrência", "47/59": "Sequência de fase inversa / Sobretensão", "V_AUXILIAR": "Defeito na alimentação auxiliar", "CONEXÃO_FÍSICA": "Defeito nos conectores (MC4) ou cabeamento CC", "TROCA_EQUIPAMENTO": "Troca de fonte, caixa de aterramento, módulo, etc.", "BATERIA": "TCU com bateria crítica", "FONTE_NCU": "Intermitência de fonte", "RELE": "Parâmetro do relé desatualizado", "RELIGAMENTO_PC": "PC de O&M desligado", "ISOLAMENTO": "Baixa resistência de isolamento", "ALARME_INVERSOR": "Atuação de alarme de inversor", "FAULT": "Problema do VTR ou do controlador de temperatura"
  };

  const toNumOrNull = (v: string) => {
    const s = String(v || "").trim();
    if (!s) return null;
    const n = Number(s.replace(",", "."));
    if (!Number.isFinite(n)) throw new Error(`Número inválido: ${v}`);
    return n;
  };

  const toIntOrNull = (v: string) => {
    const s = String(v || "").trim();
    if (!s) return null;
    const n = Number(s);
    if (!Number.isFinite(n)) throw new Error(`SS inválido: ${v}`);
    return Math.trunc(n);
  };

  const [loadingLoss, setLoadingLoss] = useState(false);
  const [loadingDrives, setLoadingDrives] = useState(false);

  const [msgLoss, setMsgLoss] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [msgDrives, setMsgDrives] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [form, setForm] = useState(() => {
    const d = todayISO();
    return {
      data: d,
      semana: isoWeekCodeUTC(d),
      usina: "",
      cmp: "",
      skid: "",
      inversor: "",
      tcu: "",
      ncu: "",
      string: "",
      cliente: "",
      equipamento: "",
      alarme: "",
      motivo_mobilizacao: "",
      problema_identificado: "",
      solucao_imediata: "",
      solucao_definitiva: "",
      ss: "",
    };
  });

  const [lossBulk, setLossBulk] = useState(false);
  const [bulkStart, setBulkStart] = useState(form.data);
  const [bulkEnd, setBulkEnd] = useState(form.data);
  const [bulkTotal, setBulkTotal] = useState("");
  const [bulkEquip, setBulkEquip] = useState<LossKey>("inversor");

  const [tab, setTab] = useState<"drives" | "loss">("drives");

  const [usinasList, setUsinasList] = useState<string[]>([]);
  const [usinasLoading, setUsinasLoading] = useState(false);

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

  const setField = (k: string, v: string) => {
    setForm((p) => {
      if (k === "data") return { ...p, data: v, semana: isoWeekCodeUTC(v) };
      if (k === "usina") return { ...p, usina: clampUpper(v) };
      return { ...p, [k]: v };
    });
  };

  const validateBase = () => {
    if (!form.data || !clampUpper(form.usina)) return "Data e Usina são obrigatórias.";
    return null;
  };

  const submitLoss = async () => {
    setMsgLoss(null);
    const baseErr = validateBase();
    if (baseErr) return setMsgLoss({ type: "err", text: baseErr });

    setLoadingLoss(true);
    try {
      const res = await fetch("/api/acionamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "loss",
          data: form.data,
          usina: clampUpper(form.usina),
          cmp: toNumOrNull(form.cmp),
          skid: toNumOrNull(form.skid),
          inversor: toNumOrNull(form.inversor),
          tcu: toNumOrNull(form.tcu),
          ncu: toNumOrNull(form.ncu),
          string: toNumOrNull(form.string),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsgLoss({ type: "err", text: data?.error || "Erro ao salvar perdas" });

      setMsgLoss({ type: "ok", text: "Perdas salvas com sucesso ✅" });
      setForm((p) => ({ ...p, cmp: "", skid: "", inversor: "", tcu: "", ncu: "", string: "" }));
    } catch (err: any) {
      setMsgLoss({ type: "err", text: err?.message || "Erro inesperado" });
    } finally {
      setLoadingLoss(false);
    }
  };

  const submitLossBulk = async () => {
    setMsgLoss(null);

    if (!clampUpper(form.usina)) return setMsgLoss({ type: "err", text: "Usina é obrigatória." });
    if (!isIsoDate(bulkStart) || !isIsoDate(bulkEnd)) return setMsgLoss({ type: "err", text: "Datas inválidas (use YYYY-MM-DD)." });

    const days = eachDayISO(bulkStart, bulkEnd);
    if (!days.length) return setMsgLoss({ type: "err", text: "Período inválido (início > fim?)" });

    const total = Number(String(bulkTotal || "").replace(",", "."));
    if (!Number.isFinite(total) || total <= 0) return setMsgLoss({ type: "err", text: "Informe um total de horas válido." });

    setLoadingLoss(true);
    try {
      const values = splitTotalAcrossDays(total, days.length);

      const makeBody = (dataISO: string, horas: number) => ({
        mode: "loss",
        data: dataISO,
        usina: clampUpper(form.usina),
        cmp: bulkEquip === "cmp" ? horas : null,
        skid: bulkEquip === "skid" ? horas : null,
        inversor: bulkEquip === "inversor" ? horas : null,
        tcu: bulkEquip === "tcu" ? horas : null,
        ncu: bulkEquip === "ncu" ? horas : null,
        string: bulkEquip === "string" ? horas : null,
      });

      for (let i = 0; i < days.length; i++) {
        const res = await fetch("/api/acionamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(makeBody(days[i], values[i])),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `Erro ao salvar em ${days[i]}`);
      }

      setMsgLoss({ type: "ok", text: `Perdas em massa salvas ✅ (${days.length} dias • ${total}h em ${bulkEquip.toUpperCase()})` });
      setBulkTotal("");
    } catch (err: any) {
      setMsgLoss({ type: "err", text: err?.message || "Erro inesperado ao salvar perdas em massa" });
    } finally {
      setLoadingLoss(false);
    }
  };

  const submitDrives = async () => {
    setMsgDrives(null);
    const baseErr = validateBase();
    if (baseErr) return setMsgDrives({ type: "err", text: baseErr });

    setLoadingDrives(true);
    try {
      const res = await fetch("/api/acionamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "drives",
          data: form.data,
          semana: form.semana || isoWeekCodeUTC(form.data),
          usina: clampUpper(form.usina),
          cliente: form.cliente || null,
          equipamento: form.equipamento || null,
          alarme: form.alarme || null,
          motivo_mobilizacao: form.motivo_mobilizacao || null,
          problema_identificado: form.problema_identificado || null,
          solucao_imediata: form.solucao_imediata || null,
          solucao_definitiva: form.solucao_definitiva || null,
          ss: toIntOrNull(form.ss),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsgDrives({ type: "err", text: data?.error || "Erro ao salvar acionamento" });

      setMsgDrives({ type: "ok", text: "Acionamento salvo com sucesso ✅" });
      setForm((p) => ({
        ...p,
        cliente: "",
        equipamento: "",
        alarme: "",
        motivo_mobilizacao: "",
        problema_identificado: "",
        solucao_imediata: "",
        solucao_definitiva: "",
        ss: "",
      }));
    } catch (err: any) {
      setMsgDrives({ type: "err", text: err?.message || "Erro inesperado" });
    } finally {
      setLoadingDrives(false);
    }
  };

  return (
    <section className={UI.page} style={{ background: T.bg, color: T.text }}>
      <div className={UI.container}>
        {/* HEADER */}
        <div className={cx(UI.header, "p-4 sm:p-5 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className={UI.headerTitle} style={{ color: T.text }}>
                Cadastro de Acionamentos e Perdas
              </div>
              <div className={cx(UI.headerSub, "mt-1")} style={{ color: T.text3 }}>
                Defina <span style={{ color: T.text2, fontWeight: 600 }}>Data</span> e{" "}
                <span style={{ color: T.text2, fontWeight: 600 }}>Usina</span> e registre acionamentos ou perdas.
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill>Data: {brDate(form.data)}</Pill>
                <Pill>Semana: {form.semana || "Não Selecionada"}</Pill>
                <Pill>Usina: {form.usina ? clampUpper(form.usina) : "Não Selecionada"}</Pill>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Pill>{loadingLoss || loadingDrives ? "Processando…" : "Pronto"}</Pill>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* BASE */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className={cx(UI.section, "p-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={UI.sectionTitle} style={{ color: T.text }}>
                    Dados base
                  </div>
                  <div className={cx(UI.sectionHint, "mt-1")} style={{ color: T.text3 }}>
                    Obrigatórios para salvar.
                  </div>
                </div>
                <Pill>{usinasLoading ? "Carregando…" : `${usinasList.length} usinas`}</Pill>
              </div>

              <div className="mt-4 grid gap-4">
                <div>
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Data
                  </label>
                  <input
                    type="date"
                    value={form.data}
                    onChange={(e) => setField("data", e.target.value)}
                    className={cx(UI.input, "mt-1 rounded-md")}
                    style={{ borderColor: T.border }}
                  />
                </div>

                <div>
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Semana
                  </label>
                  <input
                    value={form.semana}
                    readOnly
                    className={cx(UI.input, "mt-1 rounded-md")}
                    style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}
                  />
                </div>

                <div className="relative z-40">
                  <label className={UI.label} style={{ color: T.text2 }}>
                    Usina
                  </label>
                  <div className="mt-1">
                    <UsinaAutocomplete
                      value={form.usina}
                      onChange={(v) => setField("usina", v)}
                      options={usinasList}
                      loading={usinasLoading}
                      placeholder="Buscar usina…"
                    />
                  </div>
                  <div className={cx(UI.help, "mt-1")} style={{ color: T.text3 }}>
                    ↑ ↓ Enter • Esc para fechar
                  </div>
                </div>

                <div className="p-3 border rounded-md" style={{ borderColor: T.border, background: T.mutedBg }}>
                  <div className="text-[11px] font-medium" style={{ color: T.text3 }}>
                    Validação
                  </div>
                  <div className="mt-2 grid gap-1 text-xs" style={{ color: T.text2 }}>
                    <div>
                      • Data: <span style={{ color: T.accent }}>{form.data ? "OK" : "Não Selecionada"}</span>
                    </div>
                    <div>
                      • Usina: <span style={{ color: T.accent }}>{form.usina ? "OK" : "Não Selecionada"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* CONTENT */}
          <main className="lg:col-span-8 xl:col-span-9">
            <div className={cx(UI.section, "rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
              {/* Tabs bar */}
              <div className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: T.border }}>
                <div className="flex items-center gap-2">
                  <TabBtn active={tab === "drives"} onClick={() => setTab("drives")}>
                    Acionamentos
                  </TabBtn>
                  <TabBtn active={tab === "loss"} onClick={() => setTab("loss")}>
                    Perdas
                  </TabBtn>
                </div>

                <div className="flex items-center gap-2">

                  <Pill>SS opcional</Pill>
                </div>
              </div>

              <div className="p-4">
                {/* ACIONAMENTOS */}
                {tab === "drives" && (
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div className="lg:col-span-4 border p-4 rounded-lg" style={{ borderColor: T.border, background: T.card }}>
                        <div className={UI.sectionTitle} style={{ color: T.text }}>
                          Identificação
                        </div>
                        <div className="mt-3 grid gap-4">
                          <div>
                            <label className={UI.label} style={{ color: T.text2 }}>
                              Cliente
                            </label>
                            <select
                              value={form.cliente}
                              onChange={(e) => setField("cliente", e.target.value)}
                              className={cx(UI.select, "mt-1 rounded-md")}
                              style={{ borderColor: T.border }}
                            >
                              <option value="">Selecione…</option>
                              {CLIENTES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className={UI.label} style={{ color: T.text2 }}>
                              Equipamento
                            </label>
                            <select
                              value={form.equipamento}
                              onChange={(e) => setField("equipamento", e.target.value)}
                              className={cx(UI.select, "mt-1 rounded-md")}
                              style={{ borderColor: T.border }}
                            >
                              <option value="">Selecione…</option>
                              {EQUIPAMENTOS.map((eq) => (
                                <option key={eq} value={eq}>
                                  {eq}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className={UI.label} style={{ color: T.text2 }}>
                              SS
                            </label>
                            <input
                              value={(form as any).ss}
                              onChange={(e) => setField("ss", e.target.value)}
                              className={cx(UI.input, "mt-1 rounded-md")}
                              style={{ borderColor: T.border }}
                              placeholder="Ex: 8699366"
                              inputMode="numeric"
                            />
                          </div>

                          <div>
                            <label className={UI.label} style={{ color: T.text2 }}>
                              Alarme
                            </label>
                            <select
                              value={form.alarme}
                              onChange={(e) => setField("alarme", e.target.value)}
                              className={cx(UI.select, "mt-1 rounded-md")}
                              style={{ borderColor: T.border }}
                            >
                              <option value="">Selecione…</option>
                              {Object.keys(ALARME_TO_MOTIVO).map((a) => (
                                <option key={a} value={a}>
                                  {a}
                                </option>
                              ))}
                            </select>
                            <div className="mt-1 text-xs" style={{ color: T.text3 }}>
                              {form.alarme ? (
                                <>
                                  Sugestão:{" "}
                                  <span style={{ color: T.accent, fontWeight: 600 }}>
                                    {ALARME_TO_MOTIVO[form.alarme] ?? "-"}
                                  </span>
                                </>
                              ) : (
                                "Selecione um alarme para ver sugestão."
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-8 grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={UI.label} style={{ color: T.text2 }}>
                              Motivo da mobilização
                            </label>
                            <textarea
                              value={(form as any).motivo_mobilizacao}
                              onChange={(e) => setField("motivo_mobilizacao", e.target.value)}
                              className={cx(UI.textarea, "mt-1 rounded-md")}
                              style={{ borderColor: T.border }}
                              placeholder="Ex: Subtensão recorrente no inversor..."
                            />
                          </div>

                          <div>
                            <label className={UI.label} style={{ color: T.text2 }}>
                              Problema identificado
                            </label>
                            <textarea
                              value={(form as any).problema_identificado}
                              onChange={(e) => setField("problema_identificado", e.target.value)}
                              className={cx(UI.textarea, "mt-1 rounded-md")}
                              style={{ borderColor: T.border }}
                              placeholder="Ex: Disjuntor desarmado / falha na fonte..."
                            />
                          </div>

                          <div>
                            <label className={UI.label} style={{ color: T.text2 }}>
                              Solução imediata
                            </label>
                            <textarea
                              value={(form as any).solucao_imediata}
                              onChange={(e) => setField("solucao_imediata", e.target.value)}
                              className={cx(UI.textarea, "mt-1 rounded-md")}
                              style={{ borderColor: T.border }}
                              placeholder="Ex: Reset e testes de operação..."
                            />
                          </div>

                          <div>
                            <label className={UI.label} style={{ color: T.text2 }}>
                              Solução definitiva
                            </label>
                            <textarea
                              value={(form as any).solucao_definitiva}
                              onChange={(e) => setField("solucao_definitiva", e.target.value)}
                              className={cx(UI.textarea, "mt-1 rounded-md")}
                              style={{ borderColor: T.border }}
                              placeholder="Ex: Substituição do componente..."
                            />
                          </div>
                        </div>

                        <div className="flex  justify-end gap-3 flex-wrap">
                          <Btn tone="primary" onClick={submitDrives} disabled={loadingDrives} loading={loadingDrives}>
                            Salvar acionamento
                          </Btn>
                        </div>

                        <MsgBox m={msgDrives} />
                      </div>
                    </div>
                  </div>
                )}

                {/* PERDAS */}
                {tab === "loss" && (
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className={UI.sectionTitle} style={{ color: T.text }}>
                          Registro de perdas
                        </div>
                        <div className={UI.sectionHint} style={{ color: T.text3 }}>
                          Informe em horas (vírgula ou ponto).
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TabBtn active={!lossBulk} onClick={() => setLossBulk(false)}>
                          Normal
                        </TabBtn>
                        <TabBtn active={lossBulk} onClick={() => setLossBulk(true)}>
                          Em massa
                        </TabBtn>
                      </div>
                    </div>

                    {lossBulk ? (
                      <div className="grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-3">
                            <label className={UI.label} style={{ color: T.text2 }}>
                              Início
                            </label>
                            <input
                              type="date"
                              value={bulkStart}
                              onChange={(e) => setBulkStart(e.target.value)}
                              className={cx(UI.input, "mt-1 rounded-md")}
                              style={{ borderColor: T.border }}
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className={UI.label} style={{ color: T.text2 }}>
                              Fim
                            </label>
                            <input
                              type="date"
                              value={bulkEnd}
                              onChange={(e) => setBulkEnd(e.target.value)}
                              className={cx(UI.input, "mt-1 rounded-md")}
                              style={{ borderColor: T.border }}
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className={UI.label} style={{ color: T.text2 }}>
                              Equipamento
                            </label>
                            <select
                              value={bulkEquip}
                              onChange={(e) => setBulkEquip(e.target.value as any)}
                              className={cx(UI.select, "mt-1 rounded-md")}
                              style={{ borderColor: T.border }}
                            >
                              <option value="cmp">CMP</option>
                              <option value="skid">SKID</option>
                              <option value="inversor">INVERSOR</option>
                              <option value="tcu">TCU</option>
                              <option value="ncu">NCU</option>
                              <option value="string">STRING</option>
                            </select>
                          </div>

                          <div className="md:col-span-3 p-3 border rounded-md" style={{ borderColor: T.border, background: T.mutedBg }}>
                            <div className="text-[11px] font-medium" style={{ color: T.text3 }}>
                              Prévia
                            </div>
                            <div className="mt-2 text-sm font-semibold" style={{ color: T.accent }}>
                              {(() => {
                                const days = isIsoDate(bulkStart) && isIsoDate(bulkEnd) ? eachDayISO(bulkStart, bulkEnd) : [];
                                const total = Number(String(bulkTotal || "").replace(",", "."));
                                if (!days.length || !Number.isFinite(total) || total <= 0) return "—";
                                return `${days.length} dias`;
                              })()}
                            </div>
                            <div className="mt-1 text-[11px]" style={{ color: T.text3 }}>
                              Ajusta o último dia.
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className={UI.label} style={{ color: T.text2 }}>
                            Total de horas (período)
                          </label>
                          <input
                            value={bulkTotal}
                            onChange={(e) => setBulkTotal(e.target.value)}
                            className={cx(UI.input, "mt-1 rounded-md")}
                            style={{ borderColor: T.border }}
                            placeholder="ex: 18,00"
                            inputMode="decimal"
                          />
                          <div className={cx(UI.help, "mt-1")} style={{ color: T.text3 }}>
                            Exemplo: 18h em 2 dias → 9h + 9h.
                          </div>
                        </div>

                        <Btn tone="primary" onClick={submitLossBulk} disabled={loadingLoss} loading={loadingLoss}>
                          Salvar perdas em massa
                        </Btn>

                        <MsgBox m={msgLoss} />
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                          {(["cmp", "skid", "inversor", "tcu", "ncu", "string"] as const).map((k) => (
                            <div key={k} className="border p-4 rounded-lg" style={{ borderColor: T.border, background: T.card }}>
                              <div className="flex items-center justify-between">
                                <div className="text-[11px] font-medium uppercase" style={{ color: T.text3 }}>
                                  {k}
                                </div>
                                <span className="text-[11px]" style={{ color: T.text3 }}>
                                  h
                                </span>
                              </div>
                              <input
                                value={(form as any)[k]}
                                onChange={(e) => setField(k, e.target.value)}
                                className={cx(UI.input, "mt-2 rounded-md")}
                                style={{ borderColor: T.border }}
                                placeholder="ex: 1,50"
                                inputMode="decimal"
                              />
                              <div className="mt-1 text-[11px]" style={{ color: T.text3 }}>
                                Somente número.
                              </div>
                            </div>
                          ))}
                        </div>

                        <Btn tone="primary" onClick={submitLoss} disabled={loadingLoss} loading={loadingLoss}>
                          Salvar perdas
                        </Btn>

                        <MsgBox m={msgLoss} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Global focus ring using your tokens */}
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
