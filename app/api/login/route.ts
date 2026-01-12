import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { empresa, password } = await req.json();

    console.log("➡️ EMPRESA:", empresa);
    console.log("➡️ SENHA DIGITADA:", password);

    const { data: client, error } = await supabase
      .from("clients")
      .select("*")
      .eq("client_name", empresa)
      .single();

    console.log("➡️ CLIENT DO BANCO:", client);
    console.log("➡️ SUPABASE ERROR:", error);

    if (error || !client) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 401 }
      );
    }

    console.log("➡️ SENHA NO BANCO:", client.password);

    if (password !== client.password) {
      return NextResponse.json(
        { error: "Senha inválida" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: client.id,
      client_id: client.client_id,
      empresa: client.client_name,
      access: client.access,
    });
  } catch (err) {
    console.error("🔥 ERRO LOGIN:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
