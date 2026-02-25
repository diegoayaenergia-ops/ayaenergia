"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
    Menu,
    X,
    ChevronDown,
    ChevronRight,
    Search as SearchIcon,
    Home as HomeIcon,
    ShieldCheck,
    GraduationCap,
    LayoutDashboard,
    ClipboardList,
    PlusCircle,
    SolarPanel,
    User,
    Lock,
    Eye,
    EyeOff,
    KeyRound,
    LogOut,
    Info,
    MessageCircle,
    Mail,
    Linkedin,
    Clock,
    ExternalLink,
} from "lucide-react";

import { CoursesPage } from "@/components/CoursesPage";
import { AcionamentosCadastroPage } from "@/components/Acionamentos/CadastroAcionamentosPage";
import { AcionamentosBasePage } from "@/components/Acionamentos/BaseAcionamentosPage";
import { AcionamentosDashPage } from "@/components/Acionamentos/DashAcionamentosPage";
import { PerdasBasePage } from "@/components/Acionamentos/BasePerdasPage";
import { UsinasContent } from "@/components/UsinasPage";
import { ComprasCadastroPage } from "@/components/Compras/CadastroComprasPage";
import { ComprasBasePage } from "@/components/Compras/BaseComprasPage";
import { ComprasDashPage } from "@/components/Compras/DashComprasPage";
import { SismetroDashPage } from "@/components/DashSismetroPage";

/* =========================================================
   TYPES / DATA
========================================================= */
type NavItem = { id: string; title: string; group: string; icon?: any; src?: string };
type RecentItem = { id: string; t: number };
type CourseItem = { id: string; title: string; description?: string; vimeoId?: string; formUrl?: string };
type OpenMenu = null | "operacao" | "manutencao" | "compras" | "cursos";

const COURSES_MENU_ID = "cursos";

const COURSES: CourseItem[] = [
    { id: "modulo:inversor-1", title: "Inversores Fotovoltaicos", description: "Introdução", vimeoId: "1164064064" },
    { id: "modulo:inversor-2", title: "SKID", description: "Em breve" },
    { id: "modulo:inversor-3", title: "CMP (Cabine Medição Primária)", description: "Em breve" },
    { id: "modulo:inversor-4", title: "Estruturas Mecânicas", description: "Em breve" },
    { id: "modulo:inversor-5", title: "Estruturas Automação", description: "Em breve" },
    { id: "modulo:inversor-6", title: "Redes e Informática", description: "Em breve" },
    { id: "modulo:inversor-7", title: "CFTV (Circuito Fechado de TV)", description: "Em breve" },
    { id: "modulo:inversor-8", title: "Nobreak", description: "Em breve" },
    { id: "modulo:inversor-9", title: "Indicadores Técnicos de Eficiência", description: "Em breve" },
    { id: "modulo:inversor-10", title: "Eletricidade Básica", description: "Em breve" },
];

const UI = {
    top: "#1C4D28",
    top2: "#163E21",
    sub: "#10321F",
    soft: "#EEF2F0",
    border: "rgba(0,0,0,0.10)",
    text: "rgba(0,0,0,0.88)",
    text2: "rgba(0,0,0,0.62)",
    text3: "rgba(0,0,0,0.45)",
    accent: "#2FB26A",
    accent2: "#1F8E53",
    focus: "rgba(47,178,106,0.35)",
};

const STORAGE = {
    user: "bi_user",
    activeTab: "activeTab",
    courseIndex: "currentCourseIndex",
    recentNav: "recentNav",
} as const;

const NON_IFRAME = new Set<string>([
    "home",
    "cursos",
    "usinas",
    "ss",
    "acionamentos_dash",
    "acionamentos_cadastro",
    "acionamentos_base",
    "perdas_base",
    "compras_dash",
    "compras_cadastro",
    "compras_base",
]);

/* =========================================================
   HELPERS
========================================================= */
const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

function safeJsonParse<T>(raw: string | null): T | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

function normalizeStringArray(raw: unknown): string[] {
    if (Array.isArray(raw)) return raw.filter((x) => typeof x === "string");
    if (typeof raw === "string") {
        const parsed = safeJsonParse<unknown>(raw);
        if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
    }
    return [];
}

function safeSrc(src?: string | null) {
    const s = (src ?? "").trim();
    return s.length ? s : null;
}

function formatUrl(url: string) {
    if (!url) return url;
    try {
        const u = new URL(url);
        u.searchParams.set("navContentPaneEnabled", "false");
        u.searchParams.set("filterPaneEnabled", "false");
        u.searchParams.set("pageView", "fitToWidth");
        return u.toString();
    } catch {
        const params = ["navContentPaneEnabled=false", "filterPaneEnabled=false", "pageView=fitToWidth"].join("&");
        return url.includes("?") ? `${url}&${params}` : `${url}?${params}`;
    }
}

function calcPasswordScore(pw: string) {
    const s = String(pw || "");
    let score = 0;

    const len = s.length;
    const hasLower = /[a-z]/.test(s);
    const hasUpper = /[A-Z]/.test(s);
    const hasNum = /\d/.test(s);
    const hasSym = /[^a-zA-Z0-9]/.test(s);

    if (len >= 4) score++;
    if (len >= 8) score++;
    if ((hasLower && hasUpper) || (hasLower && hasNum) || (hasUpper && hasNum)) score++;
    if (hasSym) score++;

    const clipped = Math.max(0, Math.min(4, score));
    const label = clipped <= 1 ? "Fraca" : clipped === 2 ? "Ok" : clipped === 3 ? "Boa" : "Forte";
    return { score: clipped, label };
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

function useOutsideClose(open: boolean, onClose: () => void, nodes: Array<HTMLElement | null>) {
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!open) return;

        const onDown = (e: PointerEvent) => {
            const t = e.target as Node | null;
            if (!t) return;
            const inside = nodes.some((n) => n && n.contains(t));
            if (!inside) onCloseRef.current();
        };

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCloseRef.current();
        };

        window.addEventListener("pointerdown", onDown, true);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("pointerdown", onDown, true);
            window.removeEventListener("keydown", onKey);
        };
    }, [open, nodes]);
}

function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        if (typeof window === "undefined") return;
        const m = window.matchMedia(query);
        const apply = () => setMatches(m.matches);
        apply();
        // @ts-ignore
        if (m.addEventListener) m.addEventListener("change", apply);
        // @ts-ignore
        else m.addListener(apply);
        return () => {
            // @ts-ignore
            if (m.removeEventListener) m.removeEventListener("change", apply);
            // @ts-ignore
            else m.removeListener(apply);
        };
    }, [query]);
    return matches;
}

