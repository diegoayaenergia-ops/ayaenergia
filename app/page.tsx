"use client";

import { useEffect, useState } from "react";
import {
  X,
  Eye,
  EyeOff,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import Image from "next/image";

/* =========================
   TYPES
========================= */

type ReportItem = {
  id: string;
  title: string;
  src: string;
  image?: string;
  icon?: LucideIcon;
};

/* =========================
   RELATÓRIOS
========================= */

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
    src: "https://app.powerbi.com/view?r=eyJrIjoiYzQzYjZjM2YtMzc0OS00MDMwLWI1N2EtODFjZGZmYjczMTlkIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },
  {
    id: "acionamentos",
    title: "Acionamentos",
    src: "https://app.powerbi.com/view?r=eyJrIjoiM2ZkZGQzZjgtNmQ1Yi00YjdhLWFmOGEtYTQ3MTBiMTk2YmU3IiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },
  {
    id: "compras",
    title: "Compras",
    src: "https://app.powerbi.com/view?r=eyJrIjoiMGQ1YmMyMjctMWYzMy00NTg4LWJkNWYtNGI4OWE0MWViZmUyIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },
];

const ALL_REPORTS: ReportItem[] = [...PORTFOLIO_REPORTS, ...INTERNAL_REPORTS];

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
  const [nextReport, setNextReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  const [showSupport, setShowSupport] = useState(false);

  /* ==== RESET PASSWORD ==== */
  const [showReset, setShowReset] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  /* ===== SESSÃO ===== */
  useEffect(() => {
    const saved = localStorage.getItem("bi_user");
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      setActive("home");
    }
  }, []);

  /* ===== TROCA RELATÓRIO ===== */
  useEffect(() => {
    if (!nextReport) return;
    const t = setTimeout(() => {
      setActive(nextReport);
      setNextReport(null);
    }, 150);
    return () => clearTimeout(t);
  }, [nextReport]);

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

        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/video.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 w-[520px] h-[300px] bg-gradient-to-br from-[#0b3a2a] via-[#0b1f15] to-[#145a36]
          rounded-xl shadow-2xl border border-white/10 grid grid-cols-2 overflow-hidden">

          <div className="p-6 flex flex-col justify-center items-center text-white bg-black/20">
            <Image src="/logo-aya.png" alt="AYA" width={110} height={110} />
            <p className="mt-4 text-sm">Portal de Business Intelligence</p>
          </div>

          <form
            className="p-6 flex flex-col justify-center gap-3"
            onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
          >
            <h2 className="text-center text-white text-sm font-semibold">Login</h2>

            <input
              placeholder="Login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="px-3 py-2 rounded bg-black/40 text-white text-sm border border-white/20"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded bg-black/40 text-white text-sm border border-white/20"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && <div className="text-xs text-red-400">{error}</div>}

            <button disabled={loginLoading}
              className="mt-1 py-2 rounded bg-[#2E7B57] text-white text-sm font-semibold">
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
    <div className="flex flex-col h-screen w-full bg-black">

      {/* ===== TOP BAR ===== */}
      <header className="h-14 w-full flex items-center justify-between px-6
        bg-gradient-to-r from-black via-[#0b1f15] to-[#145a36]
        border-b border-white/10">

        <div className="flex items-center gap-6">
          <Image src="/logo-aya.png" alt="Logo" width={36} height={36} />
          <span className="text-white text-sm font-semibold">{user.empresa}</span>

          <div className="flex gap-4 ml-6">
            {allowedReports.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  if (r.id === active) return;
                  setFadeIn(false);
                  setLoading(true);
                  setNextReport(r.id);
                }}
                className={`text-sm transition
                  ${active === r.id
                    ? "text-white font-semibold"
                    : "text-white/60 hover:text-white"
                  }`}
              >
                {r.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-white/70">
          <button onClick={() => setShowReset(true)} className="hover:text-white">Redefinir Senha</button>
          <button onClick={() => setShowSupport(true)} className="hover:text-white">Suporte</button>
          <button onClick={handleLogout} className="hover:text-white">Sair</button>
        </div>
      </header>

      {/* ===== CONTEÚDO ===== */}
      <main className="flex-1 relative">

        {loading && active !== "home" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70">
            <div className="w-12 h-12 border-4 border-white/20 border-t-[#2E7B57] rounded-full animate-spin mb-4" />
            <p className="text-white/80 text-sm">Carregando...</p>
          </div>
        )}

        {active === "home" && (
          <div className="absolute inset-0">
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
              <source src="/video.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}

        {report && active !== "home" && (
          <iframe
            key={active}
            src={formatUrl(report.src)}
            className={`absolute inset-0 w-full h-full border-none transition-opacity duration-500
              ${fadeIn ? "opacity-100" : "opacity-0"}`}
            allowFullScreen
            onLoad={() => {
              setLoading(false);
              setFadeIn(true);
            }}
          />
        )}
      </main>

      {/* ===== MODAIS ===== */}
      {showSupport && (
        <Modal onClose={() => setShowSupport(false)}>
          <h3 className="text-white text-lg font-semibold mb-3">Suporte Técnico</h3>
          <p className="text-white/70 text-sm mb-4">diego.sanchez@ayaenergia.com.br</p>
          <p className="text-white/70 text-sm">WhatsApp: (11) 96199-5900</p>
        </Modal>
      )}

      {showReset && (
        <Modal onClose={() => setShowReset(false)}>
          <h3 className="text-white text-lg font-semibold mb-4">Redefinir Senha</h3>

          <input
            type={showOldPass ? "text" : "password"}
            placeholder="Senha atual"
            value={oldPass}
            onChange={(e) => setOldPass(e.target.value)}
            className="w-full mb-3 p-3 rounded bg-[#145a36] text-white border border-white/20"
          />

          <input
            type={showNewPass ? "text" : "password"}
            placeholder="Nova senha"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            className="w-full mb-3 p-3 rounded bg-[#145a36] text-white border border-white/20"
          />

          {resetMsg && <div className="text-sm mb-3 text-white">{resetMsg}</div>}

          <button
            onClick={handleChangePassword}
            disabled={resetLoading}
            className="w-full bg-[#2E7B57] py-2 rounded text-white"
          >
            {resetLoading ? "Alterando..." : "Alterar Senha"}
          </button>
        </Modal>
      )}
    </div>
  );
}

/* =========================
   MODAL
========================= */

function Modal({ children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#145a36] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white">
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

/* =========================
   POWER BI PARAMS
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
