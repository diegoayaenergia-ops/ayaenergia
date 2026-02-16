"use client";

import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Search,
  RefreshCw,
  X,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

/* =========================================================
   TOKENS (BI / enterprise)
========================================================= */
const T = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  card2: "#FBFCFD",
  border: "rgba(17,24,39,0.10)",
  border2: "rgba(17,24,39,0.14)",
  text: "#0B1220",
  text2: "rgba(11,18,32,0.74)",
  text3: "rgba(11,18,32,0.54)",
  muted: "rgba(17,24,39,0.035)",

  accent: "#115923",
  accent2: "#1E7C35",
  ring: "rgba(17,89,35,0.18)",
  accentSoft: "rgba(17,89,35,0.10)",

  blue: "#60A5FA",
  amber: "#F59E0B",
  gray: "#9CA3AF",

  okBg: "rgba(16,185,129,0.10)",
  okTx: "#065F46",
  errBg: "rgba(239,68,68,0.10)",
  errTx: "#7F1D1D",
} as const;

/* =========================================================
   TYPES
========================================================= */
type DriveRow = {
  id: string | number;
  data: string; // YYYY-MM-DD
  usina: string;
  ufv?: string;
  cliente?: string;
  equipamento?: string;
  alarme?: string;
  ss?: number | string | null;
  motivo_mobilizacao?: string;
  problema_identificado?: string;
  solucao_imediata?: string;
  solucao_definitiva?: string;
};

type SortKey = "data_desc" | "data_asc" | "ufv_asc" | "equip_asc" | "cliente_asc";

/* =========================================================
   HELPERS
========================================================= */
const rowId = (r: DriveRow) => String(r.id);

function clampUpper(s: string) {
  return String(s || "").trim().toUpperCase();
}
function safeStr(v: any, fb = "—") {
  const s = String(v ?? "").trim();
  return s ? s : fb;
}
function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
}
function brDate(iso?: string | null) {
  if (!iso) return "—";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(iso);
  return `${m[3]}/${m[2]}/${m[1]}`;
}
function parseISO(iso: string) {
  if (!isIsoDate(iso)) return null;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
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
function dayDiffInclusive(startISO: string, endISO: string) {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  if (!s || !e) return 0;
  const ms = e.getTime() - s.getTime();
  const days = Math.floor(ms / 86400000) + 1;
  return Math.max(0, days);
}
function shiftRangeBack(startISO: string, endISO: string) {
  const len = dayDiffInclusive(startISO, endISO);
  const s = parseISO(startISO);
  if (!s || !len) return null;
  const prevEnd = new Date(s);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (len - 1));
  return { start: toISO(prevStart), end: toISO(prevEnd) };
}

function normCliente(v: any) {
  const s = String(v ?? "").trim().toUpperCase();
  if (!s) return "ÉLIS";
  if (s.includes("INEER")) return "INEER";
  if (s.includes("KAMAI")) return "KAMAI";
  if (s.includes("ÉLIS") || s.includes("ELIS")) return "ÉLIS";
  return s;
}

const CLIENTE_COLORS: Record<string, { dot: string; fill: string; stroke: string }> = {
  "ÉLIS": { dot: T.gray, fill: "rgba(156,163,175,0.18)", stroke: "rgba(156,163,175,0.95)" },
  "INEER": { dot: T.blue, fill: "rgba(96,165,250,0.18)", stroke: "rgba(96,165,250,0.95)" },
  "KAMAI": { dot: T.amber, fill: "rgba(245,158,11,0.18)", stroke: "rgba(245,158,11,0.95)" },
};
function clienteColor(c: string) {
  return CLIENTE_COLORS[c] ?? { dot: T.gray, fill: "rgba(156,163,175,0.18)", stroke: "rgba(156,163,175,0.95)" };
}

function ufvLabel(r: DriveRow) {
  return clampUpper(String(r.ufv ?? r.usina ?? "").trim()) || "N/A";
}
function equipLabel(r: DriveRow) {
  return safeStr(r.equipamento, "N/A");
}

function rowToClipboardText(r: DriveRow) {
  return [
    `Data: ${safeStr(brDate(r.data))}`,
    `UFV/Usina: ${safeStr(r.ufv ?? r.usina)}`,
    `Cliente: ${safeStr(r.cliente)}`,
    `Equipamento: ${safeStr(r.equipamento)}`,
    `Alarme: ${safeStr(r.alarme)}`,
    `SS: ${safeStr(r.ss)}`,
    `Motivo: ${safeStr(r.motivo_mobilizacao)}`,
    `Problema: ${safeStr(r.problema_identificado)}`,
    `Solução imediata: ${safeStr(r.solucao_imediata)}`,
    `Solução definitiva: ${safeStr(r.solucao_definitiva)}`,
  ].join("\n");
}

function pctDelta(cur: number, prev: number) {
  if (prev <= 0 && cur <= 0) return 0;
  if (prev <= 0) return 100;
  return ((cur - prev) / prev) * 100;
}
function fmtPct(n: number) {
  const s = Math.round(n);
  return `${s > 0 ? "+" : ""}${s}%`;
}

/* =========================================================
   UI PRIMITIVES
========================================================= */
function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "info" }) {
  const s =
    tone === "accent"
      ? { borderColor: "rgba(17,89,35,0.22)", background: T.accentSoft, color: T.accent }
      : tone === "info"
      ? { borderColor: "rgba(96,165,250,0.25)", background: "rgba(96,165,250,0.10)", color: "rgba(37,99,235,0.95)" }
      : { borderColor: T.border, background: T.card2, color: T.text2 };

  return (
    <span className="inline-flex items-center h-7 px-2.5 text-[11px] font-semibold border rounded-lg" style={s}>
      {children}
    </span>
  );
}

