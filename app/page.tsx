"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

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
  videoUrl: string;
  formUrl: string;
};


import Image from "next/image";

/* =========================
   RELATÓRIOS
========================= */
const COURSES: CourseItem[] = [
  {
    id: "modulo:inversor-1",
    title: "Módulo Inversores",
    description: "Introdução e ",
    videoUrl:
      "https://ayaenergiabr.sharepoint.com/sites/AyaEnergia/_layouts/15/embed.aspx?UniqueId=0a72e85f-f5c2-4a61-b5d2-595c53d52b5f&embed=%7B%22ust%22%3Atrue%2C%22hv%22%3A%22CopyEmbedCode%22%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create",
    formUrl:
      "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
  {
    id: "modulo:inversor-2",
    title: "Como usar os Relatórios",
    description: "Filtros, páginas e análises",
    videoUrl:
    "https://www.youtube.com/embed/Vqd_FfZz4ZI?si=5QyJ9uOxgupusW4F",
    formUrl:
      "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
  {
    id: "modulo:inversor-3",
    title: "Como usar os Relatórios",
    description: "Filtros, páginas e análises",
    videoUrl:
      "https://www.youtube.com/embed/6OZ23Ljnm4c?si=VdQi-hJc5BN6Ds4Y",
    formUrl:
      "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
  {
    id: "modulo:inversor-4",
    title: "Como usar os Relatórios",
    description: "Filtros, páginas e análises",
    videoUrl:
    "https://www.youtube.com/embed/LwC4oOSH7ko?si=U7vhZdXNKiSKr5RW",
     formUrl:
      "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
  {
    id: "modulo:inversor-5",
    title: "Como usar os Relatórios",
    description: "Filtros, páginas e análises",
    videoUrl:
      "https://www.youtube.com/embed/LwC4oOSH7ko?si=U7vhZdXNKiSKr5RW",
    formUrl:
      "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
  {
    id: "modulo:inversor-6",
    title: "Como usar os Relatórios",
    description: "Filtros, páginas e análises",
    videoUrl:
     "https://www.youtube.com/embed/LwC4oOSH7ko?si=U7vhZdXNKiSKr5RW",
    formUrl:
      "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
  {
    id: "modulo:inversor-7",
    title: "Como usar os Relatórios",
    description: "Filtros, páginas e análises",
    videoUrl:
     "https://www.youtube.com/embed/lu7qWZYP2To?si=hIsQaT5NGdFFywMs",
      formUrl:
      "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
    {
    id: "modulo:inversor-8",
    title: "Como usar os Relatórios",
    description: "Filtros, páginas e análises",
    videoUrl:
     "https://www.youtube.com/embed/W9AO7g2Cgdc?si=tpKfmY-hL4SB9bJH",
    formUrl:
      "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
    {
    id: "modulo:inversor-9",
    title: "Como usar os Relatórios",
    description: "Filtros, páginas e análises",
    videoUrl:
    "https://www.youtube.com/embed/Xo4LrG-irLI?si=4zvMX60u0saSwFrA",
    formUrl:
      "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
    {
    id: "modulo:inversor-10",
    title: "Como usar os Relatórios",
    description: "Filtros, páginas e análises",
    videoUrl:
    "https://www.youtube.com/embed/alzphVrX3dU?si=3aYJfiQMBNtosWr3",
    formUrl:
      "https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX",
  },
];
const COURSES_MENU: ReportItem = {
  id: "cursos",
  title: "Cursos",
  icon: ClipboardList,
  src: "", // não usa iframe Power BI
};


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
  ...PORTFOLIO_REPORTS,
  ...INTERNAL_REPORTS,
  COURSES_MENU,
];


/* =========================
   PAGE
========================= */

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [active, setActive] = useState<string>("home");
  const [showSupport, setShowSupport] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /* ==== RESET PASSWORD ==== */
  const [showReset, setShowReset] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [focus, setFocus] = useState(false);


  /* ===== CARREGA SESSÃO ===== */
  useEffect(() => {
    const saved = localStorage.getItem("bi_user");
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      setActive("home");
    }
  }, []);


  useEffect(() => {
    const last = localStorage.getItem("last_report");
    if (last) setActive(last);
  }, []);

  useEffect(() => {
    if (active !== "home") {
      localStorage.setItem("last_report", active);
    }
  }, [active]);


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

      // 👉 dispara form fake para o Chrome salvar
      const f = document.getElementById("chrome-save-form") as HTMLFormElement;
      if (f) {
        (f.elements.namedItem("username") as HTMLInputElement).value = login;
        (f.elements.namedItem("password") as HTMLInputElement).value = senha;
        f.submit();
      }

      localStorage.setItem("bi_user", JSON.stringify(data));
      setUser(data);
      setActive("home");

    } catch {
      setError("Erro de conexão com o servidor");
    } finally {
      setLoginLoading(false);
    }
  };

  /* ===== LOGOUT ===== */
  const handleLogout = () => {
    localStorage.removeItem("bi_user");
    setUser(null);
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

  /* ================= LOGIN PAGE ================= */

  if (!user) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">

        {/* VÍDEO DE FUNDO */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-black/50" />

        {/* CARD LOGIN */}
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
          {/* DIVISÓRIA CENTRAL */}
          <div className="absolute left-1/2 top-6 bottom-6 w-px bg-white/40" />


          {/* LADO ESQUERDO */}
          <div className="p-6 flex flex-col justify-center items-center text-center text-white ">
            <Image src="/logo-aya.png" alt="AYA" width={110} height={110} />

            <p className="mt-4 text-sm text-white/90 font-medium">
              Portal de Business Intelligence
            </p>

            <span className="mt-2 text-xs text-white/50">
              BI Portal • AYA Energia
            </span>
          </div>

          {/* LADO DIREITO */}
          <form
            method="post"
            action="/login"
            className="p-6 flex flex-col justify-center gap-3"
            onSubmit={(e) => {
              e.preventDefault(); // continua SPA
              handleLogin();
            }}
          >
            <h2 className="text-center text-white font-semibold text-sm mb-1">
              Login
            </h2>

            {/* LOGIN */}
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="
      w-full px-3 py-2 rounded
      bg-#2E7B41 text-white text-sm
      border border-white/40
      focus:outline-none focus:border-[#2E7B57]
    "
            />

            {/* SENHA */}
            <div className="relative">
              <input
                id="current-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="
    w-full px-3 py-2 pr-10 rounded
    bg-#2E7B41 text-white text-sm
    border border-white/40
    focus:outline-none focus:border-[#2E7B57]
  "
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* ERRO */}
            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                {error}
              </div>
            )}

            {/* BOTÃO */}
            <button
              type="submit"
              disabled={loginLoading}
              className="
      mt-1 w-full py-2 rounded
      bg-[#2E7B45] hover:bg-[#5CAE70]
      text-white text-sm font-semibold
      transition disabled:opacity-50
    "
            >
              {loginLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }




  /* ================= PORTAL ================= */

  const allowedReports = ALL_REPORTS.filter((r) =>
    user.access.includes(r.id)
  );

  const report = allowedReports.find((r) => r.id === active);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-black">

      {!focus && (

        <header className="h-16 w-full flex items-center justify-between px-4 
bg-gradient-to-r from-[#1f7a55]/90 via-[#2E7B57]/80 to-[#145a36]/90 backdrop-blur
border-b border-white/10 shadow-xl">


          {/* LOGO */}
          <button
            onClick={() => setActive("home")}
            className="flex items-center gap-3"
          >
            <Image src="/logo-aya.png" alt="Logo" width={42} height={42} />
            <div className="leading-tight text-left">
              <p className="text-white font-semibold text-sm">
                {user.empresa}
              </p>
              <p className="text-white/40 text-xs">BI Portal</p>
            </div>
          </button>

          {/* MENU */}
          <nav className="flex items-center gap-2 overflow-x-auto">
            {allowedReports.map((r) => {
              const isActive = active === r.id;
              const Icon = r.icon;

              return (
                <button
                  key={r.id}
                  onClick={() => {
                    if (r.id === active) return;
                    setActive(r.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition
            ${isActive
                      ? "bg-white/15 text-white border-b-2 border-[#5CAE70]"
                      : "text-white/70 hover:bg-white/10"}

                  }`}
                >
                  {/* {r.image ? (
                  <Image src={r.image} alt="" width={20} height={20} />
                ) : (
                  Icon && <Icon size={18} />
                )} */}

                  <span>{r.title}</span>
                </button>
              );
            })}
          </nav>

          {/* AÇÕES */}
          <div className="flex items-center gap-2">

            {/* Redefinir Senha */}
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

            {/* Suporte */}
            <button
              onClick={() => setShowSupport(true)}
              className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white"
              title="Suporte"
            >
              <HelpCircle size={18} />
            </button>

            {/* Logout */}
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


      {/* CONTEÚDO */}
      <div className="flex-1 relative bg-black">
        {active === "home" && (
          <div className="absolute inset-0">

            {/* VÍDEO */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/video.mp4" type="video/mp4" />
            </video>

            {/* OVERLAY */}
            <div className="absolute inset-0 bg-black/50" />

            {/* CONTEÚDO SOBRE O VÍDEO */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">

              <h1 className="text-white text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
                Portal de Business Intelligence
              </h1>

              <p className="mt-4 text-white/80 text-lg max-w-2xl">
                Monitoramento, indicadores e performance das usinas.
              </p>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => {
                    if (allowedReports[0]) {
                      setActive(allowedReports[0].id);
                    }
                  }}
                  className="
            px-6 py-3 rounded-lg
            bg-[#2E7B57] hover:bg-[#256947]
            text-white font-semibold
            transition
            shadow-lg
          "
                >
                  Acessar Relatórios
                </button>
              </div>
            </div>

          </div>
        )}
        {active === "cursos" && (
          <div className="absolute inset-0 overflow-y-auto bg-white p-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {COURSES.map((course) => (
                <div
                  key={course.id}
                  className="bg-[#145a36] rounded-xl border border-white/10 shadow-lg overflow-hidden"
                >
                  <div className="p-4">
                    <h2 className="text-white font-semibold text-lg">
                      {course.title}

                    </h2>
                    {course.description && (
                      <p className="text-white/70 text-sm mt-1">
                        {course.description}
                      </p>
                    )}
                  </div>

                  <div className="relative aspect-video">
                    <iframe
                      src={course.videoUrl}
                      className="w-full h-full"
                      allow="fullscreen"
                      allowFullScreen
                    />

                    <button
                      onClick={() => {
                        const iframe = document.querySelector("iframe");
                        iframe?.requestFullscreen();
                      }}
                      className="
    absolute top-1 right-1
     text-white
    px-5 py-3
    rounded-xl
    text-xl
    hover:bg-black/90
    transition
  "
                    >
                      ⛶
                    </button>
                  </div>

                  <div className="p-4 border-t border-white/10">
                    <a
                      href={course.formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
        w-full inline-flex items-center justify-center gap-2
        px-4 py-2 rounded-lg
        bg-[#2E7B57] hover:bg-[#256947]
        text-white font-semibold text-sm
        transition shadow
      "
                    >
                      Realizar Teste Final
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {report && active !== "home" && active !== "cursos" && (
          <iframe
            key={active}
            src={formatUrl(report.src)}
            className="absolute inset-0 w-full h-full border-none"
            allowFullScreen
          />

        )}

      </div>

      {/* MODAL SUPORTE */}
      {showSupport && (
        <Modal onClose={() => setShowSupport(false)}>
          <h3 className="text-white text-lg font-semibold mb-2">
            Suporte Técnico
          </h3>
          <p className="text-white/70 text-sm mb-4">
            Entre em contato com o desenvolvedor
          </p>

          <div className="space-y-3 text-sm">
            <a
              href="https://www.linkedin.com/in/diegodamaro/"
              target="_blank"
              className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
            >
              <Linkedin size={18} /> LinkedIn
            </a>

            <a
              href="mailto:diego.sanchez@ayaenergia.com.br"
              className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
            >
              <Mail size={18} /> Email
            </a>

            <a
              href="https://wa.me/5511961995900"
              target="_blank"
              className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
            >
              <Phone size={18} /> WhatsApp
            </a>
          </div>
        </Modal>
      )}

      {/* MODAL RESET SENHA */}
      {showReset && (
        <Modal onClose={() => setShowReset(false)}>
          <h3 className="text-white text-lg font-semibold mb-4">
            Redefinir Senha
          </h3>

          <div className="relative mb-3">
            <input
              type={showOldPass ? "text" : "password"}
              placeholder="Senha atual"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              className="w-full p-3 pr-10 rounded bg-[#145a36] text-white border border-white/20
                         focus:outline-none focus:border-[#2E7B57] focus:ring-1 focus:ring-[#2E7B57]"
            />
            <button
              type="button"
              onClick={() => setShowOldPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
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
              className="w-full p-3 pr-10 rounded bg-[#145a36] text-white border border-white/20
                         focus:outline-none focus:border-[#2E7B57] focus:ring-1 focus:ring-[#2E7B57]"
            />
            <button
              type="button"
              onClick={() => setShowNewPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {resetMsg && (
            <div
              className={`text-sm mb-3 px-3 py-2 rounded border ${resetMsg.includes("sucesso")
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
            >
              {resetMsg}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={resetLoading || !oldPass || !newPass}
            className="w-full bg-[#2E7B57] py-2 rounded text-white hover:bg-[#2E7B57]
                       disabled: disabled:cursor-not-allowed transition"
          >
            {resetLoading ? "Alterando..." : "Alterar Senha"}
          </button>
        </Modal>
      )}
    </div>
  );
}

/* =========================
   MODAL BASE
========================= */

function Modal({ children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#145a36] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}


/* =========================
   POWER BI URL
========================= */

function formatUrl(url: string) {
  if (!url) return url;

  const params = [
    "navContentPaneEnabled=false",
    "filterPaneEnabled=false",
    "pageView=fitToWidth",
  ].join("&");

  return url.includes("?") ? `${url}&${params}` : `${url}?${params}`;
}
