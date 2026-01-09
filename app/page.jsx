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
} from "lucide-react";

import Image from "next/image";


/* =========================
   USUÁRIOS / EMPRESAS
========================= */

const USERS = {
  aya: {
    empresa: "Aya Energia",
    senha: "Aya@2024",
    access: ["ineer", "kamai", "elis", "os", "acionamentos", "compras"],
  },
  ineer: {
    empresa: "Ineer Energia",
    senha: "k7m2s9qa",
    access: ["ineer"],
  },
  elis: {
    empresa: "Élis Energia",
    senha: "p4x8c2wz",
    access: ["elis"],
  },
  kamai: {
    empresa: "Kamai Solar",
    senha: "r9d5m2e8",
    access: ["kamai"],
  },
};

/* =========================
   RELATÓRIOS
========================= */

const PORTFOLIO_REPORTS = [
  {
    id: "ineer",
    title: "Ineer Energia",
    image: "/icon-ineer.png",
    src: "https://app.powerbi.com/view?r=eyJrIjoiODJiMGQwM2MtOGJiOC00MTAyLWJkM2EtMWNkZTlkNjBiYTBlIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },
  {
    id: "kamai",
    title: "Kamai Solar",
    image: "/icon-kamai.png",
    src: "https://app.powerbi.com/view?r=eyJrIjoiNmM4ZjNkODgtNTRiOC00MmNkLTk5MDctMzA1Mzk4YTA5NmFhIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },
  {
    id: "elis",
    title: "Élis Energia",
    image: "/icon-elis.png",
    src: "https://app.powerbi.com/view?r=eyJrIjoiMTBmYTEwMmEtMmU1ZS00ZWE0LWEzM2MtYThhYzIzMmMxMDhhIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },
];

const INTERNAL_REPORTS = [
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

const ALL_REPORTS = [...PORTFOLIO_REPORTS, ...INTERNAL_REPORTS];

/* =========================
   PAGE
========================= */

export default function Home() {
  const [user, setUser] = useState(null);
  const [empresa, setEmpresa] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");

  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);



  /* ===== CARREGA SESSÃO ===== */
  useEffect(() => {
    const saved = localStorage.getItem("bi_user");
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      setActive(u.access[0]);
      setLoading(true);
      setFadeIn(false);
    }
  }, []);

  /* ===== LOGIN ===== */
  const handleLogin = () => {
    const found = Object.values(USERS).find(
      (u) => u.empresa === empresa && u.senha === senha
    );

    if (!found) {
      setError("Empresa ou senha inválidos");
      return;
    }

    localStorage.setItem("bi_user", JSON.stringify(found));
    setUser(found);
    setFadeIn(false);
    setLoading(true);
    setActive(found.access[0]);
  };

  /* ===== LOGOUT ===== */
  const handleLogout = () => {
    localStorage.removeItem("bi_user");
    setUser(null);
    setEmpresa("");
    setSenha("");
    setActive(null);
  };

  /* ================= LOGIN PAGE ================= */

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#0f2f1f] to-[#1f7a4a]">
        <div className="bg-zinc-950/80 backdrop-blur p-10 rounded-2xl w-full max-w-md space-y-6 shadow-2xl border border-white/10">
          <div className="flex justify-center">
            <Image src="/logo-aya.png" alt="AYA" width={110} height={110} />
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-white text-xl font-semibold">
              Portal de Business Intelligence
            </h2>
            <p className="text-white/50 text-sm">
              Acesso exclusivo para clientes
            </p>
          </div>

          <div className="space-y-4">
            <select
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              className="w-full p-3.5 rounded-lg bg-black text-white border border-white/20 focus:outline-none focus:border-[#2E7B41]"
            >
              <option value="">Selecione sua empresa</option>
              {Object.values(USERS).map((u) => (
                <option key={u.empresa} value={u.empresa}>
                  {u.empresa}
                </option>
              ))}
            </select>

            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-3 rounded-lg bg-black text-white border border-white/20 focus:outline-none focus:border-[#2E7B41]"
            />

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-2 rounded">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full bg-[#2E7B57] hover:bg-[#2E7B45] transition text-white py-3 rounded-lg font-medium"
            >
              Entrar no Portal
            </button>
          </div>

          <p className="text-xs text-white/40 text-center">
            © {new Date().getFullYear()} AYA Energia · BI Portal
          </p>
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
    <div className="flex h-screen w-screen overflow-hidden bg-black">
      {/* SIDEBAR */}
      <aside
        className={`relative h-full flex flex-col bg-gradient-to-b from-black via-[#0b1f15] to-[#145a36]
        border-r border-white/10 shadow-2xl transition-all duration-300
        ${sidebarOpen ? "w-64" : "w-16"}`}
      >

        {/* HEADER */}
        <div className="h-16 flex items-center px-3 border-b border-white/10">
          <div className="flex items-center gap-2 overflow-hidden">
            <Image src="/logo-aya.png" alt="Logo" width={50} height={50} />
            {sidebarOpen && (
              <div className="leading-tight">
            <p className="text-white font-semibold text-sm">AYA Energia</p>
            <p className="text-white/50 text-xs">BI Portal</p>
            </div>
            )}
          </div>
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
                  setFadeIn(false);
                  setLoading(true);
                  setActive(r.id);
                }}
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm w-full
                  ${isActive
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 h-full w-1 bg-[#2E7B57] rounded-r" />
                )}

                {r.image ? (
                  <Image
                    src={r.image}
                    alt=""
                    width={22}
                    height={22}
                    className="shrink-0 transition group-hover:scale-110"
                  />
                ) : (
                  Icon && (
                    <Icon className="w-5 h-5 shrink-0 transition group-hover:scale-110" />
                  )
                )}

                {sidebarOpen && <span className="truncate">{r.title}</span>}
              </button>
            );
          })}
        </div>

        {/* BOTÃO SUPORTE */}
        <div className="border-t border-white/10 p-2">
          <button
            onClick={() => setShowSupport(true)}
            title={!sidebarOpen ? "Suporte" : ""}
            className="flex items-center gap-3 text-white/60 hover:text-white w-full text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition"
          >
            <HelpCircle size={18} />
            {sidebarOpen && <span>Dúvidas / Suporte</span>}
          </button>
        </div>

        {/* LOGOUT */}
        <div className="border-t border-white/10 p-2">
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Sair" : ""}
            className="flex items-center gap-3 text-white/60 hover:text-white w-full text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      
      {/* FAIXA DE TOGGLE NA BORDA */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="absolute top-0 right-0 h-full w-2 bg-transparent hover:bg-white/10 transition"
        title={sidebarOpen ? "Fechar menu" : "Abrir menu"}
      />
      </aside>


      {/* CONTEÚDO */}
      <div className="flex-1 relative bg-black overflow-hidden">

        {/* LOADING OVERLAY */}
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-white/20 border-t-[#2E7B57] rounded-full animate-spin mb-4" />
            <p className="text-white/80 text-sm tracking-wide">
              Carregando: {report?.title || "relatório"}...
            </p>
          </div>
        )}

        {report && (
          <iframe
            key={report.id}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
          <div className="bg-gradient-to-b from-black via-[#0b1f15] to-[#145a36] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">

            {/* FECHAR */}
            <button
              onClick={() => setShowSupport(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center space-y-3">
              {/* <Image src="/logo-aya.png" alt="AYA" width={70} height={70} /> */}

              <h3 className="text-white text-lg font-semibold">
                Suporte Técnico
              </h3>

              <p className="text-white/70 text-sm">
                Entre em contato com o desenvolvedor
              </p>

              <p className="text-white font-medium">
                Diego Sanchez D’Amaro
              </p>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <a
                href="https://www.linkedin.com/in/diegodamaro/"
                target="_blank"
                className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white"
              >
                <Linkedin size={18} />
                <span>LinkedIn</span>
              </a>

              <a
                href="mailto:diego.sanchez@ayaenergia.com.br"
                className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white"
              >
                <Mail size={18} />
                <span>Email</span>
              </a>

              <a
                href="https://wa.me/5511961995900"
                target="_blank"
                className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white"
              >
                <Phone size={18} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* =========================
   POWER BI URL
========================= */

function formatUrl(url) {
  if (!url) return url;

  const params = [
    "navContentPaneEnabled=false",
    "filterPaneEnabled=false",
    "pageView=fitToWidth",
  ].join("&");


  return url.includes("?") ? `${url}&${params}` : `${url}?${params}`;
}