function Btn({
  tone = "secondary",
  loading,
  disabled,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold border rounded-xl " +
    "disabled:opacity-50 disabled:cursor-not-allowed transition active:translate-y-[0.5px]";

  const style =
    tone === "primary"
      ? { background: T.accent, borderColor: "rgba(17,89,35,0.45)", color: "white" }
      : tone === "ghost"
      ? { background: "transparent", borderColor: "transparent", color: T.text2 }
      : { background: T.card, borderColor: T.border, color: T.text };

  return (
    <button className={cx(base, className)} style={style} disabled={disabled || loading} {...props}>
      {loading ? (
        <>
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          <span>Carregando…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

function Card({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx("border rounded-2xl overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.03)]", className)}
      style={{ borderColor: T.border, background: T.card }}
    >
      <div
        className="px-5 py-3 border-b flex items-start justify-between gap-3"
        style={{
          borderColor: T.border,
          background: "linear-gradient(to bottom, rgba(17,24,39,0.08), rgba(17,24,39,0.03))",
        }}
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold" style={{ color: T.text }}>
            {title}
          </div>
          {subtitle && (
            <div className="text-xs mt-0.5" style={{ color: T.text3 }}>
              {subtitle}
            </div>
          )}
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function MsgBox({ m }: { m: { type: "ok" | "err"; text: string } | null }) {
  if (!m) return null;
  const s =
    m.type === "ok"
      ? { background: T.okBg, borderColor: "rgba(16,185,129,0.25)", color: T.okTx }
      : { background: T.errBg, borderColor: "rgba(239,68,68,0.25)", color: T.errTx };

  return (
    <div className="text-sm px-3 py-2 border rounded-xl" style={s}>
      {m.text}
    </div>
  );
}

/* =========================================================
   TOOLTIP
========================================================= */
type TooltipState = null | { x: number; y: number; title: string; lines: string[] };

function useTooltip() {
  const [tip, setTip] = useState<TooltipState>(null);
  const onLeave = () => setTip(null);
  return { tip, setTip, onLeave };
}

function Tooltip({ tip }: { tip: TooltipState }) {
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none fixed z-[9999] max-w-[340px] rounded-xl border px-3 py-2 shadow-sm"
      style={{
        left: tip.x + 12,
        top: tip.y + 12,
        background: "rgba(255,255,255,0.98)",
        borderColor: T.border2,
        color: T.text,
      }}
    >
      <div className="text-xs font-semibold">{tip.title}</div>
      <div className="mt-1 grid gap-0.5">
        {tip.lines.map((l, i) => (
          <div key={i} className="text-[11px]" style={{ color: T.text2 }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   SPARKLINE + KPI (com delta)
========================================================= */
function Sparkline({ values }: { values: number[] }) {
  const W = 120;
  const H = 34;
  const pad = 4;
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const n = Math.max(1, values.length);

  const x = (i: number) => pad + (i / Math.max(1, n - 1)) * (W - pad * 2);
  const y = (v: number) => {
    const range = Math.max(1, max - min);
    const t = (v - min) / range;
    return pad + (1 - t) * (H - pad * 2);
  };

  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${pad},${H - pad} ${pts} ${W - pad},${H - pad}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="shrink-0">
      <polygon points={area} fill="rgba(17,89,35,0.10)" />
      <polyline points={pts} fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  const up = delta > 0;
  const down = delta < 0;
  const style = up
    ? { background: "rgba(16,185,129,0.12)", color: "rgba(5,150,105,0.95)", borderColor: "rgba(16,185,129,0.25)" }
    : down
    ? { background: "rgba(239,68,68,0.10)", color: "rgba(220,38,38,0.95)", borderColor: "rgba(239,68,68,0.22)" }
    : { background: "rgba(17,24,39,0.06)", color: T.text2, borderColor: "rgba(17,24,39,0.10)" };

  return (
    <span className="inline-flex items-center h-7 px-2.5 rounded-lg border text-[11px] font-semibold" style={style}>
      {fmtPct(delta)}
    </span>
  );
}

function KpiCard({
  title,
  value,
  spark,
  delta,
  hint,
}: {
  title: string;
  value: string | number;
  spark?: number[];
  delta?: number;
  hint?: string;
}) {
  return (
    <div className="border rounded-2xl p-4" style={{ borderColor: T.border, background: T.card }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-semibold" style={{ color: T.text2 }}>
            {title}
          </div>
          <div className="mt-1 text-3xl font-extrabold tracking-tight truncate" style={{ color: T.text }}>
            {value}
          </div>
          {hint && (
            <div className="text-[11px] mt-1" style={{ color: T.text3 }}>
              {hint}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {typeof delta === "number" ? <DeltaBadge delta={delta} /> : null}
          {spark && spark.length > 1 ? <Sparkline values={spark} /> : null}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DONUT CLIENTE (clicável)
========================================================= */
function DonutCliente({
  rows,
  pickedCliente,
  onPickCliente,
}: {
  rows: DriveRow[];
  pickedCliente: string | null;
  onPickCliente: (c: string) => void;
}) {
  const { tip, setTip, onLeave } = useTooltip();

  const data = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const c = normCliente(r.cliente);
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    const arr = Array.from(m.entries())
      .map(([cliente, count]) => ({ cliente, count }))
      .sort((a, b) => b.count - a.count || a.cliente.localeCompare(b.cliente));
    const total = arr.reduce((a, b) => a + b.count, 0);
    return { arr, total: Math.max(1, total) };
  }, [rows]);

  const size = 220;
  const cx0 = 110;
  const cy0 = 110;
  const rOuter = 88;
  const rInner = 56;
  const C = 2 * Math.PI;

  let start = -Math.PI / 2;

  const arcPath = (a0: number, a1: number) => {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx0 + rOuter * Math.cos(a0);
    const y0 = cy0 + rOuter * Math.sin(a0);
    const x1 = cx0 + rOuter * Math.cos(a1);
    const y1 = cy0 + rOuter * Math.sin(a1);

    const xi0 = cx0 + rInner * Math.cos(a1);
    const yi0 = cy0 + rInner * Math.sin(a1);
    const xi1 = cx0 + rInner * Math.cos(a0);
    const yi1 = cy0 + rInner * Math.sin(a0);

    return [
      `M ${x0} ${y0}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${x1} ${y1}`,
      `L ${xi0} ${yi0}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${xi1} ${yi1}`,
      "Z",
    ].join(" ");
  };

  return (
    <>
      <Tooltip tip={tip} />
      <Card
        title="Cliente"
        subtitle="distribuição (clique para filtrar)"
        right={pickedCliente ? <Pill tone="accent">{pickedCliente}</Pill> : <Pill>{data.arr.length} itens</Pill>}
      >
        {data.arr.length === 0 ? (
          <div className="text-sm" style={{ color: T.text2 }}>
            Sem dados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="flex justify-center">
              <svg viewBox={`0 0 ${size} ${size}`} className="w-[220px]" onMouseLeave={onLeave}>
                <circle cx={cx0} cy={cy0} r={rOuter} fill="rgba(17,24,39,0.03)" />
                <circle cx={cx0} cy={cy0} r={rInner} fill={T.card} />

                {data.arr.map((d) => {
                  const frac = d.count / data.total;
                  const a0 = start;
                  const a1 = start + frac * C;
                  start = a1;

                  const col = clienteColor(d.cliente);
                  const active = pickedCliente === d.cliente;

                  return (
                    <path
                      key={d.cliente}
                      d={arcPath(a0, a1)}
                      fill={col.stroke}
                      opacity={pickedCliente && !active ? 0.32 : 0.95}
                      style={{ cursor: "pointer" }}
                      onClick={() => onPickCliente(d.cliente)}
                      onMouseMove={(e) => {
                        const pct = Math.round((d.count / data.total) * 100);
                        setTip({
                          x: (e as any).clientX,
                          y: (e as any).clientY,
                          title: d.cliente,
                          lines: [`Acionamentos: ${d.count}`, `Share: ${pct}%`],
                        });
                      }}
                    />
                  );
                })}

                <text x={cx0} y={cx0 - 4} textAnchor="middle" fontSize="12" fill={T.text3} fontWeight={700}>
                  TOTAL
                </text>
                <text x={cx0} y={cx0 + 18} textAnchor="middle" fontSize="22" fill={T.text} fontWeight={900}>
                  {data.total}
                </text>
              </svg>
            </div>

            <div className="grid gap-2">
              {data.arr.map((d) => {
                const col = clienteColor(d.cliente);
                const active = pickedCliente === d.cliente;
                const pct = Math.round((d.count / data.total) * 100);

                return (
                  <button
                    key={d.cliente}
                    type="button"
                    className="w-full text-left border rounded-xl px-3 py-2 flex items-center justify-between gap-3 hover:bg-black/[0.02] transition"
                    style={{
                      borderColor: "rgba(17,24,39,0.10)",
                      background: active ? col.fill : T.card,
                      opacity: pickedCliente && !active ? 0.55 : 1,
                    }}
                    onClick={() => onPickCliente(d.cliente)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.dot }} />
                      <span className="text-sm font-semibold truncate" style={{ color: T.text }}>
                        {d.cliente}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Pill>{pct}%</Pill>
                      <Pill tone="accent">{d.count}</Pill>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

/* =========================================================
   TREND (área/linha) — leitura limpa
========================================================= */
function TrendArea({
  title,
  subtitle,
  days,
}: {
  title: string;
  subtitle?: string;
  days: Array<{ day: string; count: number }>;
}) {
  const { tip, setTip, onLeave } = useTooltip();

  const W = 980;
  const H = 260;
  const padL = 56;
  const padR = 18;
  const padT = 18;
  const padB = 36;

  const max = Math.max(1, ...days.map((d) => d.count));
  const n = Math.max(1, days.length);

  const x = (i: number) => padL + (i / Math.max(1, n - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB);

  const pts = days.map((d, i) => [x(i), y(d.count)] as const);
  const line = pts.map((p) => `${p[0]},${p[1]}`).join(" ");
  const area = `${padL},${H - padB} ${line} ${W - padR},${H - padB}`;

  return (
    <>
      <Tooltip tip={tip} />
      <Card title={title} subtitle={subtitle} right={<Pill>{days.length} dias</Pill>} className="xl:col-span-2">
        {days.length === 0 ? (
          <div className="text-sm" style={{ color: T.text2 }}>
            Sem dados.
          </div>
        ) : (
          <div className="w-full overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={onLeave}>
              <rect x="0" y="0" width={W} height={H} fill={T.card2} />

              {[0, 0.25, 0.5, 0.75, 1].map((k) => {
                const yy = padT + (H - padT - padB) * k;
                const val = Math.round(max * (1 - k));
                return (
                  <g key={k}>
                    <line x1={padL} x2={W - padR} y1={yy} y2={yy} stroke="rgba(17,24,39,0.08)" />
                    <text x={padL - 10} y={yy + 4} fontSize="10" textAnchor="end" fill={T.text3}>
                      {val}
                    </text>
                  </g>
                );
              })}

              <polygon points={area} fill="rgba(17,89,35,0.14)" />
              <polyline points={line} fill="none" stroke={T.accent} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />

              {days.map((d, i) => {
                const cx0 = x(i);
                const cy0 = y(d.count);
                return (
                  <circle
                    key={d.day}
                    cx={cx0}
                    cy={cy0}
                    r={10}
                    fill={T.accent}
                    opacity={0}
                    onMouseMove={(e) => {
                      setTip({
                        x: (e as any).clientX,
                        y: (e as any).clientY,
                        title: brDate(d.day),
                        lines: [`Acionamentos: ${d.count}`],
                      });
                    }}
                  />
                );
              })}

              {days.map((d, i) => {
                if (days.length > 21 && i % 3 !== 0) return null;
                const xx = x(i);
                return (
                  <text key={d.day} x={xx} y={H - 12} fontSize="10" textAnchor="middle" fill={T.text3}>
                    {d.day.slice(8, 10)}
                  </text>
                );
              })}
            </svg>
          </div>
        )}
      </Card>
    </>
  );
}

/* =========================================================
   WEEKDAY BARS (seg -> dom)
========================================================= */
function WeekdayBars({ rows }: { rows: DriveRow[] }) {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

  const data = useMemo(() => {
    const m = new Map<number, number>(); // 0..6 seg..dom
    for (const r of rows) {
      if (!isIsoDate(r.data)) continue;
      const d = new Date(`${r.data}T00:00:00`);
      const js = d.getDay(); // 0 dom .. 6 sab
      const idx = js === 0 ? 6 : js - 1; // seg=0 ... dom=6
      m.set(idx, (m.get(idx) ?? 0) + 1);
    }
    const arr = days.map((label, i) => ({ label, i, count: m.get(i) ?? 0 }));
    const max = Math.max(1, ...arr.map((x) => x.count));
    return { arr, max };
  }, [rows]);

  return (
    <Card title="Dia da semana" subtitle="volume agregado (rápido de bater o olho)" right={<Pill>{rows.length}</Pill>}>
      <div className="grid gap-2">
        {data.arr.map((d) => {
          const pct = (d.count / data.max) * 100;
          return (
            <div key={d.label} className="flex items-center gap-3">
              <div className="w-10 text-[12px] font-semibold" style={{ color: T.text2 }}>
                {d.label}
              </div>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(17,24,39,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.max(2, pct)}%`, background: "rgba(17,89,35,0.65)" }} />
              </div>
              <div className="w-10 text-right text-[12px] font-semibold" style={{ color: T.text2 }}>
                {d.count}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* =========================================================
   TOP BARS (UFV/EQUIP) — ranking clean + clique
========================================================= */
function TopBars({
  title,
  subtitle,
  rows,
  mode,
  topN,
  activeKey,
  onPickKey,
}: {
  title: string;
  subtitle?: string;
  rows: DriveRow[];
  mode: "ufv" | "equip";
  topN: number;
  activeKey: string | null;
  onPickKey: (k: string) => void;
}) {
  const items = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = mode === "ufv" ? ufvLabel(r) : equipLabel(r);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    const arr = Array.from(m.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
      .slice(0, topN);

    const max = Math.max(1, ...arr.map((x) => x.count));
    return { arr, max };
  }, [rows, mode, topN]);

  return (
    <Card
      title={title}
      subtitle={subtitle}
      right={activeKey ? <Pill tone="accent">{activeKey}</Pill> : <Pill>Top {topN}</Pill>}
    >
      {items.arr.length === 0 ? (
        <div className="text-sm" style={{ color: T.text2 }}>
          Sem dados.
        </div>
      ) : (
        <div className="grid gap-2">
          {items.arr.map((it, idx) => {
            const active = activeKey === it.key;
            const pct = (it.count / items.max) * 100;

            return (
              <button
                key={it.key}
                type="button"
                className="w-full text-left border rounded-xl px-3 py-2 hover:bg-black/[0.02] transition"
                style={{
                  borderColor: "rgba(17,24,39,0.10)",
                  background: active ? "rgba(17,89,35,0.06)" : T.card,
                  opacity: activeKey && !active ? 0.55 : 1,
                }}
                onClick={() => onPickKey(it.key)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 text-[12px] font-extrabold" style={{ color: "rgba(11,18,32,0.50)" }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: T.text }}>
                      {it.key}
                    </div>
                    <div className="mt-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(17,24,39,0.06)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(4, pct)}%`,
                          background: active ? T.accent : "rgba(17,89,35,0.55)",
                        }}
                      />
                    </div>
                  </div>
                  <Pill tone={active ? "accent" : "neutral"}>{it.count}</Pill>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* =========================================================
   INSIGHTS PANEL
========================================================= */
function Insights({ rows, start, end }: { rows: DriveRow[]; start: string; end: string }) {
  const info = useMemo(() => {
    const total = rows.length;

    // peak day
    const byDay = new Map<string, number>();
    for (const r of rows) {
      if (!isIsoDate(r.data)) continue;
      byDay.set(r.data, (byDay.get(r.data) ?? 0) + 1);
    }
    const peak = Array.from(byDay.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

    // top alarm
    const byAlarm = new Map<string, number>();
    for (const r of rows) {
      const a = safeStr(r.alarme, "—");
      byAlarm.set(a, (byAlarm.get(a) ?? 0) + 1);
    }
    const topAlarm = Array.from(byAlarm.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

    // top reason (motivo)
    const byMotivo = new Map<string, number>();
    for (const r of rows) {
      const m = safeStr(r.motivo_mobilizacao, "—");
      byMotivo.set(m, (byMotivo.get(m) ?? 0) + 1);
    }
    const topMotivo = Array.from(byMotivo.entries()).sort((a, b) => b[1] - a[1])[0];

    // unique UFV/equip
    const ufvs = new Set(rows.map((r) => ufvLabel(r)));
    const equips = new Set(rows.map((r) => equipLabel(r)));

    return {
      total,
      peakDay: peak ? { day: peak[0], count: peak[1] } : null,
      topAlarm: topAlarm ? { name: topAlarm[0], count: topAlarm[1] } : null,
      topMotivo: topMotivo ? { name: topMotivo[0], count: topMotivo[1] } : null,
      ufvCount: ufvs.size,
      equipCount: equips.size,
      rangeLabel: start && end ? `${brDate(start)} → ${brDate(end)}` : "—",
    };
  }, [rows, start, end]);

  return (
    <Card title="Insights" subtitle="resumo automático do período" right={<Pill tone="info">{info.rangeLabel}</Pill>}>
      {info.total === 0 ? (
        <div className="text-sm" style={{ color: T.text2 }}>
          Sem dados para gerar insights.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="border rounded-2xl p-3" style={{ borderColor: "rgba(17,24,39,0.10)", background: T.card2 }}>
            <div className="text-[11px] font-semibold" style={{ color: T.text3 }}>
              Pico do período
            </div>
            <div className="mt-1 text-sm font-extrabold" style={{ color: T.text }}>
              {info.peakDay ? `${brDate(info.peakDay.day)} • ${info.peakDay.count}` : "—"}
            </div>
            <div className="text-[11px] mt-1" style={{ color: T.text3 }}>
              dia com mais acionamentos
            </div>
          </div>

          <div className="border rounded-2xl p-3" style={{ borderColor: "rgba(17,24,39,0.10)", background: T.card2 }}>
            <div className="text-[11px] font-semibold" style={{ color: T.text3 }}>
              Top Alarme
            </div>
            <div className="mt-1 text-sm font-extrabold truncate" style={{ color: T.text }}>
              {info.topAlarm ? `${info.topAlarm.name} • ${info.topAlarm.count}` : "—"}
            </div>
            <div className="text-[11px] mt-1" style={{ color: T.text3 }}>
              mais recorrente no período
            </div>
          </div>

          <div className="border rounded-2xl p-3" style={{ borderColor: "rgba(17,24,39,0.10)", background: T.card2 }}>
            <div className="text-[11px] font-semibold" style={{ color: T.text3 }}>
              Top Motivo
            </div>
            <div className="mt-1 text-sm font-extrabold truncate" style={{ color: T.text }}>
              {info.topMotivo ? `${info.topMotivo.count} • ${info.topMotivo.name}` : "—"}
            </div>
            <div className="text-[11px] mt-1" style={{ color: T.text3 }}>
              maior frequência
            </div>
          </div>

          <div className="border rounded-2xl p-3" style={{ borderColor: "rgba(17,24,39,0.10)", background: T.card2 }}>
            <div className="text-[11px] font-semibold" style={{ color: T.text3 }}>
              Cobertura
            </div>
            <div className="mt-1 text-sm font-extrabold" style={{ color: T.text }}>
              {info.ufvCount} UFVs • {info.equipCount} equips
            </div>
            <div className="text-[11px] mt-1" style={{ color: T.text3 }}>
              variedade no dataset filtrado
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/* =========================================================
   TABLE (premium)
========================================================= */
function Table({
  rows,
  query,
  setQuery,
  sort,
  setSort,
  expandedId,
  setExpandedId,
  onCopyRow,
}: {
  rows: DriveRow[];
  query: string;
  setQuery: (s: string) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  expandedId: string | null;
  setExpandedId: (s: string | null) => void;
  onCopyRow: (r: DriveRow) => void;
}) {
  return (
    <Card
      title="Registros"
      subtitle="busca • ordenar • expandir • copiar"
      right={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.text3 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              className="h-10 pl-9 pr-3 text-sm border rounded-xl bg-white outline-none"
              style={{ borderColor: "rgba(17,24,39,0.10)", color: T.text, width: 300, boxShadow: "none" }}
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-10 px-3 text-sm border rounded-xl bg-white outline-none"
            style={{ borderColor: "rgba(17,24,39,0.10)", color: T.text }}
          >
            <option value="data_desc">Data (desc)</option>
            <option value="data_asc">Data (asc)</option>
            <option value="ufv_asc">UFV (A-Z)</option>
            <option value="equip_asc">Equip (A-Z)</option>
            <option value="cliente_asc">Cliente (A-Z)</option>
          </select>
          {query && (
            <Btn tone="ghost" onClick={() => setQuery("")} title="Limpar busca">
              <X className="w-4 h-4" />
            </Btn>
          )}
        </div>
      }
    >
      <div className="border rounded-2xl overflow-hidden" style={{ borderColor: "rgba(17,24,39,0.10)" }}>
        <div className="overflow-auto" style={{ maxHeight: 560 }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10" style={{ background: T.card }}>
              <tr>
                {["Data", "UFV/Usina", "Cliente", "Equipamento", "Motivo", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 border-b text-[12px]"
                    style={{ borderColor: "rgba(17,24,39,0.10)", color: T.text2 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((r, idx) => {
                const zebra = idx % 2 === 1;
                const id = rowId(r);
                const expanded = expandedId === id;
                const c = normCliente(r.cliente);
                const col = clienteColor(c);

                return (
                  <React.Fragment key={id}>
                    <tr
                      className="border-b hover:bg-black/[0.02] transition"
                      style={{
                        borderColor: "rgba(17,24,39,0.06)",
                        background: zebra ? "rgba(17,24,39,0.02)" : "transparent",
                      }}
                    >
                      <td className="px-3 py-2 whitespace-nowrap" style={{ color: T.text2 }}>
                        {brDate(r.data)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap" style={{ color: T.text, fontWeight: 900 }}>
                        {ufvLabel(r)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-2 px-2 py-1 rounded-lg border text-[12px] font-semibold"
                          style={{ borderColor: "rgba(17,24,39,0.10)", color: T.text2, background: col.fill }}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ background: col.dot }} />
                          {c}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap" style={{ color: T.text2 }}>
                        {safeStr(r.equipamento, "N/A")}
                      </td>
                      <td className="px-3 py-2" style={{ color: T.text2 }}>
                        <div className="truncate max-w-[720px]">{safeStr(r.motivo_mobilizacao)}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="h-9 w-9 rounded-xl border inline-flex items-center justify-center"
                            style={{ borderColor: "rgba(17,24,39,0.10)", background: T.card, color: T.text2 }}
                            onClick={() => onCopyRow(r)}
                            title="Copiar"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="h-9 w-9 rounded-xl border inline-flex items-center justify-center"
                            style={{ borderColor: "rgba(17,24,39,0.10)", background: T.card, color: T.text2 }}
                            onClick={() => setExpandedId(expanded ? null : id)}
                            title="Detalhes"
                          >
                            <ChevronDown className={cx("w-4 h-4 transition", expanded && "rotate-180")} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expanded && (
                      <tr style={{ background: "rgba(17,24,39,0.02)" }}>
                        <td colSpan={6} className="px-3 py-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              ["Problema identificado", r.problema_identificado],
                              ["Solução imediata", r.solucao_imediata],
                              ["Solução definitiva", r.solucao_definitiva],
                              ["Metadados", `Alarme: ${safeStr(r.alarme)} • SS: ${safeStr(r.ss)} • ID: ${id}`],
                            ].map(([h, v]) => (
                              <div
                                key={h}
                                className="border rounded-2xl p-3"
                                style={{ borderColor: "rgba(17,24,39,0.10)", background: T.card }}
                              >
                                <div className="text-[11px] font-semibold" style={{ color: T.text3 }}>
                                  {h}
                                </div>
                                <div className="text-sm mt-1 whitespace-pre-wrap" style={{ color: T.text2 }}>
                                  {safeStr(v)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center" style={{ color: T.text3 }}>
                    Nada encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

/* =========================================================
   PAGE
========================================================= */
export function AcionamentosDashPage() {
  return <DashAcionamentos />;
}

function DashAcionamentos() {
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [periodPreset, setPeriodPreset] = useState<
    "today" | "yesterday" | "thisMonth" | "lastMonth" | "last7" | "last30"
  >("last7");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [usina, setUsina] = useState("");
  const [equipamento, setEquipamento] = useState("");

  const [usinasList, setUsinasList] = useState<string[]>([]);
  const [equipamentos, setEquipamentos] = useState<string[]>([]);

  const [rows, setRows] = useState<DriveRow[]>([]);
  const [loading, setLoading] = useState(false);

  // cross filters (click)
  const [pickedCliente, setPickedCliente] = useState<string | null>(null);
  const [pickedUFV, setPickedUFV] = useState<string | null>(null);
  const [pickedEquip, setPickedEquip] = useState<string | null>(null);

  // table
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("data_desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [topN, setTopN] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    applyPreset(periodPreset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invalidRange = useMemo(() => {
    const s = start ? new Date(`${start}T00:00:00`) : null;
    const e = end ? new Date(`${end}T00:00:00`) : null;
    if (!s || !e) return false;
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return false;
    return s.getTime() > e.getTime();
  }, [start, end]);

  // load lists
  useEffect(() => {
    let alive = true;

    (async () => {
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
      } catch {}
    })();

    (async () => {
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
      } catch {}
    })();

    return () => {
      alive = false;
    };
  }, []);

  const applyPreset = (p: typeof periodPreset) => {
    const now = new Date();
    const toISO2 = (x: Date) => {
      const yy = x.getFullYear();
      const mm = String(x.getMonth() + 1).padStart(2, "0");
      const dd = String(x.getDate()).padStart(2, "0");
      return `${yy}-${mm}-${dd}`;
    };

    if (p === "today") {
      const d = toISO2(now);
      setStart(d);
      setEnd(d);
      return;
    }
    if (p === "yesterday") {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      const iso = toISO2(d);
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
      setStart(toISO2(s));
      setEnd(toISO2(e));
      return;
    }
    if (p === "last30") {
      const e = new Date(now);
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      setStart(toISO2(s));
      setEnd(toISO2(e));
      return;
    }
  };

  const buildParams = (s: string, e: string) => {
    const params = new URLSearchParams();
    params.set("mode", "drives");
    params.set("limit", "4000");
    params.set("offset", "0");
    if (usina) params.set("usina", clampUpper(usina));
    if (equipamento) params.set("equipamento", equipamento);
    if (s) params.set("start", s);
    if (e) params.set("end", e);
    return params;
  };

  // cache prev range rows to compute deltas
  const [prevRows, setPrevRows] = useState<DriveRow[]>([]);

  const load = async () => {
    setMsg(null);
    if (!start || !end) return setMsg({ type: "err", text: "Selecione um período." });
    if (invalidRange) return setMsg({ type: "err", text: "Data inicial maior que a final." });

    setLoading(true);
    try {
      // current
      const res = await fetch(`/api/acionamentos?${buildParams(start, end).toString()}`, { method: "GET" });
      const data = await res.json().catch(() => null);
      if (!res.ok) return setMsg({ type: "err", text: data?.error || "Erro ao carregar." });
      const rs = Array.isArray(data?.rows) ? data.rows : [];
      setRows(rs);

      // previous range (same length)
      const pr = shiftRangeBack(start, end);
      if (pr) {
        try {
          const res2 = await fetch(`/api/acionamentos?${buildParams(pr.start, pr.end).toString()}`, { method: "GET" });
          const data2 = await res2.json().catch(() => null);
          const rs2 = res2.ok && Array.isArray(data2?.rows) ? data2.rows : [];
          setPrevRows(rs2);
        } catch {
          setPrevRows([]);
        }
      } else {
        setPrevRows([]);
      }

      // reset UI cross filters
      setPickedCliente(null);
      setPickedUFV(null);
      setPickedEquip(null);
      setQuery("");
      setExpandedId(null);
    } catch {
      setMsg({ type: "err", text: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!start || !end) return;
    if (invalidRange) return;
    const t = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, invalidRange, usina, equipamento]);

  const clearCross = () => {
    setPickedCliente(null);
    setPickedUFV(null);
    setPickedEquip(null);
  };

  const filtered = useMemo(() => {
    let out = rows.slice();
    if (pickedCliente) out = out.filter((r) => normCliente(r.cliente) === pickedCliente);
    if (pickedUFV) out = out.filter((r) => ufvLabel(r) === pickedUFV);
    if (pickedEquip) out = out.filter((r) => equipLabel(r) === pickedEquip);
    return out;
  }, [rows, pickedCliente, pickedUFV, pickedEquip]);

  const prevFiltered = useMemo(() => {
    // deltas only consider “same cross filters”
    let out = prevRows.slice();
    if (pickedCliente) out = out.filter((r) => normCliente(r.cliente) === pickedCliente);
    if (pickedUFV) out = out.filter((r) => ufvLabel(r) === pickedUFV);
    if (pickedEquip) out = out.filter((r) => equipLabel(r) === pickedEquip);
    return out;
  }, [prevRows, pickedCliente, pickedUFV, pickedEquip]);

  const daysSeries = useMemo(() => {
    const s = parseISO(start);
    const e = parseISO(end);
    if (!s || !e) return [] as Array<{ day: string; count: number }>;

    const map = new Map<string, number>();
    for (const r of filtered) {
      if (!isIsoDate(r.data)) continue;
      map.set(r.data, (map.get(r.data) ?? 0) + 1);
    }

    const out: Array<{ day: string; count: number }> = [];
    const cur = new Date(s);
    while (cur.getTime() <= e.getTime()) {
      const key = toISO(cur);
      out.push({ day: key, count: map.get(key) ?? 0 });
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }, [filtered, start, end]);

  const spark = useMemo(() => daysSeries.map((d) => d.count), [daysSeries]);

  const totalCur = filtered.length;
  const totalPrev = prevFiltered.length;
  const deltaTotal = pctDelta(totalCur, totalPrev);

  const topUFV = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) m.set(ufvLabel(r), (m.get(ufvLabel(r)) ?? 0) + 1);
    const arr = Array.from(m.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return { key: arr[0]?.[0] ?? "—", count: arr[0]?.[1] ?? 0 };
  }, [filtered]);

  const topEquip = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) m.set(equipLabel(r), (m.get(equipLabel(r)) ?? 0) + 1);
    const arr = Array.from(m.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return { key: arr[0]?.[0] ?? "—", count: arr[0]?.[1] ?? 0 };
  }, [filtered]);

  const topCliente = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) m.set(normCliente(r.cliente), (m.get(normCliente(r.cliente)) ?? 0) + 1);
    const arr = Array.from(m.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return { key: arr[0]?.[0] ?? "—", count: arr[0]?.[1] ?? 0 };
  }, [filtered]);

  const deltaCliente = useMemo(() => {
    // delta do cliente líder no período atual vs período anterior (mesmo cross)
    const cur = topCliente.key;
    if (!cur || cur === "—") return 0;
    const curCount = filtered.filter((r) => normCliente(r.cliente) === cur).length;
    const prevCount = prevFiltered.filter((r) => normCliente(r.cliente) === cur).length;
    return pctDelta(curCount, prevCount);
  }, [filtered, prevFiltered, topCliente.key]);

  const tableRows = useMemo(() => {
    let out = filtered.slice();

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((r) => {
        const blob = [
          r.data,
          ufvLabel(r),
          normCliente(r.cliente),
          r.equipamento,
          r.alarme,
          r.motivo_mobilizacao,
          r.problema_identificado,
          r.solucao_imediata,
          r.solucao_definitiva,
          String(r.ss ?? ""),
        ]
          .join(" | ")
          .toLowerCase();
        return blob.includes(q);
      });
    }

    const cmpStr = (a: any, b: any) => String(a ?? "").localeCompare(String(b ?? ""), "pt-BR", { sensitivity: "base" });

    out.sort((a, b) => {
      if (sort === "data_desc") return String(b.data).localeCompare(String(a.data));
      if (sort === "data_asc") return String(a.data).localeCompare(String(b.data));
      if (sort === "ufv_asc") return cmpStr(ufvLabel(a), ufvLabel(b));
      if (sort === "equip_asc") return cmpStr(equipLabel(a), equipLabel(b));
      if (sort === "cliente_asc") return cmpStr(normCliente(a.cliente), normCliente(b.cliente));
      return 0;
    });

    return out;
  }, [filtered, query, sort]);

  const copyRow = async (r: DriveRow) => {
    setMsg(null);
    try {
      await navigator.clipboard.writeText(rowToClipboardText(r));
      setMsg({ type: "ok", text: "Copiado ✅" });
      window.setTimeout(() => setMsg(null), 1200);
    } catch {
      setMsg({ type: "err", text: "Não consegui copiar (permissão do navegador)." });
    }
  };

  const exportCsv = () => {
    const headers = ["data", "ufv_usina", "cliente", "equipamento", "alarme", "ss", "motivo_mobilizacao"];
    const lines = [
      headers.join(","),
      ...tableRows.map((r) => {
        const vals = [
          r.data,
          ufvLabel(r),
          normCliente(r.cliente),
          safeStr(r.equipamento, ""),
          safeStr(r.alarme, ""),
          String(r.ss ?? ""),
          String(r.motivo_mobilizacao ?? "").replace(/\n/g, " "),
        ].map((x) => `"${String(x).replace(/"/g, '""')}"`);
        return vals.join(",");
      }),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acionamentos_${start}_${end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleCliente = (c: string) => setPickedCliente((p) => (p === c ? null : c));
  const toggleUFV = (k: string) => setPickedUFV((p) => (p === k ? null : k));
  const toggleEquip = (k: string) => setPickedEquip((p) => (p === k ? null : k));

  return (
    <section style={{ background: T.bg, color: T.text }} className="w-full min-w-0">
      <div className="mx-auto w-full max-w-[1560px] px-4 sm:px-6 py-6">
        {/* TOP BAR (mais pro + recolhível) */}
        <div
          className="sticky top-3 z-40 border rounded-2xl shadow-[0_14px_38px_rgba(0,0,0,0.08)]"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)" as any }}
        >
          <div className="p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-base font-semibold tracking-tight" style={{ color: T.text }}>
                    Dashboard de Acionamentos
                  </div>
                  <Pill tone="info">BI</Pill>
                </div>

                <div className="text-xs mt-1" style={{ color: T.text3 }}>
                  Visual limpo • KPIs com delta vs período anterior • clique para filtrar
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Pill>Período: {start && end ? `${brDate(start)} → ${brDate(end)}` : "—"}</Pill>
                  {pickedCliente && <Pill tone="accent">Cliente: {pickedCliente}</Pill>}
                  {pickedUFV && <Pill tone="accent">UFV: {pickedUFV}</Pill>}
                  {pickedEquip && <Pill tone="accent">Equip: {pickedEquip}</Pill>}
                  {(pickedCliente || pickedUFV || pickedEquip) && (
                    <Btn tone="ghost" onClick={clearCross} title="Limpar filtros por clique">
                      <X className="w-4 h-4" />
                    </Btn>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Btn
                  tone="secondary"
                  onClick={() => setFiltersOpen((p) => !p)}
                  title={filtersOpen ? "Recolher filtros" : "Abrir filtros"}
                >
                  <Filter className="w-4 h-4" />
                  {filtersOpen ? "Recolher" : "Filtros"}
                  {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Btn>

                <Btn tone="secondary" loading={loading} onClick={load}>
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </Btn>
                <Btn tone="secondary" disabled={tableRows.length === 0} onClick={exportCsv}>
                  <Download className="w-4 h-4" />
                  Exportar
                </Btn>
              </div>
            </div>

            {filtersOpen && (
              <>
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                  <div className="lg:col-span-2">
                    <div className="text-[11px] font-semibold" style={{ color: T.text2 }}>
                      Preset
                    </div>
                    <select
                      value={periodPreset}
                      onChange={(e) => {
                        const v = e.target.value as any;
                        setPeriodPreset(v);
                        applyPreset(v);
                      }}
                      className="mt-1 h-10 w-full px-3 rounded-xl border bg-white text-sm outline-none"
                      style={{ borderColor: "rgba(17,24,39,0.10)", color: T.text }}
                    >
                      <option value="today">Hoje</option>
                      <option value="yesterday">Ontem</option>
                      <option value="thisMonth">Este mês</option>
                      <option value="lastMonth">Mês passado</option>
                      <option value="last7">Últimos 7 dias</option>
                      <option value="last30">Últimos 30 dias</option>
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="text-[11px] font-semibold" style={{ color: T.text2 }}>
                      Início
                    </div>
                    <input
                      type="date"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      className="mt-1 h-10 w-full px-3 rounded-xl border bg-white text-sm outline-none"
                      style={{ borderColor: "rgba(17,24,39,0.10)" }}
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <div className="text-[11px] font-semibold" style={{ color: T.text2 }}>
                      Fim
                    </div>
                    <input
                      type="date"
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      className="mt-1 h-10 w-full px-3 rounded-xl border bg-white text-sm outline-none"
                      style={{ borderColor: "rgba(17,24,39,0.10)" }}
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <div className="text-[11px] font-semibold" style={{ color: T.text2 }}>
                      Usina (backend)
                    </div>
                    <select
                      value={usina}
                      onChange={(e) => setUsina(e.target.value)}
                      className="mt-1 h-10 w-full px-3 rounded-xl border bg-white text-sm outline-none"
                      style={{ borderColor: "rgba(17,24,39,0.10)" }}
                    >
                      <option value="">Todas</option>
                      {usinasList.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-3">
                    <div className="text-[11px] font-semibold" style={{ color: T.text2 }}>
                      Equipamento (backend)
                    </div>
                    <select
                      value={equipamento}
                      onChange={(e) => setEquipamento(e.target.value)}
                      className="mt-1 h-10 w-full px-3 rounded-xl border bg-white text-sm outline-none"
                      style={{ borderColor: "rgba(17,24,39,0.10)" }}
                    >
                      <option value="">Todos</option>
                      {equipamentos.map((eq) => (
                        <option key={eq} value={eq}>
                          {eq}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="text-[11px] font-semibold" style={{ color: T.text2 }}>
                      Top N
                    </div>
                    <select
                      value={topN}
                      onChange={(e) => setTopN(Number(e.target.value))}
                      className="mt-1 h-10 w-full px-3 rounded-xl border bg-white text-sm outline-none"
                      style={{ borderColor: "rgba(17,24,39,0.10)", color: T.text }}
                    >
                      <option value={5}>Top 5</option>
                      <option value={10}>Top 10</option>
                      <option value={15}>Top 15</option>
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
              </>
            )}
          </div>
        </div>

        {/* KPIs (com deltas) */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total de acionamentos"
            value={totalCur}
            hint={`vs período anterior: ${totalPrev}`}
            delta={deltaTotal}
            spark={spark}
          />
          <KpiCard
            title="Cliente líder"
            value={topCliente.key}
            hint={`${topCliente.count} ocorrências`}
            delta={deltaCliente}
            spark={spark}
          />
          <KpiCard title="UFV líder" value={topUFV.key} hint={`${topUFV.count} ocorrências`} spark={spark} />
          <KpiCard title="Equipamento líder" value={topEquip.key} hint={`${topEquip.count} ocorrências`} spark={spark} />
        </div>

        {/* INSIGHTS */}
        <div className="mt-4">
          <Insights rows={filtered} start={start} end={end} />
        </div>

        {/* CHARTS GRID (muito mais legível) */}
        <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
          <TrendArea title="Tendência por dia" subtitle="área/linha + tooltip" days={daysSeries} />

          <div className="grid gap-4">
            <DonutCliente rows={filtered} pickedCliente={pickedCliente} onPickCliente={toggleCliente} />
            <WeekdayBars rows={filtered} />
          </div>

          <div className="grid gap-4">
            <TopBars
              title="Top UFVs"
              subtitle="ranking (clique para filtrar)"
              rows={filtered}
              mode="ufv"
              topN={topN}
              activeKey={pickedUFV}
              onPickKey={toggleUFV}
            />
            <TopBars
              title="Top Equipamentos"
              subtitle="ranking (clique para filtrar)"
              rows={filtered}
              mode="equip"
              topN={topN}
              activeKey={pickedEquip}
              onPickKey={toggleEquip}
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="mt-4">
          <Table
            rows={tableRows}
            query={query}
            setQuery={setQuery}
            sort={sort}
            setSort={setSort}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            onCopyRow={copyRow}
          />
        </div>

        {/* Focus ring */}
        <style jsx global>{`
          input:focus,
          textarea:focus,
          select:focus {
            outline: none !important;
            box-shadow: 0 0 0 2px ${T.ring} !important;
          }
        `}</style>
      </div>
    </section>
  );
}
