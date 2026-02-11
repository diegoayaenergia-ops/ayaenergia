
"use client";

import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
    Search,
    ChevronDown,
    MapPin,
    ExternalLink,
    Copy,
    Check,
    Eye,
    EyeOff,
    Filter,
    Users,
    PlugZap,
    IdCard,
    Laptop,
    KeyRound,
} from "lucide-react";

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

/* =========================================================
   SAME TOKENS AS CADASTRO (copiado)
========================================================= */

const T = {
    bg: "#F4F6F8",
    card: "#FFFFFF",
    cardSoft: "#FBFCFD",
    border: "rgba(17, 24, 39, 0.12)",
    borderStrong: "rgba(17, 24, 39, 0.18)",
    text: "#0B1220",
    text2: "rgba(11, 18, 32, 0.70)",
    text3: "rgba(11, 18, 32, 0.55)",
    mutedBg: "rgba(17, 24, 39, 0.035)",

    accent: "#115923",
    accent2: "#2E7B41",
    accentSoft: "rgba(17, 89, 35, 0.08)",
    accentRing: "rgba(17, 89, 35, 0.18)",

    okBg: "rgba(16, 185, 129, 0.10)",
    okBd: "rgba(16, 185, 129, 0.30)",
    okTx: "#065F46",

    errBg: "rgba(239, 68, 68, 0.10)",
    errBd: "rgba(239, 68, 68, 0.30)",
    errTx: "#7F1D1D",
} as const;

const UI = {
    page: "w-full min-w-0",
    container: "mx-auto w-full max-w-[1480px] px-4 sm:px-6 py-6",

    header: "border bg-white",
    section: "border bg-white",

    headerTitle: "text-base sm:text-lg font-semibold tracking-tight",
    headerSub: "text-xs",
    sectionTitle: "text-sm font-semibold",
    sectionHint: "text-xs",
    label: "text-[11px] font-medium",
    help: "text-[11px]",

    input: "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2",
    select: "w-full h-10 px-3 border bg-white text-sm outline-none transition focus:ring-2",
} as const;

/* =========================================================
   PRIMITIVES (cadastro-like)
========================================================= */

function Btn({
    tone = "primary",
    loading,
    disabled,
    children,
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: "primary" | "secondary" | "danger";
    loading?: boolean;
}) {
    const base =
        "inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold border rounded-md " +
        "disabled:opacity-50 disabled:cursor-not-allowed transition active:translate-y-[0.5px]";

    const styles = tone === "primary" ? "text-white" : tone === "danger" ? "text-white" : "bg-white";

    return (
        <button
            className={cx(base, styles, className)}
            disabled={disabled || loading}
            style={
                tone === "primary"
                    ? { background: T.accent, borderColor: "rgba(17, 89, 35, 0.45)" }
                    : tone === "danger"
                        ? { background: "#DC2626", borderColor: "rgba(220, 38, 38, 0.55)" }
                        : { background: T.card, borderColor: T.border, color: T.text }
            }
            {...props}
        >
            {loading ? (
                <>
                    <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    <span>Processando…</span>
                </>
            ) : (
                children
            )}
        </button>
    );
}

function Pill({ children }: { children: ReactNode }) {
    return (
        <span
            className="inline-flex items-center h-7 px-2.5 text-[11px] font-medium border rounded-md"
            style={{ borderColor: T.border, background: T.cardSoft, color: T.text2 }}
        >
            {children}
        </span>
    );
}

function MsgBox({ m }: { m: { type: "ok" | "err"; text: string } | null }) {
    if (!m) return null;
    const s =
        m.type === "ok"
            ? { background: T.okBg, borderColor: T.okBd, color: T.okTx }
            : { background: T.errBg, borderColor: T.errBd, color: T.errTx };

    return (
        <div className="text-sm px-3 py-2 border rounded-md" style={s}>
            {m.text}
        </div>
    );
}

/* =========================================================
   TYPES + DATA
========================================================= */

type UsinaMini = { codigo: string; uc: string; concessionaria?: string };

type UfvItem = {
    nome: string;
    cliente: string;
    cnpj: string;
    nomeSocial: string;
    endereco: string;
    mapsUrl?: string;

    concessionaria: string;
    provedorInternet: string;

    CNPJ_internet: string;
    id_anydesk: string;
    senha_anydesk: string;
    senha_computador: string;

    usinas: UsinaMini[];
};

