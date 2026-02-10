"use client";

/* =========================================================
   IMPORTS
========================================================= */
import BrazilTopoMap from "@/components/BrazilTopoMap";
import VimeoPlayer from "@/components/VimeoPlayer";
import Image from "next/image";
import { useEffect, useRef, useState, useMemo, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { downloadText, toCsv, toReportText, type DriveRow } from "@/lib/exporters";
import { AcionamentosPage } from "@/components/AcionamentosPage";
import { ExtractionPage } from "@/components/ExtractionPage";
import ServicesPage from "@/components/ServicesPage";
import { CoursesPage } from "@/components/CoursesPage";
import ReportsPage from "@/components/ReportsPage";

import {
  Wrench,
  ShoppingCart,
  ClipboardList,
  LogOut,
  HelpCircle,
  X,
  Linkedin,
  Mail,
  Phone,
  Eye,
  EyeOff,
  KeyRound,
  Activity,
  Droplets,
  ClipboardCheck,
  BriefcaseBusiness,
  TrendingUp,
  FileSearch,
  SolarPanel
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */
type ReportItem = {
  id: string;
  title: string;
  src?: string;
  image?: string;
  icon?: LucideIcon;
};

type CourseItem = {
  id: string;
  title: string;
  description?: string;
  vimeoId?: string;
  formUrl?: string;
};

/* =========================================================
   MENU: ABA "Acionamentos"
========================================================= */
const ACIONAMENTOS_INPUT_MENU: ReportItem = {
  id: "acionamentos_input",
  title: "Acionamentos",
  icon: Wrench,
};

/* =========================================================
   MENU: ABA "EXTRAÇÃO"
========================================================= */
const EXTRACTION_MENU: ReportItem = {
  id: "extracao",
  title: "Extração por UC",
  icon: FileSearch,
};

/* =========================================================
   MENU: ABA "SERVIÇOS"
========================================================= */
const SERVICES_MENU: ReportItem = {
  id: "servicos",
  title: "Sobre Nós",
  icon: Wrench,
};

/* =========================================================
   CURSOS (VIMEO)
========================================================= */
const COURSES: CourseItem[] = [
  {
    id: "modulo:inversor-1",
    title: "Inversores Fotovoltaicos",
    description: "Introdução e",
    vimeoId: "1155013136",
    formUrl: "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
  {
    id: "modulo:inversor-2",
    title: "SKID",
    description: "Filtros, páginas e análises",
    vimeoId: "1155023945",
    formUrl: "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
  {
    id: "modulo:inversor-3",
    title: "CMP (Cabine Medição Primária)",
    description: "Filtros, páginas e análises",
    formUrl: "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
  {
    id: "modulo:inversor-4",
    title: "Estruturas Mecânicas",
    description: "Filtros, páginas e análises",
    formUrl: "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
  {
    id: "modulo:inversor-5",
    title: "Estruturas Automação",
    description: "Filtros, páginas e análises",
    formUrl: "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
  {
    id: "modulo:inversor-6",
    title: "Redes e Informática",
    description: "Filtros, páginas e análises",
    formUrl: "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
  {
    id: "modulo:inversor-7",
    title: "CFTV (Circuito Fechado de TV)",
    description: "Filtros, páginas e análises",
    formUrl: "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
  {
    id: "modulo:inversor-8",
    title: "Nobreak",
    description: "Filtros, páginas e análises",
    formUrl: "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
  {
    id: "modulo:inversor-9",
    title: "Indicadores Técnicos de Eficiência",
    description: "Filtros, páginas e análises",
    formUrl: "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
  {
    id: "modulo:inversor-10",
    title: "Eletricidade Básica",
    description: "Filtros, páginas e análises",
    formUrl: "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
];

const COURSES_MENU: ReportItem = {
  id: "cursos",
  title: "Cursos",
  icon: ClipboardList,
};

/* =========================================================
   RELATÓRIOS
========================================================= */
const PORTFOLIO_REPORTS: ReportItem[] = [
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
];

const INTERNAL_REPORTS: ReportItem[] = [
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
  {
    id: "compras",
    title: "Controle de Compras",
    icon: ShoppingCart,
    src: "https://app.powerbi.com/view?r=eyJrIjoiMGQ1YmMyMjctMWYzMy00NTg4LWJkNWYtNGI4OWE0MWViZmUyIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },
];

const REPORTS_MENU: ReportItem = {
  id: "relatorios",
  title: "Relatórios",
  icon: ClipboardList,
};

const ALL_REPORTS: ReportItem[] = [
  SERVICES_MENU,
  REPORTS_MENU,
  ACIONAMENTOS_INPUT_MENU,
  EXTRACTION_MENU,
  COURSES_MENU,
];

const REPORT_GROUPS = [
  { id: "portfolio", title: "Portfólio", items: PORTFOLIO_REPORTS },
  { id: "internos", title: "Internos", items: INTERNAL_REPORTS },
] as const;

/* =========================================================
   HELPERS
========================================================= */
function safeSrc(src?: string | null) {
  const s = (src ?? "").trim();
  return s.length ? s : null;
}

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

function normalizeStringArray(raw: any): string[] {
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        return parsed.filter((x) => typeof x === "string");
    } catch { }
  }
  return [];
}

function formatUrl(url: string) {
  if (!url) return url;

  const params = [
    "navContentPaneEnabled=false",
    "filterPaneEnabled=false",
    "pageView=fitToWidth",
  ].join("&");
  return url.includes("?") ? `${url}&${params}` : `${url}?${params}`;
}

function getCourseIndexFromStats(stats: string[]) {
  const index = COURSES.findIndex((course) => !stats.includes(course.id));
  return index === -1 ? COURSES.length - 1 : index;
}

/* =========================================================
   PAGE
========================================================= */
export default function Home() {
  /* ===== Sessão / login ===== */
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<any>(null);

  /* ===== Cursos ===== */
  const [stats, setStats] = useState<string[]>([]);
  const [currentCourse, setCurrentCourse] = useState(0);
  const currentCourseId = useRef<string | null>(null);
  const completingRef = useRef<string | null>(null);

  /* ===== Login form ===== */
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  /* ===== Navegação ===== */
  const [active, setActive] = useState<string>("home");
  const [showSupport, setShowSupport] = useState(false);

  /* ===== Reset senha ===== */
  const [showReset, setShowReset] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  /* ===== UI ===== */
  const [focus] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ===== Preconnect Vimeo ===== */
  useEffect(() => {
    const links = [
      "https://player.vimeo.com",
      "https://i.vimeocdn.com",
      "https://f.vimeocdn.com",
      "https://vimeo.com",
    ];
    links.forEach((href) => {
      const l = document.createElement("link");
      l.rel = "preconnect";
      l.href = href;
      l.crossOrigin = "anonymous";
      document.head.appendChild(l);
    });
  }, []);

  /* ===== Track course ref + loading ===== */
  useEffect(() => {
    currentCourseId.current = COURSES[currentCourse]?.id || null;
    setVideoLoading(true);
    setVideoError("");
  }, [currentCourse]);

  /* ===== Persist active tab ===== */
  useEffect(() => {
    if (booting) return;
    localStorage.setItem("activeTab", active);
  }, [active, booting]);

  /* ===== Carrega sessão ===== */
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
          if (savedCourse !== null && !Number.isNaN(Number(savedCourse)))
            setCurrentCourse(Number(savedCourse));
          else setCurrentCourse(getCourseIndexFromStats(fixedStats));
        }
      }
    } finally {
      setBooting(false);
    }
  }, []);

  const progressPercent =
    COURSES.length > 0 ? Math.round((stats.length / COURSES.length) * 100) : 0;

  const canAccess = (index: number) => {
    if (index === 0) return true;

    const course = COURSES[index];
    const prev = COURSES[index - 1];

    if (course?.id && stats.includes(course.id)) return true;
    if (!course?.vimeoId) return true;
    return !!prev?.id && stats.includes(prev.id);
  };

  const isWatched = (id: string) => stats.includes(id);

  const completeCourse = async (courseId: string) => {
    if (!courseId) return;
    if (!user?.login) return;
    if (stats.includes(courseId)) return;
    if (completingRef.current) return;

    completingRef.current = courseId;

    try {
      const res = await fetch("/api/user/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: user.login, courseId }),
      });

      if (!res.ok) return;

      const data = await res.json();
      const fixed = normalizeStringArray(data.stats);

      setStats(fixed);

      const updatedUser = { ...user, stats: fixed };
      setUser(updatedUser);
      localStorage.setItem("bi_user", JSON.stringify(updatedUser));
    } finally {
      completingRef.current = null;
    }
  };

  /* ===== LOGIN ===== */
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
        body: JSON.stringify({
          login: login.trim(),
          password: senha.trim(),
        }),
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

      if ((savedTab || "home") === "cursos")
        setCurrentCourse(getCourseIndexFromStats(fixedStats));
    } catch {
      setError("Erro de conexão com o servidor");
    } finally {
      setLoginLoading(false);
    }
  };

  /* ===== LOGOUT ===== */
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
  };

  /* ===== ALTERAR SENHA ===== */
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

  /* =========================================================
     LOGIN PAGE
  ========================================================= */
  if (!mounted) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (booting) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-between overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
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

  // Login mantém visual “brand”
  if (!user) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />

        <div
          className="
            relative z-10
            w-[510px] h-[250px]
            bg-[#1C4D28]
            rounded-xl
            shadow-2xl
            border border-white/10
            grid grid-cols-2
            overflow-hidden
            backdrop-blur-sm
          "
        >
          <div className="absolute left-1/2 top-6 bottom-6 w-px bg-white/40" />

          <div className="p-6 flex flex-col justify-center items-center text-center text-white">
            <Image src="/logo-aya.png" alt="AYA" width={150} height={150} />
            <span className="mt-2 text-xs text-white/50">
              Portal • AYA Energia
            </span>
          </div>

          <form
            method="post"
            action="/login"
            className="p-6 flex flex-col justify-center gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <h2 className="text-center text-white font-semibold text-sm mb-1">
              Login
            </h2>

            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-3 py-2 rounded text-white text-sm border border-white/40 focus:outline-none focus:border-[#2E7B57] bg-transparent"
            />

            <div className="relative">
              <input
                id="current-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded text-white text-sm border border-white/40 focus:outline-none focus:border-[#2E7B57] bg-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="mt-1 w-full py-2 rounded bg-[#2E7B45] hover:bg-[#5CAE70] text-white text-sm font-semibold transition disabled:opacity-50"
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
  const access = normalizeStringArray(user.access);
  const allowedReports = ALL_REPORTS.filter((r) => access.includes(r.id));
  const report = allowedReports.find((r) => r.id === active);
  const iframeSrc = safeSrc(report?.src);

  return (
    <div
      className={cx(
        "flex flex-col h-screen w-full overflow-hidden",
        "bg-white text-black"
      )}
    >
      {/* ===== HEADER ===== */}
      {!focus && (
        <header
          className="
            h-16 w-full flex items-center justify-between px-4
            bg-[#1C4D28]
            border-b border-white/10 shadow-xl
          "
        >
          <button
            onClick={() => setActive("home")}
            className="flex items-center gap-3"
          >
            <Image src="/logo-aya.png" alt="Logo" width={42} height={42} />
            <div className="leading-tight text-left">
              <p className="text-white font-semibold text-sm">Aya Energia</p>
              <p className="text-white/40 text-xs">Portal</p>
            </div>
          </button>

          <nav className="flex items-center gap-2 overflow-x-auto">
            {allowedReports.map((r) => {
              const isActive = active === r.id;

              return (
                <button
                  key={r.id}
                  onClick={() => {
                    if (r.id === active) return;

                    if (r.id === "cursos") {
                      const courseIndex = getCourseIndexFromStats(stats);
                      setCurrentCourse(courseIndex);
                    }

                    setActive(r.id);
                  }}
                  className={cx(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition",
                    isActive
                      ? "bg-white/15 text-white border-b-2 border-[#5CAE70]"
                      : "text-white/70 hover:bg-white/10"
                  )}
                >
                  <span>{r.title}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setResetMsg("");
                setOldPass("");
                setNewPass("");
                setShowReset(true);
              }}
              className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white"
              title="Redefinir Senha"
            >
              <KeyRound size={18} />
            </button>

            <button
              onClick={() => setShowSupport(true)}
              className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white"
              title="Suporte"
            >
              <HelpCircle size={18} />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded hover:bg-red-500/20 text-white/70 hover:text-red-400"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
      )}

      {/* ===== CONTEÚDO ===== */}
      <div className={cx("flex-1 relative", "bg-white")}>
        {/* HOME */}
        {active === "home" && (
          <div className="absolute inset-0 overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/video.mp4" type="video/mp4" />
            </video>

            <div className="absolute inset-0 bg-black/35" />

            <div className="relative z-10 w-full h-full flex items-center justify-center px-6">
              <Image
                src="/logo-aya.png"
                alt="AYA"
                width={500}
                height={500}
                className="opacity-60"
              />
            </div>
          </div>
        )}

        {/* SERVIÇOS */}
        {active === "servicos" && (
          <div className="absolute inset-0 overflow-y-auto bg-white">
            <ServicesPage />

          </div>
        )}

        {/* CURSOS */}
        {active === "cursos" && (
          <CoursesPage
            user={user}
            courses={COURSES}
            stats={stats}
            setStats={setStats}
          />
        )}


        {/* EXTRAÇÃO */}
        {active === "extracao" && (
          <div className="absolute inset-0 overflow-y-auto bg-[#f6f7f8]">
            <ExtractionPage />
          </div>
        )}

        {/* ACIONAMENTOS (INPUT) */}
        {active === "acionamentos_input" && (
          <div className="absolute inset-0 overflow-y-auto bg-[#f6f7f8]">
            <AcionamentosPage />
          </div>
        )}

        {active === "relatorios" && (
          <div className="absolute inset-0 bg-[#f6f7f8] overflow-hidden">
            <ReportsPage
              access={access}
              portfolioReports={PORTFOLIO_REPORTS}
              internalReports={INTERNAL_REPORTS}
            />
          </div>
        )}

        {/* RELATÓRIOS (se algum menu tiver src direto) */}
        {iframeSrc &&
          active !== "home" &&
          active !== "cursos" &&
          active !== "servicos" &&
          active !== "extracao" &&
          active !== "acionamentos_input" &&
          active !== "relatorios" && (
            <iframe
              key={active}
              src={formatUrl(iframeSrc)}
              className="absolute inset-0 w-full h-full border-none"
              allowFullScreen
            />
          )}
      </div>

      {/* ===== MODAL SUPORTE ===== */}
      {showSupport && (
        <Modal onClose={() => setShowSupport(false)}>
          <h3 className="text-lg font-semibold mb-2 text-black">
            Suporte Técnico
          </h3>
          <p className="text-sm mb-4 text-black/65">
            Entre em contato com o desenvolvedor
          </p>

          <div className="space-y-3 text-sm">
            <a
              href="https://www.linkedin.com/in/diegodamaro/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-2 rounded-lg border transition bg-black/[0.03] hover:bg-black/[0.06] text-black border-black/10"
            >
              <Linkedin size={18} /> LinkedIn
            </a>

            <a
              href="mailto:diego.sanchez@ayaenergia.com.br"
              className="flex items-center gap-3 px-4 py-2 rounded-lg border transition bg-black/[0.03] hover:bg-black/[0.06] text-black border-black/10"
            >
              <Mail size={18} /> Email
            </a>

            <a
              href="https://wa.me/5511961995900"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-2 rounded-lg border transition bg-black/[0.03] hover:bg-black/[0.06] text-black border-black/10"
            >
              <Phone size={18} /> WhatsApp
            </a>
          </div>
        </Modal>
      )}

      {/* ===== MODAL RESET SENHA ===== */}
      {showReset && (
        <Modal onClose={() => setShowReset(false)}>
          <h3 className="text-lg font-semibold mb-4 text-black">
            Redefinir Senha
          </h3>

          <div className="relative mb-3">
            <input
              type={showOldPass ? "text" : "password"}
              placeholder="Senha atual"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              className="w-full p-3 pr-10 rounded border focus:outline-none focus:ring-1 bg-white text-black border-black/20 focus:border-[#2E7B57] focus:ring-[#2E7B57]"
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
              className="w-full p-3 pr-10 rounded border focus:outline-none focus:ring-1 bg-white text-black border-black/20 focus:border-[#2E7B57] focus:ring-[#2E7B57]"
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
                "text-sm mb-3 px-3 py-2 rounded border",
                resetMsg.includes("sucesso")
                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                  : "bg-red-500/10 text-red-600 border-red-500/20"
              )}
            >
              {resetMsg}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={resetLoading || !oldPass || !newPass}
            className="w-full bg-[#2E7B57] py-2 rounded text-white hover:bg-[#256947] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {resetLoading ? "Alterando..." : "Alterar Senha"}
          </button>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   MODAL BASE
========================================================= */
function Modal({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="border rounded-2xl w-full max-w-md p-6 shadow-2xl relative bg-white border-black/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black/50 hover:text-black"
        >
          <X size={18} />
        </button>

        {children}
      </div>
    </div>
  );
}
