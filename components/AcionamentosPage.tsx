"use client";

import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { downloadText, toCsv, type DriveRow } from "@/lib/exporters";
import { SplitShell } from "@/components/SplitShell";
import { Pencil, Trash2, Copy } from "lucide-react";

type AcoView = "cadastro" | "base" | "perdas";
type DbView = "base" | "perdas";

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

/* =========================================================
   UI PRIMITIVES (premium)
========================================================= */

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

type ToastTone = "ok" | "err" | "info";
function useToasts() {
  const [toasts, setToasts] = useState<Array<{ id: string; tone: ToastTone; text: string }>>([]);

  const push = (tone: ToastTone, text: string) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setToasts((p) => [...p, { id, tone, text }]);
    window.setTimeout(() => {
      setToasts((p) => p.filter((t) => t.id !== id));
    }, 2200);
  };

  const ToastHost = () => (
    <div className="fixed z-[80] right-4 top-4 flex flex-col gap-2 w-[320px] max-w-[92vw]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            "rounded-2xl border shadow-[0_18px_60px_-30px_rgba(0,0,0,0.28)] px-4 py-3 text-sm",
            "backdrop-blur bg-white/92",
            t.tone === "ok" && "border-emerald-500/25 text-emerald-800",
            t.tone === "err" && "border-red-500/25 text-red-700",
            t.tone === "info" && "border-black/10 text-black/70"
          )}
        >
          <div className="font-semibold">{t.text}</div>
        </div>
      ))}
    </div>
  );

  return { push, ToastHost };
}

function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "green" | "amber" | "red";
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold border",
        tone === "neutral" && "border-black/10 bg-black/[0.03] text-black/60",
        tone === "green" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
        tone === "amber" && "border-amber-500/25 bg-amber-500/10 text-amber-800",
        tone === "red" && "border-red-500/25 bg-red-500/10 text-red-700"
      )}
    >
      {children}
    </span>
  );
}