// ✅ cole seu UFVS aqui (mantive como placeholder)
const UFVS: UfvItem[] = [
    {
        nome: "Boa esperança do Sul",
        cliente: "Ineer",
        cnpj: "45.574.668/0002-61",
        nomeSocial: "CONSORCIO LIMOEIRO ENERGIAS RENOVAVEIS",
        endereco: "R. Francisca Henrique, 50, Boa Esperança do Sul - SP, 14930-000",
        concessionaria: "CPFL Paulista",
        provedorInternet: "WOW FIBER",
        CNPJ_internet: "45.574.668/0001-80",
        id_anydesk: "1151154585",
        senha_anydesk: "O&M@2030",
        senha_computador: "O&M@2030",
        mapsUrl: "https://www.google.com/maps/place/UFV+-+Boa+Esperan%C3%A7a+do+Sul/@-23.063851,-52.3358006,7z/data=!4m10!1m3!11m2!2shodH8m0-QSWmuCzhDTcGCg!3e3!3m5!1s0x94b8bf0031b68393:0x23923238297f615b!8m2!3d-21.9947399!4d-48.399542!16s%2Fg%2F11vm3hmmsc?entry=ttu&g_ep=EgoyMDI2MDIwOC4wIKXMDSoASAFQAw%3D%3D",
        usinas: [
            { codigo: "BES-01", uc: "4003532615" },
            { codigo: "BES-02", uc: "4003532634" },
            { codigo: "BES-03", uc: "4003532661" },
            { codigo: "BES-04", uc: "4003532738" },
        ],
    },
    {
        nome: "Conchal",
        cliente: "Ineer",
        cnpj: "",
        nomeSocial: "CONSORCIO LIMOEIRO ENERGIAS RENOVAVEIS",
        endereco: "JVM7+V9 - Terra Queimada, Conchal - SP, 13835-000",
        concessionaria: "Elektro",
        provedorInternet: "Starlink",
        CNPJ_internet: "57.171.677/0001-00",
        id_anydesk: "1801596524",
        senha_anydesk: "O&M@2030",
        senha_computador: "O&M@2030",
        mapsUrl: "https://www.google.com/maps/place/UFV+-+CONCHAL/@-23.063851,-52.3358006,7z/data=!4m10!1m3!11m2!2shodH8m0-QSWmuCzhDTcGCg!3e3!3m5!1s0x94c86700086d5dbf:0x49b56dca990d23e!8m2!3d-22.3653333!4d-47.1365556!16s%2Fg%2F11lz967p0s?entry=ttu&g_ep=EgoyMDI2MDIwOC4wIKXMDSoASAFQAw%3D%3D",
        usinas: [
            { codigo: "COM-01", uc: "45928029" },
            { codigo: "COM-02", uc: "45928088" },
            { codigo: "COM-03", uc: "45928118" },
        ],
    },
    {
        nome: "Garça",
        cliente: "Ineer",
        cnpj: "36.538.339/0001-93",
        nomeSocial: "CONSORCIO LIMOEIRO ENERGIAS RENOVAVEIS",
        endereco: "CRT 184C, S/N1 - GARCA",
        concessionaria: "CPFL Paulista",
        provedorInternet: "AONET",
        CNPJ_internet: "50.963.340/0001-96",
        id_anydesk: "1405045048",
        senha_anydesk: "O&M@2030",
        senha_computador: "O&M@2030",
        mapsUrl: "https://www.google.com/maps/place/UFV+-+Gar%C3%A7a/@-23.063851,-52.3358006,7z/data=!4m10!1m3!11m2!2shodH8m0-QSWmuCzhDTcGCg!3e3!3m5!1s0x94bfb90065c64549:0x2846b2a5a27acad5!8m2!3d-22.2222016!4d-49.6652474!16s%2Fg%2F11wp848pps?entry=ttu&g_ep=EgoyMDI2MDIwOC4wIKXMDSoASAFQAw%3D%3D",
        usinas: [
            { codigo: "GAR-01", uc: "4003638535" },
            { codigo: "GAR-02", uc: "4003638519" },
            { codigo: "GAR-03", uc: "4003639471" },
        ],
    },
    {
        nome: "Guarantã",
        cliente: "Ineer",
        cnpj: "",
        nomeSocial: "CONSORCIO LIMOEIRO ENERGIAS RENOVAVEIS",
        endereco: "5C4C+CV, Guarantã - SP, 16570-000",
        concessionaria: "CPFL Paulista",
        provedorInternet: "Starlink",
        CNPJ_internet: "57.171.677/0001-00",
        id_anydesk: "1083759725",
        senha_anydesk: "O&M@2030",
        senha_computador: "O&M@2030",
        mapsUrl: "https://www.google.com/maps/place/UFV+-+Guarant%C3%A3/@-23.063851,-52.3358006,7z/data=!4m10!1m3!11m2!2shodH8m0-QSWmuCzhDTcGCg!3e3!3m5!1s0x94be4f004f250bc9:0xdbe6c9220aa5dd4b!8m2!3d-21.8465179!4d-49.5745913!16s%2Fg%2F11lw4lh5j8?entry=ttu&g_ep=EgoyMDI2MDIwOC4wIKXMDSoASAFQAw%3D%3D",
        usinas: [
            { codigo: "GUA-01", uc: "4003725032" },
            { codigo: "GUA-02", uc: "4003725297" },
        ],
    },
    {
        nome: "Itu",
        cliente: "Ineer",
        cnpj: "51.356.620/0001-07",
        nomeSocial: "CONSORCIO LIMOEIRO ENERGIAS RENOVAVEIS",
        endereco: "RODOVIA CASTELO BRANCO, KM 84, CEP: 18105-125 - FAZENDA QUEBRA GALHOS",
        concessionaria: "CPFL Paulista",
        provedorInternet: "Starlink",
        CNPJ_internet: "57.171.677/0001-00",
        id_anydesk: "1008331544",
        senha_anydesk: "O&M@2030",
        senha_computador: "O&M@2030",
        mapsUrl: "https://www.google.com/maps/place/UFV+-+Itu/@-23.063851,-52.3358006,7z/data=!4m10!1m3!11m2!2shodH8m0-QSWmuCzhDTcGCg!3e3!3m5!1s0x94cf59004c036871:0x377d2b3f99c81e3c!8m2!3d-23.3667896!4d-47.3941308!16s%2Fg%2F11wx0sv6g0?entry=ttu&g_ep=EgoyMDI2MDIwOC4wIKXMDSoASAFQAw%3D%3D",
        usinas: [
            { codigo: "ITU-01", uc: "4003727916" },
            { codigo: "ITU-02", uc: "4003416513" },
            { codigo: "ITU-03", uc: "4003727936" },
            { codigo: "ITU-04", uc: "4003728573" },
        ],
    },
    {
        nome: "Laranjal Paulista",
        cliente: "Ineer",
        cnpj: "36.538.339/0001-93",
        nomeSocial: "CONSORCIO LIMOEIRO ENERGIAS RENOVAVEIS",
        endereco: "Estr. Vicinal Giovanni Costa",
        concessionaria: "Elektro",
        provedorInternet: "Zaaz",
        CNPJ_internet: "36.538.339/0001-93",
        id_anydesk: "927665734",
        senha_anydesk: "O&M@2030",
        senha_computador: "LrJ@2102",
        mapsUrl: "https://www.google.com/maps/place/UFV+-+Laranjal+paulista/@-23.063851,-52.3358006,7z/data=!4m10!1m3!11m2!2shodH8m0-QSWmuCzhDTcGCg!3e3!3m5!1s0x94c669005242c7c3:0x8c66b359703910a1!8m2!3d-23.063851!4d-47.8533787!16s%2Fg%2F11y6dbhvdc?entry=ttu&g_ep=EgoyMDI2MDIwOC4wIKXMDSoASAFQAw%3D%3D",
        usinas: [
            { codigo: "LRJ-01", uc: "45952248" },
            { codigo: "LRJ-02", uc: "45952256" },
            { codigo: "LRJ-03", uc: "45952272" },
        ],
    },
    {
        nome: "Leopoldo de Bulhões",
        cliente: "Ineer",
        cnpj: "45.655.452/0001-40",
        nomeSocial: "CONSORCIO LIMOEIRO ENERGIAS RENOVAVEIS",
        endereco: "Fazenda Boa Vista das Caldas",
        concessionaria: "Equatorial - GO",
        mapsUrl: "https://www.google.com/maps/place/UFV+-+Leopoldo+de+Bulhoes/@-19.9355945,-55.0322168,7z/data=!4m10!1m3!11m2!2shodH8m0-QSWmuCzhDTcGCg!3e3!3m5!1s0x935ec97ad9556251:0x14b31eadc40b4584!8m2!3d-16.5547547!4d-48.8469399!16s%2Fg%2F11vhq9dkgp?entry=ttu&g_ep=EgoyMDI2MDIwOC4wIKXMDSoASAFQAw%3D%3D",
        provedorInternet: "Tecnet",
        CNPJ_internet: "45.655.452/0001-40",
        id_anydesk: "1074487459",
        senha_anydesk: "O&M@2030",
        senha_computador: "Aya@2025!",
        usinas: [
            { codigo: "BLH-01", uc: "10035875494" },
            { codigo: "BLH-02", uc: "10035875508" },
            { codigo: "BLH-03", uc: "10035875516" },
        ],
    },
    {
        nome: "Mineiros",
        cliente: "Ineer",
        cnpj: "31.322.661/0001-67",
        nomeSocial: "CONSORCIO LIMOEIRO ENERGIAS RENOVAVEIS",
        endereco: "Mineiros - GO, 75830-000",
        concessionaria: "Equatorial - GO",
        CNPJ_internet: "46.057.602/0001-86",
        id_anydesk: "1924306865",
        senha_anydesk: "area281@2026",
        senha_computador: "@Mesdes2026@",
        mapsUrl: "https://www.google.com/maps/place/UFV+-+Mineiros/@-19.9355945,-55.0322168,7z/data=!4m10!1m3!11m2!2shodH8m0-QSWmuCzhDTcGCg!3e3!3m5!1s0x93633b00477dcc0d:0xa83c295401bf630e!8m2!3d-17.4411551!4d-52.4836818!16s%2Fg%2F11y6rkbd6_?entry=ttu&g_ep=EgoyMDI2MDIwOC4wIKXMDSoASAFQAw%3D%3D",
        provedorInternet: "Link",
        usinas: [
            { codigo: "MNR-01", uc: "10035146999" },
            { codigo: "MNR-02", uc: "10035147006" },
            { codigo: "MNR-03", uc: "10035147022" },
            { codigo: "MNR-04", uc: "10035147057" },
            { codigo: "MNR-05", uc: "10035147065" },
        ],
    },
    {
        nome: "Monte Aprazível",
        cliente: "Ineer",
        cnpj: "46.245.567/0002-00",
        nomeSocial: "CONSORCIO LIMOEIRO ENERGIAS RENOVAVEIS",
        endereco: "crt 073a 634 S/N1",
        concessionaria: "CPFL Paulista",
        provedorInternet: "Genesys",
        CNPJ_internet: "46.245.567/0001-29",
        id_anydesk: "1453576692",
        senha_anydesk: "O&M@2030",
        senha_computador: "O&M@2030",
        mapsUrl: "https://www.google.com/maps/place/UFV+-+Monte+apraz%C3%ADvel/@-19.9355945,-55.0322168,7z/data=!4m10!1m3!11m2!2shodH8m0-QSWmuCzhDTcGCg!3e3!3m5!1s0x94bd9f004d72e89f:0xa3fbc9ebe8f363f1!8m2!3d-20.7921188!4d-49.7122375!16s%2Fg%2F11w3kf2_02?entry=ttu&g_ep=EgoyMDI2MDIwOC4wIKXMDSoASAFQAw%3D%3D",
        usinas: [{ codigo: "MAP-01", uc: "4003451571" }],
    },
    {
        nome: "Pirangi",
        cliente: "Ineer",
        cnpj: "46.477.763/0001-29",
        nomeSocial: "CONSORCIO LIMOEIRO ENERGIAS RENOVAVEIS",
        endereco: "Rod. Comendador Pedro Monteleone, KM 177 / 178",
        concessionaria: "CPFL Paulista",
        provedorInternet: "Starlink",
        CNPJ_internet: "57.171.677/0001-00",
        id_anydesk: "1619218649",
        senha_anydesk: "O&M@2030",
        senha_computador: "@Mendes2023@",
        mapsUrl: "https://www.google.com/maps/place/UFV+-+Pirangi/@-19.9355945,-55.0322168,7z/data=!4m10!1m3!11m2!2shodH8m0-QSWmuCzhDTcGCg!3e3!3m5!1s0x94bbff0049c184c7:0xd6e495effbfd93c9!8m2!3d-21.0462222!4d-48.6468056!16s%2Fg%2F11w1cqhh70?entry=ttu&g_ep=EgoyMDI2MDIwOC4wIKXMDSoASAFQAw%3D%3D",
        usinas: [{ codigo: "PRG-01", uc: "4003451499" }],
    },
    {
        nome: "Pirassununga",
        cliente: "Ineer",
        cnpj: "50.963.782/0001-32",
        nomeSocial: "CONSORCIO LIMOEIRO ENERGIAS RENOVAVEIS",
        endereco: "ROD SP-225 SENTIDO PIRAS/ANALANDIA KM 51",
        concessionaria: "Elektro",
        mapsUrl: "https://www.google.com/maps/place/UFV+-+Pirassununga/@-19.9355945,-55.0322168,7z/data=!4m10!1m3!11m2!2shodH8m0-QSWmuCzhDTcGCg!3e3!3m5!1s0x94c80700177354f5:0x350e452fa778eeaf!8m2!3d-22.047492!4d-47.448122!16s%2Fg%2F11x6dvrw2z?entry=ttu&g_ep=EgoyMDI2MDIwOC4wIKXMDSoASAFQAw%3D%3D",
        provedorInternet: "Starlink",
        CNPJ_internet: "57.171.677/0001-00",
        id_anydesk: "290291863",
        senha_anydesk: "O&M@2030",
        senha_computador: "usuario01",
        usinas: [
            { codigo: "PIR-01", uc: "45944873" },
            { codigo: "PIR-02", uc: "45944865" },
        ],
    },
    {
        nome: "Pirassununga (Kamai)",
        cliente: "Kamai",
        cnpj: "",
        nomeSocial: "",
        endereco: "ROD SP-225 SENTIDO PIRAS/ANALANDIA KM 51",
        concessionaria: "Elektro",
        provedorInternet: "Starlink",
        CNPJ_internet: "57.171.677/0001-00",
        id_anydesk: "1855200825",
        senha_anydesk: "19Geicke*!",
        senha_computador: "19Geicke*!",
        usinas: [
            { codigo: "PIRA-01", uc: "46761306" },
            { codigo: "PIRA-02", uc: "46760881" },
            { codigo: "PIRA-03", uc: "46760134" },
        ],
    },
    {
        nome: "Populina",
        cliente: "Ineer",
        cnpj: "51.199.970/0001-07",
        nomeSocial: "EGD 5 LTDA",
        endereco: "Estrada Vicinal Salvador Canci, 15670-000",
        concessionaria: "Elektro",
        mapsUrl: "https://www.google.com/maps/place/UFV+-+Populina/@-19.9355945,-55.0322168,7z/data=!4m10!1m3!11m2!2shodH8m0-QSWmuCzhDTcGCg!3e3!3m5!1s0x94984f007bda1e95:0xc3a9defc932c709d!8m2!3d-19.9355945!4d-50.5497949!16s%2Fg%2F11y9c_hn99?entry=ttu&g_ep=EgoyMDI2MDIwOC4wIKXMDSoASAFQAw%3D%3D",
        provedorInternet: "AZARITI TELECOMUNICAÇÕES",
        CNPJ_internet: "51.199.970/0001-07",
        id_anydesk: "1440992863",
        senha_anydesk: "O&M@2030",
        senha_computador: "usuario01",
        usinas: [
            { codigo: "PPL-01", uc: "44719485" },
            { codigo: "PPL-02", uc: "45062749" },
        ],
    },
    {
        nome: "Reginópolis",
        cliente: "Ineer",
        cnpj: "46.802.966/0001-43",
        nomeSocial: "CONSORCIO LIMOEIRO ENERGIAS RENOVAVEIS",
        endereco: "3300 R. Miguel Raduan",
        mapsUrl: "https://www.google.com/maps/place/UFV+-+Regin%C3%B3polis/@-19.9975996,-50.8325443,7z/data=!4m10!1m3!11m2!2shodH8m0-QSWmuCzhDTcGCg!3e3!3m5!1s0x94befd00603117ad:0xf8408cb5e54b093c!8m2!3d-21.8680278!4d-49.2198611!16s%2Fg%2F11vzqfc92q?entry=ttu&g_ep=EgoyMDI2MDIwOC4wIKXMDSoASAFQAw%3D%3D",
        concessionaria: "CPFL Paulista",
        provedorInternet: "Starlink",
        CNPJ_internet: "57.171.677/0001-00",
        id_anydesk: "1822255428",
        senha_anydesk: "O&M@2030",
        senha_computador: "O&M@2030",
        usinas: [
            { codigo: "RGN-01", uc: "4003546480" },
            { codigo: "RGN-02", uc: "4003546345", concessionaria: "CPFL" },
            { codigo: "RGN-03", uc: "4003546101", concessionaria: "CPFL" },
            { codigo: "RGN-04", uc: "4003546252", concessionaria: "CPFL" },
        ],
    },
    {
        nome: "Ribeirão Bonito",
        cliente: "Ineer",
        cnpj: "45.655.904/0001-93",
        nomeSocial: "CONSORCIO LIMOEIRO ENERGIAS RENOVAVEIS",
        endereco: "ROD LUIS AUGUSTO DE OLIVEIRA - AREA RUAL",
        mapsUrl: "https://www.google.com/maps/place/UFV+-+Ribeir%C3%A3o+bonito/@-19.9975996,-50.8325443,7z/data=!4m10!1m3!11m2!2shodH8m0-QSWmuCzhDTcGCg!3e3!3m5!1s0x94b885001ce77f1f:0x499b76216aaf3df5!8m2!3d-22.0901821!4d-48.2259563!16s%2Fg%2F11ywdg777x?entry=ttu&g_ep=EgoyMDI2MDIwOC4wIKXMDSoASAFQAw%3D%3D",
        concessionaria: "CPFL Paulista",
        provedorInternet: "Starlink",
        CNPJ_internet: "57.171.677/0001-00",
        id_anydesk: "1521415513",
        senha_anydesk: "O&M@2030",
        senha_computador: "O&M@2030",
        usinas: [
            { codigo: "RBB-01", uc: "4003447405" },
            { codigo: "RBB-02", uc: "4003447374" },
            { codigo: "RBB-03", uc: "4003447300" },
            { codigo: "RBB-04", uc: "4003446863" },
            { codigo: "RBB-05", uc: "4003447339" },
        ],
    },
    {
        nome: "Rincão",
        cliente: "Ineer",
        cnpj: "",
        nomeSocial: "",
        endereco: "Av. Albérico D Alessandro, 209-1, Rincão - SP, 14830-000",
        concessionaria: "CPFL Paulista",
        provedorInternet: "Starlink",
        CNPJ_internet: "57.171.677/0001-00",
        id_anydesk: "1051957013",
        senha_anydesk: "O&M@2030",
        senha_computador: "O&M@2030",
        usinas: [
            { codigo: "RIN-01", uc: "4003679548" },
            { codigo: "RIN-02", uc: "4003699699" },
            { codigo: "RIN-03", uc: "4003699973" },
            { codigo: "RIN-04", uc: "4003715198" },
        ],
    },
    {
        nome: "São Bento 3",
        cliente: "Ineer",
        cnpj: "45.656.242/0001-76",
        nomeSocial: "CONSORCIO LIMOEIRO ENERGIAS RENOVAVEIS",
        endereco: "M35Q+83 - Conservatória, Valença - RJ, 27600-000",
        concessionaria: "Light",
        provedorInternet: "PegaNet",
        CNPJ_internet: "48.126.682/0001-00",
        id_anydesk: "1248312142",
        senha_anydesk: "O&M@2030",
        senha_computador: "O&M@2030",
        usinas: [{ codigo: "SB3-01", uc: "430385950" }],
    },
    {
        nome: "São Bento 6",
        cliente: "Ineer",
        cnpj: "45.574.629/0002-64",
        nomeSocial: "CONSORCIO LIMOEIRO ENERGIAS RENOVAVEIS",
        endereco: "Conservatória, Valença - State of Rio de Janeiro, 27600-000",
        concessionaria: "Light",
        provedorInternet: "Starlink",
        CNPJ_internet: "57.171.677/0001-00",
        id_anydesk: "681143651",
        senha_anydesk: "O&M@2030",
        senha_computador: "usuario01",
        usinas: [
            { codigo: "SB6-01", uc: "430389892" },
            { codigo: "SB6-02", uc: "430386751" },
        ],
    },
];

