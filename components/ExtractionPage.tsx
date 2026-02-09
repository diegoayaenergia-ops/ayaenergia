"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { SplitShell } from "@/components/SplitShell";
import {
  FileSearch,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download,
  Search,
  X,
  Layers,
  Eye,
  EyeOff,
  ArrowUpDown,
  CalendarDays,
} from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

type Row = {
  mes: string; // "YYYY-MM"
  usina: string; // "RBB"
  uc: number | null; // 274
  ufv: string; // "UFV 1"
  geracao: number; // kWh
};

type MsgState = { type: "ok" | "err" | "info"; text: string } | null;

type SortMode = "order" | "kwh_desc" | "kwh_asc" | "uc_desc" | "uc_asc";

function brInt(n: number) {
  return Math.round(n).toLocaleString("pt-BR");
}

function fmtRange(start: string, end: string) {
  return `${start} → ${end}`;
}

function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function safeDate(d: string) {
  if (!d || !isIsoDate(d)) return null;
  const x = new Date(`${d}T00:00:00`);
  return Number.isNaN(x.getTime()) ? null : x;
}

function shortMes(mes: string) {
  // "YYYY-MM" -> "MM/YY"
  if (!/^\d{4}-\d{2}$/.test(mes)) return mes;
  const [y, mm] = mes.split("-");
  return `${mm}/${y.slice(2)}`;
}

function clampUpper(s: string) {
  return String(s || "").trim().toUpperCase();
}