/* =========================================================
   UI PRIMITIVES
========================================================= */
function IconButton({
    label,
    onClick,
    children,
    variant = "dark",
    className,
}: {
    label: string;
    onClick?: () => void;
    children: ReactNode;
    variant?: "dark" | "light";
    className?: string;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            className={cx(
                "h-10 w-10 rounded-xl grid place-items-center transition focus-visible:outline-none focus-visible:ring-2",
                variant === "dark"
                    ? "text-white/95 hover:bg-white/10 focus-visible:ring-white/45"
                    : "text-black/70 hover:bg-black/[0.04] focus-visible:ring-black/15",
                className
            )}
        >
            {children}
        </button>
    );
}

function Button({
    children,
    onClick,
    variant = "primary",
    disabled,
    loading,
    className,
    type = "button",
}: {
    children: ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary";
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    type?: "button" | "submit";
}) {
    const base =
        "h-11 px-4 rounded-xl text-sm font-semibold transition inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const styles =
        variant === "primary"
            ? "bg-[#2FB26A] text-white hover:bg-[#1F8E53] focus-visible:ring-[rgba(47,178,106,0.35)]"
            : "bg-black/[0.04] text-black/80 hover:bg-black/[0.06] focus-visible:ring-black/15 border border-black/10";

    return (
        <button type={type} onClick={onClick} disabled={disabled || loading} className={cx(base, styles, className)}>
            {loading ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : null}
            {children}
        </button>
    );
}

