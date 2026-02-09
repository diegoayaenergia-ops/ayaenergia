// app/api/acionamentos/equipamentos/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "drives";
    if (mode !== "drives") {
      return NextResponse.json({ equipamentos: [] });
    }

    // pega distintos (sem view nativa, usamos select e dedupe)
    const { data, error } = await supabase
      .from("drives")
      .select("equipamento")
      .not("equipamento", "is", null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const set = new Set<string>();
    for (const row of data || []) {
      const v = String((row as any).equipamento || "").trim();
      if (v) set.add(v);
    }

    const equipamentos = Array.from(set).sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ equipamentos });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro inesperado" }, { status: 500 });
  }
}