export function ExtractionPage() {
  // =========================
  // STATE
  // =========================
  const [start, setStart] = useState("2026-01-01");
  const [end, setEnd] = useState("2026-01-31");

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [msg, setMsg] = useState<MsgState>(null);

  const [rows, setRows] = useState<Row[]>([]);

  // UI Controls
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [sortMode, setSortMode] = useState<SortMode>("order");
  const [compact, setCompact] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const autoTimerRef = useRef<number | null>(null);

  // =========================
  // STYLE TOKENS (clean + pro)
  // =========================
  const muted = "text-black/55";
  const muted2 = "text-black/45";

  const input =
    "w-full rounded-xl px-3 py-2 border outline-none transition text-sm bg-white text-black border-black/15 focus:ring-2 focus:ring-[#2E7B57]/30 focus:border-[#2E7B57]/40";

  const btnBase =
    "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold border transition select-none";
  const btn = (primary?: boolean) =>
    cx(
      btnBase,
      "px-3 py-2",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      primary
        ? "border-black/10 bg-[#2E7B57] text-white hover:brightness-110"
        : "border-black/10 bg-black/[0.03] text-black/75 hover:bg-black/[0.06]"
    );

  const chip = (active?: boolean) =>
    cx(
      "px-2.5 py-1 rounded-full text-xs font-bold border transition",
      active
        ? "bg-[#2E7B57]/10 border-[#2E7B57]/20 text-[#1d4f39]"
        : "bg-black/[0.03] border-black/10 text-black/60 hover:bg-black/[0.06]"
    );

  const card = "rounded-2xl border border-black/10 bg-white";
  const soft = "bg-black/[0.03] border border-black/10";

  // =========================
  // DERIVED
  // =========================
  const invalidRange = useMemo(() => {
    const s = safeDate(start);
    const e = safeDate(end);
    if (!s || !e) return false;
    return s.getTime() > e.getTime();
  }, [start, end]);

  const setPreset = (preset: "thisMonth" | "lastMonth" | "last7") => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === "last7") {
      const d2 = new Date(now);
      const d1 = new Date(now);
      d1.setDate(d1.getDate() - 6);
      setStart(fmt(d1));
      setEnd(fmt(d2));
      return;
    }

    if (preset === "thisMonth") {
      const d1 = new Date(now.getFullYear(), now.getMonth(), 1);
      const d2 = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStart(fmt(d1));
      setEnd(fmt(d2));
      return;
    }

    const d1 = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const d2 = new Date(now.getFullYear(), now.getMonth(), 0);
    setStart(fmt(d1));
    setEnd(fmt(d2));
  };

  const totalKwh = useMemo(() => rows.reduce((acc, r) => acc + (Number.isFinite(r.geracao) ? r.geracao : 0), 0), [rows]);

  const filtered = useMemo(() => {
    const n = search.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter((r) => {
      const hay = `${r.mes} ${r.usina} ${r.uc ?? ""} ${r.ufv}`.toLowerCase();
      return hay.includes(n);
    });
  }, [rows, search]);

  const groupedRaw = useMemo(() => {
    const map = new Map<string, Row[]>();
    const order: string[] = [];

    for (const r of filtered) {
      const key = clampUpper(r.usina || "—");
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key)!.push({ ...r, usina: key });
    }

    return order.map((usina) => {
      const items = map.get(usina)!;
      const total = items.reduce((acc, it) => acc + (Number(it.geracao) || 0), 0);
      const ucs = new Set(items.map((i) => i.uc ?? "—"));
      return { usina, items, total, ucsCount: ucs.size };
    });
  }, [filtered]);

  const grouped = useMemo(() => {
    const arr = [...groupedRaw];
    if (sortMode === "order") return arr;

    const byTotal = (dir: 1 | -1) => (a: any, b: any) => (a.total - b.total) * dir;
    const byUc = (dir: 1 | -1) => (a: any, b: any) => (a.ucsCount - b.ucsCount) * dir;

    switch (sortMode) {
      case "kwh_desc":
        return arr.sort(byTotal(-1));
      case "kwh_asc":
        return arr.sort(byTotal(1));
      case "uc_desc":
        return arr.sort(byUc(-1));
      case "uc_asc":
        return arr.sort(byUc(1));
      default:
        return arr;
    }
  }, [groupedRaw, sortMode]);

  const collapsedCount = useMemo(() => Object.values(collapsed).filter(Boolean).length, [collapsed]);
  const allGroups = useMemo(() => grouped.map((g) => g.usina), [grouped]);
  const allCollapsed = useMemo(() => allGroups.length > 0 && allGroups.every((u) => collapsed[u]), [allGroups, collapsed]);

  // =========================
  // ACTIONS
  // =========================
  const scrollTop = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
  }, []);

  const toast = useCallback((next: MsgState) => {
    setMsg(next);
    window.setTimeout(() => setMsg((cur) => (cur?.text === next?.text ? null : cur)), 3500);
  }, []);

  const download = async () => {
    setMsg(null);
    if (!start || !end) return toast({ type: "err", text: "Preencha as datas." });
    if (invalidRange) return toast({ type: "err", text: "A data inicial não pode ser maior que a final." });

    setLoading(true);
    try {
      const res = await fetch(`/api/extracao?start_date=${start}&end_date=${end}`);
      if (!res.ok) return toast({ type: "err", text: (await res.text()) || "Erro ao gerar Excel." });

      const blob = await res.blob();
      const cd = res.headers.get("content-disposition");
      const fileName = cd?.match(/filename="(.+)"/)?.[1] || `geracao_mensal_${start}_a_${end}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ type: "ok", text: "Download iniciado ✅" });
    } catch {
      toast({ type: "err", text: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async (silent?: boolean) => {
    if (!silent) setMsg(null);
    if (!start || !end) return toast({ type: "err", text: "Preencha as datas." });
    if (invalidRange) return toast({ type: "err", text: "A data inicial não pode ser maior que a final." });

    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/extracao?start_date=${start}&end_date=${end}&format=json`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) return toast({ type: "err", text: (await res.text()) || "Erro ao carregar prévia." });

      const data = (await res.json()) as { rows?: Row[] };
      const nextRows = Array.isArray(data.rows) ? data.rows : [];
      setRows(nextRows);

      if (!silent) toast({ type: "info", text: "Prévia atualizada." });
      scrollTop();
    } catch {
      if (!silent) toast({ type: "err", text: "Erro de conexão ao carregar prévia." });
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleGroup = (usina: string) => setCollapsed((prev) => ({ ...prev, [usina]: !prev[usina] }));

  const toggleAll = () => {
    setCollapsed((prev) => {
      const next: Record<string, boolean> = { ...prev };
      const target = !allCollapsed; // se não estiver tudo colapsado, colapsa tudo
      for (const u of allGroups) next[u] = target;
      return next;
    });
  };

  const clearSearch = () => setSearch("");

  // =========================
  // AUTO PREVIEW (debounce)
  // =========================
  useEffect(() => {
    if (!start || !end || invalidRange) return;
    if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
    autoTimerRef.current = window.setTimeout(() => loadPreview(true), 280);
    return () => {
      if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, invalidRange]);

  // Keyboard shortcuts: Ctrl/Cmd+K focus search, Esc clear search
  const searchRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (document.activeElement === searchRef.current && search) clearSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [search]);

  // =========================
  // MINI CARD (compact toggle)
  // =========================
  const MiniCard = ({ r }: { r: Row }) => (
    <div className={cx("rounded-xl border border-black/10 bg-white", compact ? "p-2.5" : "p-3")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cx("text-[11px] font-extrabold uppercase", muted2)}>
            {shortMes(r.mes)} • {clampUpper(r.usina)}
          </div>

          <div className={cx("font-extrabold leading-tight", compact ? "text-sm" : "text-[15px]")}>
            UC {r.uc ?? "-"}
          </div>

          <div className={cx("mt-0.5 truncate", muted, compact ? "text-[12px]" : "text-xs")}>{r.ufv}</div>
        </div>

        <div className="text-right shrink-0">
          <div className={cx("uppercase font-bold", muted2, compact ? "text-[10px]" : "text-[11px]")}>kWh</div>
          <div className={cx("font-extrabold tabular-nums", compact ? "text-sm" : "text-[15px]")}>
            {brInt(Number(r.geracao || 0))}
          </div>
        </div>
      </div>
    </div>
  );

  // =========================
  // SKELETON
  // =========================
  const Skeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-black/10 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-black/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-black/10 animate-pulse" />
              <div className="w-28 h-3 rounded bg-black/10 animate-pulse" />
              <div className="w-16 h-3 rounded bg-black/10 animate-pulse" />
            </div>
            <div className="w-20 h-8 rounded bg-black/10 animate-pulse" />
          </div>
          <div className="p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((__, j) => (
                <div key={j} className="rounded-xl border border-black/10 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <div className="w-16 h-3 rounded bg-black/10 animate-pulse" />
                      <div className="w-28 h-4 rounded bg-black/10 animate-pulse" />
                      <div className="w-40 h-3 rounded bg-black/10 animate-pulse" />
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="w-10 h-3 rounded bg-black/10 animate-pulse ml-auto" />
                      <div className="w-16 h-4 rounded bg-black/10 animate-pulse ml-auto" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // =========================
  // RENDER
  // =========================
  return (
    <SplitShell
      sidebarWidth={360}
      sidebar={
        <aside className="w-[360px] border-r flex flex-col border-black/10 bg-white">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-white border-b border-black/10">
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-extrabold text-lg leading-tight">Extração por UC</div>
                  <p className={cx("text-xs mt-1", muted)}>Selecione o período e baixe o Excel consolidado.</p>
                </div>

                {/* <div className={cx("px-2.5 py-1 rounded-full text-xs font-extrabold border", soft, "text-black/70")}>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={14} />
                    {fmtRange(start, end)}
                  </span>
                </div> */}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className={card + " p-4"}>
              <div className={cx("text-xs font-bold uppercase mb-2", muted)}>Período rápido</div>
              <div className="grid grid-cols-3 gap-2">
                <button className={btn(false)} onClick={() => setPreset("last7")}>
                  Últ. 7d
                </button>
                <button className={btn(false)} onClick={() => setPreset("thisMonth")}>
                  Mês
                </button>
                <button className={btn(false)} onClick={() => setPreset("lastMonth")}>
                  Ant.
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <div>
                  <label className={cx("text-xs", muted)}>Data inicial</label>
                  <input
                    className={cx(input, invalidRange && "ring-2 ring-red-500/30 border-red-500/20")}
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>

                <div>
                  <label className={cx("text-xs", muted)}>Data final</label>
                  <input
                    className={cx(input, invalidRange && "ring-2 ring-red-500/30 border-red-500/20")}
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button className={btn(true)} onClick={download} disabled={loading || invalidRange}>
                  {loading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  {loading ? "Gerando…" : "Baixar Excel"}
                </button>

                <button className={btn(false)} onClick={() => loadPreview(false)} disabled={previewLoading || invalidRange}>
                  {previewLoading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  {previewLoading ? "Carregando…" : "Atualizar prévia"}
                </button>
              </div>

              {invalidRange && (
                <div className="mt-3 text-sm rounded-xl px-3 py-2 border bg-red-500/10 text-red-700 border-red-500/20">
                  A data inicial não pode ser maior que a data final.
                </div>
              )}

              {msg && (
                <div
                  className={cx(
                    "mt-3 text-sm rounded-xl px-3 py-2 border",
                    msg.type === "ok"
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                      : msg.type === "info"
                        ? "bg-black/[0.03] text-black/75 border-black/10"
                        : "bg-red-500/10 text-red-700 border-red-500/20"
                  )}
                >
                  {msg.text}
                </div>
              )}
            </div>

            {/* <div className={card + " p-4"}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold uppercase text-black/50">Resumo</div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-black/60">
                  <Layers size={14} />
                  {grouped.length} usina(s)
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className={cx("rounded-xl p-3", soft)}>
                  <div className="text-[11px] uppercase font-bold text-black/45">Linhas</div>
                  <div className="text-lg font-extrabold tabular-nums">{filtered.length}</div>
                </div>

                <div className={cx("rounded-xl p-3", soft)}>
                  <div className="text-[11px] uppercase font-bold text-black/45">Total kWh</div>
                  <div className="text-lg font-extrabold tabular-nums">{brInt(totalKwh)}</div>
                </div>
              </div>
            </div> */}

            {/* <div className={card + " p-4"}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-black/50">Controles</div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button className={chip(!compact)} onClick={() => setCompact(false)}>
                  Normal
                </button>
                <button className={chip(compact)} onClick={() => setCompact(true)}>
                  Compacto
                </button>

                <button className={chip(sortMode === "order")} onClick={() => setSortMode("order")}>
                  Ordem original
                </button>

                <button className={chip(sortMode === "kwh_desc")} onClick={() => setSortMode("kwh_desc")}>
                  kWh ↓
                </button>

                <button className={chip(sortMode === "uc_desc")} onClick={() => setSortMode("uc_desc")}>
                  UC(s) ↓
                </button>

                <button className={chip(allCollapsed)} onClick={toggleAll} title="Colapsar/Expandir tudo">
                  {allCollapsed ? (
                    <>
                      <Eye size={14} /> Expandir
                    </>
                  ) : (
                    <>
                      <EyeOff size={14} /> Colapsar
                    </>
                  )}
                </button>
              </div>

              <div className={cx("mt-3 text-xs", muted)}>
                Dica: <span className="font-semibold">Ctrl/Cmd + K</span> foca a busca • <span className="font-semibold">Esc</span>{" "}
                limpa.
              </div>
            </div> */}
          </div>
        </aside>
      }
    >
      {/* MAIN */}
      <div className="h-full min-h-0 overflow-hidden p-6 flex flex-col">
        {/* Top bar (sticky inside main) */}
        <div className="sticky top-0 z-10  pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold tracking-tight">Prévia do Consolidado</h2>
              <p className={cx("mt-2 text-sm", muted)}>Mostrando exatamente o que vai para o Excel (mensal por UC).</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="w-full sm:w-[420px] relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/35" />
                  <input
                    ref={searchRef}
                    className={cx(input, "pl-9 pr-9")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="    Buscar (usina, UC, UFV)…"
                  />
                  {!!search && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-black/5"
                      title="Limpar"
                    >
                      <X size={16} className="text-black/45" />
                    </button>
                  )}
                </div>

                <button
                  className={cx(btn(false), "px-3")}
                  onClick={() => {
                    // quick cycle sort for convenience
                    const next: SortMode =
                      sortMode === "order"
                        ? "kwh_desc"
                        : sortMode === "kwh_desc"
                          ? "uc_desc"
                          : sortMode === "uc_desc"
                            ? "order"
                            : "order";
                    setSortMode(next);
                  }}
                  title="Alternar ordenação"
                >
                  <ArrowUpDown size={16} />
                  Ordenar
                </button>

                <button className={cx(btn(false), "px-3")} onClick={toggleAll} title="Colapsar/Expandir tudo">
                  {allCollapsed ? <Eye size={16} /> : <EyeOff size={16} />}
                  {allCollapsed ? "Expandir" : "Colapsar"}
                </button>

                {collapsedCount > 0 && (
                  <div className={cx("text-xs font-semibold px-2.5 py-1 rounded-full", soft, "text-black/60")}>
                    {collapsedCount} colapsada(s)
                  </div>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs uppercase font-bold text-black/50">Período</div>
              <div className="text-sm font-semibold">{fmtRange(start, end)}</div>

              <div className={cx("text-xs mt-1", muted)}>
                Total: <span className="font-semibold text-black/80">{brInt(totalKwh)} kWh</span>
              </div>
              {/* <div className={cx("text-xs mt-1", muted)}>
                Linhas: <span className="font-semibold text-black/80">{filtered.length}</span>
              </div> */}
            </div>
          </div>
        </div>

        {/* SCROLL AREA */}
        <div className="mt-1 flex-1 min-h-0 overflow-hidden rounded-2xl border border-black/10 bg-white">
          <div
            ref={listRef}
            className="h-full min-h-0 overflow-y-auto overscroll-contain p-4"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {previewLoading ? (
              <Skeleton />
            ) : filtered.length === 0 ? (
              <div className="py-12">
                <div className="mx-auto max-w-md text-center">
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-3 bg-black/[0.03] border border-black/10 flex items-center justify-center">
                    <Search className="text-black/40" />
                  </div>
                  <div className="text-sm font-extrabold text-black/80">Nenhum dado encontrado</div>
                  <div className={cx("text-sm mt-1", muted)}>
                    Tente ajustar o período ou remover filtros de busca.
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button className={btn(false)} onClick={clearSearch} disabled={!search}>
                      Limpar busca
                    </button>
                    <button className={btn(false)} onClick={() => loadPreview(false)}>
                      <RefreshCw size={16} />
                      Recarregar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {grouped.map((g) => {
                  const isCollapsed = !!collapsed[g.usina];
                  return (
                    <div key={g.usina} className="rounded-2xl border border-black/10 bg-white overflow-hidden">
                      {/* Group header */}
                      <button
                        onClick={() => toggleGroup(g.usina)}
                        className="w-full px-4 py-3 border-b border-black/10 flex items-center justify-between hover:bg-black/[0.02] transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                          <div className="font-extrabold text-sm truncate">{g.usina}</div>
                          <div className={cx("text-xs", muted)}>• {g.ucsCount} UC(s)</div>

                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold uppercase text-black/50">Total</div>
                          <div className="text-sm font-extrabold tabular-nums">{brInt(g.total)} kWh</div>
                        </div>
                      </button>

                      {!isCollapsed && (
                        <div className={cx("p-3", compact ? "pt-3" : "pt-3")}>
                          <div className={cx("grid gap-3", compact ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2")}>
                            {g.items.map((r, idx) => (
                              <MiniCard key={`${r.mes}-${r.usina}-${r.uc ?? "null"}-${r.ufv}-${idx}`} r={r} />
                            ))}
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

        {/* Bottom actions */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className={cx("text-xs", muted)}>
            Mostrando <span className="font-semibold text-black/80">{filtered.length}</span> linha(s) •{" "}
            <span className="font-semibold text-black/80">{grouped.length}</span> usina(s)
          </div>

          <div className="flex items-center gap-2">
            <button className={btn(false)} onClick={() => loadPreview(false)} disabled={previewLoading || invalidRange}>
              <RefreshCw size={16} />
              Atualizar
            </button>
            <button className={btn(true)} onClick={download} disabled={loading || invalidRange}>
              <FileSearch size={16} />
              Baixar Excel
            </button>
          </div>
        </div>
      </div>
    </SplitShell>
  );
}
