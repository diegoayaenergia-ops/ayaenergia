"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  useDeferredValue,
} from "react";
import {
  Search,
  RefreshCw,
  X,
  Download,
  Copy,
  ChevronDown,
  Filter,
  ChevronUp,
  TrendingUp,
  CalendarDays,
  Building2,
  Siren,
  Cpu,
  Users,
  Flame,
  Table2,
} from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) =>
  p.filter(Boolean).join(" ");

/* =========================================================
   TOKENS
========================================================= */
const T = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  card2: "#FBFCFD",
  border: "rgba(17,24,39,0.10)",
  text: "#0B1220",
  text2: "rgba(11,18,32,0.74)",
  text3: "rgba(11,18,32,0.54)",
  muted: "rgba(17,24,39,0.035)",

  accent: "#115923",
  accent2: "#1E7C35",
  ring: "rgba(17,89,35,0.18)",
  accentSoft: "rgba(17,89,35,0.10)",

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

type SortKey =
  | "data_desc"
  | "data_asc"
  | "ufv_asc"
  | "equip_asc"
  | "cliente_asc";

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
function isoWeekKey(iso: string) {
  const d0 = parseISO(iso);
  if (!d0) return "—";
  const d = new Date(Date.UTC(d0.getFullYear(), d0.getMonth(), d0.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    (((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7
  );
  const yyyy = d.getUTCFullYear();
  const ww = String(weekNo).padStart(2, "0");
  return `${yyyy}-W${ww}`;
}
function weekdayKey(iso: string) {
  const d = parseISO(iso);
  if (!d) return "—";
  const wd = d.getDay();
  const map = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"] as const;
  return map[wd] ?? "—";
}

function normCliente(v: any) {
  const s = String(v ?? "").trim().toUpperCase();
  if (!s) return "ÉLIS";
  if (s.includes("INEER")) return "INEER";
  if (s.includes("KAMAI")) return "KAMAI";
  if (s.includes("ÉLIS") || s.includes("ELIS")) return "ÉLIS";
  return s;
}

function ufvLabel(r: DriveRow) {
  return clampUpper(String(r.ufv ?? r.usina ?? "").trim()) || "N/A";
}
function usinaLabel(r: DriveRow) {
  return clampUpper(String(r.usina ?? "").trim()) || "N/A";
}
function equipLabel(r: DriveRow) {
  return safeStr(r.equipamento, "N/A");
}
function alarmeLabel(r: DriveRow) {
  return safeStr(r.alarme, "N/A");
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
   UI PRIMITIVES (compact)
========================================================= */
function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "info";
}) {
  const s =
    tone === "accent"
      ? { borderColor: "rgba(17,89,35,0.20)", background: T.accentSoft, color: T.accent }
      : tone === "info"
      ? { borderColor: "rgba(37,99,235,0.20)", background: "rgba(37,99,235,0.08)", color: "rgba(37,99,235,0.95)" }
      : { borderColor: T.border, background: T.card2, color: T.text2 };

  return (
    <span
      className="inline-flex items-center h-6 px-2 text-[11px] font-semibold border rounded-lg"
      style={s}
    >
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
    "inline-flex items-center justify-center gap-2 h-9 px-3 text-sm font-semibold border rounded-xl " +
    "disabled:opacity-50 disabled:cursor-not-allowed transition active:translate-y-[0.5px]";

  const style =
    tone === "primary"
      ? { background: T.accent, borderColor: "rgba(17,89,35,0.45)", color: "white" }
      : tone === "ghost"
      ? { background: "transparent", borderColor: "transparent", color: T.text2 }
      : { background: T.card, borderColor: T.border, color: T.text };

  return (
    <button
      className={cx(base, className)}
      style={style}
      disabled={disabled || loading}
      {...props}
    >
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
  icon,
  dense = true,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  dense?: boolean;
}) {
  return (
    <div
      className={cx(
        "border rounded-2xl overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.03)]",
        className
      )}
      style={{ borderColor: T.border, background: T.card }}
    >
      <div
        className={cx("border-b flex items-center justify-between gap-3", dense ? "px-3 py-2" : "px-5 py-3")}
        style={{
          borderColor: T.border,
          background:
            "linear-gradient(to bottom, rgba(17,24,39,0.08), rgba(17,24,39,0.03))",
        }}
      >
        <div className="min-w-0 flex items-center gap-2">
          {icon ? (
            <div
              className={cx(
                "rounded-xl border flex items-center justify-center shrink-0",
                dense ? "h-7 w-7" : "h-8 w-8"
              )}
              style={{ borderColor: "rgba(17,24,39,0.10)", background: "rgba(17,24,39,0.02)" }}
            >
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            <div className={cx("font-semibold truncate", dense ? "text-[13px]" : "text-sm")} style={{ color: T.text }}>
              {title}
            </div>
            {subtitle ? (
              <div className={cx("truncate", dense ? "text-[11px]" : "text-xs")} style={{ color: T.text3 }}>
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
        {right}
      </div>
      <div className={cx(dense ? "p-3" : "p-5")}>{children}</div>
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

function MiniKpi({
  label,
  value,
  icon,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "accent" | "info";
}) {
  const bg =
    tone === "accent"
      ? "rgba(17,89,35,0.08)"
      : tone === "info"
      ? "rgba(37,99,235,0.07)"
      : "rgba(17,24,39,0.03)";
  const br =
    tone === "accent"
      ? "rgba(17,89,35,0.16)"
      : tone === "info"
      ? "rgba(37,99,235,0.14)"
      : "rgba(17,24,39,0.10)";

  return (
    <div
      className="border rounded-2xl px-3 py-2.5 flex items-center justify-between gap-3"
      style={{ background: bg, borderColor: br }}
    >
      <div className="min-w-0">
        <div className="text-[10px] font-semibold leading-4" style={{ color: T.text3 }}>
          {label}
        </div>
        <div className="text-[20px] font-black leading-6 tracking-tight" style={{ color: T.text }}>
          {value}
        </div>
        {hint ? (
          <div className="text-[10px] font-semibold mt-0.5 truncate" style={{ color: T.text2 }}>
            {hint}
          </div>
        ) : null}
      </div>
      {icon ? (
        <div
          className="h-9 w-9 rounded-2xl border flex items-center justify-center shrink-0"
          style={{ borderColor: br, background: "rgba(255,255,255,0.75)" }}
        >
          {icon}
        </div>
      ) : null}
    </div>
  );
}

/* =========================================================
   CHARTS (compact + click-to-filter)
========================================================= */
function HorizontalRankBars({
  title,
  subtitle,
  icon,
  rows,
  activeKey,
  onPickKey,
  labelOf,
  emptyLabel = "N/A",
  maxHeight = 260,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  rows: DriveRow[];
  activeKey: string | null;
  onPickKey: (k: string) => void;
  labelOf: (r: DriveRow) => string;
  emptyLabel?: string;
  maxHeight?: number;
}) {
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q);

  const agg = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const raw = String(labelOf(r) || "").trim();
      const k = raw ? raw : emptyLabel;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    let arr = Array.from(m.entries()).map(([key, count]) => ({ key, count }));
    arr.sort(
      (a, b) =>
        b.count - a.count ||
        a.key.localeCompare(b.key, "pt-BR", { sensitivity: "base" })
    );
    const qq = dq.trim().toLowerCase();
    if (qq) arr = arr.filter((x) => x.key.toLowerCase().includes(qq));

    const max = Math.max(1, ...arr.map((x) => x.count));
    const total = Math.max(1, rows.length);
    return { arr, max, total };
  }, [rows, labelOf, emptyLabel, dq]);

  return (
    <Card
      dense
      title={title}
      subtitle={subtitle}
      icon={icon}
      right={
        <div className="flex items-center gap-2">
          {activeKey ? <Pill tone="accent">{activeKey}</Pill> : <Pill>{agg.arr.length}</Pill>}
          <div className="relative hidden lg:block">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: T.text3 }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar…"
              className="h-8 pl-8 pr-2 text-[13px] border rounded-xl bg-white outline-none"
              style={{ borderColor: "rgba(17,24,39,0.10)", color: T.text, width: 180 }}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg border inline-flex items-center justify-center"
                style={{ borderColor: "rgba(17,24,39,0.10)", background: "rgba(17,24,39,0.02)", color: T.text2 }}
                title="Limpar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      }
    >
      {agg.arr.length === 0 ? (
        <div className="text-sm" style={{ color: T.text2 }}>Sem dados.</div>
      ) : (
        <div
          className="border rounded-2xl overflow-hidden"
          style={{ borderColor: "rgba(17,24,39,0.10)", background: T.card }}
        >
          <div className="overflow-auto" style={{ maxHeight }}>
            {agg.arr.map((it) => {
              const active = activeKey === it.key;
              const dimmed = activeKey && !active;
              const w = (it.count / agg.max) * 100;
              const share = Math.round((it.count / agg.total) * 100);
              return (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => onPickKey(it.key)}
                  className="w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-black/[0.02] transition"
                  style={{ borderColor: "rgba(17,24,39,0.06)", opacity: dimmed ? 0.5 : 1 }}
                  title="Clique para filtrar"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-extrabold truncate" style={{ color: T.text }}>
                        {it.key}
                      </div>
                      <div className="text-[10px] font-semibold mt-0.5" style={{ color: T.text3 }}>
                        {it.count} • {share}%
                      </div>
                    </div>
                    <Pill tone={active ? "accent" : "neutral"}>{it.count}</Pill>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(17,24,39,0.06)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(2, w)}%`, background: active ? T.accent : "rgba(17,89,35,0.55)" }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function TrendDailyMini({
  rows,
  title,
  subtitle,
  icon,
  pickedDay,
  onPickDay,
}: {
  rows: DriveRow[];
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  pickedDay: string | null;
  onPickDay: (isoDay: string) => void;
}) {
  const data = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      if (!isIsoDate(r.data)) continue;
      m.set(r.data, (m.get(r.data) ?? 0) + 1);
    }
    const arr = Array.from(m.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const max = Math.max(1, ...arr.map((x) => x.count));
    return { arr, max };
  }, [rows]);

  const W = 700;
  const H = 180;
  const padL = 34;
  const padR = 14;
  const padT = 14;
  const padB = 28;

  const n = Math.max(1, data.arr.length);
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const xOf = (i: number) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yOf = (v: number) => padT + innerH - (v / data.max) * innerH;

  const dPath = useMemo(() => {
    if (data.arr.length === 0) return "";
    return data.arr
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(p.count)}`)
      .join(" ");
  }, [data.arr, n, innerW, innerH]);

  const areaPath = useMemo(() => {
    if (data.arr.length === 0) return "";
    const top = data.arr.map((p, i) => `L ${xOf(i)} ${yOf(p.count)}`).join(" ");
    const xEnd = xOf(data.arr.length - 1);
    const yBase = padT + innerH;
    return `M ${xOf(0)} ${yBase} ${top} L ${xEnd} ${yBase} Z`;
  }, [data.arr, n, innerH]);

  return (
    <Card
      dense
      title={title}
      subtitle={subtitle}
      icon={icon}
      right={
        pickedDay ? (
          <div className="flex items-center gap-2">
            <Pill tone="info">{brDate(pickedDay)}</Pill>
            <Btn tone="ghost" onClick={() => onPickDay(pickedDay)} title="Limpar dia">
              <X className="w-4 h-4" />
            </Btn>
          </div>
        ) : (
          <Pill>{rows.length}</Pill>
        )
      }
    >
      {data.arr.length === 0 ? (
        <div className="text-sm" style={{ color: T.text2 }}>Sem dados.</div>
      ) : (
        <div
          className="border rounded-2xl overflow-hidden"
          style={{ borderColor: "rgba(17,24,39,0.10)", background: T.card }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <path d={areaPath} fill="rgba(17,89,35,0.10)" />
            <path d={dPath} fill="none" stroke="rgba(17,89,35,0.80)" strokeWidth="3" />
            {data.arr.map((p, i) => {
              const x = xOf(i);
              const y = yOf(p.count);
              const active = pickedDay === p.date;
              return (
                <g key={p.date}>
                  <circle cx={x} cy={y} r={active ? 5.5 : 4} fill={T.accent} opacity={0.95} />
                  <rect
                    x={x - 10}
                    y={padT}
                    width={20}
                    height={innerH}
                    fill="transparent"
                    style={{ cursor: "pointer" }}
                    onClick={() => onPickDay(p.date)}
                  />
                </g>
              );
            })}
            <text x={padL} y={H - 8} fontSize="10" fill={T.text3} fontWeight={800} textAnchor="start">
              {brDate(data.arr[0]?.date)}
            </text>
            <text x={padL + innerW} y={H - 8} fontSize="10" fill={T.text3} fontWeight={800} textAnchor="end">
              {brDate(data.arr[data.arr.length - 1]?.date)}
            </text>
          </svg>
        </div>
      )}
      <div className="mt-1 text-[10px] font-semibold" style={{ color: T.text3 }}>
        clique no ponto para filtrar o dia
      </div>
    </Card>
  );
}

/* =========================================================
   TABLE (compact, collapsible outside)
========================================================= */
function TableCompact({
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
      dense
      title="Registros"
      subtitle="busca • ordenar • expandir"
      icon={<Table2 className="w-4 h-4" style={{ color: T.text2 }} />}
      right={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: T.text3 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              className="h-8 pl-8 pr-2 text-[13px] border rounded-xl bg-white outline-none"
              style={{ borderColor: "rgba(17,24,39,0.10)", color: T.text, width: 220 }}
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-8 px-2 text-[13px] border rounded-xl bg-white outline-none"
            style={{ borderColor: "rgba(17,24,39,0.10)", color: T.text }}
          >
            <option value="data_desc">Data ↓</option>
            <option value="data_asc">Data ↑</option>
            <option value="ufv_asc">UFV A-Z</option>
            <option value="equip_asc">Equip A-Z</option>
            <option value="cliente_asc">Cliente A-Z</option>
          </select>
          {query ? (
            <Btn tone="ghost" onClick={() => setQuery("")} title="Limpar">
              <X className="w-4 h-4" />
            </Btn>
          ) : null}
        </div>
      }
    >
      <div className="border rounded-2xl overflow-hidden" style={{ borderColor: "rgba(17,24,39,0.10)" }}>
        <div className="overflow-auto" style={{ maxHeight: 420 }}>
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 z-10" style={{ background: T.card }}>
              <tr>
                {["Data", "UFV", "Cliente", "Equip", "Motivo", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-2.5 py-2 border-b text-[11px]"
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

                return (
                  <React.Fragment key={id}>
                    <tr
                      className="border-b hover:bg-black/[0.02] transition"
                      style={{
                        borderColor: "rgba(17,24,39,0.06)",
                        background: zebra ? "rgba(17,24,39,0.02)" : "transparent",
                      }}
                    >
                      <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: T.text2 }}>
                        {brDate(r.data)}
                      </td>
                      <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: T.text, fontWeight: 900 }}>
                        {ufvLabel(r)}
                      </td>
                      <td className="px-2.5 py-2 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-lg border text-[11px] font-semibold"
                          style={{
                            borderColor: "rgba(17,24,39,0.10)",
                            color: T.text2,
                            background: "rgba(17,24,39,0.03)",
                          }}
                        >
                          {c}
                        </span>
                      </td>
                      <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: T.text2 }}>
                        {safeStr(r.equipamento, "N/A")}
                      </td>
                      <td className="px-2.5 py-2" style={{ color: T.text2 }}>
                        <div className="truncate max-w-[520px]">{safeStr(r.motivo_mobilizacao)}</div>
                      </td>
                      <td className="px-2.5 py-2 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className="h-8 w-8 rounded-xl border inline-flex items-center justify-center"
                            style={{
                              borderColor: "rgba(17,24,39,0.10)",
                              background: T.card,
                              color: T.text2,
                            }}
                            onClick={() => onCopyRow(r)}
                            title="Copiar"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="h-8 w-8 rounded-xl border inline-flex items-center justify-center"
                            style={{
                              borderColor: "rgba(17,24,39,0.10)",
                              background: T.card,
                              color: T.text2,
                            }}
                            onClick={() => setExpandedId(expanded ? null : id)}
                            title="Detalhes"
                          >
                            <ChevronDown className={cx("w-4 h-4 transition", expanded && "rotate-180")} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expanded ? (
                      <tr style={{ background: "rgba(17,24,39,0.02)" }}>
                        <td colSpan={6} className="px-2.5 py-2.5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {[
                              ["Problema", r.problema_identificado],
                              ["Solução imediata", r.solucao_imediata],
                              ["Solução definitiva", r.solucao_definitiva],
                              ["Metadados", `Alarme: ${safeStr(r.alarme)} • SS: ${safeStr(r.ss)} • ID: ${id}`],
                            ].map(([h, v]) => (
                              <div
                                key={String(h)}
                                className="border rounded-2xl p-2.5"
                                style={{ borderColor: "rgba(17,24,39,0.10)", background: T.card }}
                              >
                                <div className="text-[10px] font-semibold" style={{ color: T.text3 }}>
                                  {h as any}
                                </div>
                                <div className="text-[12px] mt-1 whitespace-pre-wrap" style={{ color: T.text2 }}>
                                  {safeStr(v)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}

              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center" style={{ color: T.text3 }}>
                    Nada encontrado.
                  </td>
                </tr>
              ) : null}
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

  // ✅ padrão: mês atual
  const [periodPreset, setPeriodPreset] = useState<
    "today" | "yesterday" | "thisMonth" | "lastMonth" | "last7" | "last30"
  >("thisMonth");

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [usina, setUsina] = useState("");
  const [equipamento, setEquipamento] = useState("");

  const [usinasList, setUsinasList] = useState<string[]>([]);
  const [equipamentos, setEquipamentos] = useState<string[]>([]);

  const [rows, setRows] = useState<DriveRow[]>([]);
  const [loading, setLoading] = useState(false);

  // click filters
  const [pickedUsina, setPickedUsina] = useState<string | null>(null);
  const [pickedEquip, setPickedEquip] = useState<string | null>(null);
  const [pickedAlarme, setPickedAlarme] = useState<string | null>(null);
  const [pickedCliente, setPickedCliente] = useState<string | null>(null);
  const [pickedWeek, setPickedWeek] = useState<string | null>(null);
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [pickedWeekday, setPickedWeekday] = useState<string | null>(null);

  // table
  const [showTable, setShowTable] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [sort, setSort] = useState<SortKey>("data_desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // filtros “compact”: fechado por padrão
  const [filtersOpen, setFiltersOpen] = useState(false);

  // preset inicial
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

  const [prevRows, setPrevRows] = useState<DriveRow[]>([]);

  const clearCross = () => {
    setPickedUsina(null);
    setPickedEquip(null);
    setPickedAlarme(null);
    setPickedCliente(null);
    setPickedWeek(null);
    setPickedDay(null);
    setPickedWeekday(null);
  };

  const load = async () => {
    setMsg(null);
    if (!start || !end) return setMsg({ type: "err", text: "Selecione um período." });
    if (invalidRange) return setMsg({ type: "err", text: "Data inicial maior que a final." });

    setLoading(true);
    try {
      const res = await fetch(`/api/acionamentos?${buildParams(start, end).toString()}`, { method: "GET" });
      const data = await res.json().catch(() => null);
      if (!res.ok) return setMsg({ type: "err", text: data?.error || "Erro ao carregar." });

      const rs = Array.isArray(data?.rows) ? data.rows : [];
      setRows(rs);

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

      clearCross();
      setQuery("");
      setExpandedId(null);
    } catch {
      setMsg({ type: "err", text: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  };

  // auto-load
  useEffect(() => {
    if (!start || !end) return;
    if (invalidRange) return;
    const t = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, invalidRange, usina, equipamento]);

  // cross-filter base
  const filtered = useMemo(() => {
    let out = rows.slice();
    if (pickedUsina) out = out.filter((r) => usinaLabel(r) === pickedUsina);
    if (pickedEquip) out = out.filter((r) => equipLabel(r) === pickedEquip);
    if (pickedAlarme) out = out.filter((r) => alarmeLabel(r) === pickedAlarme);
    if (pickedCliente) out = out.filter((r) => normCliente(r.cliente) === pickedCliente);
    if (pickedWeek) out = out.filter((r) => (isIsoDate(r.data) ? isoWeekKey(r.data) === pickedWeek : false));
    if (pickedDay) out = out.filter((r) => r.data === pickedDay);
    if (pickedWeekday) out = out.filter((r) => (isIsoDate(r.data) ? weekdayKey(r.data) === pickedWeekday : false));
    return out;
  }, [rows, pickedUsina, pickedEquip, pickedAlarme, pickedCliente, pickedWeek, pickedDay, pickedWeekday]);

  const prevFiltered = useMemo(() => {
    let out = prevRows.slice();
    if (pickedUsina) out = out.filter((r) => usinaLabel(r) === pickedUsina);
    if (pickedEquip) out = out.filter((r) => equipLabel(r) === pickedEquip);
    if (pickedAlarme) out = out.filter((r) => alarmeLabel(r) === pickedAlarme);
    if (pickedCliente) out = out.filter((r) => normCliente(r.cliente) === pickedCliente);
    return out;
  }, [prevRows, pickedUsina, pickedEquip, pickedAlarme, pickedCliente]);

  const totalCur = filtered.length;
  const totalPrev = prevFiltered.length;
  const deltaTotal = pctDelta(totalCur, totalPrev);

  const distinctUsinas = useMemo(() => new Set(filtered.map(usinaLabel)).size, [filtered]);
  const distinctEquips = useMemo(() => new Set(filtered.map(equipLabel)).size, [filtered]);
  const distinctAlarms = useMemo(() => new Set(filtered.map(alarmeLabel)).size, [filtered]);
  const distinctClientes = useMemo(() => new Set(filtered.map((r) => normCliente(r.cliente))).size, [filtered]);

  // table rows
  const tableRows = useMemo(() => {
    let out = filtered.slice();

    const q = deferredQuery.trim().toLowerCase();
    if (q) {
      out = out.filter((r) => {
        const blob = [
          r.data,
          ufvLabel(r),
          usinaLabel(r),
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

    const cmpStr = (a: any, b: any) =>
      String(a ?? "").localeCompare(String(b ?? ""), "pt-BR", { sensitivity: "base" });

    out.sort((a, b) => {
      if (sort === "data_desc") return String(b.data).localeCompare(String(a.data));
      if (sort === "data_asc") return String(a.data).localeCompare(String(b.data));
      if (sort === "ufv_asc") return cmpStr(ufvLabel(a), ufvLabel(b));
      if (sort === "equip_asc") return cmpStr(equipLabel(a), equipLabel(b));
      if (sort === "cliente_asc") return cmpStr(normCliente(a.cliente), normCliente(b.cliente));
      return 0;
    });

    return out;
  }, [filtered, deferredQuery, sort]);

  const copyRow = async (r: DriveRow) => {
    setMsg(null);
    try {
      await navigator.clipboard.writeText(rowToClipboardText(r));
      setMsg({ type: "ok", text: "Copiado ✅" });
      window.setTimeout(() => setMsg(null), 900);
    } catch {
      setMsg({ type: "err", text: "Não consegui copiar (permissão do navegador)." });
    }
  };

  const exportCsv = () => {
    const headers = [
      "data",
      "ufv_usina",
      "usina_backend",
      "cliente",
      "equipamento",
      "alarme",
      "ss",
      "motivo_mobilizacao",
    ];
    const lines = [
      headers.join(","),
      ...tableRows.map((r) => {
        const vals = [
          r.data,
          ufvLabel(r),
          usinaLabel(r),
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

  const toggle = (setter: (fn: (p: string | null) => string | null) => void, k: string) =>
    setter((p) => (p === k ? null : k));

  const toggleUsina = (k: string) => toggle(setPickedUsina, k);
  const toggleEquip = (k: string) => toggle(setPickedEquip, k);
  const toggleAlarme = (k: string) => toggle(setPickedAlarme, k);

  return (
    <section style={{ background: T.bg, color: T.text }} className="w-full min-w-0">
      <div className="mx-auto w-full max-w-[1560px] px-4 sm:px-6 py-4">
        {/* TOP BAR (compact) */}
        <div
          className="sticky top-3 z-40 border rounded-2xl shadow-[0_12px_34px_rgba(0,0,0,0.08)]"
          style={{
            borderColor: T.border,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)" as any,
          }}
        >
          <div className="p-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-[14px] font-semibold tracking-tight" style={{ color: T.text }}>
                    Acionamentos
                  </div>
                  <Pill tone="accent">Total {totalCur}</Pill>
                  <Pill>Δ {fmtPct(deltaTotal)}</Pill>
                  <Pill>
                    {start && end ? `${brDate(start)} → ${brDate(end)}` : "—"}
                  </Pill>
                  {(pickedUsina || pickedEquip || pickedAlarme || pickedWeek || pickedDay || pickedWeekday || pickedCliente) ? (
                    <Btn tone="ghost" onClick={clearCross} title="Limpar filtros por clique">
                      <X className="w-4 h-4" />
                      Limpar
                    </Btn>
                  ) : null}
                </div>

                {/* INLINE FILTERS (1 linha) */}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <select
                    value={periodPreset}
                    onChange={(e) => {
                      const v = e.target.value as any;
                      setPeriodPreset(v);
                      applyPreset(v);
                    }}
                    className="h-8 px-2 text-[13px] border rounded-xl bg-white outline-none"
                    style={{ borderColor: "rgba(17,24,39,0.10)", color: T.text }}
                    title="Período"
                  >
                    <option value="thisMonth">Mês atual</option>
                    <option value="lastMonth">Mês passado</option>
                    <option value="last7">7 dias</option>
                    <option value="last30">30 dias</option>
                    <option value="today">Hoje</option>
                    <option value="yesterday">Ontem</option>
                  </select>

                  <input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="h-8 px-2 text-[13px] border rounded-xl bg-white outline-none"
                    style={{ borderColor: "rgba(17,24,39,0.10)" }}
                    title="Início"
                  />
                  <input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="h-8 px-2 text-[13px] border rounded-xl bg-white outline-none"
                    style={{ borderColor: "rgba(17,24,39,0.10)" }}
                    title="Fim"
                  />

                  <Btn tone="secondary" onClick={() => setFiltersOpen((p) => !p)}>
                    <Filter className="w-4 h-4" />
                    {filtersOpen ? "Menos" : "Mais"}
                    {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Btn>

                  <Btn tone="secondary" loading={loading} onClick={load}>
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                  </Btn>

                  <Btn tone="secondary" disabled={tableRows.length === 0} onClick={exportCsv}>
                    <Download className="w-4 h-4" />
                    CSV
                  </Btn>

                  <Btn tone="secondary" onClick={() => setShowTable((p) => !p)}>
                    <Table2 className="w-4 h-4" />
                    {showTable ? "Ocultar tabela" : "Ver tabela"}
                  </Btn>
                </div>
              </div>
            </div>

            {filtersOpen ? (
              <div className="mt-3 grid grid-cols-1 lg:grid-cols-12 gap-2 items-end">
                <div className="lg:col-span-4">
                  <div className="text-[11px] font-semibold" style={{ color: T.text2 }}>
                    Usina (backend)
                  </div>
                  <select
                    value={usina}
                    onChange={(e) => setUsina(e.target.value)}
                    className="mt-1 h-8 w-full px-2 rounded-xl border bg-white text-[13px] outline-none"
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

                <div className="lg:col-span-4">
                  <div className="text-[11px] font-semibold" style={{ color: T.text2 }}>
                    Equipamento (backend)
                  </div>
                  <select
                    value={equipamento}
                    onChange={(e) => setEquipamento(e.target.value)}
                    className="mt-1 h-8 w-full px-2 rounded-xl border bg-white text-[13px] outline-none"
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

                <div className="lg:col-span-4">
                  <div className="text-[11px] font-semibold" style={{ color: T.text2 }}>
                    Avisos
                  </div>
                  <div className="mt-1">
                    {invalidRange ? (
                      <div className="text-[11px]" style={{ color: T.errTx }}>
                        Data inicial maior que a final.
                      </div>
                    ) : (
                      <MsgBox m={msg} />
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* KPIs (compact) */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          <MiniKpi
            label="Total"
            value={totalCur}
            tone="accent"
            icon={<Flame className="w-5 h-5" style={{ color: T.accent }} />}
            hint={<span>Δ {fmtPct(deltaTotal)}</span>}
          />
          <MiniKpi
            label="Usinas"
            value={distinctUsinas}
            icon={<Building2 className="w-5 h-5" style={{ color: T.text2 }} />}
            hint={<span>distintas</span>}
          />
          <MiniKpi
            label="Equipamentos"
            value={distinctEquips}
            icon={<Cpu className="w-5 h-5" style={{ color: T.text2 }} />}
            hint={<span>distintos</span>}
          />
          <MiniKpi
            label="Alarmes"
            value={distinctAlarms}
            icon={<Siren className="w-5 h-5" style={{ color: T.text2 }} />}
            hint={<span>distintos</span>}
          />
          <MiniKpi
            label="Clientes"
            value={distinctClientes}
            icon={<Users className="w-5 h-5" style={{ color: T.text2 }} />}
            hint={<span>distintos</span>}
          />
          <MiniKpi
            label="Registros"
            value={rows.length}
            tone="info"
            icon={<CalendarDays className="w-5 h-5" style={{ color: "rgba(37,99,235,0.95)" }} />}
            hint={<span>carregados</span>}
          />
        </div>

        {/* CHART GRID (dense: 1 tela) */}
        <div className="mt-3 grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
          {/* Left: Usinas (rank) */}
          <div className="xl:col-span-5">
            <HorizontalRankBars
              title="Usinas"
              subtitle="clique para filtrar"
              icon={<Building2 className="w-4 h-4" style={{ color: T.text2 }} />}
              rows={filtered}
              activeKey={pickedUsina}
              onPickKey={toggleUsina}
              labelOf={usinaLabel}
              maxHeight={520}
            />
          </div>

          {/* Right: 2x2 compact */}
          <div className="xl:col-span-7 grid gap-3">
            <TrendDailyMini
              title="Tendência"
              subtitle="clique no ponto filtra dia"
              icon={<TrendingUp className="w-4 h-4" style={{ color: T.text2 }} />}
              rows={filtered}
              pickedDay={pickedDay}
              onPickDay={(d) => setPickedDay((p) => (p === d ? null : d))}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <HorizontalRankBars
                title="Equipamentos"
                subtitle="clique para filtrar"
                icon={<Cpu className="w-4 h-4" style={{ color: T.text2 }} />}
                rows={filtered}
                activeKey={pickedEquip}
                onPickKey={toggleEquip}
                labelOf={equipLabel}
                maxHeight={250}
              />
              <HorizontalRankBars
                title="Alarmes"
                subtitle="clique para filtrar"
                icon={<Siren className="w-4 h-4" style={{ color: T.text2 }} />}
                rows={filtered}
                activeKey={pickedAlarme}
                onPickKey={toggleAlarme}
                labelOf={alarmeLabel}
                maxHeight={250}
              />
            </div>
          </div>
        </div>

        {/* TABLE (collapsed by default) */}
        {showTable ? (
          <div className="mt-3">
            <TableCompact
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
        ) : (
          <div className="mt-3 text-[12px] font-semibold flex items-center justify-between gap-2">
            <span style={{ color: T.text3 }}>
              Tabela recolhida para caber “tudo na tela”. Clique em <b>Ver tabela</b> se precisar.
            </span>
            <Pill>{tableRows.length} itens no recorte</Pill>
          </div>
        )}

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
