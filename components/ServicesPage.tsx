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
  ChevronDown,
  Check,
} from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

type TabId = "visao" | "portfolio" | "operacao" | "outros";
type TabItem = { id: TabId; label: string; icon: any; hint: string };

const TABS: TabItem[] = [
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

function useOutsideClick<T extends HTMLElement>(onOutside: () => void, enabled: boolean) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (!el.contains(target)) onOutside();
    };

    document.addEventListener("mousedown", handler, { passive: true });
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [enabled, onOutside]);

  return ref;
}

/* =========================================================
   TOP BAR: compacto + tabs (desktop) / seletor (mobile)
========================================================= */
function TopBar({
  tab,
  setTab,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
}) {
  const isSm = useMedia("(max-width: 640px)");
  const active = useMemo(() => TABS.find((t) => t.id === tab)!, [tab]);

  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const wrapRef = useOutsideClick<HTMLDivElement>(close, open);

  useEffect(() => {
    if (!isSm) setOpen(false);
  }, [isSm]);

  return (
    <div className="sticky top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 py-2">
        <div className="flex items-center gap-3">
          {/* breadcrumb discreto */}
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-semibold text-black/55 truncate">Sobre nós</div>
          </div>

          <div className="ml-auto min-w-0">
            {/* MOBILE: dropdown compacto */}
            {isSm ? (
              <div ref={wrapRef} className="relative">
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition",
                    "bg-white text-black/80 border-black/10 hover:bg-black/[0.02]",
                    "focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  )}
                >
                  <active.icon className="w-4 h-4 text-emerald-800" />
                  <span className="truncate max-w-[160px]">{active.label}</span>
                  <ChevronDown className={cx("w-4 h-4 text-black/45 transition", open && "rotate-180")} />
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-[260px] rounded-2xl border border-black/10 bg-white shadow-xl overflow-hidden">
                    <div className="p-2">
                      {TABS.map((t) => {
                        const Icon = t.icon;
                        const selected = t.id === tab;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setTab(t.id);
                              close();
                            }}
                            className={cx(
                              "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                              selected ? "bg-emerald-50 text-emerald-900" : "hover:bg-black/[0.03] text-black/75"
                            )}
                          >
                            <span className={cx("w-8 h-8 rounded-xl grid place-items-center border", selected ? "border-emerald-200 bg-emerald-100/50" : "border-black/10 bg-black/[0.02]")}>
                              <Icon className={cx("w-4 h-4", selected ? "text-emerald-800" : "text-black/45")} />
                            </span>
                            <div className="min-w-0 flex-1 text-left">
                              <div className="font-semibold truncate">{t.label}</div>
                              <div className="text-[11px] text-black/50 truncate">{t.hint}</div>
                            </div>
                            {selected && <Check className="w-4 h-4 text-emerald-700" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* DESKTOP: tabs horizontais com scroll se precisar */
              <div
                className={cx(
                  "flex items-center gap-2 overflow-x-auto whitespace-nowrap",
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
                      title={t.hint}
                    >
                      <Icon className={cx("w-4 h-4", Active ? "text-emerald-800" : "text-black/45")} />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE SHELL
   ✅ todas as páginas com MESMO "frame"
   ✅ header fixo igual
   ✅ corpo com scroll interno consistente
========================================================= */
function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
  alt = false,
  rightSlot,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  alt?: boolean;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className={cx("h-full w-full", alt ? "bg-neutral-50" : "bg-white")}>
      <div className="h-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6 overflow-y-auto">
        <div className="pb-4 sm:pb-6 border-b border-black/5 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-emerald-900/[0.04] px-3 py-1 text-[11px] font-semibold text-emerald-950">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                {eyebrow}
              </div>
            )}

            <h2 className="mt-3 text-[clamp(24px,3.4vw,44px)] font-extrabold tracking-tight text-green-950 leading-[1.05]">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-3 text-[clamp(13px,1.6vw,16px)] leading-relaxed text-black/70 max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>

          {rightSlot && <div className="hidden md:block">{rightSlot}</div>}
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

  // ao trocar de tab, volta pro topo (sem mexer no scroll da página global)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  const heroRight = (
    <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm shadow-[0_16px_40px_-28px_rgba(0,0,0,0.35)]">
      <div className="font-extrabold text-green-950">COI • AYA Energia</div>
      <div className="mt-1 text-black/60 text-xs leading-relaxed">
        Monitoramento • SLA • Campo • Evidências
      </div>
    </div>
  );

  return (
    <div ref={wrapRef} className="h-full w-full min-w-0 bg-white text-black flex flex-col">
      <TopBar tab={tab} setTab={setTab} />

      {/* área do conteúdo: MESMO tamanho pra todas as páginas */}
      <div className="flex-1 min-h-0">
        {/* ================= VISÃO GERAL ================= */}
        {tab === "visao" && (
          <PageShell
            eyebrow="AYA Energia • Centro de Operação Integrado (COI)"
            title="Operação, manutenção e performance"
            subtitle="Monitoramento em tempo real, coordenação técnica e execução em campo com SLA, rastreabilidade e foco em disponibilidade."
            rightSlot={heroRight}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-7 space-y-6">
                <p className="text-[clamp(13px,1.6vw,16px)] leading-[1.75] text-black/70">
                  Nosso COI em São Paulo – SP concentra especialistas e processos para acompanhar a geração das usinas,
                  identificar desvios e coordenar ações de forma rápida. Atuamos com bases regionais e equipes de campo,
                  garantindo atendimento conforme <b className="text-black/85">SLA</b> e mantendo histórico completo para
                  auditoria e melhoria contínua.
                </p>

                <div className="flex flex-wrap gap-2">
                  <Pill label="Monitoramento contínuo" />
                  <Pill label="Resposta rápida (SLA)" />
                  <Pill label="Bases regionais" />
                  <Pill label="Rastreabilidade" />
                  <Pill label="Relatórios executivos" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <EnterpriseCard icon={Activity} title="Operação" desc="Supervisão contínua e coordenação técnica." />
                  <EnterpriseCard icon={Wrench} title="Manutenção" desc="Preventiva, corretiva e preditiva." />
                  <EnterpriseCard icon={Eye} title="Monitoramento" desc="Detecção de falhas em tempo real." />
                  <EnterpriseCard icon={Droplets} title="Limpeza e roçagem" desc="Preservação da eficiência energética." />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="mx-auto w-full max-w-[260px] sm:max-w-[340px]">
                  <div className="rounded-2xl border border-black/10 bg-black/5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] overflow-hidden">
                    <div className="relative aspect-[10/14] sm:aspect-[10/16]">
                      <Image
                        src="/chefes.png"
                        alt="Centro de Operação Aya Energia"
                        fill
                        sizes="(max-width: 1024px) 70vw, 340px"
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
            rightSlot={
              <div className="hidden md:flex gap-2">
                <Pill label="SP" />
                <Pill label="MT" />
                <Pill label="GO" />
                <Pill label="PE" />
                <Pill label="RJ" />
                <Pill label="BA" />
              </div>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-9">
                {/* altura responsiva e sem “gigante” */}
                <div className="w-full overflow-hidden rounded-2xl border border-black/10 bg-white h-[clamp(260px,45vh,520px)]">
                  <BrazilTopoMap activeUFs={["SP", "MT", "GO", "PE", "RJ", "BA"]} height={520} />
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
