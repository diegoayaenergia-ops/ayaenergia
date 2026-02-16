"use client";

/* =========================================================
   IMPORTS
========================================================= */
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Menu,
  X,
  Pin,
  PinOff,
  LayoutDashboard,
  Wrench,
  FileSearch,
  ClipboardList,
  KeyRound,
  HelpCircle,
  LogOut,
  Eye,
  EyeOff,
  SolarPanel,
  TrendingUp,
  GraduationCap,
  Users,
  PlusCircle,
  TrendingDown,
  ArrowLeft,
  ShoppingCart,
} from "lucide-react";

import { CoursesPage } from "@/components/CoursesPage";
import { ExtractionPage } from "@/components/ExtractionPage";
import { AcionamentosCadastroPage } from "@/components/Acionamentos/CadastroAcionamentosPage";
import { AcionamentosBasePage } from "@/components/Acionamentos/BaseAcionamentosPage";
import { AcionamentosDashPage } from "@/components/Acionamentos/DashAcionamentosPage";
import { PerdasBasePage } from "@/components/Acionamentos/BasePerdasPage";
import ServicesContent from "@/components/ServicesPage";
import { UsinasContent } from "@/components/UsinasPage";
import { ComprasCadastroPage } from "@/components/Compras/CadastroComprasPage";
import { ComprasBasePage } from "@/components/Compras/BaseComprasPage";
import { ComprasDashPage } from "@/components/Compras/DashComprasPage";
import { SismetroDashPage } from "@/components/DashSismetroPage";

/* =========================================================
   TYPES
========================================================= */
type ReportItem = {
  id: string;
  title: string;
  src?: string;
  icon?: any;
};

type CourseItem = {
  id: string;
  title: string;
  description?: string;
  vimeoId?: string;
  formUrl?: string;
};

/* =========================================================
   MENU / DADOS
========================================================= */
// abas “página”
const SERVICES_MENU: ReportItem = { id: "servicos", title: "Sobre Nós", icon: Users };
const EXTRACTION_MENU: ReportItem = { id: "extracao", title: "Extração por UC", icon: FileSearch };
const COURSES_MENU: ReportItem = { id: "cursos", title: "Cursos", icon: GraduationCap };
const USINAS_MENU: ReportItem = { id: "usinas", title: "Usinas", icon: SolarPanel };
const SS_MENU: ReportItem = { id: "ss", title: "Ordens de Serviço", icon: ClipboardList };

const ACIONAMENTOS_ITEMS: ReportItem[] = [
  { id: "acionamentos_dash", title: "Dashboard", icon: LayoutDashboard },
  { id: "acionamentos_cadastro", title: "Cadastro", icon: PlusCircle },
  { id: "acionamentos_base", title: "Base Acionamentos", icon: ClipboardList },
  { id: "perdas_base", title: "Base Perdas", icon: TrendingDown },
];

const COMPRAS_ITEMS: ReportItem[] = [
  { id: "compras_dash", title: "Visualização", icon: LayoutDashboard },
  { id: "compras_cadastro", title: "Cadastro", icon: PlusCircle },
  { id: "compras_base", title: "Aprovações", icon: ClipboardList },

];

// cursos
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

