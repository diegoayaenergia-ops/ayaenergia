"use client";

/* =========================================================
   IMPORTS
========================================================= */
import BrazilTopoMap from "@/components/BrazilTopoMap";
import VimeoPlayer from "@/components/VimeoPlayer";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

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
  Sun,
  Moon,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */
type ReportItem = {
  id: string;
  title: string;
  src: string;
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

type Theme = "dark" | "light";

/* =========================================================
   MENU: ABA "SERVIÇOS"
========================================================= */
const SERVICES_MENU: ReportItem = {
  id: "servicos",
  title: "Sobre Nós",
  icon: Wrench,
  src: "",
};

/* =========================================================
   CURSOS (VIMEO)
========================================================= */
const COURSES: CourseItem[] = [
  {
    id: "modulo:inversor-1",
    title: "Inversores Fotovoltaicos",
    description: "Introdução e ",
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
  src: "",
};

/* =========================================================
   RELATÓRIOS
========================================================= */
const PORTFOLIO_REPORTS: ReportItem[] = [
  {
    id: "ineer",
    title: "Ineer Energia",
    image: "/icon-usina.png",
    src: "https://app.powerbi.com/view?r=eyJrIjoiODJiMGQwM2MtOGJiOC00MTAyLWJkM2EtMWNkZTlkNjBiYTBlIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },
  {
    id: "kamai",
    title: "Kamai Solar",
    image: "/icon-usina.png",
    src: "https://app.powerbi.com/view?r=eyJrIjoiNmM4ZjNkODgtNTRiOC00MmNkLTk5MDctMzA1Mzk4YTA5NmFhIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },
  {
    id: "elis",
    title: "Élis Energia",
    image: "/icon-usina.png",
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

const ALL_REPORTS: ReportItem[] = [
  SERVICES_MENU,
  COURSES_MENU,
  ...PORTFOLIO_REPORTS,
  ...INTERNAL_REPORTS,
];

/* =========================================================
   HELPERS
========================================================= */
const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

function normalizeStringArray(raw: any): string[] {
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        return parsed.filter((x) => typeof x === "string");
    } catch {}
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

  /* ===== Theme (light/dark) ===== */
  const [theme, setTheme] = useState<Theme>("dark");
  const isDark = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

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

    // já concluído? pode reassistir
    if (course?.id && stats.includes(course.id)) return true;

    // se não tem vídeo ainda, não trava
    if (!course?.vimeoId) return true;

    // sequencial (precisa concluir a anterior)
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
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <div className="text-white/70 text-sm">Carregando sessão…</div>
        </div>
      </div>
    );
  }

  // Login mantém visual “brand” (escuro) — tema começa após logado
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

  return (
    <div
      className={cx(
        "flex flex-col h-screen w-full overflow-hidden",
        isDark ? "bg-black text-white" : "bg-b text-black"
      )}
    >
      {/* ===== HEADER ===== */}
      {!focus && (
        <header
          className="
            h-16 w-full flex items-center justify-between px-4
            bg-gradient-to-r from-[#1f7a55]/90 via-[#2E7B57]/80 to-[#145a36]/90 backdrop-blur
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
              onClick={toggleTheme}
              className={cx(
                "p-2 rounded transition",
                "text-white/70 hover:text-white hover:bg-white/10"
              )}
              title={isDark ? "Tema claro" : "Tema escuro"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

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
      <div className={cx("flex-1 relative", isDark ? "bg-black" : "bg-white")}>
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
          <div
            className={cx(
              "absolute inset-0 overflow-y-auto",
              isDark ? "bg-[#0b0f0d]" : "bg-white"
            )}
          >
            <ServicesContent theme={theme} />
          </div>
        )}

        {/* CURSOS */}
        {active === "cursos" && (
          <div className={cx("absolute inset-0 flex", isDark ? "bg-[#0b0f0d]" : "bg-[#f6f7f8]")}>
            {/* SIDEBAR */}
            <aside
              className={cx(
                "w-[360px] border-r flex flex-col",
                isDark
                  ? "bg-[#0f1512] border-white/10"
                  : "bg-white border-black/10"
              )}
            >
              <div className={cx("p-4 border-b", isDark ? "border-white/10" : "border-black/10")}>
                <div className="flex items-center justify-between">
                  <h3 className={cx("font-semibold text-base", isDark ? "text-white" : "text-black")}>
                    Conteúdo
                  </h3>
                  <span className={cx("text-xs", isDark ? "text-white/40" : "text-black/50")}>
                    {stats.length}/{COURSES.length}
                  </span>
                </div>

                <div className="mt-3">
                  <div className={cx("w-full h-2 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-black/10")}>
                    <div
                      className="h-full bg-[#5CAE70] transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className={cx("text-xs mt-1 block", isDark ? "text-white/40" : "text-black/50")}>
                    {progressPercent}% concluído
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {COURSES.map((course, index) => {
                  const watched = isWatched(course.id);
                  const activeItem = index === currentCourse;
                  const locked = !canAccess(index);

                  return (
                    <div
                      key={course.id}
                      className={cx(
                        "group rounded-xl transition",
                        activeItem
                          ? isDark
                            ? "bg-black/30 ring-1 ring-[#5CAE70]/35"
                            : "bg-black/[0.03] ring-1 ring-[#5CAE70]/25"
                          : isDark
                            ? "hover:bg-white/[0.04]"
                            : "hover:bg-black/[0.04]",
                        locked && "opacity-45"
                      )}
                    >
                      <div className="flex items-center gap-3 px-3 py-3">
                        <button
                          type="button"
                          disabled={locked}
                          onClick={() => {
                            if (!canAccess(index)) return;
                            setCurrentCourse(index);
                          }}
                          className="flex-1 min-w-0 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <p className={cx("text-sm font-semibold truncate", isDark ? "text-white" : "text-black")}>
                              {course.title}
                            </p>

                            {watched && (
                              <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-[#5CAE70]/20 text-[#2a6a3a] border border-[#5CAE70]/20">
                                Concluída
                              </span>
                            )}

                            {!course.vimeoId && (
                              <span
                                className={cx(
                                  "shrink-0 text-[10px] px-2 py-0.5 rounded-full border",
                                  isDark
                                    ? "bg-white/5 text-white/50 border-white/10"
                                    : "bg-black/[0.03] text-black/55 border-black/10"
                                )}
                              >
                                Em breve
                              </span>
                            )}

                            {locked && (
                              <span
                                className={cx(
                                  "shrink-0 text-[10px] px-2 py-0.5 rounded-full border",
                                  isDark
                                    ? "bg-white/5 text-white/40 border-white/10"
                                    : "bg-black/[0.03] text-black/45 border-black/10"
                                )}
                              >
                                Bloqueada
                              </span>
                            )}
                          </div>

                          <div className={cx("mt-1 flex items-center gap-2 text-xs", isDark ? "text-white/45" : "text-black/55")}>
                            <span>Aula {index + 1}</span>
                            <span className={cx("w-1 h-1 rounded-full", isDark ? "bg-white/25" : "bg-black/25")} />
                            <span>{course.description || "Conteúdo do módulo"}</span>
                          </div>
                        </button>

                        {course.vimeoId && (
                          <button
                            type="button"
                            onClick={() => {
                              if (locked) return;
                              if (watched) return;
                              completeCourse(course.id);
                            }}
                            disabled={locked || watched || completingRef.current === course.id}
                            className={cx(
                              "shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition border",
                              watched
                                ? isDark
                                  ? "bg-white/5 text-white/35 border-white/10 cursor-not-allowed"
                                  : "bg-black/[0.03] text-black/40 border-black/10 cursor-not-allowed"
                                : locked
                                  ? isDark
                                    ? "bg-white/5 text-white/25 border-white/10 cursor-not-allowed"
                                    : "bg-black/[0.03] text-black/30 border-black/10 cursor-not-allowed"
                                  : "bg-[#5CAE70] text-black border-[#5CAE70]/30 hover:brightness-110 active:scale-[0.98]"
                            )}
                            title={watched ? "Já concluída" : "Marcar como concluída"}
                          >
                            {watched ? "✓" : completingRef.current === course.id ? "..." : "Concluir"}
                          </button>
                        )}
                      </div>

                      {course.formUrl && (
                        <div className="px-3 pb-3">
                          <a
                            href={course.formUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cx(
                              "inline-flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 transition border",
                              watched
                                ? isDark
                                  ? "bg-white/5 text-white border-white/10 hover:bg-white/10"
                                  : "bg-black/[0.03] text-black border-black/10 hover:bg-black/[0.06]"
                                : "bg-black/0 text-black/30 border-black/10 cursor-not-allowed pointer-events-none"
                            )}
                          >
                            📄 Avaliação da Aula
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={cx("p-3 border-t", isDark ? "border-white/10" : "border-black/10")}>
                <button
                  onClick={async () => {
                    const ok = window.confirm(
                      "Tem certeza que deseja recomeçar o curso? Isso vai remover seu progresso."
                    );
                    if (!ok) return;

                    try {
                      const res = await fetch("/api/user/reset-stats", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ login: user.login }),
                      });

                      if (!res.ok) return;

                      setStats([]);
                      const updatedUser = { ...user, stats: [] };
                      setUser(updatedUser);
                      localStorage.setItem("bi_user", JSON.stringify(updatedUser));
                      setCurrentCourse(0);
                    } catch {}
                  }}
                  className={cx(
                    "w-full px-4 py-2 rounded-lg text-sm font-semibold border transition",
                    isDark
                      ? "border-white/15 text-white/80 hover:bg-white/5"
                      : "border-black/15 text-black/70 hover:bg-black/[0.04]"
                  )}
                  title="Zerar progresso do curso"
                >
                  Recomeçar
                </button>
              </div>
            </aside>

            {/* PLAYER */}
            <main className={cx("flex-1", isDark ? "bg-[#0b0f0d]" : "bg-[#f6f7f8]")}>
              <div className="h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="w-full max-w-[1200px]">
                    <div
                      className={cx(
                        "rounded-2xl border overflow-hidden shadow-[0_18px_60px_-30px_rgba(0,0,0,0.7)]",
                        isDark
                          ? "border-white/10 bg-black"
                          : "border-black/10 bg-white"
                      )}
                    >
                      <div className={cx("relative w-full aspect-video", isDark ? "bg-black" : "bg-black")}>
                        {COURSES[currentCourse]?.vimeoId ? (
                          <div className="absolute inset-0">
                            <VimeoPlayer
                              key={COURSES[currentCourse].vimeoId}
                              videoId={COURSES[currentCourse].vimeoId}
                              onReady={() => {
                                setVideoLoading(false);
                                setVideoError("");
                              }}
                              onError={(msg) => {
                                setVideoLoading(false);
                                setVideoError(msg);
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className={cx(
                              "absolute inset-0 flex flex-col items-center justify-center text-center px-6",
                              isDark ? "bg-white/5" : "bg-black/[0.04]"
                            )}
                          >
                            <p className={cx("font-semibold text-lg", isDark ? "text-white" : "text-black")}>
                              Conteúdo em preparação
                            </p>
                            <p className={cx("text-sm mt-2 max-w-md", isDark ? "text-white/60" : "text-black/60")}>
                              Esta aula ainda não possui vídeo disponível. Em breve o conteúdo será liberado.
                            </p>
                          </div>
                        )}

                        {videoLoading && COURSES[currentCourse]?.vimeoId && !videoError && (
                          <div className="absolute inset-0 grid place-items-center bg-black/60">
                            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                          </div>
                        )}

                        {videoError && !videoLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
                            <div className="max-w-md text-center">
                              <p className="text-white font-semibold">Erro no player</p>
                              <p className="text-white/70 text-sm mt-2">{videoError}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div
                        className={cx(
                          "px-5 py-4 border-t",
                          isDark
                            ? "bg-[#0f1512] border-white/10"
                            : "bg-white border-black/10"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className={cx("text-xs", isDark ? "text-white/50" : "text-black/50")}>
                              Aula {currentCourse + 1} de {COURSES.length}
                            </p>
                            <p className={cx("font-semibold truncate", isDark ? "text-white" : "text-black")}>
                              {COURSES[currentCourse]?.title}
                            </p>
                          </div>

                          {COURSES[currentCourse]?.vimeoId && (
                            <button
                              onClick={() => completeCourse(COURSES[currentCourse].id)}
                              disabled={isWatched(COURSES[currentCourse].id)}
                              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#5CAE70] text-black disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition"
                            >
                              {isWatched(COURSES[currentCourse].id)
                                ? "Concluída ✓"
                                : "Marcar como concluída"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        )}

        {/* RELATÓRIOS */}
        {report && active !== "home" && active !== "cursos" && active !== "servicos" && (
          <iframe
            key={active}
            src={formatUrl(report.src)}
            className="absolute inset-0 w-full h-full border-none"
            allowFullScreen
          />
        )}
      </div>

      {/* ===== MODAL SUPORTE ===== */}
      {showSupport && (
        <Modal theme={theme} onClose={() => setShowSupport(false)}>
          <h3 className={cx("text-lg font-semibold mb-2", isDark ? "text-white" : "text-black")}>
            Suporte Técnico
          </h3>
          <p className={cx("text-sm mb-4", isDark ? "text-white/70" : "text-black/65")}>
            Entre em contato com o desenvolvedor
          </p>

          <div className="space-y-3 text-sm">
            <a
              href="https://www.linkedin.com/in/diegodamaro/"
              target="_blank"
              rel="noreferrer"
              className={cx(
                "flex items-center gap-3 px-4 py-2 rounded-lg border transition",
                isDark
                  ? "bg-white/5 hover:bg-white/10 text-white border-white/10"
                  : "bg-black/[0.03] hover:bg-black/[0.06] text-black border-black/10"
              )}
            >
              <Linkedin size={18} /> LinkedIn
            </a>

            <a
              href="mailto:diego.sanchez@ayaenergia.com.br"
              className={cx(
                "flex items-center gap-3 px-4 py-2 rounded-lg border transition",
                isDark
                  ? "bg-white/5 hover:bg-white/10 text-white border-white/10"
                  : "bg-black/[0.03] hover:bg-black/[0.06] text-black border-black/10"
              )}
            >
              <Mail size={18} /> Email
            </a>

            <a
              href="https://wa.me/5511961995900"
              target="_blank"
              rel="noreferrer"
              className={cx(
                "flex items-center gap-3 px-4 py-2 rounded-lg border transition",
                isDark
                  ? "bg-white/5 hover:bg-white/10 text-white border-white/10"
                  : "bg-black/[0.03] hover:bg-black/[0.06] text-black border-black/10"
              )}
            >
              <Phone size={18} /> WhatsApp
            </a>
          </div>
        </Modal>
      )}

      {/* ===== MODAL RESET SENHA ===== */}
      {showReset && (
        <Modal theme={theme} onClose={() => setShowReset(false)}>
          <h3 className={cx("text-lg font-semibold mb-4", isDark ? "text-white" : "text-black")}>
            Redefinir Senha
          </h3>

          <div className="relative mb-3">
            <input
              type={showOldPass ? "text" : "password"}
              placeholder="Senha atual"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              className={cx(
                "w-full p-3 pr-10 rounded border focus:outline-none focus:ring-1",
                isDark
                  ? "bg-black/30 text-white border-white/20 focus:border-[#2E7B57] focus:ring-[#2E7B57]"
                  : "bg-white text-black border-black/20 focus:border-[#2E7B57] focus:ring-[#2E7B57]"
              )}
            />
            <button
              type="button"
              onClick={() => setShowOldPass((v) => !v)}
              className={cx(
                "absolute right-3 top-1/2 -translate-y-1/2",
                isDark ? "text-white/60 hover:text-white" : "text-black/50 hover:text-black"
              )}
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
              className={cx(
                "w-full p-3 pr-10 rounded border focus:outline-none focus:ring-1",
                isDark
                  ? "bg-black/30 text-white border-white/20 focus:border-[#2E7B57] focus:ring-[#2E7B57]"
                  : "bg-white text-black border-black/20 focus:border-[#2E7B57] focus:ring-[#2E7B57]"
              )}
            />
            <button
              type="button"
              onClick={() => setShowNewPass((v) => !v)}
              className={cx(
                "absolute right-3 top-1/2 -translate-y-1/2",
                isDark ? "text-white/60 hover:text-white" : "text-black/50 hover:text-black"
              )}
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
  theme,
}: {
  children: React.ReactNode;
  onClose: () => void;
  theme: Theme;
}) {
  const isDark = theme === "dark";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={cx(
          "border rounded-2xl w-full max-w-md p-6 shadow-2xl relative",
          isDark
            ? "bg-[#0f1512] border-white/10"
            : "bg-white border-black/10"
        )}
      >
        <button
          onClick={onClose}
          className={cx(
            "absolute top-4 right-4",
            isDark ? "text-white/60 hover:text-white" : "text-black/50 hover:text-black"
          )}
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   ABA SERVIÇOS (LAYOUT ENTERPRISE)
========================================================= */
function ServicesContent({ theme }: { theme: Theme }) {
  const isDark = theme === "dark";

  const pageBg = isDark ? "bg-[#0b0f0d] text-white" : "bg-white text-black";

  const sectionBorder = isDark ? "border-white/10" : "border-black/5";
  const sectionAlt = isDark ? "bg-[#0f1512]" : "bg-neutral-50";

  const heading = isDark ? "text-white" : "text-green-950";
  const body = isDark ? "text-white/70" : "text-black/70";
  const bodyStrong = isDark ? "text-white/85" : "text-black/85";

  return (
    <div className={cx("w-full", pageBg)}>
      {/* HERO */}
      <section className={cx("border-b", sectionBorder)}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 pt-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* TEXTO */}
            <div className="lg:col-span-7">
              <div
                className={cx(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                  isDark
                    ? "border-white/10 bg-white/5 text-white"
                    : "border-green-900/15 bg-green-900/[0.04] text-green-950"
                )}
              >
                <span className={cx("w-2 h-2 rounded-full", isDark ? "bg-[#5CAE70]" : "bg-green-700")} />
                AYA ENERGIA • Centro de Operação Integrado (COI)
              </div>

              <h1
                className={cx(
                  "mt-4 text-4xl md:text-5xl font-extrabold tracking-tight leading-tight",
                  heading
                )}
              >
                Operação, manutenção e performance
              </h1>

              <p className={cx("mt-4 text-[15px] md:text-[16px] leading-relaxed", body)}>
                O <b className={bodyStrong}>Centro de Operação Integrado (COI)</b> em São Paulo – SP concentra
                especialistas e processos para monitorar e acompanhar a geração das usinas solares em tempo real.
              </p>

              <p className={cx("mt-3 text-[15px] md:text-[16px] leading-relaxed", body)}>
                Contamos com bases regionais e <b className={bodyStrong}>equipes de campo</b> para execução e coordenação
                da operação, estoque de materiais e atendimento conforme{" "}
                <b className={bodyStrong}>SLA (Service Level Agreement)</b>.
              </p>

              <p className={cx("mt-3 text-[15px] md:text-[16px] leading-relaxed", body)}>
                Nossa equipe é composta por especialistas em usinas solares e engenheiros com conhecimentos avançados,
                atuando no back office e em campo.
              </p>

              {/* Pills */}
              <div className="mt-5 flex flex-wrap gap-2">
                <Pill theme={theme} label="Monitoramento contínuo" />
                <Pill theme={theme} label="Resposta rápida (SLA)" />
                <Pill theme={theme} label="Bases regionais" />
                <Pill theme={theme} label="Rastreabilidade e relatórios" />
              </div>
            </div>

            {/* IMAGEM */}
            <div className="lg:col-span-5 flex justify-center lg:justify-center">
              <div className="w-full max-w-[310px]">
                <div
                  className={cx(
                    "rounded-2xl border shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] overflow-hidden",
                    isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"
                  )}
                >
                  <div className="relative aspect-[10/16]">
                    <Image
                      src="/chefes.png"
                      alt="Centro de Operação Aya Energia"
                      fill
                      className="object-cover"
                      priority={false}
                    />
                  </div>
                </div>
                <div className={cx("mt-2 text-xs text-center", isDark ? "text-white/55" : "text-black/50")}>
                  COI • Monitoramento e coordenação operacional
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PORTFÓLIO */}
      <section className={cx(sectionAlt, "border-b", sectionBorder)}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 pt-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-12">
              <h1 className={cx("text-4xl md:text-4xl font-extrabold tracking-tight", heading)}>
                Nosso Portfólio
              </h1>

              <p className={cx("mt-4 text-[15px] md:text-[16px] leading-relaxed", body)}>
                Nossos times regionais permitem uma resposta rápida a qualquer demanda e urgências, diminuindo o tempo
                de inatividade e maximizando a eficiência da geração de energia. Frota e equipe dedicada e equipamentos
                de última geração, garantimos que todas as intervenções sejam realizadas de forma eficiente e segura.
              </p>

              <p className={cx("mt-3 text-[15px] md:text-[16px] leading-relaxed", body)}>
                Ampla atuação de O&M nos estados de São Paulo, Goiás e Rio de Janeiro, Pernambuco e Bahia.
              </p>
            </div>

            <div className="lg:col-span-12 flex justify-center lg:justify-center">
              <div className="w-full max-w-6xl h-[450px]">
                <BrazilTopoMap
                  activeUFs={["SP", "MT", "GO", "PE", "RJ", "BA"]}
                  height={560}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OPERAÇÃO & MANUTENÇÃO */}
      <section className={cx("border-b", sectionBorder)}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 pt-6 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-12">
              <h2 className={cx("text-4xl md:text-4xl font-extrabold tracking-tight", heading)}>
                Operação &amp; Manutenção
              </h2>

              <p className={cx("mt-3 text-[15px] md:text-[16px] leading-relaxed", body)}>
                Serviços integrados para maximizar disponibilidade, eficiência e segurança operacional — com processos e
                indicadores para gestão executiva.
              </p>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <Bullet
                theme={theme}
                title="Monitoramento"
                text="Acompanhamento em tempo real para identificar anomalias e quedas de produção com ação imediata."
              />
              <Bullet
                theme={theme}
                title="Manutenção completa"
                text="Corretiva, preditiva e preventiva, incluindo inspeções térmicas, limpeza de módulos e controle de vegetação."
              />
              <Bullet
                theme={theme}
                title="Segurança avançada"
                text="CFTV com IA, câmeras de alta resolução e análise de vídeo para resposta rápida e prevenção de incidentes."
              />
              <Bullet
                theme={theme}
                title="Gestão operacional"
                text="Acesso do cliente ao progresso das solicitações e relatórios detalhados de desempenho e intervenções."
              />
              <Bullet
                theme={theme}
                title="Atendimento ágil"
                text="Equipes em campo para demandas críticas, reduzindo tempo de inatividade."
              />
            </div>

            <div className="lg:col-span-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EnterpriseCard
                  theme={theme}
                  icon={Activity}
                  title="Operação"
                  desc="Rotinas, supervisão e coordenação para continuidade operacional."
                />
                <EnterpriseCard
                  theme={theme}
                  icon={Wrench}
                  title="Manutenção técnica"
                  desc="Execução padronizada com foco em disponibilidade e confiabilidade."
                />
                <EnterpriseCard
                  theme={theme}
                  icon={Eye}
                  title="Monitoramento"
                  desc="Supervisório com inteligência para detectar falhas em tempo real."
                />
                <EnterpriseCard
                  theme={theme}
                  icon={Droplets}
                  title="Limpeza e roçagem"
                  desc="Controle de vegetação e limpeza para preservar eficiência e vida útil."
                />
              </div>

              <div
                className={cx(
                  "mt-4 rounded-2xl border p-5",
                  isDark ? "border-white/10 bg-black/30" : "border-black/10 bg-white"
                )}
              >
                <div className={cx("text-md font-semibold", heading)}>
                  Governança e transparência
                </div>
                <p className={cx("mt-2 text-sm leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
                  Relatórios, evidências e histórico de intervenções para auditoria e tomada de decisão.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OUTROS SERVIÇOS */}
      <section className={cx(sectionAlt, "border-t", sectionBorder)}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h3 className={cx("text-3xl md:text-4xl font-extrabold tracking-tight", heading)}>
                Outros Serviços
              </h3>
              <p className={cx("mt-2 text-[15px] md:text-[16px] leading-relaxed max-w-1xl", body)}>
                Serviços especializados para apoiar implantação, performance e segurança na aquisição de ativos solares.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <BigServiceCard
              theme={theme}
              icon={ClipboardCheck}
              title="Comissionamento"
              desc="Atendimento técnico especializado em comissionamento, garantindo funcionamento adequado das usinas."
              body="Com nossa expertise técnica e equipamentos próprios, atendemos comissionamento a frio e a quente. O comissionamento é crucial para garantir o funcionamento adequado do sistema como um todo."
            />

            <BigServiceCard
              theme={theme}
              icon={BriefcaseBusiness}
              title="Engenharia do proprietário"
              desc="Engenheiros especializados acompanham a construção de usinas solares em todas as etapas."
              body="Acompanhamento desde o parecer de acesso e projeto homologado, revisão e aprovação dos projetos executivos, até a fiscalização de obra."
            />

            <BigServiceCard
              theme={theme}
              icon={TrendingUp}
              title="Otimização de geração"
              desc="Análise de estudos iniciais e dados reais para corrigir falhas e elevar a performance."
              body="Diversas usinas não apresentam geração conforme simulações (ex.: PVSyst) ou premissas iniciais. Analisamos estudos, dados de geração e irradiação real para identificar causas e elevar a rentabilidade."
            />

            <BigServiceCard
              theme={theme}
              icon={FileSearch}
              title="Diligência técnica"
              desc="Avaliação técnica para dar segurança ao investidor e confiabilidade ao ativo."
              body="Com o mercado de aquisição em alta, avaliamos a documentação do projeto e o ativo via visitas técnicas, garantindo que a planta seja confiável e gere o que o modelo financeiro prevê."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   UI COMPONENTS (SERVIÇOS)
========================================================= */
function Pill({
  label,
  icon: Icon,
  theme,
}: {
  label: string;
  icon?: any;
  theme: Theme;
}) {
  const isDark = theme === "dark";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs md:text-sm",
        isDark
          ? "border-white/10 bg-white/5 text-white/70"
          : "border-black/10 bg-white text-black/70"
      )}
    >
      {Icon ? (
        <Icon size={14} className={isDark ? "text-[#9be6b0]" : "text-green-800"} />
      ) : null}
      {label}
    </span>
  );
}

function Bullet({
  title,
  text,
  theme,
}: {
  title: string;
  text: string;
  theme: Theme;
}) {
  const isDark = theme === "dark";
  return (
    <div className="flex gap-3">
      <span
        className={cx(
          "mt-1.5 w-2.5 h-2.5 rounded-full shrink-0",
          isDark ? "bg-[#5CAE70]" : "bg-green-700"
        )}
      />
      <div>
        <div className={cx("text-md font-semibold", isDark ? "text-white/90" : "text-black/85")}>
          {title}
        </div>
        <div className={cx("text-sm leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
          {text}
        </div>
      </div>
    </div>
  );
}

function EnterpriseCard({
  icon: Icon,
  title,
  desc,
  theme,
}: {
  icon: any;
  title: string;
  desc: string;
  theme: Theme;
}) {
  const isDark = theme === "dark";
  return (
    <div
      className={cx(
        "rounded-2xl border p-5 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)]",
        isDark ? "border-white/10 bg-black/30" : "border-black/10 bg-white"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cx(
            "w-10 h-10 rounded-xl border flex items-center justify-center",
            isDark ? "bg-white/5 border-white/10" : "bg-green-900/[0.06] border-green-900/10"
          )}
        >
          <Icon size={20} className={isDark ? "text-[#9be6b0]" : "text-green-800"} />
        </div>
        <div>
          <div className={cx("text-base font-bold", isDark ? "text-white" : "text-green-950")}>
            {title}
          </div>
          <p className={cx("mt-1 text-sm leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}

function BigServiceCard({
  icon: Icon,
  title,
  desc,
  body,
  theme,
}: {
  icon: any;
  title: string;
  desc: string;
  body: string;
  theme: Theme;
}) {
  const isDark = theme === "dark";
  return (
    <div
      className={cx(
        "rounded-2xl border p-6 shadow-[0_10px_34px_-20px_rgba(0,0,0,0.25)]",
        isDark ? "border-white/10 bg-black/30" : "border-black/10 bg-white"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cx(
            "w-11 h-11 rounded-xl border flex items-center justify-center",
            isDark ? "bg-white/5 border-white/10" : "bg-green-900/[0.06] border-green-900/10"
          )}
        >
          <Icon size={22} className={isDark ? "text-[#9be6b0]" : "text-green-800"} />
        </div>

        <div className="min-w-0">
          <div className={cx("text-lg font-extrabold", isDark ? "text-white" : "text-green-950")}>
            {title}
          </div>
          <p className={cx("mt-1 text-sm leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
            {desc}
          </p>
        </div>
      </div>

      <div className={cx("mt-4 text-sm leading-relaxed", isDark ? "text-white/70" : "text-black/70")}>
        {body}
      </div>
    </div>
  );
}