function Field({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    autoComplete,
    leftIcon,
    right,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    autoComplete?: string;
    leftIcon?: ReactNode;
    right?: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-black/70">{label}</label>
            <div className="relative rounded-2xl border border-black/10 bg-white overflow-hidden">
                {leftIcon ? <div className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40">{leftIcon}</div> : null}
                <input
                    type={type}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={cx(
                        "w-full h-11 px-3 text-sm outline-none bg-transparent text-black placeholder:text-black/40",
                        "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(47,178,106,0.35)]",
                        leftIcon ? "pl-10" : "",
                        right ? "pr-11" : "pr-3"
                    )}
                />
                {right ? <div className="absolute right-2 top-1/2 -translate-y-1/2">{right}</div> : null}
            </div>
        </div>
    );
}

/* =========================================================
   SUPPORT MODAL
========================================================= */
function SupportModal({ onClose }: { onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border overflow-hidden" style={{ borderColor: UI.border }}>
                <div className="h-1 w-full" style={{ background: UI.accent }} />
                <div className="px-5 pt-5 pb-3 border-b flex items-start gap-3" style={{ borderColor: UI.border }}>
                    <div className="min-w-0 flex-1">
                        <div className="text-base font-semibold text-black/90">Suporte Técnico</div>
                        <div className="text-sm text-black/55 mt-1">Canais oficiais para suporte, solicitações e dúvidas.</div>
                    </div>
                    <IconButton label="Fechar" variant="light" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </IconButton>
                </div>

                <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <a
                        href="https://wa.me/5511961995900"
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border bg-white p-4 hover:bg-black/[0.02] transition flex items-start gap-3"
                        style={{ borderColor: UI.border }}
                    >
                        <div className="h-10 w-10 rounded-xl bg-black/[0.03] grid place-items-center text-black/60">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-black/85">WhatsApp</div>
                            <div className="text-[12px] text-black/55">+55 (11) 96199-5900</div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-black/35" />
                    </a>

                    <a
                        href="mailto:diego.sanchez@ayaenergia.com.br"
                        className="rounded-2xl border bg-white p-4 hover:bg-black/[0.02] transition flex items-start gap-3"
                        style={{ borderColor: UI.border }}
                    >
                        <div className="h-10 w-10 rounded-xl bg-black/[0.03] grid place-items-center text-black/60">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-black/85">Email</div>
                            <div className="text-[12px] text-black/55">diego.sanchez@ayaenergia.com.br</div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-black/35" />
                    </a>

                    <a
                        href="https://www.linkedin.com/in/diegodamaro/"
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border bg-white p-4 hover:bg-black/[0.02] transition flex items-start gap-3"
                        style={{ borderColor: UI.border }}
                    >
                        <div className="h-10 w-10 rounded-xl bg-black/[0.03] grid place-items-center text-black/60">
                            <Linkedin className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-black/85">LinkedIn</div>
                            <div className="text-[12px] text-black/55">/in/diegodamaro</div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-black/35" />
                    </a>

                    <div className="rounded-2xl border bg-black/[0.02] p-4" style={{ borderColor: UI.border }}>
                        <div className="text-sm font-semibold text-black/85 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            SLA e Horário
                        </div>
                        <div className="text-[12px] text-black/55 mt-2 leading-relaxed">
                            • Seg–Sex 08:00–18:00
                            <br />• Emergências: WhatsApp
                            <br />• Resposta: até 2h
                        </div>
                    </div>
                </div>

                <div className="px-5 py-4 border-t bg-black/[0.02] flex justify-end" style={{ borderColor: UI.border }}>
                    <Button variant="secondary" onClick={onClose}>
                        Fechar
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   TOP DROPDOWN (hover + click sticky)  ✅ FIX STICKY
========================================================= */
function TopDropdown({
    label,
    open,
    onOpen,
    onClose,
    items,
    onPick,
    desktopHover,
    stickyByClick = false,
    setStickyByClick,
}: {
    label: string;
    open: boolean;
    onOpen: () => void;
    onClose: () => void;
    items: NavItem[];
    onPick: (id: string) => void;
    desktopHover: boolean;
    stickyByClick?: boolean;
    setStickyByClick?: (v: boolean) => void;
}) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const closeTimer = useRef<number | null>(null);

    useOutsideClose(
        open,
        () => {
            setStickyByClick?.(false);
            onClose();
        },
        [rootRef.current]
    );

    if (!items.length) return null;

    const clearCloseTimer = () => {
        if (closeTimer.current) window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
    };

    const scheduleClose = () => {
        clearCloseTimer();
        closeTimer.current = window.setTimeout(() => {
            if (!stickyByClick) onClose();
        }, 180);
    };

    const handleClick = () => {
        // comportamento:
        // - se está fechado: abre e "gruda"
        // - se está aberto e NÃO grudado: gruda (mantém aberto)
        // - se está aberto e grudado: desgruda e fecha
        if (!setStickyByClick) {
            open ? onClose() : onOpen();
            return;
        }

        if (!open) {
            setStickyByClick(true);
            onOpen();
            return;
        }

        if (open && !stickyByClick) {
            setStickyByClick(true);
            onOpen();
            return;
        }

        // open && stickyByClick
        setStickyByClick(false);
        onClose();
    };

    return (
        <div
            ref={rootRef}
            className="relative"
            onMouseEnter={() => {
                if (!desktopHover) return;
                clearCloseTimer();
                onOpen();
            }}
            onMouseLeave={() => {
                if (!desktopHover) return;
                scheduleClose();
            }}
        >
            <button
                type="button"
                onClick={handleClick}
                className={cx(
                    "h-9 px-3 rounded-xl text-[16px]  text-white/92 hover:bg-white/10 transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35",
                    open && "bg-white/10"
                )}
            >
                <span className="inline-flex items-center gap-2">
                    {label}
                    <ChevronDown className={cx("w-4 h-4 transition-transform", open && "rotate-180")} />
                </span>
            </button>

            {open && (
                <div
                    className="absolute left-0 top-[42px] z-50 w-[360px] rounded-2xl border bg-white shadow-2xl overflow-hidden"
                    style={{ borderColor: UI.border }}
                    onMouseEnter={() => {
                        if (!desktopHover) return;
                        clearCloseTimer();
                    }}
                    onMouseLeave={() => {
                        if (!desktopHover) return;
                        scheduleClose();
                    }}
                >
                    <div className="px-4 py-3 bg-black/[0.02] border-b" style={{ borderColor: UI.border }}>
                        <div className="text-[12px] font-semibold text-black/70">{label}</div>
                        {stickyByClick ? <div className="text-[11px] text-black/45 mt-0.5">Fixado (clique para fechar)</div> : null}
                    </div>

                    <div className="grid grid-cols-1 gap-2 p-2">
                        {items.map((it) => {
                            const Icon = it.icon || SolarPanel;
                            return (
                                <button
                                    key={it.id}
                                    type="button"
                                    onClick={() => {
                                        onPick(it.id);
                                        setStickyByClick?.(false);
                                        onClose();
                                    }}
                                    className="group rounded-xl border border-black/10 bg-white hover:bg-black/[0.02] transition p-3 flex items-center gap-3 text-left"
                                >
                                    <span className="w-10 h-10 rounded-xl bg-black/[0.03] grid place-items-center text-black/60 group-hover:bg-black/[0.05]">
                                        <Icon className="w-5 h-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-semibold text-black/85 truncate">{it.title}</div>
                                        <div className="text-[11px] text-black/45 truncate">{it.group}</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-black/20" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

/* =========================================================
   DRAWER (mobile)
========================================================= */
function Drawer({
    open,
    onClose,
    userLabel,
    sections,
    allItems,
    onGo,
    onSupport,
    onResetPassword,
    onLogout,
}: {
    open: boolean;
    onClose: () => void;
    userLabel: string;
    sections: Array<{ title: string; items: NavItem[] }>;
    allItems: NavItem[];
    onGo: (id: string) => void;
    onSupport: () => void;
    onResetPassword: () => void;
    onLogout: () => void;
}) {
    useLockBodyScroll(open);

    const [query, setQuery] = useState("");

    const q = query.trim().toLowerCase();

    const results = useMemo(() => {
        if (!q) return [];
        const hits = allItems.filter((i) => i.title.toLowerCase().includes(q));
        hits.sort((a, b) => {
            const aS = a.title.toLowerCase().startsWith(q) ? 0 : 1;
            const bS = b.title.toLowerCase().startsWith(q) ? 0 : 1;
            if (aS !== bS) return aS - bS;
            return a.title.localeCompare(b.title);
        });
        return hits.slice(0, 20);
    }, [allItems, q]);

    const showingResults = q.length > 0;

    return (
        <>
            {open && <div className="fixed inset-0 z-40 bg-black/55" onClick={onClose} aria-hidden="true" />}

            <aside
                className={cx(
                    "fixed left-0 top-0 z-50 h-full w-[88vw] max-w-[420px] bg-white shadow-2xl",
                    "transition-transform duration-200",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
                aria-hidden={!open}
            >
                <div className="h-14 px-4 flex items-center gap-3 text-white" style={{ background: UI.top }}>
                    <div className="h-9 w-9 rounded-full bg-white/12 grid place-items-center">
                        <User className="w-5 h-5 text-white/90" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[14px] font-semibold truncate">Olá, {userLabel}</div>
                        <div className="text-[11px] text-white/65 -mt-[1px]">Portal Operacional</div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="ml-auto h-10 w-10 rounded-xl grid place-items-center hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
                        aria-label="Fechar"
                    >
                        <X className="w-5 h-5 text-white/90" />
                    </button>
                </div>

                <div className="h-[calc(100%-56px)] flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        {/* BUSCA (sticky dentro da sidebar) */}
                        <div className="sticky top-0 z-10 bg-white px-4 pt-4 pb-3 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                            <div className="h-11 rounded-2xl border border-black/10 bg-black/[0.02] flex items-center overflow-hidden">
                                <div className="px-3 text-black/45">
                                    <SearchIcon className="w-4 h-4" />
                                </div>

                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Buscar no menu…"
                                    className="flex-1 h-11 px-1 text-sm outline-none bg-transparent text-black placeholder:text-black/45"
                                />

                                {query.trim() ? (
                                    <button
                                        type="button"
                                        onClick={() => setQuery("")}
                                        className="h-11 w-11 grid place-items-center text-black/50 hover:bg-black/[0.03]"
                                        aria-label="Limpar busca"
                                        title="Limpar"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                ) : null}
                            </div>

                            {showingResults ? (
                                <div className="mt-2 text-[11px] text-black/55">
                                    Resultados: <span className="font-semibold text-black/70">{results.length}</span>
                                </div>
                            ) : (
                                <div className="mt-2 text-[11px] text-black/45">Dica: digite para filtrar Operação, Manutenção, Compras e Cursos.</div>
                            )}
                        </div>

                        {/* CONTEÚDO: ou mostra resultados, ou mostra seções */}
                        {showingResults ? (
                            <div className="px-2 py-2">
                                {results.length ? (
                                    results.map((it) => {
                                        const Icon = it.icon || SolarPanel;
                                        return (
                                            <button
                                                key={it.id}
                                                type="button"
                                                onClick={() => onGo(it.id)}
                                                className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-left hover:bg-black/[0.03]"
                                            >
                                                <span className="w-9 h-9 rounded-xl bg-black/[0.03] grid place-items-center text-black/60">
                                                    <Icon className="w-4 h-4" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-semibold text-black/85 truncate">{it.title}</div>
                                                    <div className="text-[11px] text-black/45 truncate">{it.group}</div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-black/25" />
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="p-4">
                                        <div className="rounded-2xl border bg-black/[0.02] p-4" style={{ borderColor: UI.border }}>
                                            <div className="text-sm font-semibold text-black/80">Nada encontrado</div>
                                            <div className="text-[12px] text-black/55 mt-1">Tente outro termo.</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : sections.length ? (
                            sections.map((s) => (
                                <div key={s.title} className="border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                                    <div className="px-4 py-3 text-[13px] font-semibold text-black/70">{s.title}</div>
                                    {s.items.map((it) => {
                                        const Icon = it.icon || SolarPanel;
                                        return (
                                            <button
                                                key={it.id}
                                                type="button"
                                                onClick={() => onGo(it.id)}
                                                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-black/[0.03]"
                                            >
                                                <span className="w-9 h-9 rounded-xl bg-black/[0.03] grid place-items-center text-black/60">
                                                    <Icon className="w-4 h-4" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-semibold text-black/85 truncate">{it.title}</div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-black/25" />
                                            </button>
                                        );
                                    })}
                                </div>
                            ))
                        ) : (
                            <div className="p-6">
                                <div className="rounded-2xl border bg-black/[0.02] p-4" style={{ borderColor: UI.border }}>
                                    <div className="text-sm font-semibold text-black/80">Sem acesso configurado</div>
                                    <div className="text-[12px] text-black/55 mt-1">Solicite ao administrador liberação de acesso.</div>
                                </div>
                            </div>
                        )}

                        {/* Conta & Suporte (mantém igual) */}
                        {!showingResults && (
                            <div className="border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                                <div className="px-4 py-3 text-[13px] font-semibold text-black/70">Conta & Suporte</div>

                                <button type="button" onClick={onSupport} className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-black/[0.03]">
                                    <span className="w-9 h-9 rounded-xl bg-black/[0.03] grid place-items-center text-black/60">
                                        <MessageCircle className="w-4 h-4" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-semibold text-black/85 truncate">Suporte</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-black/25" />
                                </button>

                                <button type="button" onClick={onResetPassword} className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-black/[0.03]">
                                    <span className="w-9 h-9 rounded-xl bg-black/[0.03] grid place-items-center text-black/60">
                                        <KeyRound className="w-4 h-4" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-semibold text-black/85 truncate">Redefinir senha</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-black/25" />
                                </button>

                                <button type="button" onClick={onLogout} className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-black/[0.03]">
                                    <span className="w-9 h-9 rounded-xl bg-black/[0.03] grid place-items-center text-black/60">
                                        <LogOut className="w-4 h-4" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-semibold text-black/85 truncate">Sair</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-black/25" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t bg-white" style={{ borderColor: UI.border }}>
                        <Button variant="secondary" onClick={onClose} className="w-full">
                            Fechar
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    );
}

/* =========================================================
   COMPONENT
========================================================= */
export default function PortalClient() {
    const mdUp = useMediaQuery("(min-width: 768px)");

    const [booting, setBooting] = useState(true);
    const [user, setUser] = useState<any>(null);

    // login
    const [login, setLogin] = useState("");
    const [senha, setSenha] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);

    // portal
    const [active, setActive] = useState<string>("home");
    const [drawerOpen, setDrawerOpen] = useState(false);

    // top menus
    const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
    const [stickyMenu, setStickyMenu] = useState<OpenMenu>(null);

    // search top
    const [navQuery, setNavQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const searchWrapRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    useOutsideClose(searchOpen, () => setSearchOpen(false), [searchWrapRef.current]);

    // reset pass
    const [showReset, setShowReset] = useState(false);
    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [showOldPass, setShowOldPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [resetMsg, setResetMsg] = useState("");
    const [resetLoading, setResetLoading] = useState(false);

    // support
    const [showSupport, setShowSupport] = useState(false);

    // stats/courses
    const [stats, setStats] = useState<string[]>([]);
    const [currentCourse, setCurrentCourse] = useState(0);

    // recents
    const [recent, setRecent] = useState<RecentItem[]>([]);

    // ===== Nav base
    const NAV_HOME: NavItem = { id: "home", title: "Home", group: "Geral", icon: HomeIcon };
    const NAV_COURSES: NavItem = { id: "cursos", title: "Entendendo a Geração Distribuída", group: "Cursos", icon: GraduationCap };

    const REPORTS: NavItem[] = [
        {
            id: "ineer",
            title: "Ineer Energia",
            group: "Geração e Performance",
            icon: SolarPanel,
            src: "https://app.powerbi.com/view?r=eyJrIjoiODJiMGQwM2MtOGJiOC00MTAyLWJkM2EtMWNkZTlkNjBiYTBlIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
        },
        {
            id: "kamai",
            title: "Kamai Solar",
            group: "Geração e Performance",
            icon: SolarPanel,
            src: "https://app.powerbi.com/view?r=eyJrIjoiNmM4ZjNkODgtNTRiOC00MmNkLTk5MDctMzA1Mzk4YTA5NmFhIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
        },
        {
            id: "elis",
            title: "Élis Energia",
            group: "Geração e Performance",
            icon: SolarPanel,
            src: "https://app.powerbi.com/view?r=eyJrIjoiMTBmYTEwMmEtMmU1ZS00ZWE0LWEzM2MtYThhYzIzMmMxMDhhIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
        },
        { id: "usinas", title: "Dados das Usinas", group: "Usinas Ineer e Kamai", icon: Info },
    ];

    const MANUTENCAO: NavItem[] = [
        { id: "ss", title: "Painel de Ordens de Serviço", group: "Manutenção", icon: LayoutDashboard },
        { id: "acionamentos_dash", title: "Painel de Acionamentos", group: "Manutenção", icon: LayoutDashboard },
        { id: "acionamentos_cadastro", title: "Registrar Acionamentos e Perdas", group: "Manutenção", icon: PlusCircle },
        { id: "acionamentos_base", title: "Histórico de Acionamentos", group: "Manutenção", icon: ClipboardList },
        { id: "perdas_base", title: "Histórico de Perdas", group: "Manutenção", icon: ClipboardList },
    ];

    const COMPRAS: NavItem[] = [
        { id: "compras_dash", title: "Painel de Compras", group: "Compras", icon: LayoutDashboard },
        { id: "compras_cadastro", title: "Lançar Transações", group: "Compras", icon: PlusCircle },
        { id: "compras_base", title: "Aprovar Transações", group: "Compras", icon: ClipboardList },
    ];

    // restore session
    useEffect(() => {
        try {
            const savedUser = safeJsonParse<any>(localStorage.getItem(STORAGE.user));
            const savedTab = localStorage.getItem(STORAGE.activeTab);
            const savedCourse = localStorage.getItem(STORAGE.courseIndex);

            if (savedUser) {
                const fixedStats = normalizeStringArray(savedUser.stats);
                const fixedAccess = normalizeStringArray(savedUser.access);
                const fixedUser = { ...savedUser, stats: fixedStats, access: fixedAccess };
                setUser(fixedUser);
                setStats(fixedStats);
                localStorage.setItem(STORAGE.user, JSON.stringify(fixedUser));
                if (savedTab) setActive(savedTab);
                if (savedTab === "cursos" && savedCourse && !Number.isNaN(Number(savedCourse))) setCurrentCourse(Number(savedCourse));
            }

            const rec = safeJsonParse<RecentItem[]>(localStorage.getItem(STORAGE.recentNav)) || [];
            setRecent(Array.isArray(rec) ? rec.filter((x) => x && typeof x.id === "string") : []);
        } finally {
            setBooting(false);
        }
    }, []);

    useEffect(() => {
        if (!booting) localStorage.setItem(STORAGE.activeTab, active);
    }, [active, booting]);

    useEffect(() => {
        localStorage.setItem(STORAGE.courseIndex, String(currentCourse));
    }, [currentCourse]);

    // allowed
    const access = useMemo(() => normalizeStringArray(user?.access), [user?.access]);

    const allowedOperacao = useMemo(() => REPORTS.filter((i) => access.includes(i.id)), [access]);
    const allowedManut = useMemo(() => MANUTENCAO.filter((i) => access.includes(i.id)), [access]);
    const allowedCompras = useMemo(() => COMPRAS.filter((i) => access.includes(i.id)), [access]);
    const canCourses = useMemo(() => access.includes(COURSES_MENU_ID), [access]);

    const allAllowedItems = useMemo(() => {
        const list: NavItem[] = [NAV_HOME];
        if (allowedOperacao.length) list.push(...allowedOperacao);
        if (allowedManut.length) list.push(...allowedManut);
        if (allowedCompras.length) list.push(...allowedCompras);
        if (canCourses) list.push(NAV_COURSES);
        return list;
    }, [allowedOperacao, allowedManut, allowedCompras, canCourses]);

    const drawerSections = useMemo(() => {
        const s: Array<{ title: string; items: NavItem[] }> = [];
        if (allowedOperacao.length) s.push({ title: "Operação", items: allowedOperacao });
        if (allowedManut.length) s.push({ title: "Manutenção", items: allowedManut });
        if (allowedCompras.length) s.push({ title: "Compras", items: allowedCompras });
        if (canCourses) s.push({ title: "Cursos", items: [NAV_COURSES] });
        return s;
    }, [allowedOperacao, allowedManut, allowedCompras, canCourses]);

    const recentItems = useMemo(() => {
        const map = new Map(allAllowedItems.map((x) => [x.id, x]));
        const picked = recent.map((r) => map.get(r.id)).filter(Boolean) as NavItem[];
        return picked.slice(0, 8);
    }, [recent, allAllowedItems]);

    const saveRecent = useCallback(
        (id: string) => {
            const now = Date.now();
            const next: RecentItem[] = [{ id, t: now }, ...recent.filter((x) => x.id !== id)].slice(0, 12);
            setRecent(next);
            try {
                localStorage.setItem(STORAGE.recentNav, JSON.stringify(next));
            } catch { }
        },
        [recent]
    );

    const go = useCallback(
        (id: string) => {
            if (id === "cursos") setCurrentCourse(0);
            setActive(id);
            saveRecent(id);
            setDrawerOpen(false);
            setOpenMenu(null);
            setStickyMenu(null);
            setSearchOpen(false);
            setNavQuery("");
        },
        [saveRecent]
    );

    useEffect(() => {
        if (!user) return;
        const allowedIds = new Set(allAllowedItems.map((x) => x.id));
        if (!allowedIds.has(active)) setActive("home");
    }, [user, active, allAllowedItems]);

    const q = navQuery.trim().toLowerCase();
    const searchResults = useMemo(() => {
        if (!q) return [];
        const hits = allAllowedItems.filter((i) => i.title.toLowerCase().includes(q));
        hits.sort((a, b) => {
            const aS = a.title.toLowerCase().startsWith(q) ? 0 : 1;
            const bS = b.title.toLowerCase().startsWith(q) ? 0 : 1;
            if (aS !== bS) return aS - bS;
            return a.title.localeCompare(b.title);
        });
        return hits.slice(0, 10);
    }, [allAllowedItems, q]);

    const activeReport = useMemo(() => allowedOperacao.find((r) => r.id === active), [allowedOperacao, active]);
    const iframeSrc = useMemo(() => safeSrc(activeReport?.src), [activeReport?.src]);
    const isNonIframe = useMemo(() => NON_IFRAME.has(active), [active]);

    const handleLogin = useCallback(async () => {
        if (!login || !senha) {
            setError("Informe login e senha");
            return;
        }
        setError("");
        setLoginLoading(true);

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login: login.trim(), password: senha.trim() }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data?.error || "Erro ao fazer login");
                return;
            }

            const fixedStats = normalizeStringArray(data.stats);
            const fixedAccess = normalizeStringArray(data.access);
            const fixedUser = { ...data, stats: fixedStats, access: fixedAccess };

            localStorage.setItem(STORAGE.user, JSON.stringify(fixedUser));
            setUser(fixedUser);
            setStats(fixedStats);

            const savedTab = localStorage.getItem(STORAGE.activeTab);
            setActive(savedTab || "home");
        } catch {
            setError("Erro de conexão com o servidor");
        } finally {
            setLoginLoading(false);
        }
    }, [login, senha]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem(STORAGE.user);
        localStorage.removeItem(STORAGE.activeTab);
        localStorage.removeItem(STORAGE.courseIndex);
        localStorage.removeItem(STORAGE.recentNav);

        setUser(null);
        setStats([]);
        setActive("home");
        setLogin("");
        setSenha("");
        setError("");
        setRecent([]);
        setDrawerOpen(false);
        setOpenMenu(null);
        setStickyMenu(null);
        setSearchOpen(false);
        setNavQuery("");
        setShowReset(false);
        setShowSupport(false);
    }, []);

    const handleChangePassword = useCallback(async () => {
        setResetMsg("");

        if (!oldPass || !newPass || !confirmPass) {
            setResetMsg("Preencha todos os campos");
            return;
        }
        if (newPass !== confirmPass) {
            setResetMsg("A confirmação não confere");
            return;
        }
        if (newPass.trim() === oldPass.trim()) {
            setResetMsg("A nova senha precisa ser diferente");
            return;
        }
        if (newPass.length < 4) {
            setResetMsg("Mínimo 4 caracteres");
            return;
        }

        setResetLoading(true);
        try {
            const res = await fetch("/api/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    login: String(user?.login ?? "").trim(),
                    oldPassword: oldPass.trim(),
                    newPassword: newPass.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setResetMsg(data?.error || "Erro ao alterar senha");
                return;
            }

            setResetMsg("Senha alterada com sucesso ✅");
            setTimeout(() => {
                setShowReset(false);
                setOldPass("");
                setNewPass("");
                setConfirmPass("");
                setResetMsg("");
            }, 900);
        } catch {
            setResetMsg("Erro de conexão com o servidor");
        } finally {
            setResetLoading(false);
        }
    }, [oldPass, newPass, confirmPass, user]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && String(e.key || "").toLowerCase() === "k") {
                e.preventDefault();
                setSearchOpen(true);
                setOpenMenu(null);
                setStickyMenu(null);
                requestAnimationFrame(() => searchInputRef.current?.focus());
            }
            if (e.key === "Escape") {
                setDrawerOpen(false);
                setShowReset(false);
                setShowSupport(false);
                setOpenMenu(null);
                setStickyMenu(null);
                setSearchOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    /* =========================================================
       BOOT / LOGIN
    ========================================================= */
    if (booting) {
        return (
            <div className="min-h-screen w-full grid place-items-center bg-black">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        const pwScore = calcPasswordScore(senha);

        return (
            <div className="relative min-h-screen w-full overflow-hidden">
                <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                    <source src="/video.mp4" type="video/mp4" />
                </video>

                <div className="absolute inset-0 bg-black/35" />
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "radial-gradient(80% 70% at 70% 30%, rgba(47,178,106,0.18) 0%, rgba(0,0,0,0) 60%), radial-gradient(90% 90% at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.40) 100%)",
                    }}
                />

                <div className="relative z-10 min-h-screen w-full flex items-center justify-center px-4 md:px-10">
                    <div className="w-[520px] max-w-[94vw] rounded-[26px] overflow-hidden shadow-2xl bg-white">
                        <div className="p-5 md:p-6 text-white" style={{ background: `linear-gradient(180deg, ${UI.sub} 0%, ${UI.top} 100%)` }}>
                            <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/15 grid place-items-center overflow-hidden">
                                    <Image src="/logo-aya.png" alt="AYA" width={34} height={34} priority className="object-contain" />
                                </div>

                                <div className="min-w-0">
                                    <div className="text-[13px] font-semibold leading-tight">AYA Energia</div>
                                    <div className="text-[11px] text-white/70 -mt-[1px]">Portal Operacional</div>
                                </div>

                                <div className="ml-auto hidden sm:flex items-center gap-2">
                                    <span className="text-[11px] px-2 py-1 rounded-full bg-white/10 border border-white/15">Acesso seguro</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8">
                            <div>
                                <div className="text-xl font-semibold text-black/90">Entrar</div>
                                <div className="text-sm text-black/55 mt-1">Use suas credenciais para acessar o portal.</div>
                            </div>

                            <form
                                className="mt-6 space-y-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleLogin();
                                }}
                            >
                                <Field label="Login" placeholder="Digite seu login" value={login} onChange={setLogin} autoComplete="username" leftIcon={<User className="w-4 h-4" />} />

                                <Field
                                    label="Senha"
                                    placeholder="Digite sua senha"
                                    value={senha}
                                    onChange={setSenha}
                                    autoComplete="current-password"
                                    type={showPassword ? "text" : "password"}
                                    leftIcon={<Lock className="w-4 h-4" />}
                                    right={
                                        <IconButton
                                            label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                            variant="light"
                                            className="h-9 w-9"
                                            onClick={() => setShowPassword((v) => !v)}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </IconButton>
                                    }
                                />

                                <div className="rounded-2xl border bg-black/[0.02] p-4 border-black/10">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[12px] font-semibold text-black/70">Segurança da senha</div>
                                        <div className="text-[12px] font-semibold text-black/60">{pwScore.label}</div>
                                    </div>
                                    <div className="mt-2 grid grid-cols-4 gap-2">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div key={i} className="h-2 rounded-full" style={{ background: pwScore.score >= i + 1 ? UI.accent : "rgba(0,0,0,0.10)" }} />
                                        ))}
                                    </div>
                                    <div className="mt-2 text-[11px] text-black/50">
                                        Dica: use <span className="font-semibold text-black/70">8+</span> caracteres e combine letras e números.
                                    </div>
                                </div>

                                {error && <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</div>}

                                <Button type="submit" disabled={loginLoading} loading={loginLoading} className="w-full">
                                    {loginLoading ? "Entrando..." : "Entrar no Portal"}
                                </Button>

                                <div className="flex items-center justify-between pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowSupport(true)}
                                        className="text-[12px] font-semibold text-black/60 hover:text-black underline underline-offset-4"
                                    >
                                        Suporte
                                    </button>

                                    <div className="text-[12px] text-black/45 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" />
                                        Ambiente seguro
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
            </div>
        );
    }

    /* =========================================================
       PORTAL
    ========================================================= */
    return (
        <div className="h-screen w-full overflow-hidden bg-white text-black flex flex-col">
            <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                userLabel={String(user?.name || user?.empresa || "Usuário")}
                sections={drawerSections}
                allItems={allAllowedItems}
                onGo={go}
                onSupport={() => {
                    setDrawerOpen(false);
                    setShowSupport(true);
                }}
                onResetPassword={() => {
                    setDrawerOpen(false);
                    setShowReset(true);
                }}
                onLogout={() => {
                    setDrawerOpen(false);
                    handleLogout();
                }}
            />

            <header className="sticky top-0 z-30">
                <div className="h-16 px-3 md:px-4 flex items-center gap-2" style={{ background: UI.top }}>
                    <IconButton label="Menu" onClick={() => setDrawerOpen(true)} className="md:hidden">
                        <Menu className="w-7 h-7" />
                    </IconButton>

                    <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        className="hidden md:flex h-9 px-3 rounded-xl items-center gap-2 text-[13px] font-semibold text-white/95 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
                        aria-label="Abrir menu"
                    >
                        <Menu className="w-7 h-7" />
                        {/* <span className="hidden lg:inline">Menu</span> */}
                    </button>
                    <button
                        type="button"
                        onClick={() => go("home")}
                        className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
                        aria-label="Ir para Home"
                    >
                        <Image src="/logo-aya.png" alt="AYA" width={40} height={40} />
                        <div className="hidden sm:flex flex-col text-left leading-tight">
                            <div className="text-[13px] font-semibold text-white">AYA Energia</div>
                            <div className="text-[11px] text-white/65">Portal Operacional</div>
                        </div>
                    </button>

                    {/* SEARCH (desktop) */}
                    {/* <div ref={searchWrapRef} className="relative hidden md:block flex-1 max-w-[350px] mx-3">
                        <div className="h-11 rounded-2xl overflow-hidden bg-white ring-1 ring-white/15 flex items-center">
                            <div className="px-3 text-black/40">
                                <SearchIcon className="w-4 h-4" />
                            </div>
                            <input
                                ref={searchInputRef}
                                value={navQuery}
                                onChange={(e) => {
                                    setNavQuery(e.target.value);
                                    setSearchOpen(true);
                                }}
                                onFocus={() => setSearchOpen(true)}
                                placeholder="Buscar no portal…"
                                className="flex-1 h-11 px-2 text-sm outline-none text-black placeholder:text-black/45"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchOpen(true);
                                    requestAnimationFrame(() => searchInputRef.current?.focus());
                                }}
                                className="h-11 w-12 grid place-items-center"
                                style={{ background: UI.top2 }}
                                aria-label="Buscar"
                            >
                                <SearchIcon className="w-5 h-5 text-white/90" />
                            </button>
                        </div>

                        {searchOpen && (navQuery.trim() ? true : recentItems.length > 0) && (
                            <div className="absolute left-0 right-0 top-[46px] z-50 rounded-2xl border bg-white shadow-2xl overflow-hidden" style={{ borderColor: UI.border }}>
                                <div className="px-3 py-2 border-b text-[12px] font-semibold text-black/70 bg-black/[0.02]" style={{ borderColor: UI.border }}>
                                    {navQuery.trim() ? "Resultados" : "Recentes"}
                                </div>

                                <div className="max-h-[100px] overflow-y-auto p-1">
                                    {(navQuery.trim() ? searchResults : recentItems).map((it) => {
                                        const Icon = it.icon || SolarPanel;
                                        return (
                                            <button
                                                key={it.id}
                                                type="button"
                                                onClick={() => go(it.id)}
                                                className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-left hover:bg-black/[0.04]"
                                            >
                                                <span className="w-9 h-9 rounded-xl bg-black/[0.03] grid place-items-center text-black/60">
                                                    <Icon className="w-4 h-4" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-semibold text-black/85 truncate">{it.title}</div>
                                                    <div className="text-[11px] text-black/45 truncate">{it.group}</div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-black/20" />
                                            </button>
                                        );
                                    })}
                                    {!navQuery.trim() && recentItems.length === 0 ? <div className="px-3 py-3 text-sm text-black/55">Sem recentes.</div> : null}
                                    {navQuery.trim() && searchResults.length === 0 ? <div className="px-3 py-3 text-sm text-black/55">Nada encontrado.</div> : null}
                                </div>
                            </div>
                        )}
                    </div> */}

                    {/* LISTAS (desktop) */}
                    <div className="hidden ml-auto flex md:flex items-center gap-2 justify-center">

                        <TopDropdown
                            label="Operação"
                            open={openMenu === "operacao"}
                            onOpen={() => setOpenMenu("operacao")}
                            onClose={() => setOpenMenu(null)}
                            items={allowedOperacao}
                            onPick={go}
                            desktopHover={true}
                            stickyByClick={stickyMenu === "operacao"}
                            setStickyByClick={(v) => setStickyMenu(v ? "operacao" : null)}
                        />

                        <TopDropdown
                            label="Manutenção"
                            open={openMenu === "manutencao"}
                            onOpen={() => setOpenMenu("manutencao")}
                            onClose={() => setOpenMenu(null)}
                            items={allowedManut}
                            onPick={go}
                            desktopHover={true}
                            stickyByClick={stickyMenu === "manutencao"}
                            setStickyByClick={(v) => setStickyMenu(v ? "manutencao" : null)}
                        />

                        <TopDropdown
                            label="Compras"
                            open={openMenu === "compras"}
                            onOpen={() => setOpenMenu("compras")}
                            onClose={() => setOpenMenu(null)}
                            items={allowedCompras}
                            onPick={go}
                            desktopHover={true}
                            stickyByClick={stickyMenu === "compras"}
                            setStickyByClick={(v) => setStickyMenu(v ? "compras" : null)}
                        />

                        <TopDropdown
                            label="Cursos"
                            open={openMenu === "cursos"}
                            onOpen={() => setOpenMenu("cursos")}
                            onClose={() => setOpenMenu(null)}
                            items={canCourses ? [NAV_COURSES] : []}
                            onPick={go}
                            desktopHover={true}
                            stickyByClick={stickyMenu === "cursos"}
                            setStickyByClick={(v) => setStickyMenu(v ? "cursos" : null)}
                        />

                    </div>

                    {/* right actions */}
                    <div className="ml-auto flex items-center gap-2">
                        <IconButton label="Redefinir senha" onClick={() => setShowReset(true)} className="hidden md:grid">
                            <KeyRound className="w-5 h-5" />
                        </IconButton>
                        <IconButton label="Suporte" onClick={() => setShowSupport(true)} className="hidden md:grid">
                            <MessageCircle className="w-5 h-5" />
                        </IconButton>
                        <IconButton label="Sair" onClick={handleLogout} className="hidden md:grid">
                            <LogOut className="w-5 h-5" />
                        </IconButton>

                        {/* mobile */}
                        <button onClick={() => setShowSupport(true)} className="md:hidden h-10 px-3 rounded-xl text-xs font-semibold text-white/95 hover:bg-white/10">
                            Suporte
                        </button>
                        <button onClick={() => setShowReset(true)} className="md:hidden h-10 px-3 rounded-xl text-xs font-semibold text-white/95 hover:bg-white/10">
                            Senha
                        </button>
                        <button onClick={handleLogout} className="md:hidden h-10 px-3 rounded-xl text-xs font-semibold text-white/95 hover:bg-white/10">
                            Sair
                        </button>
                    </div>
                </div>

                {/* second row: dropdown lists (desktop only) */}
                {/* <div className="hidden md:flex h-11 px-3 md:px-4 items-center gap-2" style={{ background: UI.sub }}>
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        className="h-9 px-3 rounded-xl flex items-center gap-2 text-[13px] font-semibold text-white/95 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
                        aria-label="Abrir menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <TopDropdown
                        label="Operação"
                        open={openMenu === "operacao"}
                        onOpen={() => setOpenMenu("operacao")}
                        onClose={() => setOpenMenu(null)}
                        items={allowedOperacao}
                        onPick={go}
                        desktopHover={true}
                        stickyByClick={stickyMenu === "operacao"}
                        setStickyByClick={(v) => setStickyMenu(v ? "operacao" : null)}
                    />

                    <TopDropdown
                        label="Manutenção"
                        open={openMenu === "manutencao"}
                        onOpen={() => setOpenMenu("manutencao")}
                        onClose={() => setOpenMenu(null)}
                        items={allowedManut}
                        onPick={go}
                        desktopHover={true}
                        stickyByClick={stickyMenu === "manutencao"}
                        setStickyByClick={(v) => setStickyMenu(v ? "manutencao" : null)}
                    />

                    <TopDropdown
                        label="Compras"
                        open={openMenu === "compras"}
                        onOpen={() => setOpenMenu("compras")}
                        onClose={() => setOpenMenu(null)}
                        items={allowedCompras}
                        onPick={go}
                        desktopHover={true}
                        stickyByClick={stickyMenu === "compras"}
                        setStickyByClick={(v) => setStickyMenu(v ? "compras" : null)}
                    />

                    <TopDropdown
                        label="Cursos"
                        open={openMenu === "cursos"}
                        onOpen={() => setOpenMenu("cursos")}
                        onClose={() => setOpenMenu(null)}
                        items={canCourses ? [NAV_COURSES] : []}
                        onPick={go}
                        desktopHover={true}
                        stickyByClick={stickyMenu === "cursos"}
                        setStickyByClick={(v) => setStickyMenu(v ? "cursos" : null)}
                    />

                    <div className="ml-auto" />
                </div> */}
            </header>

            {/* CONTENT */}
            <main className="flex-1 min-h-0 relative bg-white">
                {active === "home" && (
                    <div className="absolute inset-0 overflow-hidden">
                        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                            <source src="/video.mp4" type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 bg-black/35" />
                        <div className="relative z-10 w-full h-full flex items-center justify-center px-6">
                            <Image src="/logo-aya.png" alt="AYA" width={520} height={520} />
                        </div>
                    </div>
                )}

                {active === "usinas" && (
                    <div className="absolute inset-0 overflow-y-auto bg-white">
                        <UsinasContent />
                    </div>
                )}

                {active === "cursos" && (
                    <div className="absolute inset-0 overflow-y-auto bg-white">
                        <CoursesPage user={user} courses={COURSES} stats={stats} setStats={setStats} />
                    </div>
                )}

                {active === "ss" && (
                    <div className="absolute inset-0 overflow-y-auto" style={{ background: UI.soft }}>
                        <SismetroDashPage />
                    </div>
                )}

                {active === "acionamentos_dash" && (
                    <div className="absolute inset-0 overflow-y-auto" style={{ background: UI.soft }}>
                        <AcionamentosDashPage />
                    </div>
                )}
                {active === "acionamentos_cadastro" && (
                    <div className="absolute inset-0 overflow-y-auto" style={{ background: UI.soft }}>
                        <AcionamentosCadastroPage />
                    </div>
                )}
                {active === "acionamentos_base" && (
                    <div className="absolute inset-0 overflow-y-auto" style={{ background: UI.soft }}>
                        <AcionamentosBasePage />
                    </div>
                )}
                {active === "perdas_base" && (
                    <div className="absolute inset-0 overflow-y-auto" style={{ background: UI.soft }}>
                        <PerdasBasePage />
                    </div>
                )}

                {active === "compras_cadastro" && (
                    <div className="absolute inset-0 overflow-y-auto" style={{ background: UI.soft }}>
                        <ComprasCadastroPage />
                    </div>
                )}
                {active === "compras_base" && (
                    <div className="absolute inset-0 overflow-y-auto" style={{ background: UI.soft }}>
                        <ComprasBasePage />
                    </div>
                )}
                {active === "compras_dash" && (
                    <div className="absolute inset-0 overflow-y-auto" style={{ background: UI.soft }}>
                        <ComprasDashPage />
                    </div>
                )}

                {iframeSrc && !isNonIframe && (
                    <iframe
                        key={active}
                        src={formatUrl(iframeSrc)}
                        className="absolute inset-0 w-full h-full border-none"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        title={activeReport?.title || "Relatório"}
                    />
                )}
            </main>

            {/* MODALS */}
            {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}

            {showReset && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
                    <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border overflow-hidden" style={{ borderColor: UI.border }}>
                        <div className="h-1 w-full" style={{ background: UI.accent }} />
                        <div className="px-5 pt-5 pb-3 border-b flex items-start gap-3" style={{ borderColor: UI.border }}>
                            <div className="min-w-0 flex-1">
                                <div className="text-base font-semibold text-black/90">Redefinir senha</div>
                                <div className="text-sm text-black/55 mt-1">Recomendado: 8+ caracteres com letras e números.</div>
                            </div>
                            <IconButton label="Fechar" variant="light" onClick={() => setShowReset(false)}>
                                <X className="w-5 h-5" />
                            </IconButton>
                        </div>

                        <div className="px-5 py-4 space-y-4">
                            <Field
                                label="Senha atual"
                                placeholder="Digite sua senha atual"
                                value={oldPass}
                                onChange={setOldPass}
                                type={showOldPass ? "text" : "password"}
                                autoComplete="current-password"
                                leftIcon={<Lock className="w-4 h-4" />}
                                right={
                                    <IconButton label={showOldPass ? "Ocultar" : "Mostrar"} variant="light" onClick={() => setShowOldPass((v) => !v)}>
                                        {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </IconButton>
                                }
                            />

                            <Field
                                label="Nova senha"
                                placeholder="Crie uma nova senha"
                                value={newPass}
                                onChange={setNewPass}
                                type={showNewPass ? "text" : "password"}
                                autoComplete="new-password"
                                leftIcon={<KeyRound className="w-4 h-4" />}
                                right={
                                    <IconButton label={showNewPass ? "Ocultar" : "Mostrar"} variant="light" onClick={() => setShowNewPass((v) => !v)}>
                                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </IconButton>
                                }
                            />

                            <Field
                                label="Confirmar nova senha"
                                placeholder="Repita a nova senha"
                                value={confirmPass}
                                onChange={setConfirmPass}
                                type={showConfirmPass ? "text" : "password"}
                                autoComplete="new-password"
                                leftIcon={<KeyRound className="w-4 h-4" />}
                                right={
                                    <IconButton label={showConfirmPass ? "Ocultar" : "Mostrar"} variant="light" onClick={() => setShowConfirmPass((v) => !v)}>
                                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </IconButton>
                                }
                            />

                            {resetMsg ? (
                                <div
                                    className={cx(
                                        "text-sm px-4 py-3 rounded-2xl border",
                                        resetMsg.includes("sucesso") ? "bg-green-500/10 text-green-700 border-green-500/20" : "bg-red-500/10 text-red-700 border-red-500/20"
                                    )}
                                >
                                    {resetMsg}
                                </div>
                            ) : null}
                        </div>

                        <div className="px-5 py-4 border-t bg-black/[0.02] flex items-center justify-between" style={{ borderColor: UI.border }}>
                            <div className="text-[12px] text-black/55 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                Não compartilhe sua senha.
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="secondary" onClick={() => setShowReset(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleChangePassword} disabled={resetLoading || !oldPass || !newPass || !confirmPass || newPass !== confirmPass} loading={resetLoading}>
                                    Alterar senha
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}