"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, ChevronDown, Search } from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

const T = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  cardSoft: "#FBFCFD",
  border: "rgba(17, 24, 39, 0.12)",
  text: "#0B1220",
  text2: "rgba(11, 18, 32, 0.70)",
  text3: "rgba(11, 18, 32, 0.55)",
  mutedBg: "rgba(17, 24, 39, 0.035)",
  accent: "#115923",
  accentSoft: "rgba(17, 89, 35, 0.08)",
  accentRing: "rgba(17, 89, 35, 0.18)",
  okBg: "rgba(16, 185, 129, 0.10)",
  okBd: "rgba(16, 185, 129, 0.30)",
  okTx: "#065F46",
  errBg: "rgba(239, 68, 68, 0.10)",
  errBd: "rgba(239, 68, 68, 68, 0.30)",
  errTx: "#7F1D1D",
} as const;

const UI = {
  page: "w-full min-w-0",
  container: "mx-auto w-full max-w-[1480px] px-4 sm:px-6 py-6",
  section: "border bg-white rounded-lg",
  title: "text-base sm:text-lg font-semibold tracking-tight",
  label: "text-[11px] font-medium",
  input: "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2 rounded-md",
  select: "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2 rounded-md",
  mono: "tabular-nums",
} as const;

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" }) {
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

function Btn({
  children,
  loading,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      className="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold border rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition active:translate-y-[0.5px]"
      style={{ borderColor: T.border, background: T.card, color: T.text }}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      type="button"
    >
      {loading ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : null}
      {children}
    </button>
  );
}

function brDate(iso?: string | null) {
  if (!iso) return "-";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(iso);
  return `${m[3]}/${m[2]}/${m[1]}`;
}
function brKwh(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString("pt-BR");
}
function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
}

type Station = { id: number; code: string; name: string };

type ApiResp = {
  ok: boolean;
  error?: string;
  ps_id?: number;
  start_date?: string;
  end_date?: string;
  performance?: any;
  series?: {
    daily: Array<{ day: string; kwh: number }>;
    monthly: Array<{ month: string; kwh: number }>;
    yearly: Array<{ year: string; kwh: number }>;
  };
  kpis?: {
    total_kwh: number;
    avg_kwh_day: number;
    peak_day: string | null;
    peak_kwh: number;
    source: string;
  };
};

