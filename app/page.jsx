"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Wrench,
  ShoppingCart,
  ClipboardList,
  Menu,
} from "lucide-react";

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
  const [active, setActive] = useState(PORTFOLIO_REPORTS[0].id);
  const [open, setOpen] = useState(true); // ABERTA POR PADRÃO

  const report = ALL_REPORTS.find((r) => r.id === active);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black">
      {/* SIDEBAR */}
      <aside
        className={`h-full transition-all duration-300 flex flex-col ${
          open ? "w-64" : "w-16"
        }`}
        style={{
          background: "linear-gradient(180deg, #464947ff 0%, #464947ff 100%)",
        }}
      >
        {/* HEADER + TOGGLE */}
        <div className="h-20 flex items-center justify-between px-3 border-b border-white/10">
          <div className="flex-1 flex justify-center">
            <Image
              src="/logo-aya.png"
              alt="Logo AYA"
              width={open ? 80: 50}
              height={open ? 80 : 50}
              className="object-contain transition-all"
            />
          </div>

          {/* <button
            onClick={() => setOpen((v) => !v)}
            className="text-white/80 hover:text-white ml-2"
            title={open ? "Fechar menu" : "Abrir menu"}
          >
            <Menu size={22} />
          </button> */}
        </div>

        {/* MENU */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
          <MenuSection
            title="Portfólio Overview"
            open={open}
            items={PORTFOLIO_REPORTS}
            active={active}
            setActive={setActive}
          />

          <MenuSection
            title="Relatórios Internos"
            open={open}
            items={INTERNAL_REPORTS}
            active={active}
            setActive={setActive}
          />
        </div>

        {/* FOOTER */}
        <div className="h-12 flex items-center justify-center border-t border-white/10 text-xs text-white/60">
          {open ? "Desenvolvido por Diego D'Amaro" : "BI"}
        </div>
      </aside>

      {/* CONTEÚDO */}
      <div className="flex-1 relative bg-black">
        <iframe
          key={report.id}
          src={formatUrl(report.src)}
          className="absolute inset-0 w-full h-full border-none"
          allowFullScreen
        />
      </div>
    </div>
  );
}

/* =========================
   COMPONENTES
========================= */

function MenuSection({ title, open, items, active, setActive }) {
  return (
    <div className="space-y-1">
      {open && (
        <div className="px-2 text-xs uppercase tracking-wider text-white/50 mb-2">
          {title}
        </div>
      )}

      {items.map((r) => {
        const isActive = active === r.id;
        const Icon = r.icon;

        return (
          <button
            key={r.id}
            onClick={() => setActive(r.id)}
            className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-all text-sm w-full
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

            {open && <span className="truncate">{r.title}</span>}
          </button>
        );
      })}
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