function Button({
  variant = "ghost",
  loading,
  disabled,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  loading?: boolean;
}) {
  const base =
    "px-3 py-2 rounded-xl text-sm font-semibold border transition inline-flex items-center justify-center gap-2 " +
    "active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "border-black/10 bg-[#2E7B57] text-white hover:brightness-110"
      : variant === "danger"
      ? "border-red-500/20 bg-red-500/10 text-red-700 hover:bg-red-500/15"
      : "border-black/10 bg-black/[0.03] text-black/75 hover:bg-black/[0.06]";

  return (
    <button className={cx(base, styles)} disabled={disabled || loading} {...props}>
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

/** Collapse animado sem biblioteca (altura automática) */
function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const [h, setH] = useState<number>(0);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const measure = () => setH(el.scrollHeight);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  return (
    <div
      className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
      style={{ maxHeight: open ? h : 0, opacity: open ? 1 : 0 }}
      aria-hidden={!open}
    >
      <div ref={ref}>{children}</div>
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

// ISO week code in UTC (prevents timezone weirdness)
function isoWeekCodeUTC(dateStr: string) {
  if (!isIsoDate(dateStr)) return "";
  const d = new Date(`${dateStr}T00:00:00Z`);
  const tmp = new Date(d);
  const day = tmp.getUTCDay() || 7; // 1..7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day); // Thu
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

function todayISO() {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
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
   LOSS TYPES / HELPERS
========================================================= */

type LossRow = {
  id: string;
  data: string; // YYYY-MM-DD
  usina: string;
  cmp: number | null;
  skid: number | null;
  inversor: number | null;
  tcu: number | null;
  ncu: number | null;
  string: number | null;
};

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

type LossKey = "cmp" | "skid" | "inversor" | "tcu" | "ncu" | "string";

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
   MODAL (menor, central, bonito)
========================================================= */

function Modal({
  children,
  onClose,
  title,
  subtitle,
  size = "md",
}: {
  children: ReactNode;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: "sm" | "md";
}) {
  useLockBodyScroll(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const maxW = size === "sm" ? "max-w-[520px]" : "max-w-[720px]";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cx(
          "w-full",
          maxW,
          "rounded-2xl border bg-white text-black",
          "border-black/10 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.6)]"
        )}
      >
        <div className="px-4 py-3 border-b border-black/10">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              {title && <div className="text-sm font-extrabold truncate">{title}</div>}
              {subtitle && <div className="text-[11px] text-black/50">{subtitle}</div>}
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg border border-black/10 text-black/60 hover:bg-black/[0.05] transition"
              aria-label="Fechar modal"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-4 py-4">{children}</div>
      </div>
    </div>
  );
}

/* =========================================================
   AUTOCOMPLETE USINA (premium)
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
        className={cx(
          "w-full h-10 rounded-xl px-3 border outline-none transition text-sm",
          "bg-white text-black border-black/15",
          "focus:ring-1 focus:ring-[#2E7B57]"
        )}
        placeholder={placeholder}
        autoComplete="off"
      />

      {open && (
        <div
          className={cx(
            "absolute z-40 mt-1 w-full max-h-64 overflow-auto",
            "rounded-xl border border-black/10 bg-white",
            "shadow-[0_18px_60px_-30px_rgba(0,0,0,0.35)]"
          )}
        >
          {loading && <div className="px-3 py-2 text-xs text-black/50">Carregando…</div>}

          {!loading && filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-black/50">Nenhuma usina encontrada</div>
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
                className={cx(
                  "w-full text-left px-3 py-2 text-sm transition",
                  i === highlight
                    ? "bg-[#2E7B57]/10 text-[#2E7B57] font-semibold"
                    : "hover:bg-black/[0.04]"
                )}
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
   PAGE SHELL
========================================================= */

export function AcionamentosPage() {
  const [view, setView] = useState<AcoView>("cadastro");

  const muted = "text-black/55";
  const input =
    "w-full h-10 rounded-xl px-3 border outline-none transition text-sm " +
    "bg-white text-black border-black/15 focus:ring-1 focus:ring-[#2E7B57]";

  const [q, setQ] = useState("");

  const groups = useMemo(
    () => [
      {
        id: "nav",
        title: "Navegação",
        items: [
          { id: "cadastro", title: "Cadastro", hint: "Cadastrar Perdas ou Acionamentos" },
          { id: "base", title: "Base Acionamentos", hint: "Alterar Acionamentos" },
          { id: "perdas", title: "Base Perdas", hint: "Alterar Perdas" },
        ],
      },
    ],
    []
  );

  const filteredGroups = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return groups;

    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => `${it.title} ${it.hint}`.toLowerCase().includes(term)),
      }))
      .filter((g) => g.items.length > 0);
  }, [q, groups]);

  return (
    <SplitShell
      sidebar={
        <aside className="w-[360px] border-r flex flex-col border-black/10 bg-white">
          <div className="p-4 border-b border-black/10">
            <div className="font-extrabold text-lg">Perdas e Acionamentos</div>
            <p className={cx("text-xs mt-1", muted)}>Escolha uma aba e visualize no painel.</p>

            <div className="mt-3">
              <input value={q} onChange={(e) => setQ(e.target.value)} className={input} placeholder="Buscar…" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {filteredGroups.map((g) => (
              <div key={g.id}>
                <div className={cx("text-xs font-bold uppercase px-2 mb-2", muted)}>{g.title}</div>

                <div className="space-y-1">
                  {g.items.map((it) => {
                    const active = view === (it.id as AcoView);

                    return (
                      <button
                        key={it.id}
                        onClick={() => setView(it.id as AcoView)}
                        type="button"
                        className={cx(
                          "w-full text-left px-3 py-2 rounded-xl border transition flex items-center gap-3",
                          active ? "bg-black/[0.04] border-[#2E7B57]/30" : "bg-white border-black/10 hover:bg-black/[0.03]"
                        )}
                      >
                        <span
                          className={cx(
                            "w-5 h-5 rounded-full border flex items-center justify-center shrink-0",
                            active ? "border-[#2E7B57]/40 bg-[#2E7B57]/10" : "border-black/15 bg-black/[0.03]"
                          )}
                          aria-hidden
                        >
                          <span className={cx("w-2.5 h-2.5 rounded-full", active ? "bg-[#2E7B57]" : "bg-black/20")} />
                        </span>

                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">{it.title}</div>
                          <div className={cx("text-xs truncate", muted)}>{active ? "Selecionado" : it.hint}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-black/10">
            <div className={cx("text-xs", muted)}>Dica: clique no card para copiar o texto.</div>
          </div>
        </aside>
      }
    >
      <div className="h-full min-w-0 overflow-y-auto">
        {view === "cadastro" && (
          <div className="p-4">
            <AcionamentosCadastro />
          </div>
        )}

        {view === "base" && (
          <div className="p-0">
            <BancoDeDadosDrives view="base" />
          </div>
        )}

        {view === "perdas" && (
          <div className="p-0">
            <BancoDeDadosLoss view="perdas" />
          </div>
        )}
      </div>
    </SplitShell>
  );
}

/* =========================================================
   CADASTRO
========================================================= */

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
    GERAL: "Falta de energia / eventos externos",
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

  // bulk
  const [lossBulk, setLossBulk] = useState(false);
  const [bulkStart, setBulkStart] = useState(form.data);
  const [bulkEnd, setBulkEnd] = useState(form.data);
  const [bulkTotal, setBulkTotal] = useState("");
  const [bulkEquip, setBulkEquip] = useState<LossKey>("inversor");

  // usinas
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

  const input =
    "mt-1 w-full h-10 rounded-xl px-3 border outline-none transition text-sm " +
    "bg-white text-black border-black/15 focus:ring-1 focus:ring-[#2E7B57]";

  const card =
    "rounded-2xl border shadow-[0_18px_60px_-30px_rgba(0,0,0,0.18)] border-black/10 bg-white";

  const muted = "text-black/55";

  const MsgBox = ({ m }: { m: { type: "ok" | "err"; text: string } | null }) => {
    if (!m) return null;
    return (
      <div
        className={cx(
          "text-sm p-3 rounded-xl border",
          m.type === "ok"
            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
            : "bg-red-500/10 text-red-700 border-red-500/20"
        )}
      >
        {m.text}
      </div>
    );
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

    if (!isIsoDate(bulkStart) || !isIsoDate(bulkEnd)) {
      return setMsgLoss({ type: "err", text: "Datas inválidas (use YYYY-MM-DD)." });
    }

    const days = eachDayISO(bulkStart, bulkEnd);
    if (!days.length) return setMsgLoss({ type: "err", text: "Período inválido (início > fim?)" });

    const total = Number(String(bulkTotal || "").replace(",", "."));
    if (!Number.isFinite(total) || total <= 0) {
      return setMsgLoss({ type: "err", text: "Informe um total de horas válido." });
    }

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

      setMsgLoss({
        type: "ok",
        text: `Perdas em massa salvas ✅ (${days.length} dias • ${total}h em ${bulkEquip.toUpperCase()})`,
      });

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
    <section className="w-full h-full min-w-0 bg-transparent">
      <div className="px-6 pt-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-xl font-extrabold">Cadastro</div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">
          {/* ESQUERDA */}
          <div className={cx(card, "w-full min-w-0")}>
            <div className="p-6 border-b border-black/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={cx("text-xs", muted)}>Data</label>
                  <input type="date" value={form.data} onChange={(e) => setField("data", e.target.value)} className={input} />
                </div>

                <div>
                  <label className={cx("text-xs", muted)}>Semana</label>
                  <input value={form.semana} readOnly className={cx(input, "opacity-80")} />
                </div>

                <div>
                  <label className={cx("text-xs", muted)}>Usina</label>
                  <UsinaAutocomplete
                    value={form.usina}
                    onChange={(v) => setField("usina", v)}
                    options={usinasList}
                    loading={usinasLoading}
                    placeholder="Digite a usina…"
                  />
                  <div className={cx("text-[11px] mt-1", muted)}>
                    {usinasLoading ? "Buscando usinas…" : `${usinasList.length} usinas disponíveis`}
                  </div>
                </div>
              </div>
            </div>

            {/* LOSS */}
            <div className="p-6 grid gap-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-black/80">Perdas</div>
                  <div className={cx("text-xs mt-1", muted)}>
                    {lossBulk
                      ? "Cadastre em massa: período + total de horas → uma linha por dia."
                      : "Envie as perdas em horas (Considere o dia com 9h)"}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setLossBulk((p) => !p);
                    const d = form.data;
                    setBulkStart(d);
                    setBulkEnd(d);
                    setBulkEquip("inversor");
                    setBulkTotal("");
                  }}
                >
                  {lossBulk ? "Modo normal" : "Modo em massa"}
                </Button>
              </div>

              {lossBulk ? (
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={cx("text-xs", muted)}>Início</label>
                      <input type="date" value={bulkStart} onChange={(e) => setBulkStart(e.target.value)} className={input} />
                    </div>
                    <div>
                      <label className={cx("text-xs", muted)}>Fim</label>
                      <input type="date" value={bulkEnd} onChange={(e) => setBulkEnd(e.target.value)} className={input} />
                    </div>
                    <div>
                      <label className={cx("text-xs", muted)}>Equipamento</label>
                      <select value={bulkEquip} onChange={(e) => setBulkEquip(e.target.value as any)} className={input}>
                        <option value="cmp">CMP</option>
                        <option value="skid">SKID</option>
                        <option value="inversor">INVERSOR</option>
                        <option value="tcu">TCU</option>
                        <option value="ncu">NCU</option>
                        <option value="string">STRING</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={cx("text-xs", muted)}>Total de horas (período)</label>
                      <input
                        value={bulkTotal}
                        onChange={(e) => setBulkTotal(e.target.value)}
                        className={input}
                        placeholder="ex: 18,00"
                        inputMode="decimal"
                      />
                    </div>

                    <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3">
                      <div className="text-xs font-bold text-black/50">Prévia</div>
                      <div className="mt-1 text-sm text-black/70">
                        {(() => {
                          const days =
                            isIsoDate(bulkStart) && isIsoDate(bulkEnd) ? eachDayISO(bulkStart, bulkEnd) : [];
                          const total = Number(String(bulkTotal || "").replace(",", "."));
                          if (!days.length || !Number.isFinite(total) || total <= 0) return "Preencha período e total…";
                          const vals = splitTotalAcrossDays(total, days.length);
                          return `${days.length} dias • ${total}h → ${vals[0]}h/dia (último dia ajusta)`;
                        })()}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={submitLossBulk}
                    disabled={loadingLoss}
                    className="w-full rounded-xl py-3 font-extrabold transition disabled:opacity-50 disabled:cursor-not-allowed bg-[#2E7B57] text-white hover:brightness-110"
                  >
                    {loadingLoss ? "Salvando em massa…" : "Gerar + Enviar Perdas em Massa"}
                  </button>

                  <MsgBox m={msgLoss} />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(["cmp", "skid", "inversor", "tcu", "ncu", "string"] as const).map((k) => (
                      <div key={k}>
                        <label className={cx("text-xs uppercase", muted)}>{k}</label>
                        <input
                          value={(form as any)[k]}
                          onChange={(e) => setField(k, e.target.value)}
                          className={input}
                          placeholder="ex: 18,00"
                          inputMode="decimal"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={submitLoss}
                    disabled={loadingLoss}
                    className="w-full rounded-xl py-3 font-extrabold transition disabled:opacity-50 disabled:cursor-not-allowed bg-[#2E7B57] text-white hover:brightness-110"
                  >
                    {loadingLoss ? "Salvando…" : "Enviar Perdas"}
                  </button>

                  <MsgBox m={msgLoss} />
                </>
              )}
            </div>
          </div>

          {/* DIREITA (DRIVES) */}
          <div className={cx(card, "w-full min-w-0")}>
            <div className="p-6 grid gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cx("text-xs", muted)}>Cliente</label>
                  <select value={form.cliente} onChange={(e) => setField("cliente", e.target.value)} className={input}>
                    <option value="">Selecione…</option>
                    {CLIENTES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={cx("text-xs", muted)}>Equipamento</label>
                  <select value={form.equipamento} onChange={(e) => setField("equipamento", e.target.value)} className={input}>
                    <option value="">Selecione…</option>
                    {EQUIPAMENTOS.map((eq) => (
                      <option key={eq} value={eq}>
                        {eq}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cx("text-xs", muted)}>Alarme</label>
                  <select value={form.alarme} onChange={(e) => setField("alarme", e.target.value)} className={input}>
                    <option value="">Selecione…</option>
                    {Object.keys(ALARME_TO_MOTIVO).map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <div className={cx("text-[11px] mt-1", muted)}>
                    {form.alarme ? `Sugestão motivo: ${ALARME_TO_MOTIVO[form.alarme] ?? "-"}` : " "}
                  </div>
                </div>

                <div>
                  <label className={cx("text-xs", muted)}>SS</label>
                  <input
                    value={(form as any).ss}
                    onChange={(e) => setField("ss", e.target.value)}
                    className={input}
                    placeholder="Ex: 8699366"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cx("text-xs", muted)}>Motivo da mobilização</label>
                  <input value={(form as any).motivo_mobilizacao} onChange={(e) => setField("motivo_mobilizacao", e.target.value)} className={input} />
                </div>
                <div>
                  <label className={cx("text-xs", muted)}>Problema identificado</label>
                  <input value={(form as any).problema_identificado} onChange={(e) => setField("problema_identificado", e.target.value)} className={input} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cx("text-xs", muted)}>Solução imediata</label>
                  <input value={(form as any).solucao_imediata} onChange={(e) => setField("solucao_imediata", e.target.value)} className={input} />
                </div>
                <div>
                  <label className={cx("text-xs", muted)}>Solução definitiva</label>
                  <input value={(form as any).solucao_definitiva} onChange={(e) => setField("solucao_definitiva", e.target.value)} className={input} />
                </div>
              </div>

              <button
                type="button"
                onClick={submitDrives}
                disabled={loadingDrives}
                className="w-full rounded-xl py-3 font-extrabold transition disabled:opacity-50 disabled:cursor-not-allowed bg-[#2E7B57] text-white hover:brightness-110"
              >
                {loadingDrives ? "Salvando…" : "Enviar Acionamentos"}
              </button>

              <MsgBox m={msgDrives} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   BASE ACIONAMENTOS (CRUD + filtros + copiar)
========================================================= */

function BancoDeDadosDrives({ view }: { view: DbView }) {
  const { push, ToastHost } = useToasts();

  const [openId, setOpenId] = useState<string | null>(null);

  const topTitle = "Base de acionamentos";
  const muted = "text-black/55";

  const input =
    "w-full h-10 rounded-xl px-3 border outline-none transition text-sm " +
    "bg-white text-black border-black/15 focus:ring-1 focus:ring-[#2E7B57]";

  const btn = (variant: "primary" | "ghost" | "danger" = "ghost") =>
    cx(
      "px-3 py-2 rounded-xl text-sm font-semibold border transition inline-flex items-center justify-center gap-2",
      "active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
      variant === "primary" && "border-black/10 bg-[#2E7B57] text-white hover:brightness-110",
      variant === "danger" && "border-red-500/20 bg-red-500/10 text-red-700 hover:bg-red-500/15",
      variant === "ghost" && "border-black/10 bg-black/[0.03] text-black/75 hover:bg-black/[0.06]"
    );

  const chip = (tone: "neutral" | "ok" | "warn" = "neutral") =>
    cx(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border",
      tone === "neutral" && "border-black/10 bg-black/[0.03] text-black/70",
      tone === "ok" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
      tone === "warn" && "border-amber-500/20 bg-amber-500/10 text-amber-700"
    );

  const pill = (tone: "green" | "amber" | "neutral" = "neutral") =>
    cx(
      "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold border",
      tone === "neutral" && "border-black/10 bg-black/[0.03] text-black/60",
      tone === "green" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
      tone === "amber" && "border-amber-500/25 bg-amber-500/10 text-amber-800"
    );

  const toneForAlarm = (a?: string | null) => {
    const v = String(a || "").toUpperCase();
    if (v === "PROGRAMADO") return "neutral";
    if (v) return "amber";
    return "neutral";
  };

  const norm = (v: any) => (v === "" ? null : v);

  // usinas filtro
  const [usinas, setUsinas] = useState<string[]>([]);
  const [usinasLoading, setUsinasLoading] = useState(false);
  const [usina, setUsina] = useState("");

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
        if (alive) setUsinas(list);
      } finally {
        if (alive) setUsinasLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // equipamentos filtro (opcional)
  const [equipamentos, setEquipamentos] = useState<string[]>([]);
  const [equipLoading, setEquipLoading] = useState(false);
  const [equipamento, setEquipamento] = useState("");

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

  // período default hoje
  const [periodPreset, setPeriodPreset] = useState<"today" | "yesterday" | "thisMonth" | "lastMonth" | "last7" | "last30">("today");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

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

  const startDate = start ? new Date(`${start}T00:00:00`) : null;
  const endDate = end ? new Date(`${end}T00:00:00`) : null;

  const invalidRange =
    !!startDate && !!endDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())
      ? startDate.getTime() > endDate.getTime()
      : false;

  // list/crud
  const [rows, setRows] = useState<DriveRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const limit = 6;
  const [offset, setOffset] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<DriveRow | null>(null);
  const [saving, setSaving] = useState(false);

  const setError = (m: string) => setErr(m);
  const clearError = () => setErr("");

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
    if (!start || !end) return setError("Selecione um Período (início e fim).");
    if (invalidRange) return setError("A data inicial não pode ser maior que a data final.");

    clearError();
    setLoading(true);
    try {
      const res = await fetch(`/api/acionamentos?${buildParams(newOffset, limit).toString()}`, { method: "GET" });
      const data = await res.json().catch(() => null);
      if (!res.ok) return setError(data?.error || "Erro ao carregar base.");
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setOffset(newOffset);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view !== "base") return;
    if (!start || !end) return;
    if (invalidRange) return;
    const t = window.setTimeout(() => loadTable(0), 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, start, end, invalidRange, usina, equipamento]);

  const exportCsv = () => {
    if (!rows.length) return setError("Nada para exportar.");
    clearError();
    const csv = "\uFEFF" + toCsv(rows);
    downloadText("acionamentos.csv", csv, "text/csv;charset=utf-8");
  };

  const copyCard = async (r: DriveRow) => {
    try {
      const txt = rowToClipboardText(r);
      await navigator.clipboard.writeText(txt);
      push("ok", "Copiado ✅");
    } catch {
      push("err", "Não consegui copiar (permissão do navegador).");
    }
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm("Excluir este registro? Essa ação não pode ser desfeita.");
    if (!ok) return;

    clearError();
    try {
      const res = await fetch(`/api/acionamentos/${id}?mode=drives`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) return setError(data?.error || "Erro ao excluir.");
      setRows((p) => p.filter((r) => (r as any).id !== id));
    } catch {
      setError("Erro de conexão.");
    }
  };

  const openEdit = (r: DriveRow) => {
    if (!(r as any)?.id) return setError("Registro sem ID (não veio do banco).");
    setEditing({ ...(r as any) });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!(editing as any)?.id) return;
    setSaving(true);
    clearError();

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

      if (!res.ok) return setError(data?.error || raw || `Erro ao salvar edição (HTTP ${res.status})`);

      const nextRow = { ...(editing as any), ...payload } as DriveRow;
      setRows((p) => p.map((r) => ((r as any).id === (editing as any).id ? nextRow : r)));

      setEditOpen(false);
      setEditing(null);
      push("ok", "Registro atualizado ✅");
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  };

  const page = Math.floor(offset / limit) + 1;

  const topHint = useMemo(() => {
    if (!start || !end) return null;
    const parts = [
      `${brDate(start)} → ${brDate(end)}`,
      usina ? clampUpper(usina) : null,
      equipamento ? `Equip: ${equipamento}` : null,
    ].filter(Boolean);
    return parts.join(" • ");
  }, [start, end, usina, equipamento]);

  return (
    <section className="w-full h-full min-w-0 bg-transparent">
      <ToastHost />

      <div className="px-6 pt-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xl font-extrabold">{topTitle}</div>
              {topHint && <span className={chip("neutral")}>{topHint}</span>}
              <span className={chip("ok")}>Clique no card para copiar</span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <Button variant="ghost" onClick={exportCsv} disabled={!rows.length} type="button">
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 sticky top-0 z-20 bg-[#f6f7f8]/85 backdrop-blur border-y border-black/10">
        <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <label className={cx("text-xs", muted)}>Usina</label>
            <select className={input} value={usina} onChange={(e) => setUsina(e.target.value)} disabled={usinasLoading}>
              <option value="">{usinasLoading ? "Carregando usinas..." : "Todas"}</option>
              {usinas.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label className={cx("text-xs", muted)}>Equipamento (opcional)</label>
            <select className={input} value={equipamento} onChange={(e) => setEquipamento(e.target.value)} disabled={equipLoading}>
              <option value="">{equipLoading ? "Carregando equipamentos..." : "Todos"}</option>
              {equipamentos.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label className={cx("text-xs", muted)}>Período</label>
            <select
              className={input}
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
          </div>
        </div>

        {!!err && (
          <div className="pb-4 text-sm rounded-xl px-3 py-2 border bg-red-500/10 text-red-700 border-red-500/20">
            {err}
          </div>
        )}
      </div>

      <div className="px-6 py-6">
        {!loading && rows.length === 0 && (
          <div className="py-16 flex items-center justify-center">
            <div className="w-full rounded-2xl border border-black/10 bg-white p-6 text-center shadow-[0_18px_60px_-30px_rgba(0,0,0,0.12)]">
              <div className="text-base font-extrabold">Sem registros</div>
              <div className={cx("text-sm mt-2", muted)}>Nenhum registro encontrado para o período selecionado.</div>
            </div>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="h-4 w-40 bg-black/[0.06] rounded mb-3" />
                <div className="h-3 w-64 bg-black/[0.05] rounded mb-2" />
                <div className="h-3 w-56 bg-black/[0.05] rounded mb-4" />
                <div className="h-8 w-28 bg-black/[0.06] rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {!loading && rows.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {rows.map((r: any) => {
                const opened = openId === r.id;

                return (
                  <div
                    key={r.id}
                    className={cx(
                      "rounded-2xl border bg-white overflow-hidden",
                      "border-black/10 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.18)]",
                      "transition hover:shadow-[0_22px_70px_-34px_rgba(0,0,0,0.24)]"
                    )}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => copyCard(r)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") copyCard(r);
                      }}
                      className="w-full text-left px-4 py-4 hover:bg-black/[0.02] transition cursor-copy"
                      title="Clique para copiar"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="text-sm font-extrabold tracking-tight">{clampUpper(String(r.usina || ""))}</span>
                            <Badge tone="neutral">{brDate(r.data)}</Badge>
                            <Badge tone="green">{r.equipamento ?? "-"}</Badge>
                            <Badge tone={toneForAlarm(r.alarme) === "amber" ? "amber" : "neutral"}>Alarme: {r.alarme ?? "-"}</Badge>
                            {r.ss ? <Badge tone="neutral">SS {r.ss}</Badge> : null}
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-1.5">
                            <div className="text-xs text-black/55">
                              <span className="font-semibold text-black/70">Motivo:</span>{" "}
                              <span className="truncate inline-block max-w-[92%]" title={r.motivo_mobilizacao ?? ""}>
                                {r.motivo_mobilizacao ?? "-"}
                              </span>
                            </div>

                            <div className="text-xs text-black/55">
                              <span className="font-semibold text-black/70">Problema:</span>{" "}
                              <span className="truncate inline-block max-w-[92%]" title={r.problema_identificado ?? ""}>
                                {r.problema_identificado ?? "-"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenId((p) => (p === r.id ? null : r.id));
                          }}
                          className={pill("neutral")}
                          title="Abrir detalhes"
                        >
                          {opened ? "Fechar" : "Detalhes"}
                        </button>
                      </div>
                    </div>

                    <Collapse open={opened}>
                      <div className="px-4 pb-4">
                        <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs font-bold text-black/50">Solução imediata</div>
                              <div className="mt-1 text-sm text-black/70 whitespace-pre-wrap">{r.solucao_imediata ?? "-"}</div>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-black/50">Solução definitiva</div>
                              <div className="mt-1 text-sm text-black/70 whitespace-pre-wrap">{r.solucao_definitiva ?? "-"}</div>
                            </div>
                          </div>
                        </div>

                        <div className="py-4 flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(r);
                            }}
                            type="button"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(r.id);
                            }}
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Collapse>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 px-1 flex items-center justify-between">
              <Button variant="ghost" onClick={() => loadTable(Math.max(0, offset - limit))} disabled={loading || offset === 0}>
                Anterior
              </Button>
              <div className={cx("text-xs", muted)}>Página {page}</div>
              <Button variant="ghost" onClick={() => loadTable(offset + limit)} disabled={loading || rows.length < limit}>
                Próxima
              </Button>
            </div>
          </>
        )}
      </div>

      {/* MODAL EDIT (DRIVES) */}
      {editOpen && editing && (
        <Modal
          size="sm"
          title="Editar acionamento"
          subtitle="Campos vazios viram NULL."
          onClose={() => {
            setEditOpen(false);
            setEditing(null);
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={cx("text-[11px] font-bold", muted)}>Data</label>
              <input
                className={input}
                type="date"
                value={(editing as any).data}
                onChange={(e) => setEditing((p) => (p ? ({ ...p, data: e.target.value } as any) : p))}
              />
            </div>

            <div>
              <label className={cx("text-[11px] font-bold", muted)}>Usina</label>
              <input
                className={input}
                value={clampUpper(String((editing as any).usina || ""))}
                onChange={(e) => setEditing((p) => (p ? ({ ...p, usina: clampUpper(e.target.value) } as any) : p))}
              />
            </div>

            <div>
              <label className={cx("text-[11px] font-bold", muted)}>Cliente</label>
              <input
                className={input}
                value={String((editing as any).cliente ?? "")}
                onChange={(e) => setEditing((p) => (p ? ({ ...p, cliente: e.target.value } as any) : p))}
              />
            </div>

            <div>
              <label className={cx("text-[11px] font-bold", muted)}>Equipamento</label>
              <input
                className={input}
                value={String((editing as any).equipamento ?? "")}
                onChange={(e) => setEditing((p) => (p ? ({ ...p, equipamento: e.target.value } as any) : p))}
              />
            </div>

            <div>
              <label className={cx("text-[11px] font-bold", muted)}>Alarme</label>
              <input
                className={input}
                value={String((editing as any).alarme ?? "")}
                onChange={(e) => setEditing((p) => (p ? ({ ...p, alarme: e.target.value } as any) : p))}
              />
            </div>

            <div>
              <label className={cx("text-[11px] font-bold", muted)}>SS</label>
              <input
                className={input}
                inputMode="numeric"
                value={String((editing as any).ss ?? "")}
                onChange={(e) => setEditing((p) => (p ? ({ ...p, ss: e.target.value } as any) : p))}
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3">
            {[
              ["motivo_mobilizacao", "Motivo da mobilização"],
              ["problema_identificado", "Problema identificado"],
              ["solucao_imediata", "Solução imediata"],
              ["solucao_definitiva", "Solução definitiva"],
            ].map(([k, label]) => (
              <div key={k}>
                <label className={cx("text-[11px] font-bold", muted)}>{label}</label>
                <input
                  className={input}
                  value={String((editing as any)[k] ?? "")}
                  onChange={(e) => setEditing((p) => (p ? ({ ...p, [k]: e.target.value } as any) : p))}
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            <button
              className={btn("ghost") + " flex-1"}
              onClick={() => {
                setEditOpen(false);
                setEditing(null);
              }}
              disabled={saving}
              type="button"
            >
              Cancelar
            </button>
            <button className={btn("primary") + " flex-1"} onClick={saveEdit} disabled={saving} type="button">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

/* =========================================================
   BASE PERDAS (CRUD + filtros + modal menor e bonito)
========================================================= */

function BancoDeDadosLoss({ view }: { view: "perdas" }) {
  const { push, ToastHost } = useToasts();

  const topTitle = "Base de Perdas";
  const muted = "text-black/55";

  const input =
    "w-full h-10 rounded-xl px-3 border outline-none transition text-sm " +
    "bg-white text-black border-black/15 focus:ring-1 focus:ring-[#2E7B57]";

  const btn = (variant: "primary" | "ghost" | "danger" = "ghost") =>
    cx(
      "px-3 py-2 rounded-xl text-sm font-semibold border transition inline-flex items-center justify-center gap-2",
      "active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
      variant === "primary" && "border-black/10 bg-[#2E7B57] text-white hover:brightness-110",
      variant === "danger" && "border-red-500/20 bg-red-500/10 text-red-700 hover:bg-red-500/15",
      variant === "ghost" && "border-black/10 bg-black/[0.03] text-black/75 hover:bg-black/[0.06]"
    );

  const chip = (tone: "neutral" | "ok" | "warn" = "neutral") =>
    cx(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border",
      tone === "neutral" && "border-black/10 bg-black/[0.03] text-black/70",
      tone === "ok" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
      tone === "warn" && "border-amber-500/20 bg-amber-500/10 text-amber-700"
    );

  const card =
    "rounded-2xl border bg-white overflow-hidden " +
    "border-black/10 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.18)] " +
    "transition hover:shadow-[0_22px_70px_-34px_rgba(0,0,0,0.24)]";

  const fmt = (v: any) => (v === null || v === undefined || v === "" ? "" : String(v));

  const toNumOrNull = (v: any) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const setEditNum = (k: keyof LossRow, raw: string) => {
    const s = raw.replace(",", ".").trim();
    if (s === "") return setEditing((p) => (p ? ({ ...p, [k]: "" as any } as any) : p));
    return setEditing((p) => (p ? ({ ...p, [k]: s as any } as any) : p));
  };

  const hasVal = (v: any) => v !== null && v !== undefined && String(v).trim() !== "";

  // usinas
  const [usinas, setUsinas] = useState<string[]>([]);
  const [usinasLoading, setUsinasLoading] = useState(false);
  const [usina, setUsina] = useState("");

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

        if (alive) setUsinas(list);
      } finally {
        if (alive) setUsinasLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // período
  const [periodPreset, setPeriodPreset] = useState<"today" | "yesterday" | "thisMonth" | "lastMonth" | "last7" | "last30">("today");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

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

  const [rows, setRows] = useState<LossRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const limit = 6;
  const [offset, setOffset] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<LossRow | null>(null);
  const [saving, setSaving] = useState(false);

  const clearError = () => setErr("");
  const setError = (m: string) => setErr(m);

  const canSearch = !!start && !!end && !invalidRange;

  const buildParams = (newOffset: number, newLimit: number) => {
    const params = new URLSearchParams();
    params.set("mode", "loss");
    params.set("limit", String(newLimit));
    params.set("offset", String(newOffset));
    if (usina) params.set("usina", clampUpper(usina));
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    return params;
  };

  const loadTable = async (newOffset = 0) => {
    if (!canSearch) return setError("Selecione um Período (início e fim).");
    if (invalidRange) return setError("A data inicial não pode ser maior que a data final.");

    clearError();
    setLoading(true);

    try {
      const res = await fetch(`/api/acionamentos?${buildParams(newOffset, limit).toString()}`, { method: "GET" });
      const data = await res.json().catch(() => null);
      if (!res.ok) return setError(data?.error || "Erro ao carregar perdas.");
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setOffset(newOffset);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view !== "perdas") return;
    if (!start || !end) return;
    if (invalidRange) return;
    const t = window.setTimeout(() => loadTable(0), 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps"
  }, [view, start, end, invalidRange, usina]);

  const exportCsvLoss = () => {
    if (!rows.length) return setError("Nada para exportar.");
    clearError();

    const head = ["data", "usina", "cmp", "skid", "inversor", "tcu", "ncu", "string"].join(";");
    const body = rows
      .map((r) =>
        [r.data ?? "", clampUpper(r.usina ?? ""), r.cmp ?? "", r.skid ?? "", r.inversor ?? "", r.tcu ?? "", r.ncu ?? "", r.string ?? ""].join(";")
      )
      .join("\n");

    const csv = "\uFEFF" + head + "\n" + body;
    downloadText("perdas_loss.csv", csv, "text/csv;charset=utf-8");
  };

  const openEdit = (r: LossRow) => {
    if (!r?.id) return setError("Registro sem ID (não veio do banco).");
    setEditing({ ...r });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing?.id) return;

    setSaving(true);
    clearError();

    try {
      const payload = {
        data: editing.data,
        usina: clampUpper(editing.usina),
        cmp: toNumOrNull((editing as any).cmp),
        skid: toNumOrNull((editing as any).skid),
        inversor: toNumOrNull((editing as any).inversor),
        tcu: toNumOrNull((editing as any).tcu),
        ncu: toNumOrNull((editing as any).ncu),
        string: toNumOrNull((editing as any).string),
      };

      const res = await fetch(`/api/acionamentos/${editing.id}?mode=loss`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {}

      if (!res.ok) return setError(data?.error || raw || `Erro ao salvar edição (HTTP ${res.status})`);

      setRows((p) => p.map((x) => (x.id === editing.id ? ({ ...x, ...payload } as any) : x)));
      setEditOpen(false);
      setEditing(null);
      push("ok", "Perda atualizada ✅");
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm("Excluir este registro de perda? Essa ação não pode ser desfeita.");
    if (!ok) return;

    clearError();

    try {
      const res = await fetch(`/api/acionamentos/${id}?mode=loss`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) return setError(data?.error || "Erro ao excluir.");
      setRows((p) => p.filter((r) => r.id !== id));
      push("ok", "Excluído ✅");
    } catch {
      setError("Erro de conexão.");
    }
  };

  const page = Math.floor(offset / limit) + 1;

  const topHint = useMemo(() => {
    if (!start || !end) return null;
    const parts = [`${brDate(start)} → ${brDate(end)}`, usina ? clampUpper(usina) : null].filter(Boolean);
    return parts.join(" • ");
  }, [start, end, usina]);

  return (
    <section className="w-full h-full min-w-0 bg-transparent">
      <ToastHost />

      <div className="px-6 pt-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xl font-extrabold">{topTitle}</div>
              {topHint && <span className={chip("neutral")}>{topHint}</span>}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <Button variant="ghost" onClick={exportCsvLoss} disabled={!rows.length} type="button">
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 sticky top-0 z-20 bg-[#f6f7f8]/85 backdrop-blur border-y border-black/10">
        <div className="py-4 grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-6">
            <label className={cx("text-xs", muted)}>Usina (opcional)</label>
            <select className={input} value={usina} onChange={(e) => setUsina(e.target.value)} disabled={usinasLoading}>
              <option value="">{usinasLoading ? "Carregando usinas..." : "Todas"}</option>
              {usinas.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-6">
            <label className={cx("text-xs", muted)}>Período</label>
            <select
              className={input}
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
          </div>
        </div>

        {!!err && (
          <div className="pb-4 text-sm rounded-xl px-3 py-2 border bg-red-500/10 text-red-700 border-red-500/20">
            {err}
          </div>
        )}
      </div>

      <div className="px-6 py-6">
        {!loading && rows.length === 0 && (
          <div className="py-16 flex items-center justify-center">
            <div className="w-full rounded-2xl border border-black/10 bg-white p-6 text-center shadow-[0_18px_60px_-30px_rgba(0,0,0,0.12)]">
              <div className="text-base font-extrabold">Sem registros</div>
              <div className={cx("text-sm mt-2", muted)}>Nenhuma perda encontrada para o período selecionado.</div>
            </div>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="h-4 w-40 bg-black/[0.06] rounded mb-3" />
                <div className="h-3 w-64 bg-black/[0.05] rounded mb-2" />
                <div className="h-3 w-56 bg-black/[0.05] rounded mb-4" />
                <div className="h-8 w-28 bg-black/[0.06] rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {!loading && rows.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {rows.map((r) => (
                <div key={r.id} className={card}>
                  <div className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold tracking-tight">{clampUpper(r.usina)}</span>
                          <Badge tone="neutral">{brDate(r.data)}</Badge>
                        </div>

                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <Badge tone="neutral">CMP: {r.cmp ?? "-"}</Badge>
                          <Badge tone="neutral">SKID: {r.skid ?? "-"}</Badge>
                          <Badge tone="neutral">INV: {r.inversor ?? "-"}</Badge>
                          <Badge tone="neutral">TCU: {r.tcu ?? "-"}</Badge>
                          <Badge tone="neutral">NCU: {r.ncu ?? "-"}</Badge>
                          <Badge tone="neutral">STR: {r.string ?? "-"}</Badge>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className={btn("ghost")} onClick={() => openEdit(r)} type="button" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className={btn("danger")} onClick={() => onDelete(r.id)} type="button" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 px-1 flex items-center justify-between">
              <button className={btn("ghost")} onClick={() => loadTable(Math.max(0, offset - limit))} disabled={loading || offset === 0} type="button">
                Anterior
              </button>
              <div className={cx("text-xs", muted)}>Página {page}</div>
              <button className={btn("ghost")} onClick={() => loadTable(offset + limit)} disabled={loading || rows.length < limit} type="button">
                Próxima
              </button>
            </div>
          </>
        )}
      </div>

      {/* MODAL EDIT LOSS (menor + compacto + bonito) */}
      {editOpen && editing && (
        <Modal
          size="sm"
          title="Editar perda (Loss)"
          subtitle="Campos vazios viram NULL • atalhos 0/9/18h"
          onClose={() => {
            setEditOpen(false);
            setEditing(null);
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={cx("text-[11px] font-bold", muted)}>Data</label>
              <input
                className={input}
                type="date"
                value={editing.data}
                onChange={(e) => setEditing((p) => (p ? { ...p, data: e.target.value } : p))}
              />
            </div>

            <div>
              <label className={cx("text-[11px] font-bold", muted)}>Usina</label>
              <input
                className={input}
                value={clampUpper(editing.usina)}
                onChange={(e) => setEditing((p) => (p ? { ...p, usina: clampUpper(e.target.value) } : p))}
                placeholder="Ex: GUA"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {(
              [
                ["cmp", "CMP"],
                ["skid", "SKID"],
                ["inversor", "INV"],
                ["tcu", "TCU"],
                ["ncu", "NCU"],
                ["string", "STR"],
              ] as const
            ).map(([k, label]) => {
              const val = (editing as any)[k];

              return (
                <div key={k} className={cx("rounded-2xl border p-3 transition", hasVal(val) ? "border-emerald-500/25 bg-emerald-500/5" : "border-black/10 bg-white")}>
                  <div className="flex items-center justify-between gap-2">
                    <div className={cx("text-[11px] font-extrabold tracking-wide", muted)}>{label}</div>
                    <div className="flex gap-1">
                      {["0", "9", "18"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          className="px-2 py-1 rounded-lg text-[10px] font-bold border border-black/10 bg-black/[0.03] text-black/70 hover:bg-black/[0.06] transition"
                          onClick={() => setEditNum(k as any, v)}
                        >
                          {v}h
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 relative">
                    <input
                      className={cx(
                        "w-full h-10 rounded-xl px-3 pr-12 border outline-none transition text-sm",
                        "bg-white text-black border-black/15 focus:ring-1 focus:ring-[#2E7B57]"
                      )}
                      inputMode="decimal"
                      placeholder="0,00"
                      value={fmt(val)}
                      onChange={(e) => setEditNum(k as any, e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-black/35">h</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex gap-2">
            <button
              className={btn("ghost") + " flex-1"}
              onClick={() => {
                setEditOpen(false);
                setEditing(null);
              }}
              disabled={saving}
              type="button"
            >
              Cancelar
            </button>

            <button className={btn("primary") + " flex-1"} onClick={saveEdit} disabled={saving} type="button">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
