"use client";

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

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

export default function ServicesContent() {
  const pageBg = "bg-white text-black";

  const sectionBorder = "border-black/5";
  const sectionAlt = "bg-neutral-50";

  const heading = "text-green-950";
  const body = "text-black/70";
  const bodyStrong = "text-black/85";

  return (
    <div className={cx("h-full w-full min-w-0 overflow-y-auto", pageBg)}>
      {/* HERO */}
      <section className={cx("border-b", sectionBorder)}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 pt-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* TEXTO */}
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
                Contamos com bases regionais e <b className={bodyStrong}>equipes de campo</b> para execução e coordenação
                da operação, estoque de materiais e atendimento conforme{" "}
                <b className={bodyStrong}>SLA (Service Level Agreement)</b>.
              </p>

              <p className={cx("mt-3 text-[15px] md:text-[16px] leading-relaxed", body)}>
                Nossa equipe é composta por especialistas em usinas solares e engenheiros com conhecimentos avançados,
                atuando no back office e em campo.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Pill label="Monitoramento contínuo" />
                <Pill label="Resposta rápida (SLA)" />
                <Pill label="Bases regionais" />
                <Pill label="Rastreabilidade e relatórios" />
              </div>
            </div>

            {/* IMAGEM */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[310px]">
                <div className="rounded-2xl border border-black/10 bg-black/5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] overflow-hidden">
                  <div className="relative aspect-[10/16]">
                    <Image
                      src="/chefes.png"
                      alt="Centro de Operação Aya Energia"
                      fill
                      sizes="(max-width: 1024px) 70vw, 310px"
                      className="object-cover"
                      priority={false}
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs text-center text-black/50">
                  COI • Monitoramento e coordenação operacional
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PORTFÓLIO */}
      <section className={cx(sectionAlt, "border-b", sectionBorder)}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 pt-6 pb-12">
          <h2 className={cx("text-4xl font-extrabold tracking-tight", heading)}>Nosso Portfólio</h2>

          <p className={cx("mt-4 text-[15px] md:text-[16px] leading-relaxed", body)}>
            Atuação nacional com equipes regionais, resposta rápida e redução de indisponibilidade.
          </p>

          <div className="mt-8 w-full h-[460px] min-h-0 overflow-hidden rounded-2xl border border-black/10 bg-white">
            <BrazilTopoMap activeUFs={["SP", "MT", "GO", "PE", "RJ", "BA"]} height={560} />
          </div>
        </div>
      </section>

      {/* OPERAÇÃO & MANUTENÇÃO */}
      <section className={cx("border-b", sectionBorder)}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 pt-6 pb-12">
          <h2 className={cx("text-4xl font-extrabold tracking-tight", heading)}>Operação &amp; Manutenção</h2>

          <p className={cx("mt-3 text-[15px] md:text-[16px] leading-relaxed", body)}>
            Serviços integrados para maximizar disponibilidade, eficiência e segurança operacional.
          </p>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-6 space-y-6">
              <Bullet title="Monitoramento" text="Acompanhamento em tempo real com resposta imediata." />
              <Bullet title="Manutenção completa" text="Preventiva, corretiva e preditiva." />
              <Bullet title="Segurança avançada" text="CFTV, análise inteligente e prevenção de incidentes." />
              <Bullet title="Gestão operacional" text="Relatórios, histórico e rastreabilidade." />
              <Bullet title="Atendimento ágil" text="Equipes de campo para demandas críticas." />
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EnterpriseCard icon={Activity} title="Operação" desc="Supervisão contínua e coordenação técnica." />
              <EnterpriseCard icon={Wrench} title="Manutenção técnica" desc="Execução padronizada e confiável." />
              <EnterpriseCard icon={Eye} title="Monitoramento" desc="Detecção de falhas em tempo real." />
              <EnterpriseCard icon={Droplets} title="Limpeza e roçagem" desc="Preservação da eficiência energética." />
            </div>
          </div>
        </div>
      </section>

      {/* OUTROS SERVIÇOS */}
      <section className={cx(sectionAlt, "border-t", sectionBorder)}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
          <h3 className={cx("text-3xl md:text-4xl font-extrabold tracking-tight", heading)}>Outros Serviços</h3>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
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
        </div>
      </section>
    </div>
  );
}
