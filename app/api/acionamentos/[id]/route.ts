// app/api/acionamentos/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TABLE_DRIVES = "drives";
const TABLE_LOSS = "loss";

function tableFromMode(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode") || "drives").toLowerCase();
  return mode === "loss" ? TABLE_LOSS : TABLE_DRIVES;
}

const norm = (v: any) => (v === "" || v === undefined ? null : v);

const toNumOrNull = (v: any) => {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null; // se preferir, pode retornar erro
  return n;
};

function assertUuid(id: string) {
  const ok =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id
    );
  if (!ok) throw new Error(`ID inválido: ${id}`);
}

type Ctx = { params: Promise<{ id: string }> }; // ✅ Next 15

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    assertUuid(id);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const table = tableFromMode(req);

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  // ✅ payload de drives (novo) e loss (antigo) no mesmo endpoint
  const mode = new URL(req.url).searchParams.get("mode") || "drives";

  const payload =
    mode === "loss"
      ? {
          data: norm(body.data),
          usina: norm(body.usina),

          cmp: body.cmp ?? null,
          skid: body.skid ?? null,
          inversor: body.inversor ?? null,
          tcu: body.tcu ?? null,
          ncu: body.ncu ?? null,
          string: body.string ?? null,
        }
      : {
          data: norm(body.data),
          semana: norm(body.semana),
          usina: typeof body.usina === "string" ? body.usina.trim().toUpperCase() : norm(body.usina),

          cliente: norm(body.cliente),
          equipamento: norm(body.equipamento),
          alarme: norm(body.alarme),

          motivo_mobilizacao: norm(body.motivo_mobilizacao),
          problema_identificado: norm(body.problema_identificado),
          solucao_imediata: norm(body.solucao_imediata),
          solucao_definitiva: norm(body.solucao_definitiva),
          ss: toNumOrNull(body.ss),
        };

  const { error } = await supabase.from(table).update(payload).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    assertUuid(id);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const table = tableFromMode(req);

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
