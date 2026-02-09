"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import BrazilTopoMap from "@/components/BrazilTopoMap";
import { Pill, Bullet, EnterpriseCard, BigServiceCard } from "@/components/ui";

import {
  Activity,
  Wrench,
  Eye,
  Droplets,
  ClipboardCheck,
  BriefcaseBusiness,
  TrendingUp,
  FileSearch,
} from "lucide-react";

type ServiceSection = { id: string; title: string; subtitle?: string };

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

const SERVICES_SECTIONS: ServiceSection[] = [
  { id: "video", title: "Vídeo institucional", subtitle: "Apresentação" },
  { id: "hero", title: "Visão geral", subtitle: "COI, SLA e estrutura" },
  { id: "portfolio", title: "Portfólio", subtitle: "Atuação e cobertura" },
  { id: "om", title: "Operação & Manutenção", subtitle: "Serviços e governança" },
  { id: "outros", title: "Outros serviços", subtitle: "Comissionamento, diligência..." },
];

function SectionScroller({
  children,
  alt,
  centerOnLarge,
}: {
  children: React.ReactNode;
  alt?: boolean;
  centerOnLarge?: boolean;
}) {
  return (
    <section
      className={cx(
        "h-full min-h-0 w-full min-w-0",
        "flex flex-col",
        "overflow-y-auto overscroll-contain",
        alt && "bg-neutral-50",
        // padding vertical consistente; em telas grandes “respira” melhor
        "py-0"
      )}
    >
      <div
        className={cx(
          "flex-1 min-h-0 w-full",
          centerOnLarge ? "flex flex-col justify-start lg:justify-center" : "flex flex-col"
        )}
      >
        {children}
      </div>
    </section>
  );
}

