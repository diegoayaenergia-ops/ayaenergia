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
import Image from "next/image";

/* =========================
   RELATÓRIOS
========================= */

const  PORTFOLIO_REPORTS: ReportItem[] = [
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

const ALL_REPORTS: ReportItem[] = [...PORTFOLIO_REPORTS, ...INTERNAL_REPORTS];

/* =========================
   PAGE
========================= */

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [empresa, setEmpresa] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [companies, setCompanies] = useState<string[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  const [active, setActive] = useState<string>("home");
  const [nextReport, setNextReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
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

  /* ===== CARREGA SESSÃO ===== */
  useEffect(() => {
    const saved = localStorage.getItem("bi_user");
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      setActive("home");
    }
  }, []);

  /* ===== BUSCA EMPRESAS ===== */
  useEffect(() => {
  if (!nextReport) return;

  const t = setTimeout(() => {
    setActive(nextReport);
    setNextReport(null);
  }, 150); // pequeno delay para suavizar

  return () => clearTimeout(t);
}, [nextReport]);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/clients");
        const data = await res.json();
        setCompanies(data.map((c: any) => c.client_name));
      } catch (err) {
        console.error("Erro ao buscar empresas");
      } finally {
        setCompaniesLoading(false);
      }
    }
    loadCompanies();
  }, []);

  /* ===== LOGIN ===== */
  const handleLogin = async () => {
    if (!empresa || !senha) {
      setError("Selecione a empresa e informe a senha");
      return;
    }

    setError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa: empresa.trim(),
          password: senha.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao fazer login");
        return;
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
    setEmpresa("");
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
          empresa: String(user.empresa).trim(),
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
          w-[520px] h-[300px]
          bg-gradient-to-br from-[#0b3a2a] via-[#0b1f15] to-[#145a36]
          rounded-xl
          shadow-2xl
          border border-white/10
          grid grid-cols-2
          overflow-hidden
          backdrop-blur-sm
        "
        >

          {/* LADO ESQUERDO */}
          <div className="p-6 flex flex-col justify-center items-center text-center text-white bg-black/20">
            <Image src="/logo-aya.png" alt="AYA" width={110} height={110} />

            <p className="mt-4 text-sm text-white/90 font-medium">
              Portal de Business Intelligence
            </p>

            <span className="mt-2 text-xs text-white/50">
              BI Portal • AYA Energia
            </span>
          </div>

          {/* LADO DIREITO */}
          <div className="p-6 flex flex-col justify-center gap-3">

            <h2 className="text-center text-white font-semibold text-sm mb-1">
              Login
            </h2>

            {/* EMPRESA */}
            <select
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              className="
              w-full px-3 py-2 rounded
              bg-black/40 text-white text-sm
              border border-white/20
              focus:outline-none focus:border-[#2E7B57]
            "
            >
              <option value="">
                {companiesLoading ? "Carregando empresas..." : "Selecione a empresa"}
              </option>
              {companies.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            {/* SENHA */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="
                w-full px-3 py-2 pr-10 rounded
                bg-black/40 text-white text-sm
                border border-white/20
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
              onClick={handleLogin}
              disabled={loginLoading}
              className="
              mt-1 w-full py-2 rounded
              bg-[#2E7B57] hover:bg-[#2E7B45]
              text-white text-sm font-semibold
              transition disabled:opacity-50
            "
            >
              {loginLoading ? "Entrando..." : "Entrar"}
            </button>

          </div>
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
    <div className="flex h-full w-full overflow-hidden bg-black">
      {/* SIDEBAR */}
      <aside
        className={`relative h-full flex flex-col bg-gradient-to-b from-black via-[#0b1f15] to-[#145a36]
        border-r border-white/10 shadow-2xl transition-all duration-300
        ${sidebarOpen ? "w-64" : "w-16"}`}
      >
        {/* HEADER */}
        <div className="h-16 flex items-center px-3 border-b border-white/10">
          <button
            onClick={() => setActive("home")}
            className="flex items-center gap-2 overflow-hidden w-full text-left"
          >
            <Image src="/logo-aya.png" alt="Logo" width={50} height={50} />
            {sidebarOpen && (
              <div className="leading-tight">
                <p className="text-white font-semibold text-sm truncate">
                  {user.empresa}
                </p>
                <p className="text-white/40 text-xs">BI Portal</p>
              </div>
            )}
          </button>
        </div>

        {/* MENU */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
          {allowedReports.map((r) => {
            const isActive = active === r.id;
            const Icon = r.icon;

            return (
              <button
                key={r.id}
                onClick={() => {
                  if (r.id === active) return;
                  setFadeIn(false);
                  setLoading(true);
                  setNextReport(r.id);
                }}

                className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm w-full
                  ${isActive
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 h-full w-1 bg-[#2E7B57] rounded-r" />
                )}

                {r.image ? (
                  <Image src={r.image} alt="" width={22} height={22} />
                ) : (
                  Icon && <Icon className="w-5 h-5" />
                )}

                {sidebarOpen && <span className="truncate">{r.title}</span>}
              </button>
            );
          })}
        </div>

        {/* SUPORTE */}
        <div className="border-t border-white/10 p-2 space-y-1">
          <button
            onClick={() => {
              setResetMsg("");
              setOldPass("");
              setNewPass("");
              setShowOldPass(false);
              setShowNewPass(false);
              setShowReset(true);
            }}
            className="flex items-center gap-3 text-white/60 hover:text-white w-full text-sm px-3 py-2 rounded-lg hover:bg-white/10"
          >
            <KeyRound size={18} />
            {sidebarOpen && <span>Redefinir Senha</span>}
          </button>

          <button
            onClick={() => setShowSupport(true)}
            className="flex items-center gap-3 text-white/60 hover:text-white w-full text-sm px-3 py-2 rounded-lg hover:bg-white/10"
          >
            <HelpCircle size={18} />
            {sidebarOpen && <span>Dúvidas / Suporte</span>}
          </button>
        </div>

        {/* LOGOUT */}
        <div className="border-t border-white/10 p-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-white/60 hover:text-white w-full text-sm px-3 py-2 rounded-lg hover:bg-white/10"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>

        {/* TOGGLE */}
        <button
  onClick={() => setSidebarOpen((v) => !v)}
  className="
    absolute top-0 right-0 h-full w-3
    cursor-col-resize
    hover:bg-white/20
    transition
  "
/>

      </aside>

      {/* CONTEÚDO */}
      <div className="flex-1 relative bg-black">
        {loading && active !== "home" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-white/20 border-t-[#2E7B57] rounded-full animate-spin mb-4" />
            <p className="text-white/80 text-sm">
              Carregando: {report?.title || "relatório"}...
            </p>
          </div>
        )}

        {active === "home" && (
          <div className="absolute inset-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/video.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}

        {report && active !== "home" && (
          <iframe
            key={active}
            src={formatUrl(report.src)}
            className={`absolute inset-0 w-full h-full border-none transition-opacity duration-500 ${fadeIn ? "opacity-100" : "opacity-0"
              }`}
            allowFullScreen
            onLoad={() => {
              setLoading(false);
              setFadeIn(true);
            }}
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
