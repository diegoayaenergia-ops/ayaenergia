import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // garante Node runtime (evita edge + env doido)

function envOrThrow(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function GET() {
  try {
    const supabase = createClient(
      envOrThrow("SUPABASE_URL"),
      envOrThrow("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );

    // ✅ TROQUE AQUI pelo nome REAL da tabela
    const TABLE = "drives";
    // ✅ TROQUE AQUI se a coluna não for "usina"
    const COL = "usina";

    // Puxa distinct já do banco
    const { data, error } = await supabase
      .from(TABLE)
      .select(`${COL}`)
      .not(COL, "is", null);

    if (error) {
      return NextResponse.json(
        { error: error.message, hint: "Tabela/coluna errada ou permissão/RLS" },
        { status: 500 }
      );
    }

    const list = Array.from(
      new Set(
        (data || [])
          .map((r: any) => String(r?.[COL] ?? "").trim())
          .filter(Boolean)
          .map((s) => s.toUpperCase())
      )
    ).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ usinas: list, count: list.length });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
