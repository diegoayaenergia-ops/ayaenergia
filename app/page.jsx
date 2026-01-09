"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Wrench,
  ShoppingCart,
  ClipboardList,
  LogOut,
} from "lucide-react";

/* =========================
   USUÁRIOS / EMPRESAS
========================= */

const USERS = {
  aya: {
    empresa: "AYA Energia",
    senha: "aya123",
    access: ["ineer", "kamai", "elis", "os", "acionamentos", "compras"],
  },
  ineer: {
    empresa: "Ineer Energia",
    senha: "ineer123",
    access: ["ineer"],
  },
  elis: {
    empresa: "Élis Energia",
    senha: "elis123",
    access: ["elis"],
  },
  kamai: {
    empresa: "Kamai Solar",
    senha: "kamai123",
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

  /* ===== CARREGA SESSÃO ===== */
  useEffect(() => {
    const saved = localStorage.getItem("bi_user");
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      setActive(u.access[0]);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black">
        <div className="bg-zinc-950/80 backdrop-blur p-10 rounded-2xl w-full max-w-md space-y-6 shadow-2xl border border-white/10">
          <div className="flex justify-center">
            <Image src="/logo-aya.png" alt="AYA" width={100} height={100} />
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
              className="w-full p-3 rounded-lg bg-black text-white border border-white/20 focus:outline-none focus:border-[#2E7B41]"
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
              className="w-full bg-[#2E7B41] hover:bg-[#256735] transition text-white py-3 rounded-lg font-medium"
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
        className="h-full w-64 flex flex-col"
        style={{
          background: "linear-gradient(180deg, #464947ff 0%, #464947ff 100%)",
        }}
      >
        {/* HEADER */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-white/10">
          <Image src="/logo-aya.png" alt="Logo" width={60} height={60} />

          <button
            onClick={handleLogout}
            className="text-white/70 hover:text-white"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* MENU */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
          {allowedReports.map((r) => {
            const isActive = active === r.id;
            const Icon = r.icon;

            return (
              <button
                key={r.id}
                onClick={() => setActive(r.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm w-full
                  ${
                    isActive
                      ? "bg-[#2E7B41] text-white shadow-md"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                {r.image ? (
                  <Image src={r.image} alt="" width={22} height={22} />
                ) : (
                  Icon && <Icon className="w-5 h-5 shrink-0" />
                )}

                <span className="truncate">{r.title}</span>
              </button>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="h-12 flex items-center justify-center border-t border-white/10 text-xs text-white/60">
          {user.empresa}
        </div>
      </aside>

      {/* CONTEÚDO */}
      <div className="flex-1 relative bg-black">
        {report && (
          <iframe
            key={report.id}
            src={formatUrl(report.src)}
            className="absolute inset-0 w-full h-full border-none"
            allowFullScreen
          />
        )}
      </div>
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
    "zoom=1",
  ].join("&");

  return url.includes("?") ? `${url}&${params}` : `${url}?${params}`;
}
