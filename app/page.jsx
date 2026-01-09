"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  TrendingUp,
  Zap,
  Wrench,
  ShoppingCart,
  ClipboardList,
  LayoutDashboard,
} from "lucide-react";

const REPORTS = [

  {
    id: "ineer",
    title: "Portfólio Overview - Ineer",
    icon: BarChart3,
    image: "/logo-ineer.png",
    src: "https://app.powerbi.com/view?r=eyJrIjoiODJiMGQwM2MtOGJiOC00MTAyLWJkM2EtMWNkZTlkNjBiYTBlIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },

  {
    id: "kamai",
    title: "Portfólio Overview - Kamai",
    icon: TrendingUp,
    image: "/logo-kamai.png",
    src: "https://app.powerbi.com/view?r=eyJrIjoiNmM4ZjNkODgtNTRiOC00MmNkLTk5MDctMzA1Mzk4YTA5NmFhIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },
  {
    id: "elis",
    title: "Portfólio Overview - Élis",
    image: "/logo-elis.png",
    src: "https://app.powerbi.com/view?r=eyJrIjoiMTBmYTEwMmEtMmU1ZS00ZWE0LWEzM2MtYThhYzIzMmMxMDhhIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
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
  {
    id: "os",
    title: "Ordens de Serviço",
    icon: ClipboardList,
    src: "https://app.powerbi.com/view?r=eyJrIjoiYzQzYjZjM2YtMzc0OS00MDMwLWI1N2EtODFjZGZmYjczMTlkIiwidCI6ImEzYTY3NjNlLWQyNTMtNDEwYy04MjIzLWMyZDk3NmE0NTMzZSJ9",
  },
];

export default function Home() {
  const [active, setActive] = useState(REPORTS[0].id);
  const [open, setOpen] = useState(false);

  const report = REPORTS.find((r) => r.id === active);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black">

      {/* SIDEBAR */}
      <aside
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className={`h-full transition-all duration-300 flex flex-col
          ${open ? "w-64" : "w-20"}
        `}
        style={{
          background: "linear-gradient(180deg, #464947ff 0%, #464947ff 100%)",
        }}
      >
        {/* LOGO */}
        <div className="h-14 flex items-center justify-center border-b border-white/10">
          <LayoutDashboard className="w-6 h-6 text-white" />
        </div>

        {/* MENU */}
        <div className="flex-1 flex flex-col gap-1 px-3 py-4">
          {REPORTS.map((r) => {
            const isActive = active === r.id;
            const Icon = r.icon;

            return (
              <button
                key={r.id}
                onClick={() => setActive(r.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm
                  ${
                    isActive
                      ? "bg-[#2E7B41] text-white shadow-md"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                {/* <Icon className="w-5 h-5 shrink-0" /> */}
                <Image src={r.image} alt="" width={25} height={25}/> 

                {open && (
                  <span className="truncate">{r.title}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="h-12 flex items-center justify-center border-t border-white/10 text-xs text-white/60">
          {open ? "Portal BI • Stroom" : "BI"}
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 relative bg-black">
        <div className="absolute inset-0">
          <iframe
            key={report.id}
            src={formatUrl(report.src)}
            className="w-full h-full border-none"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

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
