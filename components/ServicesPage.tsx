"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  LayoutDashboard,
  MapPinned,
  Layers,
  Sparkles,
} from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

type TabId = "visao" | "portfolio" | "operacao" | "outros";

const TABS: Array<{ id: TabId; label: string; icon: any; hint: string }> = [
  { id: "visao", label: "Visão geral", icon: LayoutDashboard, hint: "Quem somos e como atuamos" },
  { id: "portfolio", label: "Portfólio", icon: MapPinned, hint: "Cobertura e presença nacional" },
  { id: "operacao", label: "Operação & Manutenção", icon: Layers, hint: "Rotina, processos e execução" },
  { id: "outros", label: "Outros serviços", icon: FileSearch, hint: "Serviços complementares" },
];

function useMedia(query: string) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setOk(m.matches);
    on();
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, [query]);
  return ok;
}

/* =========================================================
   TOP TABS (discreto, responsivo, com scroll no mobile)
========================================================= */
function TabsBar({
  tab,
  setTab,
  title,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
  title: string;
}) {
  const isSm = useMedia("(max-width: 640px)");

  return (
    <div className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-black/5">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-semibold text-black/55 truncate">{title}</div>
          </div>

          <div className="ml-auto min-w-0">
            <div
              className={cx(
                "flex items-center gap-2",
                "overflow-x-auto whitespace-nowrap",
                "[-ms-overflow-style:none] [scrollbar-width:none]"
              )}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              {TABS.map((t) => {
                const Active = tab === t.id;
                const Icon = t.icon;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cx(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition",
                      "focus:outline-none focus:ring-2 focus:ring-emerald-600/20",
                      Active
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : "bg-white/80 text-black/70 border-black/10 hover:bg-black/[0.02]"
                    )}
                    title={isSm ? t.hint : undefined}
                  >
                    <Icon className={cx("w-4 h-4", Active ? "text-emerald-800" : "text-black/45")} />
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE SHELL
   ✅ todas as páginas com MESMA estrutura/altura/padding
   ✅ scroll interno consistente
========================================================= */
function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
  alt = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  alt?: boolean;
}) {
  return (
    <div className={cx("h-full w-full", alt ? "bg-neutral-50" : "bg-white")}>
      <div className="h-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6 overflow-y-auto">
        <div className="pb-4 sm:pb-6 border-b border-black/5">
          {eyebrow && (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-emerald-900/[0.04] px-3 py-1 text-[11px] font-semibold text-emerald-950">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              {eyebrow}
            </div>
          )}

          <h2 className="mt-3 text-[clamp(26px,3.8vw,46px)] font-extrabold tracking-tight text-green-950 leading-[1.05]">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-3 text-[clamp(13px,1.6vw,16px)] leading-relaxed text-black/70 max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>

        <div className="pt-4 sm:pt-6">{children}</div>
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENT
========================================================= */
export default function ServicesContent() {
  const [tab, setTab] = useState<TabId>("visao");
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // quando troca tab, volta pro topo da área (para mobile)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  const topTitle = useMemo(() => {
    if (tab === "visao") return "Sobre nós";
    if (tab === "portfolio") return "Portfólio";
    if (tab === "operacao") return "Operação & Manutenção";
    return "Outros serviços";
  }, [tab]);

  return (
    <div ref={wrapRef} className="h-full w-full min-w-0 bg-white text-black flex flex-col">
      <TabsBar tab={tab} setTab={setTab} title={topTitle} />

      {/* content sempre do mesmo tamanho */}
      <div className="flex-1 min-h-0">
        {/* ================= VISÃO GERAL ================= */}
        {tab === "visao" && (
          <PageShell
            eyebrow="AYA Energia • Centro de Operação Integrado (COI)"
            title="Operação, manutenção e performance"
            subtitle="Monitoramento em tempo real, coordenação técnica e execução em campo com SLA, rastreabilidade e foco em disponibilidade."
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-7">
                <p className="text-[clamp(13px,1.6vw,16px)] leading-[1.75] text-black/70">
                  Nosso COI em São Paulo – SP concentra especialistas e processos para acompanhar a geração das usinas,
                  identificar desvios e coordenar ações de forma rápida. Atuamos com bases regionais e equipes de campo,
                  garantindo atendimento conforme <b className="text-black/85">SLA</b> e mantendo histórico completo para
                  auditoria e melhoria contínua.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Pill label="Monitoramento contínuo" />
                  <Pill label="Resposta rápida (SLA)" />
                  <Pill label="Bases regionais" />
                  <Pill label="Rastreabilidade" />
                  <Pill label="Relatórios executivos" />
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <EnterpriseCard icon={Activity} title="Operação" desc="Supervisão contínua e coordenação técnica." />
                  <EnterpriseCard icon={Wrench} title="Manutenção" desc="Preventiva, corretiva e preditiva." />
                  <EnterpriseCard icon={Eye} title="Monitoramento" desc="Detecção de falhas em tempo real." />
                  <EnterpriseCard icon={Droplets} title="Limpeza e roçagem" desc="Preservação da eficiência energética." />
                </div>

                <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-black/10 bg-white p-4">
                    <div className="text-sm font-extrabold text-green-950">Como trabalhamos</div>
                    <ul className="mt-2 text-sm text-black/70 space-y-1.5">
                      <li>• Alarmes e diagnósticos com priorização.</li>
                      <li>• Ações coordenadas com time de campo.</li>
                      <li>• Evidências e histórico por ativo.</li>
                      <li>• Rotina de melhoria por KPI.</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white p-4">
                    <div className="text-sm font-extrabold text-green-950">Resultado esperado</div>
                    <ul className="mt-2 text-sm text-black/70 space-y-1.5">
                      <li>• Menos indisponibilidade.</li>
                      <li>• Resposta mais rápida a falhas.</li>
                      <li>• Mais previsibilidade e controle.</li>
                      <li>• Performance sustentada.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="mx-auto w-full max-w-[240px] sm:max-w-[320px]">
                  <div className="rounded-2xl border border-black/10 bg-black/5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] overflow-hidden">
                    <div className="relative aspect-[10/14] sm:aspect-[10/16]">
                      <Image
                        src="/chefes.png"
                        alt="Centro de Operação Aya Energia"
                        fill
                        sizes="(max-width: 1024px) 70vw, 320px"
                        className="object-cover"
                        priority={false}
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-center text-black/50">COI • Monitoramento e coordenação operacional</div>
                </div>
              </div>
            </div>
          </PageShell>
        )}

        {/* ================= PORTFÓLIO ================= */}
        {tab === "portfolio" && (
          <PageShell
            eyebrow="Presença nacional"
            title="Nosso Portfólio"
            subtitle="Atuação com equipes regionais, resposta rápida e redução de indisponibilidade."
            alt
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-6 items-start">
              <div className="lg:col-span-9">
                <div className="w-full overflow-hidden rounded-2xl   h-[clamp(450px,50.5vh,6000px)]">
                  <BrazilTopoMap activeUFs={["SP", "MT", "GO", "PE", "RJ", "BA"]} height={600} />
                </div>
              </div>

              <div className="lg:col-span-3 space-y-4">
                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <div className="text-sm font-extrabold text-green-950">Cobertura</div>
                  <div className="mt-2 text-sm text-black/70 leading-relaxed">
                    Bases e equipes distribuídas para atender com agilidade e padronização.
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill label="SLA" />
                    <Pill label="Field teams" />
                    <Pill label="COI" />
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <div className="text-sm font-extrabold text-green-950">Foco</div>
                  <ul className="mt-2 text-sm text-black/70 space-y-1.5">
                    <li>• Disponibilidade</li>
                    <li>• Segurança</li>
                    <li>• Performance</li>
                    <li>• Evidências</li>
                  </ul>
                </div>
              </div>
            </div>
          </PageShell>
        )}

        {/* ================= OPERAÇÃO & MANUTENÇÃO ================= */}
        {tab === "operacao" && (
          <PageShell
            eyebrow="Rotina operacional"
            title="Operação & Manutenção"
            subtitle="Serviços integrados para maximizar disponibilidade, eficiência e segurança operacional."
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
              <div className="lg:col-span-6 space-y-5">
                <Bullet title="Monitoramento" text="Acompanhamento em tempo real com resposta imediata." />
                <Bullet title="Manutenção completa" text="Preventiva, corretiva e preditiva, com padrão e evidência." />
                <Bullet title="Segurança avançada" text="CFTV, análise inteligente e prevenção de incidentes." />
                <Bullet title="Gestão operacional" text="Relatórios, histórico, rastreabilidade e melhoria contínua." />
                <Bullet title="Atendimento ágil" text="Equipes de campo para demandas críticas e planejamento." />
              </div>

              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EnterpriseCard icon={Activity} title="Operação" desc="Coordenação técnica e tomada de decisão rápida." />
                <EnterpriseCard icon={Wrench} title="Manutenção técnica" desc="Execução padronizada e confiável." />
                <EnterpriseCard icon={Eye} title="Diagnóstico" desc="Causa raiz e priorização por impacto." />
                <EnterpriseCard icon={Droplets} title="Rotina de eficiência" desc="Ações para manter performance sustentada." />
              </div>

              <div className="lg:col-span-12">
                <div className="rounded-2xl border border-black/10 bg-white p-5">
                  <div className="text-sm font-extrabold text-green-950">Modelo de atendimento</div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4">
                      <div className="text-sm font-bold text-black/80">1) Detectar</div>
                      <div className="mt-1 text-sm text-black/65">Alarmes, telemetria e validação.</div>
                    </div>
                    <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4">
                      <div className="text-sm font-bold text-black/80">2) Agir</div>
                      <div className="mt-1 text-sm text-black/65">Coordenação COI + time de campo.</div>
                    </div>
                    <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4">
                      <div className="text-sm font-bold text-black/80">3) Evidenciar</div>
                      <div className="mt-1 text-sm text-black/65">Relatório, fotos, histórico e KPI.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PageShell>
        )}

        {/* ================= OUTROS SERVIÇOS ================= */}
        {tab === "outros" && (
          <PageShell
            eyebrow="Complementos estratégicos"
            title="Outros Serviços"
            subtitle="Serviços para reduzir risco, elevar qualidade e maximizar retorno do ativo."
            alt
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <BigServiceCard
                icon={ClipboardCheck}
                title="Comissionamento"
                desc="Garantia de funcionamento adequado das usinas."
                body="Comissionamento a frio e a quente com equipe especializada."
              />

              <BigServiceCard
                icon={BriefcaseBusiness}
                title="Engenharia do proprietário"
                desc="Acompanhamento técnico em todas as etapas da obra."
                body="Fiscalização, validação de projetos e conformidade técnica."
              />

              <BigServiceCard
                icon={TrendingUp}
                title="Otimização de geração"
                desc="Correção de desvios e aumento de performance."
                body="Análise de dados reais para elevar rentabilidade."
              />

              <BigServiceCard
                icon={FileSearch}
                title="Diligência técnica"
                desc="Segurança para investidores e aquisição de ativos."
                body="Avaliação técnica completa do ativo e documentação."
              />
            </div>
          </PageShell>
        )}
      </div>
    </div>
  );
}