// relatórios (iframe)
const REPORTS: ReportItem[] = [
  {
    id: "ineer",
    title: "Ineer Energia",
    icon: SolarPanel,
    src: "https://app.powerbi.com/view?r=eyJrIjoiODJiMGQwM2MtOGJiOC00MTAyLWJkM2EtMWNkZTlkNjBiYTBlIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },
  {
    id: "kamai",
    title: "Kamai Solar",
    icon: SolarPanel,
    src: "https://app.powerbi.com/view?r=eyJrIjoiNmM4ZjNkODgtNTRiOC00MmNkLTk5MDctMzA1Mzk4YTA5NmFhIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },
  {
    id: "elis",
    title: "Élis Energia",
    icon: SolarPanel,
    src: "https://app.powerbi.com/view?r=eyJrIjoiMTBmYTEwMmEtMmU1ZS00ZWE0LWEzM2MtYThhYzIzMmMxMDhhIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },
  {
    id: "os",
    title: "Ordens de Serviço",
    icon: ClipboardList,
    src: "https://app.powerbi.com/view?r=eyJrIjoiYzQzYjZjM2YtMzc0OS00MDMwLWI1N2EtODFjZGZmYjczMTlkIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },
  {
    id: "acionamentos",
    title: "Análise de Acionamentos",
    icon: Wrench,
    src: "https://app.powerbi.com/view?r=eyJrIjoiM2ZkZGQzZjgtNmQ1Yi00YjdhLWFmOGEtYTQ3MTBiMTk2YmU3IiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },
  // {
  //   id: "compras",
  //   title: "Controle de Compras",
  //   icon: ShoppingCart,
  //   src: "https://app.powerbi.com/view?r=eyJrIjoiMGQ1YmMyMjctMWYzMy00NTg4LWJkNWYtNGI4OWE0MWViZmUyIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  // },
];

const PAGE_MENUS: ReportItem[] = [SS_MENU, SERVICES_MENU, USINAS_MENU, EXTRACTION_MENU, COURSES_MENU];

/* =========================================================
   HELPERS
========================================================= */
const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

function normalizeStringArray(raw: any): string[] {
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
    } catch { }
  }
  return [];
}

function safeSrc(src?: string | null) {
  const s = (src ?? "").trim();
  return s.length ? s : null;
}

function formatUrl(url: string) {
  if (!url) return url;
  const params = ["navContentPaneEnabled=false", "filterPaneEnabled=false", "pageView=fitToWidth"].join("&");
  return url.includes("?") ? `${url}&${params}` : `${url}?${params}`;
}

function getCourseIndexFromStats(stats: string[]) {
  const index = COURSES.findIndex((course) => course?.id && !stats.includes(course.id));
  return index === -1 ? Math.max(0, COURSES.length - 1) : index;
}

/* =========================================================
   SIDEBAR UI (PRO)
========================================================= */
function SideItem({
  title,
  icon,
  active,
  onClick,
  collapsed,
  indent = false,
  right,
}: {
  title: string;
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
  collapsed: boolean;
  indent?: boolean;
  right?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition",
        "text-white/80 hover:text-white",
        "hover:bg-white/6",
        active && "bg-white/10 ring-1 ring-white/10 text-white",
        collapsed && "justify-center px-0",
        indent && !collapsed && "pl-6"
      )}
      title={collapsed ? title : undefined}
    >
      <span className={cx("w-5 h-5 grid place-items-center", active ? "text-white" : "text-white/70")}>{icon}</span>
      {!collapsed && (
        <>
          <span className="text-[14px] font-medium truncate">{title}</span>
          {right ? <span className="ml-auto text-white/60">{right}</span> : null}
        </>
      )}
    </button>
  );
}

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="border rounded-2xl w-full max-w-md p-6 shadow-2xl relative bg-white border-black/10">
        <button onClick={onClose} className="absolute top-4 right-4 text-black/50 hover:text-black" type="button">
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */
export default function Home() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [stats, setStats] = useState<string[]>([]);
  const [currentCourse, setCurrentCourse] = useState(0);
  const currentCourseId = useRef<string | null>(null);

  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [active, setActive] = useState<string>("home");

  const [showSupport, setShowSupport] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // ✅ padrão: sidebar FIXADA
  const [pinned, setPinned] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ✅ modo hierárquico
  const [navMode, setNavMode] = useState<"root" | "reports" | "acionamentos" | "compras">("root");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    currentCourseId.current = COURSES[currentCourse]?.id || null;
  }, [currentCourse]);

  useEffect(() => {
    if (booting) return;
    localStorage.setItem("activeTab", active);
  }, [active, booting]);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("bi_user");
      const savedTab = localStorage.getItem("activeTab");
      const savedCourse = localStorage.getItem("currentCourseIndex");

      if (savedUser) {
        const u = JSON.parse(savedUser);
        const fixedStats = normalizeStringArray(u.stats);
        const fixedAccess = normalizeStringArray(u.access);
        const fixedUser = { ...u, stats: fixedStats, access: fixedAccess };

        setUser(fixedUser);
        setStats(fixedStats);
        localStorage.setItem("bi_user", JSON.stringify(fixedUser));

        if (savedTab) setActive(savedTab);

        if (savedTab === "cursos") {
          if (savedCourse !== null && !Number.isNaN(Number(savedCourse))) setCurrentCourse(Number(savedCourse));
          else setCurrentCourse(getCourseIndexFromStats(fixedStats));
        }
      }
    } finally {
      setBooting(false);
    }
  }, []);

  const handleLogin = async () => {
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
        setError(data.error || "Erro ao fazer login");
        return;
      }

      const fixedStats = normalizeStringArray(data.stats);
      const fixedAccess = normalizeStringArray(data.access);
      const fixedUser = { ...data, stats: fixedStats, access: fixedAccess };

      localStorage.setItem("bi_user", JSON.stringify(fixedUser));
      setUser(fixedUser);
      setStats(fixedStats);

      const savedTab = localStorage.getItem("activeTab");
      setActive(savedTab || "home");

      if ((savedTab || "home") === "cursos") setCurrentCourse(getCourseIndexFromStats(fixedStats));
    } catch {
      setError("Erro de conexão com o servidor");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bi_user");
    localStorage.removeItem("currentCourseIndex");
    localStorage.removeItem("activeTab");

    setUser(null);
    setStats([]);
    setCurrentCourse(0);
    setActive("home");

    setLogin("");
    setSenha("");

    setNavMode("root");
  };

  const handleChangePassword = async () => {
    setResetMsg("");

    if (!oldPass || !newPass) {
      setResetMsg("Preencha todos os campos");
      return;
    }

    if (newPass.length < 4) {
      setResetMsg("A nova senha deve ter no mínimo 4 caracteres");
      return;
    }

    setResetLoading(true);

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: String(user.login).trim(),
          oldPassword: oldPass.trim(),
          newPassword: newPass.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResetMsg(data.error || "Erro ao alterar senha");
        return;
      }

      setResetMsg("Senha alterada com sucesso ✅");
      setTimeout(() => {
        setShowReset(false);
        setOldPass("");
        setNewPass("");
        setResetMsg("");
      }, 1200);
    } catch {
      setResetMsg("Erro de conexão com o servidor");
    } finally {
      setResetLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // ====== SIDEBAR behavior
  const isExpandedDesktop = pinned || hovering;
  const collapsed = !isExpandedDesktop;

  // ====== access
  const access = normalizeStringArray(user?.access);

  const allowedPages = PAGE_MENUS.filter((r) => access.includes(r.id));
  const allowedReports = REPORTS.filter((r) => access.includes(r.id));
  const allowedAcionamentos = ACIONAMENTOS_ITEMS.filter((r) => access.includes(r.id));
  const allowedCompras = COMPRAS_ITEMS.filter((r) => access.includes(r.id));


  const activeReport = allowedReports.find((r) => r.id === active);
  const iframeSrc = safeSrc(activeReport?.src);

  const isNonIframePage =
    active === "home" ||
    active === "servicos" ||
    active === "cursos" ||
    active === "extracao" ||
    active === "acionamentos_cadastro" ||
    active === "acionamentos_base" ||
    active === "acionamentos_dash" ||
    active === "perdas_base" ||
    active === "compras_cadastro" ||
    active === "compras_base" ||
    active === "compras_dash" ||
    active === "usinas" ||
    active === "ss";


  /* =========================================================
     LOGIN/BOOTING
  ========================================================= */
  if (booting) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-between overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex flex-col items-center gap-3 w-full">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <div className="text-white/70 text-sm">Carregando sessão…</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 w-[540px] max-w-[92vw] bg-[#1C4D28] rounded-2xl shadow-2xl border border-white/10 grid grid-cols-2 overflow-hidden">
          <div className="absolute left-1/2 top-6 bottom-6 w-px bg-white/25" />

          <div className="p-7 flex flex-col justify-center items-center text-center text-white">
            <Image src="/logo-aya.png" alt="AYA" width={160} height={160} />
            <span className="mt-2 text-xs text-white/55">Portal • AYA Energia</span>
          </div>

          <form
            className="p-7 flex flex-col justify-center gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <h2 className="text-center text-white font-semibold text-sm mb-1">Acesso</h2>

            <input
              autoComplete="username"
              placeholder="Login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-white text-sm border border-white/30 focus:outline-none focus:border-[#5CAE70] bg-white/5"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-lg text-white text-sm border border-white/30 focus:outline-none focus:border-[#5CAE70] bg-white/5"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}

            <button
              type="submit"
              disabled={loginLoading}
              className="mt-1 w-full py-2.5 rounded-lg bg-[#2E7B45] hover:bg-[#5CAE70] text-white text-sm font-semibold transition disabled:opacity-50"
            >
              {loginLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* =========================================================
     PORTAL
  ========================================================= */
  return (
    <div className="h-screen w-full overflow-hidden bg-white text-black flex">
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onMouseDown={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      {/* Sidebar */}
      <aside
        className={cx(
          "relative z-50 h-full flex flex-col",
          "bg-gradient-to-b from-[#183f24] to-[#0f2f1a] text-white border-r border-white/10",
          "shadow-[10px_0_40px_-30px_rgba(0,0,0,0.55)]",
          "transition-all duration-3",
          isExpandedDesktop ? "w-[260px] lg:w-[280px]" : "w-[60px]",
          "md:static md:translate-x-0 ",
          isExpandedDesktop && "shadow-2xl",
          mobileOpen ? "fixed left-0 top-0 translate-x-0" : "fixed left-0 top-0 -translate-x-full md:translate-x-0"
        )}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* header */}
        <div className="px-3 py-3 border-b border-white/10 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setActive("home");
              setNavMode("root");
            }}
            className={cx("flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5 transition", collapsed && "justify-center w-full")}
            title={collapsed ? "Home" : undefined}
          >
            <div className={cx("grid place-items-center", collapsed ? "w-full" : "")}>
              <Image src="/logo-aya.png" alt="AYA" width={collapsed ? 28 : 44} height={collapsed ? 28 : 44} />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex flex-col items-start text-left">
                <div className="text-sm font-semibold truncate w-full">AYA Energia</div>
                <div className="text-[11px] text-white/55 w-full">Portal</div>
              </div>
            )}
          </button>

          {!collapsed && (
            <button
              type="button"
              className={cx(
                "hidden md:inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10",
                "text-white/70 hover:text-white hover:bg-white/5 transition"
              )}
              onClick={() => setPinned((v) => !v)}
              title={pinned ? "Desafixar" : "Fixar"}
            >
              {pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/5"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* nav */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 bg-transparent">
          {/* ======= CHILD VIEW HEADER ======= */}
          {navMode !== "root" && !collapsed && (
            <div className="px-1">
              <button
                type="button"
                onClick={() => setNavMode("root")}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-white/80 hover:text-white hover:bg-white/6 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[14px] font-medium">Voltar</span>
              </button>

              <div className="mt-2 px-3 text-[11px] uppercase tracking-wider text-white/50">
                {navMode === "reports" ? "Relatórios" : navMode === "acionamentos" ? "Acionamentos" : "Compras"}
              </div>
            </div>
          )}

          {/* ======= ROOT VIEW ======= */}
          {navMode === "root" && (
            <div className="space-y-1">
              <SideItem
                title="Home"
                icon={<LayoutDashboard className="w-4 h-4" />}
                active={active === "home"}
                onClick={() => setActive("home")}
                collapsed={collapsed}
              />

              {allowedReports.length > 0 && (
                <SideItem
                  title="Relatórios"
                  icon={<ClipboardList className="w-4 h-4" />}
                  collapsed={collapsed}
                  onClick={() => setNavMode("reports")}
                  right={!collapsed ? "▸" : null}
                />
              )}

              {allowedCompras.length > 0 && (
                <SideItem
                  title="Compras"
                  icon={<ShoppingCart className="w-4 h-4" />}
                  collapsed={collapsed}
                  onClick={() => setNavMode("compras")}
                  right={!collapsed ? "▸" : null}
                />
              )}

              {allowedAcionamentos.length > 0 && (
                <SideItem
                  title="Acionamentos"
                  icon={<Wrench className="w-4 h-4" />}
                  collapsed={collapsed}
                  onClick={() => setNavMode("acionamentos")}
                  right={!collapsed ? "▸" : null}
                />
              )}

              {allowedPages.map((p) => {
                const Icon = p.icon;
                return (
                  <SideItem
                    key={p.id}
                    title={p.title}
                    icon={Icon ? <Icon className="w-4 h-4" /> : <span className="w-4 h-4" />}
                    active={active === p.id}
                    onClick={() => {
                      if (p.id === "cursos") setCurrentCourse(getCourseIndexFromStats(stats));
                      setActive(p.id);
                    }}
                    collapsed={collapsed}
                  />
                );
              })}
            </div>
          )}

          {/* ======= CHILD VIEW: REPORTS ======= */}
          {navMode === "reports" && (
            <div className="space-y-1">
              {allowedReports.map((r) => {
                const Icon = r.icon || SolarPanel;
                return (
                  <SideItem
                    key={r.id}
                    title={r.title}
                    icon={<Icon className="w-4 h-4" />}
                    active={active === r.id}
                    onClick={() => setActive(r.id)}
                    collapsed={collapsed}
                  />
                );
              })}
            </div>
          )}

          {/* ======= CHILD VIEW: ACIONAMENTOS ======= */}
          {navMode === "acionamentos" && (
            <div className="space-y-1">
              {allowedAcionamentos.map((it) => {
                const Icon = it.icon;
                return (
                  <SideItem
                    key={it.id}
                    title={it.title}
                    icon={Icon ? <Icon className="w-4 h-4" /> : <span className="w-4 h-4" />}
                    active={active === it.id}
                    onClick={() => setActive(it.id)}
                    collapsed={collapsed}
                  />
                );
              })}
            </div>
          )}

          {/* ======= CHILD VIEW: COMPRAS ======= */}
          {navMode === "compras" && (
            <div className="space-y-1">
              {allowedCompras.map((it) => {
                const Icon = it.icon;
                return (
                  <SideItem
                    key={it.id}
                    title={it.title}
                    icon={Icon ? <Icon className="w-4 h-4" /> : <span className="w-4 h-4" />}
                    active={active === it.id}
                    onClick={() => setActive(it.id)}
                    collapsed={collapsed}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="px-2 py-3 border-t border-white/10 space-y-1">
          <SideItem
            title="Redefinir senha"
            icon={<KeyRound className="w-4 h-4" />}
            onClick={() => {
              setResetMsg("");
              setOldPass("");
              setNewPass("");
              setShowReset(true);
            }}
            collapsed={collapsed}
          />
          <SideItem title="Suporte" icon={<HelpCircle className="w-4 h-4" />} onClick={() => setShowSupport(true)} collapsed={collapsed} />
          <SideItem title="Sair" icon={<LogOut className="w-4 h-4" />} onClick={handleLogout} collapsed={collapsed} />
        </div>
      </aside>


      {/* Content */}
      <main
        className={cx(
          "flex-1 min-w-0 h-full relative bg-white transition-all duration-300",
          !pinned && "md:ml-[60px]"
        )}
      >
        {/* Mobile top bar */}
        <div className="md:hidden h-12 border-b border-black/10 flex items-center px-3 gap-2 bg-white">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="h-9 w-9 rounded-xl border border-black/10 grid place-items-center text-black/70 hover:bg-black/[0.03]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm font-semibold text-black/80 truncate">Portal</div>
        </div>

        {/* HOME */}
        {active === "home" && (
          <div className="absolute inset-0 overflow-hidden">
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
              <source src="/video.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/35" />
            <div className="relative z-10 w-full h-full flex items-center justify-center px-6">
              <Image src="/logo-aya.png" alt="AYA" width={500} height={500} className="opacity-60" />
            </div>
          </div>
        )}

        {/* SERVIÇOS */}
        {active === "servicos" && (
          <div className="absolute inset-0 overflow-y-auto bg-white">
            <ServicesContent />
          </div>
        )}

        {/* Usinas */}
        {active === "usinas" && (
          <div className="absolute inset-0 overflow-y-auto bg-white">
            <UsinasContent />
          </div>
        )}

        {/* CURSOS */}
        {active === "cursos" && (
          <div className="absolute inset-0 overflow-y-auto bg-white">
            <CoursesPage user={user} courses={COURSES} stats={stats} setStats={setStats} />
          </div>
        )}

        {/* EXTRAÇÃO */}
        {active === "extracao" && (
          <div className="absolute inset-0 overflow-y-auto bg-[#f6f7f8]">
            <ExtractionPage />
          </div>
        )}

        {/* SISMETRO */}
        {active === "ss" && (
          <div className="absolute inset-0 overflow-y-auto bg-[#f6f7f8]">
            <SismetroDashPage />
          </div>
        )}

        {/* ACIONAMENTOS */}
        {active === "acionamentos_dash" && (
          <div className="absolute inset-0 overflow-y-auto bg-[#f6f7f8]">
            <AcionamentosDashPage />
          </div>
        )}
        {active === "acionamentos_cadastro" && (
          <div className="absolute inset-0 overflow-y-auto bg-[#f6f7f8]">
            <AcionamentosCadastroPage />
          </div>
        )}
        {active === "acionamentos_base" && (
          <div className="absolute inset-0 overflow-y-auto bg-[#f6f7f8]">
            <AcionamentosBasePage />
          </div>
        )}
        {active === "perdas_base" && (
          <div className="absolute inset-0 overflow-y-auto bg-[#f6f7f8]">
            <PerdasBasePage />
          </div>
        )}

        {/* Compras */}
        {active === "compras_cadastro" && (
          <div className="absolute inset-0 overflow-y-auto bg-[#f6f7f8]">
            <ComprasCadastroPage />
          </div>
        )}

        {active === "compras_base" && (
          <div className="absolute inset-0 overflow-y-auto bg-[#f6f7f8]">
            <ComprasBasePage />
          </div>
        )}

        {active === "compras_dash" && (
          <div className="absolute inset-0 overflow-y-auto bg-[#f6f7f8]">
            <ComprasDashPage />
          </div>
        )}

        {/* RELATÓRIOS (iframe) */}
        {iframeSrc && !isNonIframePage && (
          <iframe key={active} src={formatUrl(iframeSrc)} className="absolute inset-0 w-full h-full border-none" allowFullScreen />
        )}
      </main>

      {/* MODAL SUPORTE */}
      {showSupport && (
        <Modal onClose={() => setShowSupport(false)}>
          <h3 className="text-lg font-semibold mb-2 text-black">Suporte Técnico</h3>
          <p className="text-sm mb-4 text-black/65">Entre em contato com o desenvolvedor</p>

          <div className="space-y-3 text-sm">
            <a
              href="https://www.linkedin.com/in/diegodamaro/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-2 rounded-lg border transition bg-black/[0.03] hover:bg-black/[0.06] text-black border-black/10"
            >
              LinkedIn
            </a>

            <a
              href="mailto:diego.sanchez@ayaenergia.com.br"
              className="flex items-center gap-3 px-4 py-2 rounded-lg border transition bg-black/[0.03] hover:bg-black/[0.06] text-black border-black/10"
            >
              Email
            </a>

            <a
              href="https://wa.me/5511961995900"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-2 rounded-lg border transition bg-black/[0.03] hover:bg-black/[0.06] text-black border-black/10"
            >
              WhatsApp
            </a>
          </div>
        </Modal>
      )}

      {/* MODAL RESET */}
      {showReset && (
        <Modal onClose={() => setShowReset(false)}>
          <h3 className="text-lg font-semibold mb-4 text-black">Redefinir Senha</h3>

          <div className="relative mb-3">
            <input
              type={showOldPass ? "text" : "password"}
              placeholder="Senha atual"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              className="w-full p-3 pr-10 rounded-lg border focus:outline-none focus:ring-1 bg-white text-black border-black/20 focus:border-[#2E7B57] focus:ring-[#2E7B57]"
            />
            <button
              type="button"
              onClick={() => setShowOldPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black"
            >
              {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative mb-3">
            <input
              type={showNewPass ? "text" : "password"}
              placeholder="Nova senha"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full p-3 pr-10 rounded-lg border focus:outline-none focus:ring-1 bg-white text-black border-black/20 focus:border-[#2E7B57] focus:ring-[#2E7B57]"
            />
            <button
              type="button"
              onClick={() => setShowNewPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black"
            >
              {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {resetMsg && (
            <div
              className={cx(
                "text-sm mb-3 px-3 py-2 rounded-lg border",
                resetMsg.includes("sucesso") ? "bg-green-500/10 text-green-700 border-green-500/20" : "bg-red-500/10 text-red-700 border-red-500/20"
              )}
            >
              {resetMsg}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={resetLoading || !oldPass || !newPass}
            className="w-full bg-[#2E7B57] py-2.5 rounded-lg text-white hover:bg-[#256947] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {resetLoading ? "Alterando..." : "Alterar Senha"}
          </button>
        </Modal>
      )}
    </div>
  );
}
