// app/api/acionamentos/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ⚠️ ajuste se seus nomes de tabela forem outros
const TABLE_DRIVES = "drives";
const TABLE_LOSS = "loss";

function tableFromMode(mode: string) {
  return mode === "loss" ? TABLE_LOSS : TABLE_DRIVES;
}

const norm = (v: any) => (v === "" || v === undefined ? null : v);

const toNumOrNull = (v: any) => {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const mode = (searchParams.get("mode") || "drives").toLowerCase();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || "30"), 1), 500);
  const offset = Math.max(Number(searchParams.get("offset") || "0"), 0);

  const q = (searchParams.get("q") || "").trim();

  const usina = (searchParams.get("usina") || "").trim().toUpperCase();
  const equipamento = (searchParams.get("equipamento") || "").trim(); // opcional

  const start = (searchParams.get("start") || "").trim(); // YYYY-MM-DD
  const end = (searchParams.get("end") || "").trim();

  const table = tableFromMode(mode);

  // ✅ Evita “trazer a base inteira” (para drives)
  // ✅ NOVA REGRA: precisa start+end e (usina OU equipamento OU q)
  if (mode === "drives") {
    if (!start || !end) {
      return NextResponse.json(
        {
          rows: [],
          error: "Informe start + end para consultar drives.",
        },
        { status: 400 }
      );
    }
  }

  let query = supabase
    .from(table)
    .select("*")
    .order("data", { ascending: false })
    .range(offset, offset + limit - 1);

  // filtros
  if (usina) query = query.eq("usina", usina);
  if (equipamento && mode === "drives") query = query.eq("equipamento", equipamento);
  if (start) query = query.gte("data", start);
  if (end) query = query.lte("data", end);

  // busca (opcional)
  if (q) {
    if (mode === "drives") {
      query = query.or(
        [
          `usina.ilike.%${q}%`,
          `cliente.ilike.%${q}%`,
          `equipamento.ilike.%${q}%`,
          `alarme.ilike.%${q}%`,
          `motivo_mobilizacao.ilike.%${q}%`,
          `problema_identificado.ilike.%${q}%`,
          `solucao_imediata.ilike.%${q}%`,
          `solucao_definitiva.ilike.%${q}%`,
          `ss::text.ilike.%${q}%`,
        ].join(",")
      );
    } else {
      query = query.or([`usina.ilike.%${q}%`].join(","));
    }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const mode = String(body.mode || "drives").toLowerCase();
  const table = tableFromMode(mode);

  if (!body.data || !body.usina) {
    return NextResponse.json({ error: "Data e Usina são obrigatórias." }, { status: 400 });
  }

  if (mode === "drives") {
    const payload = {
      data: String(body.data), // YYYY-MM-DD
      semana: String(body.semana || ""),
      usina: String(body.usina).trim().toUpperCase(),

      cliente: norm(body.cliente),
      equipamento: norm(body.equipamento),
      alarme: norm(body.alarme),

      motivo_mobilizacao: norm(body.motivo_mobilizacao),
      problema_identificado: norm(body.problema_identificado),
      solucao_imediata: norm(body.solucao_imediata),
      solucao_definitiva: norm(body.solucao_definitiva),
      ss: toNumOrNull(body.ss),
    };

    const { data, error } = await supabase.from(table).insert(payload).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, id: data?.id });
  }

  // LOSS
  const payload = {
    data: String(body.data),
    usina: String(body.usina).trim().toUpperCase(),
    cmp: body.cmp ?? null,
    skid: body.skid ?? null,
    inversor: body.inversor ?? null,
    tcu: body.tcu ?? null,
    ncu: body.ncu ?? null,
    string: body.string ?? null,
  };

  const { data, error } = await supabase.from(table).insert(payload).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, id: data?.id });
}