function todayISO() {
  const d = new Date();
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
  const toISO = (x: Date) => {
    const yy = x.getFullYear();
    const mm = String(x.getMonth() + 1).padStart(2, "0");
    const dd = String(x.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };
  return { start: toISO(start), end: toISO(end) };
}
function yearRangeISO(year: number) {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export  function TecsciPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [psId, setPsId] = useState<number>(46); // default ITU (ajuste como quiser)

  const [preset, setPreset] = useState<"thisMonth" | "lastMonth" | "last30" | "last7" | "thisYear" | "lastYear" | "custom">(
    "thisMonth"
  );
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [view, setView] = useState<"daily" | "monthly" | "yearly">("daily");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [data, setData] = useState<ApiResp | null>(null);

  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/tecsci/energy", { cache: "no-store" });
        const j = await r.json();
        if (j?.ok) setStations(j.stations || []);
      } catch {}
    })();
  }, []);

  const applyPreset = (p: typeof preset) => {
    const now = new Date();
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
      const toISO = (x: Date) => {
        const yy = x.getFullYear();
        const mm = String(x.getMonth() + 1).padStart(2, "0");
        const dd = String(x.getDate()).padStart(2, "0");
        return `${yy}-${mm}-${dd}`;
      };
      setStart(toISO(s));
      setEnd(toISO(e));
      return;
    }
    if (p === "last30") {
      const e = new Date(now);
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      const toISO = (x: Date) => {
        const yy = x.getFullYear();
        const mm = String(x.getMonth() + 1).padStart(2, "0");
        const dd = String(x.getDate()).padStart(2, "0");
        return `${yy}-${mm}-${dd}`;
      };
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
  };

  useEffect(() => {
    applyPreset("thisMonth");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invalidRange = useMemo(() => {
    if (!isIsoDate(start) || !isIsoDate(end)) return false;
    return start > end;
  }, [start, end]);

  const load = async () => {
    setMsg(null);

    if (!psId) return setMsg({ type: "err", text: "Selecione uma usina." });
    if (!isIsoDate(start) || !isIsoDate(end)) return setMsg({ type: "err", text: "Datas inválidas." });
    if (invalidRange) return setMsg({ type: "err", text: "Data inicial maior que a final." });

    setLoading(true);
    try {
      const url = `/api/tecsci/generation?ps_id=${psId}&start_date=${start}&end_date=${end}`;
      const r = await fetch(url, { cache: "no-store" });
      const j: ApiResp = await r.json().catch(() => ({ ok: false } as any));
      if (!r.ok || !j?.ok) {
        setData(null);
        setMsg({ type: "err", text: j?.error || "Erro ao carregar dados." });
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
  };

  useEffect(() => {
    // auto-load quando muda usina ou datas (leve)
    // comente se não quiser auto
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [psId, start, end]);

  const perf = data?.performance || null;
  const kpis = data?.kpis || null;

  const series = useMemo(() => {
    const s = data?.series;
    if (!s) return [];
    if (view === "daily") return s.daily.map((x) => ({ key: x.day, label: brDate(x.day), value: x.kwh }));
    if (view === "monthly")
      return s.monthly.map((x) => ({
        key: x.month,
        label: x.month,
        value: x.kwh,
      }));
    return s.yearly.map((x) => ({ key: x.year, label: x.year, value: x.kwh }));
  }, [data, view]);

  const filteredSeries = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return series;
    return series.filter((x) => `${x.key} ${x.label}`.toLowerCase().includes(n));
  }, [series, q]);

  const maxV = useMemo(() => Math.max(1, ...filteredSeries.map((x) => Number(x.value) || 0)), [filteredSeries]);

  return (
    <section className={UI.page} style={{ background: T.bg, color: T.text }}>
      <div className={UI.container}>
        {/* HEADER */}
        <div className={cx(UI.section, "p-4 sm:p-5")} style={{ borderColor: T.border, background: T.card }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className={UI.title} style={{ color: T.text }}>
                Geração por Usina
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill>Período: {start && end ? `${brDate(start)} → ${brDate(end)}` : "—"}</Pill>
                {kpis ? <Pill tone="accent">Total: {brKwh(kpis.total_kwh)} kWh</Pill> : null}
                {kpis ? <Pill>Média/dia: {brKwh(kpis.avg_kwh_day)} kWh</Pill> : null}
                {kpis?.peak_day ? <Pill>Pico: {brDate(kpis.peak_day)} ({brKwh(kpis.peak_kwh)} kWh)</Pill> : null}
                {kpis?.source ? <Pill>Fonte: {kpis.source}</Pill> : null}
              </div>

              {perf ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {perf.generated_energy_kwh != null ? <Pill tone="accent">Gerada: {brKwh(perf.generated_energy_kwh)} kWh</Pill> : null}
                  {perf.expected_energy_kwh != null ? <Pill>Esperada: {brKwh(perf.expected_energy_kwh)} kWh</Pill> : null}
                  {perf.pr_percentage != null ? <Pill>PR: {Number(perf.pr_percentage).toFixed(2)}%</Pill> : null}
                  {perf.availability_percentage != null ? <Pill>Dispon.: {Number(perf.availability_percentage).toFixed(2)}%</Pill> : null}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Btn loading={loading} onClick={load} title="Recarregar">
                <RefreshCw className="w-4 h-4" />
                Recarregar
              </Btn>
            </div>
          </div>

          {msg ? (
            <div
              className="mt-3 text-sm px-3 py-2 border rounded-md"
              style={
                msg.type === "ok"
                  ? { background: T.okBg, borderColor: T.okBd, color: T.okTx }
                  : { background: T.errBg, borderColor: T.errBd, color: T.errTx }
              }
            >
              {msg.text}
            </div>
          ) : null}
        </div>

        {/* FILTROS */}
        <div className={cx(UI.section, "mt-4 p-4")} style={{ borderColor: T.border, background: T.card }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            <div className="lg:col-span-3">
              <label className={UI.label} style={{ color: T.text2 }}>
                Usina
              </label>
              <select
                className={UI.select}
                style={{ borderColor: T.border }}
                value={psId}
                onChange={(e) => setPsId(Number(e.target.value))}
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} (ID {s.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className={UI.label} style={{ color: T.text2 }}>
                Período
              </label>
              <select
                className={UI.select}
                style={{ borderColor: T.border }}
                value={preset}
                onChange={(e) => {
                  const v = e.target.value as any;
                  setPreset(v);
                  if (v !== "custom") applyPreset(v);
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

            <div className="lg:col-span-3">
              <label className={UI.label} style={{ color: T.text2 }}>
                Início
              </label>
              <input
                className={UI.input}
                style={{ borderColor: T.border }}
                type="date"
                value={start}
                onChange={(e) => {
                  setPreset("custom");
                  setStart(e.target.value);
                }}
              />
            </div>

            <div className="lg:col-span-3">
              <label className={UI.label} style={{ color: T.text2 }}>
                Fim
              </label>
              <input
                className={UI.input}
                style={{ borderColor: T.border }}
                type="date"
                value={end}
                onChange={(e) => {
                  setPreset("custom");
                  setEnd(e.target.value);
                }}
              />
            </div>

            <div className="lg:col-span-3">
              <label className={UI.label} style={{ color: T.text2 }}>
                Visão
              </label>
              <select className={UI.select} style={{ borderColor: T.border }} value={view} onChange={(e) => setView(e.target.value as any)}>
                <option value="daily">Diária</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>

            <div className="lg:col-span-9">
              <label className={UI.label} style={{ color: T.text2 }}>
                Buscar na lista
              </label>
              <div className="relative">
                <input
                  ref={searchRef}
                  className={cx(UI.input, "pr-9")}
                  style={{ borderColor: T.border }}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ex: 2026-01, 15/01/2026…"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: T.text3 }}>
                  <Search className="w-4 h-4" />
                </div>
              </div>
            </div>

            {invalidRange ? (
              <div className="lg:col-span-12 text-[11px]" style={{ color: T.errTx }}>
                Data inicial maior que a final.
              </div>
            ) : null}
          </div>
        </div>

        {/* SÉRIE + TABELA */}
        <div className={cx(UI.section, "mt-4 p-4")} style={{ borderColor: T.border, background: T.card }}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-semibold" style={{ color: T.text }}>
                {view === "daily" ? "Geração diária" : view === "monthly" ? "Geração mensal" : "Geração anual"}
              </div>
              <div className="text-xs mt-1" style={{ color: T.text3 }}>
                Barras proporcionais ao maior valor da lista.
              </div>
            </div>
            <Pill>{filteredSeries.length} itens</Pill>
          </div>

          <div className="mt-4 grid gap-2">
            {filteredSeries.length === 0 ? (
              <div className="border rounded-lg p-4 text-sm" style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}>
                Sem dados.
              </div>
            ) : (
              filteredSeries.map((p) => {
                const pct = (Number(p.value) / maxV) * 100;
                return (
                  <div key={p.key} className="flex items-center gap-3">
                    <div className="w-28 sm:w-36 text-xs" style={{ color: T.text3 }}>
                      {p.label}
                    </div>
                    <div className="flex-1 border rounded-md overflow-hidden" style={{ borderColor: T.border, background: T.mutedBg }}>
                      <div
                        className="h-8"
                        style={{
                          width: `${Math.max(2, Math.min(100, pct))}%`,
                          background: "rgba(17, 89, 35, 0.75)",
                        }}
                      />
                    </div>
                    <div className="w-28 text-xs text-right" style={{ color: T.text2, fontWeight: 700 }}>
                      {brKwh(p.value)} kWh
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 border rounded-lg overflow-hidden" style={{ borderColor: T.border }}>
            <div
              className="px-3 py-2 text-[11px] font-semibold border-b"
              style={{ borderColor: T.border, background: T.cardSoft, color: T.text2, display: "grid", gridTemplateColumns: "1fr 160px", gap: 0 }}
            >
              <div>{view === "daily" ? "Dia" : view === "monthly" ? "Mês" : "Ano"}</div>
              <div style={{ textAlign: "right" }}>kWh</div>
            </div>

            {filteredSeries.slice(0, 120).map((p) => (
              <div
                key={`row-${p.key}`}
                className="px-3 py-2 text-sm border-b last:border-b-0"
                style={{ borderColor: "rgba(17,24,39,0.08)", background: T.card, display: "grid", gridTemplateColumns: "1fr 160px" }}
              >
                <div style={{ color: T.text }}>{p.label}</div>
                <div className={UI.mono} style={{ color: T.text, textAlign: "right", fontWeight: 800 }}>
                  {brKwh(p.value)}
                </div>
              </div>
            ))}
          </div>

          {filteredSeries.length > 120 ? (
            <div className="mt-2 text-[11px]" style={{ color: T.text3 }}>
              Mostrando 120 itens (reduza o período ou refine a busca para ver menos).
            </div>
          ) : null}
        </div>
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