/* =========================================================
   HELPERS
========================================================= */

function norm(s: string) {
    return (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function mapsHref(addr: string) {
    const q = encodeURIComponent(addr || "");
    return q ? `https://www.google.com/maps/search/?api=1&query=${q}` : "";
}

async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}

function joinClean(parts: Array<string | undefined | null>) {
    return parts
        .map((x) => (x || "").trim())
        .filter(Boolean)
        .join("\n");
}

function buildCopyAll(u: UfvItem) {
    const mapLink = u.mapsUrl || (u.endereco ? mapsHref(u.endereco) : "");

    const lines = [
        `UFV: ${u.nome || "-"}`,
        u.cliente ? `Cliente: ${u.cliente}` : "",
        u.cnpj ? `CNPJ: ${u.cnpj}` : "",
        u.nomeSocial ? `Nome social: ${u.nomeSocial}` : "",
        u.concessionaria ? `Concessionária: ${u.concessionaria}` : "",
        u.provedorInternet ? `Internet: ${u.provedorInternet}` : "",
        u.CNPJ_internet ? `CNPJ Internet: ${u.CNPJ_internet}` : "",
        u.id_anydesk ? `AnyDesk ID: ${u.id_anydesk}` : "",
        u.senha_anydesk ? `AnyDesk Senha: ${u.senha_anydesk}` : "",
        u.senha_computador ? `Senha Computador: ${u.senha_computador}` : "",
        u.endereco ? `Endereço: ${u.endereco}` : "",
        mapLink ? `Maps: ${mapLink}` : "",
        "",
        "Usinas / UCs:",
        ...(u.usinas || []).map((x) =>
            joinClean([
                `- ${x.codigo || "-"}`,
                x.uc ? `  UC: ${x.uc}` : "",
                x.concessionaria ? `  Concessionária: ${x.concessionaria}` : "",
            ])
        ),
    ];

    return lines.filter(Boolean).join("\n");
}

function maskedValue(v?: string, masked?: boolean) {
    if (!v) return "—";
    return masked ? "••••••••••" : v;
}

/* =========================================================
   SMALL COPY BUTTON
========================================================= */

function CopyIconBtn({ text, title }: { text: string; title: string }) {
    const [ok, setOk] = useState(false);

    return (
        <button
            type="button"
            className="h-9 w-9 border rounded-md inline-flex items-center justify-center"
            style={{ borderColor: T.border, background: T.card, color: T.text2 }}
            title={title}
            onClick={async (e) => {
                e.stopPropagation();
                if (!text?.trim()) return;
                const res = await copyToClipboard(text);
                setOk(res);
                window.setTimeout(() => setOk(false), 800);
            }}
        >
            {ok ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
    );
}

/* =========================================================
   PAGE
========================================================= */

export function UsinasContent() {
    return <UsinasBase />;
}

function UsinasBase() {
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const [q, setQ] = useState("");
    const [cliente, setCliente] = useState("");
    const [concessionaria, setConcessionaria] = useState("");
    const [provedor, setProvedor] = useState("");
    const [showSecrets, setShowSecrets] = useState(false);

    const [openName, setOpenName] = useState<string | null>(null);

    const allClientes = useMemo(() => {
        const s = new Set<string>();
        for (const u of UFVS) if (u.cliente) s.add(u.cliente);
        return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, []);

    const allConcessionarias = useMemo(() => {
        const s = new Set<string>();
        for (const u of UFVS) if (u.concessionaria) s.add(u.concessionaria);
        return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, []);

    const allProvedores = useMemo(() => {
        const s = new Set<string>();
        for (const u of UFVS) if (u.provedorInternet) s.add(u.provedorInternet);
        return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, []);

    const filtered = useMemo(() => {
        const qq = norm(q);

        return UFVS.filter((u) => {
            if (cliente && u.cliente !== cliente) return false;
            if (concessionaria && u.concessionaria !== concessionaria) return false;
            if (provedor && u.provedorInternet !== provedor) return false;

            if (!qq) return true;

            const bag = [
                u.nome,
                u.cliente,
                u.cnpj,
                u.nomeSocial,
                u.endereco,
                u.mapsUrl,
                u.concessionaria,
                u.provedorInternet,
                u.CNPJ_internet,
                u.id_anydesk,
                ...(u.usinas || []).flatMap((x) => [x.codigo, x.uc, x.concessionaria]),
            ]
                .filter(Boolean)
                .join(" | ");

            return norm(bag).includes(qq);
        }).sort((a, b) => a.nome.localeCompare(b.nome));
    }, [q, cliente, concessionaria, provedor]);

    const clearFilters = () => {
        setQ("");
        setCliente("");
        setConcessionaria("");
        setProvedor("");
    };

    const summary = useMemo(() => {
        const parts = [
            q ? `Busca: "${q}"` : null,
            cliente ? `Cliente: ${cliente}` : null,
            concessionaria ? `Concessionária: ${concessionaria}` : null,
            provedor ? `Provedor: ${provedor}` : null,
        ].filter(Boolean);
        return parts.join(" • ") || "Sem filtros";
    }, [q, cliente, concessionaria, provedor]);

    return (
        <section className={UI.page} style={{ background: T.bg, color: T.text }}>
            <div className={UI.container}>
                {/* HEADER */}
                <div className={cx(UI.header, "p-4 sm:p-5 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                            <div className={UI.headerTitle} style={{ color: T.text }}>
                                Informações das Usinas
                            </div>
                            <div className={cx(UI.headerSub, "mt-1")} style={{ color: T.text3 }}>
                                Pesquisa rápida + filtros. Clique no card para abrir <span style={{ color: T.text2, fontWeight: 600 }}>detalhes</span>{" "}
                                e ações.
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Pill>{summary}</Pill>
                                <Pill>
                                    Exibindo: <b style={{ color: T.text }}>{filtered.length}</b> / {UFVS.length}
                                </Pill>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">

                            <Btn tone="secondary" onClick={clearFilters}>
                                Limpar
                            </Btn>
                        </div>
                    </div>
                </div>

                {/* BODY */}
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    {/* FILTERS */}
                    <aside className="lg:col-span-4 xl:col-span-3">
                        <div className={cx(UI.section, "p-4 rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className={UI.sectionTitle} style={{ color: T.text }}>
                                        Filtros
                                    </div>
                                    <div className={cx(UI.sectionHint, "mt-1")} style={{ color: T.text3 }}>
                                        Ajusta e a lista atualiza.
                                    </div>
                                </div>
                                <Pill>{filtered.length} resultados</Pill>
                            </div>

                            <div className="mt-4 grid gap-4">
                                <div>
                                    <label className={UI.label} style={{ color: T.text2 }}>
                                        Buscar
                                    </label>
                                    <div className="relative mt-1">
                                        <input
                                            value={q}
                                            onChange={(e) => setQ(e.target.value)}
                                            className={cx(UI.input, "rounded-md pr-9")}
                                            style={{ borderColor: T.border, color: T.text }}
                                            placeholder="UC, CNPJ, Endereço…"
                                        />
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: T.text3 }}>
                                            <Search className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className={UI.label} style={{ color: T.text2 }}>
                                        Cliente
                                    </label>
                                    <select
                                        value={cliente}
                                        onChange={(e) => setCliente(e.target.value)}
                                        className={cx(UI.select, "mt-1 rounded-md")}
                                        style={{ borderColor: T.border }}
                                    >
                                        <option value="">Todos</option>
                                        {allClientes.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={UI.label} style={{ color: T.text2 }}>
                                        Concessionária
                                    </label>
                                    <select
                                        value={concessionaria}
                                        onChange={(e) => setConcessionaria(e.target.value)}
                                        className={cx(UI.select, "mt-1 rounded-md")}
                                        style={{ borderColor: T.border }}
                                    >
                                        <option value="">Todas</option>
                                        {allConcessionarias.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={UI.label} style={{ color: T.text2 }}>
                                        Provedor de internet
                                    </label>
                                    <select
                                        value={provedor}
                                        onChange={(e) => setProvedor(e.target.value)}
                                        className={cx(UI.select, "mt-1 rounded-md")}
                                        style={{ borderColor: T.border }}
                                    >
                                        <option value="">Todos</option>
                                        {allProvedores.map((p) => (
                                            <option key={p} value={p}>
                                                {p}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <MsgBox m={msg} />
                            </div>
                        </div>
                    </aside>

                    {/* LIST */}
                    <main className="lg:col-span-8 xl:col-span-9">
                        <div className={cx(UI.section, "rounded-lg")} style={{ borderColor: T.border, background: T.card }}>
                            <div className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: T.border }}>
                                <div className="flex items-center gap-2">
                                    <Pill>Dados confidenciais</Pill>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Pill>Total: {filtered.length}</Pill>
                                </div>
                            </div>

                            <div className="p-4">
                                {filtered.length === 0 ? (
                                    <div className="border rounded-lg p-4 text-sm" style={{ borderColor: T.border, background: T.mutedBg, color: T.text2 }}>
                                        Nenhuma UFV encontrada para os filtros selecionados.
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {filtered.map((u) => {
                                            const opened = openName === u.nome;
                                            const mapLink = u.mapsUrl || (u.endereco ? mapsHref(u.endereco) : "");
                                            const copyAll = buildCopyAll(u);

                                            return (
                                                <div key={u.nome} className="border rounded-lg" style={{ borderColor: T.border, background: T.card }}>
                                                    {/* header row */}
                                                    <div
                                                        role="button"
                                                        tabIndex={0}
                                                        className="w-full text-left p-4 transition cursor-default select-none"
                                                        style={{ color: T.text }}
                                                        onClick={() => setOpenName((p) => (p === u.nome ? null : u.nome))}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" || e.key === " ") {
                                                                e.preventDefault();
                                                                setOpenName((p) => (p === u.nome ? null : u.nome));
                                                            }
                                                        }}
                                                        title="Clique para abrir detalhes"
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-sm font-semibold" style={{ color: T.text }}>
                                                                        {u.nome}
                                                                    </span>
                                                                    {u.cliente ? <Pill>{u.cliente}</Pill> : null}
                                                                    {u.concessionaria ? <Pill>{u.concessionaria}</Pill> : null}
                                                                    {/* {u.provedorInternet ? <Pill>{u.provedorInternet}</Pill> : null} */}
                                                                    <Pill>{u.usinas?.length || 0} UCs</Pill>
                                                                </div>

                                                                <div className="mt-2 text-xs" style={{ color: T.text3 }}>
                                                                    Clique para visualizar mais informações.
                                                                </div>
                                                            </div>

                                                            {/* actions */}
                                                            <div className="flex items-center gap-2">
                                                                {/* <CopyIconBtn text={u.nome} title="Copiar UFV" />
                                <CopyIconBtn text={u.id_anydesk || ""} title="Copiar AnyDesk ID" />
                                <CopyIconBtn text={u.senha_anydesk || ""} title="Copiar Senha AnyDesk" /> */}
                                                                {mapLink ? (
                                                                    <a
                                                                        href={mapLink}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="h-9 w-9 border rounded-md inline-flex items-center justify-center"
                                                                        style={{ borderColor: T.border, background: T.card, color: T.text2 }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        title="Abrir no Maps"
                                                                    >
                                                                        <MapPin className="w-4 h-4" />
                                                                    </a>
                                                                ) : null}

                                                                <button
                                                                    type="button"
                                                                    className="h-9 w-9 border rounded-md inline-flex items-center justify-center"
                                                                    style={{ borderColor: T.border, background: T.card, color: T.text2 }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setOpenName((p) => (p === u.nome ? null : u.nome));
                                                                    }}
                                                                    title="Detalhes"
                                                                >
                                                                    <ChevronDown className={cx("w-4 h-4 transition", opened && "rotate-180")} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* details */}
                                                    {opened && (
  <div className="px-4 pb-4">
    <div
      className="border rounded-lg p-4"
      style={{ borderColor: T.border, background: T.mutedBg }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* CNPJ */}
        <div
          className="border rounded-lg p-3"
          style={{ borderColor: "rgba(17,24,39,0.08)", background: T.card }}
        >
          <div className="flex items-start gap-2">
            <IdCard className="w-4 h-4 mt-0.5" style={{ color: T.text3 }} />
            <div className="min-w-0 w-full">
              <div className={UI.label} style={{ color: T.text2 }}>
                CNPJ
              </div>

              <div className="mt-1 flex items-center gap-2">
                <div className="min-w-0 flex-1 text-sm truncate" style={{ color: T.text }}>
                  {u.cnpj || "—"}
                </div>
                <CopyIconBtn text={u.cnpj || ""} title="Copiar CNPJ" />
              </div>
            </div>
          </div>
        </div>

        {/* Endereço + Maps */}
        <div
          className="border rounded-lg p-3"
          style={{ borderColor: "rgba(17,24,39,0.08)", background: T.card }}
        >
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5" style={{ color: T.text3 }} />
            <div className="min-w-0 w-full">
              <div className={UI.label} style={{ color: T.text2 }}>
                Endereço
              </div>

              <div className="mt-1 flex items-start gap-2">
                <div className="min-w-0 flex-1 text-sm leading-relaxed" style={{ color: T.text }}>
                  {u.endereco || "—"}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <CopyIconBtn text={u.endereco || ""} title="Copiar endereço" />

                  {(() => {
                    const link = u.mapsUrl || (u.endereco ? mapsHref(u.endereco) : "");
                    if (!link) return null;

                    return (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="h-9 px-3 border rounded-md inline-flex items-center gap-2 text-sm font-semibold"
                        style={{ borderColor: T.border, background: T.card, color: T.text }}
                        title="Abrir no Maps"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Maps
                      </a>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AnyDesk + Senhas */}
        <div
          className="border rounded-lg p-3"
          style={{ borderColor: "rgba(17,24,39,0.08)", background: T.card }}
        >
          <div className="flex items-start gap-2">
            <Laptop className="w-4 h-4 mt-0.5" style={{ color: T.text3 }} />
            <div className="min-w-0 w-full">
              <div className={UI.label} style={{ color: T.text2 }}>
                AnyDesk / Acesso
              </div>

              {/* ID */}
              <div className="mt-1 flex items-center gap-2">
                <div className="min-w-0 flex-1 text-sm truncate" style={{ color: T.text }}>
                  ID: {u.id_anydesk || "—"}
                </div>
                <CopyIconBtn text={u.id_anydesk || ""} title="Copiar AnyDesk ID" />
              </div>

              {/* Senha AnyDesk */}
              <div className="mt-2 flex items-center gap-2">
                <div className="min-w-0 flex-1 text-sm truncate" style={{ color: T.text2 }}>
                  Senha: {maskedValue(u.senha_anydesk, !showSecrets) || "—"}
                </div>
                <CopyIconBtn text={u.senha_anydesk || ""} title="Copiar Senha AnyDesk" />
              </div>

              {/* Senha do PC */}
              <div className="mt-2 flex items-center gap-2">
                <div className="min-w-0 flex-1 text-sm truncate" style={{ color: T.text2 }}>
                  Senha do PC: {maskedValue(u.senha_computador, !showSecrets) || "—"}
                </div>
                <CopyIconBtn text={u.senha_computador || ""} title="Copiar senha computador" />
              </div>
            </div>
          </div>
        </div>

        {/* Internet */}
        <div
          className="border rounded-lg p-3"
          style={{ borderColor: "rgba(17,24,39,0.08)", background: T.card }}
        >
          <div className="flex items-start gap-2">
            <PlugZap className="w-4 h-4 mt-0.5" style={{ color: T.text3 }} />
            <div className="min-w-0 w-full">
              <div className={UI.label} style={{ color: T.text2 }}>
                Internet
              </div>

              {/* Provedor */}
              <div className="mt-1 flex items-center gap-2">
                <div className="min-w-0 flex-1 text-sm truncate" style={{ color: T.text }}>
                  {u.provedorInternet || "—"}
                </div>
                <CopyIconBtn text={u.provedorInternet || ""} title="Copiar provedor" />
              </div>

              {/* CNPJ Internet */}
              <div className="mt-2 flex items-center gap-2">
                <div className="min-w-0 flex-1 text-sm truncate" style={{ color: T.text2 }}>
                  CNPJ: {u.CNPJ_internet || "—"}
                </div>
                <CopyIconBtn text={u.CNPJ_internet || ""} title="Copiar CNPJ internet" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UCs */}
      <div className="mt-4">
        <div className={UI.label} style={{ color: T.text2 }}>
          Usinas / UCs (clique para copiar)
        </div>

        <div className="mt-2 grid gap-2">
          {(u.usinas || []).map((x) => {
            const subtitle = [x.uc ? `UC ${x.uc}` : "", x.concessionaria || ""]
              .filter(Boolean)
              .join(" • ");

            const toCopy = joinClean([
              `UFV: ${u.nome}`,
              `Usina: ${x.codigo || "-"}`,
              x.uc ? `UC: ${x.uc}` : "",
              x.concessionaria ? `Concessionária: ${x.concessionaria}` : "",
            ]);

            return (
              <button
                key={x.codigo + x.uc}
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  const ok = await copyToClipboard(toCopy);
                  setMsg(ok ? { type: "ok", text: "Copiado ✅" } : { type: "err", text: "Falha ao copiar." });
                  window.setTimeout(() => setMsg(null), 900);
                }}
                className="w-full text-left rounded-md border px-3 py-2 flex items-start justify-between gap-3 transition"
                style={{ borderColor: "rgba(17,24,39,0.10)", background: T.card }}
                title="Copiar"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: T.text }}>
                    {x.codigo}
                  </div>
                  <div className="text-xs truncate" style={{ color: T.text3 }}>
                    {subtitle || "—"}
                  </div>
                </div>

                <span className="h-8 w-8 grid place-items-center rounded-md border"
                  style={{ borderColor: "rgba(17,24,39,0.10)", background: "transparent" }}
                >
                  <Copy className="w-4 h-4" style={{ color: T.text3 }} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  </div>
)}


                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Global focus ring token */}
            <style jsx global>{`
        input:focus,
        select:focus {
          outline: none !important;
          box-shadow: 0 0 0 2px ${T.accentRing} !important;
        }
      `}</style>
        </section>
    );
}