export default function ServicesPage() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string>(SERVICES_SECTIONS[0]?.id ?? "video");
  const [soundOn, setSoundOn] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return SERVICES_SECTIONS;
    return SERVICES_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(needle) ||
        (s.subtitle ?? "").toLowerCase().includes(needle)
    );
  }, [q]);

  useEffect(() => {
    if (!filtered.length) return;
    if (!filtered.some((x) => x.id === selected)) setSelected(filtered[0].id);
  }, [filtered, selected]);

  // ===== tokens light only (FUNDO mantido)
  const shell = "absolute inset-0 bg-[#f6f7f8] text-black min-h-dvh min-w-0";
  const input =
    "w-full rounded-xl px-3 py-2 border border-black/15 bg-white text-black outline-none transition focus:ring-1 focus:ring-[#2E7B57]";
  const muted = "text-black/55";

  // viewport “enterprise”: centraliza o app, sem mexer no fundo
  const viewport =
    "min-h-dvh w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 py-4";

  // grid principal: sidebar responsiva + content
  const layoutGrid =
    "h-[calc(100dvh-2rem)] min-h-0 grid grid-cols-1 lg:grid-cols-[clamp(280px,22vw,380px)_1fr] gap-4";

  const sidebarCard =
    "rounded-2xl border border-black/10 bg-white shadow-[0_18px_60px_-30px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col min-h-0 min-w-0";

  const contentCard =
    "rounded-2xl border border-black/10 bg-white shadow-[0_18px_60px_-30px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col min-h-0 min-w-0";

  const heading = "text-green-950";
  const body = "text-black/70";
  const bodyStrong = "text-black/85";

  const renderSection = () => {
    switch (selected) {
      case "video":
        return (
          <section className="h-full min-h-0 w-full min-w-0 overflow-hidden">
            <div className="h-full w-full relative bg-black">
              <video
                id="institutionalVideo"
                className="absolute inset-0 w-full h-full object-cover"
                src="/video.mp4"
                autoPlay
                loop
                muted={!soundOn}
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 bg-black/25" />
              <div className="relative z-10 w-full h-full flex items-center justify-center px-6">
                <Image
                  src="/logo-aya.png"
                  alt="AYA"
                  width={520}
                  height={520}
                  className="opacity-80"
                />
              </div>
            </div>
          </section>
        );

      case "hero":
        return (
          <SectionScroller centerOnLarge>
            <div className="mx-auto w-full max-w-6xl 2xl:max-w-5xl px-6 md:px-10 py-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7">
                  <div className="inline-flex items-center gap-2 rounded-full border border-green-900/15 bg-green-900/[0.04] px-3 py-1 text-xs font-semibold text-green-950">
                    <span className="w-2 h-2 rounded-full bg-green-700" />
                    AYA ENERGIA • Centro de Operação Integrado (COI)
                  </div>

                  <h1 className={cx("mt-4 text-4xl md:text-5xl font-extrabold tracking-tight leading-tight", heading)}>
                    Operação, manutenção e performance
                  </h1>

                  <p className={cx("mt-4 text-[15px] md:text-[16px] leading-relaxed", body)}>
                    O <b className={bodyStrong}>Centro de Operação Integrado (COI)</b> em São Paulo – SP concentra
                    especialistas e processos para monitorar e acompanhar a geração das usinas solares em tempo real.
                  </p>

                  <p className={cx("mt-3 text-[15px] md:text-[16px] leading-relaxed", body)}>
                    Contamos com bases regionais e <b className={bodyStrong}>equipes de campo</b> para execução e
                    coordenação da operação, estoque de materiais e atendimento conforme{" "}
                    <b className={bodyStrong}>SLA (Service Level Agreement)</b>.
                  </p>

                  <p className={cx("mt-3 text-[15px] md:text-[16px] leading-relaxed", body)}>
                    Nossa equipe é composta por especialistas em usinas solares e engenheiros com conhecimentos
                    avançados, atuando no back office e em campo.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Pill label="Monitoramento contínuo" />
                    <Pill label="Resposta rápida (SLA)" />
                    <Pill label="Bases regionais" />
                    <Pill label="Rastreabilidade e relatórios" />
                  </div>
                </div>

                <div className="lg:col-span-5 flex justify-center">
                  <div className="w-full max-w-[360px]">
                    <div className="rounded-2xl border border-black/10 bg-black/5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] overflow-hidden">
                      <div className="relative aspect-[10/16]">
                        <Image
                          src="/chefes.png"
                          alt="Centro de Operação Aya Energia"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className={cx("mt-2 text-xs text-center", muted)}>
                      COI • Monitoramento e coordenação operacional
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionScroller>
        );

      case "portfolio":
        return (
          <SectionScroller alt>
            <div className="max-w-6xl 2xl:max-w-5xl mx-auto w-full px-6 md:px-10 py-10 flex flex-col min-h-0">
              <h2 className={cx("text-4xl md:text-4xl font-extrabold tracking-tight", heading)}>Nosso Portfólio</h2>

              <p className={cx("mt-4 text-[15px] md:text-[16px] leading-relaxed", body)}>
                Nossos times regionais permitem uma resposta rápida a qualquer demanda e urgências, diminuindo o tempo de
                inatividade e maximizando a eficiência da geração de energia.
              </p>

              <p className={cx("mt-3 text-[15px] md:text-[16px] leading-relaxed", body)}>
                Ampla atuação de O&amp;M nos estados de São Paulo, Goiás e Rio de Janeiro, Pernambuco e Bahia.
              </p>

              {/* Preenche o restante do card */}
              <div className="mt-8 flex-1 min-h-0 w-full">
                <div className="h-full min-h-[520px] w-full">
                  <BrazilTopoMap activeUFs={["SP", "MT", "GO", "PE", "RJ", "BA"]} height={900} />
                </div>
              </div>
            </div>
          </SectionScroller>
        );

      case "om":
        return (
          <SectionScroller>
            <div className="max-w-6xl 2xl:max-w-5xl mx-auto w-full px-6 md:px-10 py-10">
              <h2 className={cx("text-4xl md:text-4xl font-extrabold tracking-tight", heading)}>
                Operação &amp; Manutenção
              </h2>

              <p className={cx("mt-3 text-[15px] md:text-[16px] leading-relaxed", body)}>
                Serviços integrados para maximizar disponibilidade, eficiência e segurança operacional — com processos e
                indicadores para gestão executiva.
              </p>

              <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                <div className="lg:col-span-6 space-y-6">
                  <Bullet title="Monitoramento" text="Acompanhamento em tempo real para identificar anomalias e quedas de produção com ação imediata." />
                  <Bullet title="Manutenção completa" text="Corretiva, preditiva e preventiva, incluindo inspeções térmicas, limpeza de módulos e controle de vegetação." />
                  <Bullet title="Segurança avançada" text="CFTV com IA, câmeras de alta resolução e análise de vídeo para resposta rápida e prevenção de incidentes." />
                  <Bullet title="Gestão operacional" text="Acesso do cliente ao progresso das solicitações e relatórios detalhados de desempenho e intervenções." />
                  <Bullet title="Atendimento ágil" text="Equipes em campo para demandas críticas, reduzindo tempo de inatividade." />
                </div>

                <div className="lg:col-span-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <EnterpriseCard icon={Activity} title="Operação" desc="Rotinas, supervisão e coordenação para continuidade operacional." />
                    <EnterpriseCard icon={Wrench} title="Manutenção técnica" desc="Execução padronizada com foco em disponibilidade e confiabilidade." />
                    <EnterpriseCard icon={Eye} title="Monitoramento" desc="Supervisório com inteligência para detectar falhas em tempo real." />
                    <EnterpriseCard icon={Droplets} title="Limpeza e roçagem" desc="Controle de vegetação e limpeza para preservar eficiência e vida útil." />
                  </div>

                  <div className="mt-4 rounded-2xl border border-black/10 bg-white p-5">
                    <div className="text-md font-semibold text-green-950">Governança e transparência</div>
                    <p className="mt-2 text-sm leading-relaxed text-black/65">
                      Relatórios, evidências e histórico de intervenções para auditoria e tomada de decisão.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionScroller>
        );

      case "outros":
        return (
          <SectionScroller alt centerOnLarge>
            <div className="max-w-6xl 2xl:max-w-5xl mx-auto w-full px-6 md:px-10 py-10">
              <h3 className={cx("text-3xl md:text-4xl font-extrabold tracking-tight", heading)}>Outros Serviços</h3>

              <p className={cx("mt-2 text-[15px] md:text-[16px] leading-relaxed max-w-2xl", body)}>
                Serviços especializados para apoiar implantação, performance e segurança na aquisição de ativos solares.
              </p>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <BigServiceCard
                  icon={ClipboardCheck}
                  title="Comissionamento"
                  desc="Atendimento técnico especializado em comissionamento, garantindo funcionamento adequado das usinas."
                  body="Com nossa expertise técnica e equipamentos próprios, atendemos comissionamento a frio e a quente."
                />
                <BigServiceCard
                  icon={BriefcaseBusiness}
                  title="Engenharia do proprietário"
                  desc="Engenheiros especializados acompanham a construção de usinas solares em todas as etapas."
                  body="Acompanhamento desde o parecer de acesso e projeto homologado até a fiscalização de obra."
                />
                <BigServiceCard
                  icon={TrendingUp}
                  title="Otimização de geração"
                  desc="Análise de estudos iniciais e dados reais para corrigir falhas e elevar a performance."
                  body="Analisamos estudos, dados de geração e irradiação real para identificar causas e elevar a rentabilidade."
                />
                <BigServiceCard
                  icon={FileSearch}
                  title="Diligência técnica"
                  desc="Avaliação técnica para dar segurança ao investidor e confiabilidade ao ativo."
                  body="Avaliamos documentação do projeto e o ativo via visitas técnicas, garantindo confiabilidade."
                />
              </div>
            </div>
          </SectionScroller>
        );

      default:
        return null;
    }
  };

  return (
    <div className={shell}>
      {/* viewport central (não muda o fundo) */}
      <div className={viewport}>
        <div className={layoutGrid}>
          {/* SIDEBAR */}
          <aside className={sidebarCard}>
            <div className="p-4 border-b border-black/10">
              <div className="font-extrabold text-lg">Sobre Nós</div>
              <p className={cx("text-xs mt-1", muted)}>Navegue pelas seções do conteúdo.</p>

              <div className="mt-3">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className={input}
                  placeholder="Buscar seção…"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
              {filtered.map((s) => {
                const active = s.id === selected;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s.id)}
                    className={cx(
                      "w-full text-left px-3 py-2 rounded-xl border transition",
                      active
                        ? "bg-black/[0.04] border-[#2E7B57]/30"
                        : "bg-white border-black/10 hover:bg-black/[0.03]"
                    )}
                  >
                    <div className="text-sm font-semibold truncate">{s.title}</div>
                    <div className={cx("text-xs truncate mt-0.5", muted)}>
                      {s.subtitle ?? "Clique para abrir"}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* MAIN */}
          <main className="min-h-0 min-w-0">
            <div className={cx(contentCard, "h-full")}>
              <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
                {renderSection()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
