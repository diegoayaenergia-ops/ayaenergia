import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const empresa = body.empresa?.trim();
    const oldPassword = body.oldPassword?.trim();
    const newPassword = body.newPassword?.trim();

    console.log("EMPRESA:", empresa);
    console.log("OLD PASS DIGITADA:", oldPassword);

    if (!empresa || !oldPassword || !newPassword) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      );
    }

    const { data: client, error } = await supabase
      .from("clients")
      .select("*")
      .eq("client_name", empresa)
      .single();

    console.log("CLIENT DO BANCO:", client);

    if (error || !client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    console.log("SENHA NO BANCO:", client.password);

    // ✅ COMPARAÇÃO CORRETA (coluna password)
    if (String(client.password).trim() !== oldPassword) {
      return NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 401 }
      );
    }

    // ✅ ATUALIZA NA COLUNA CERTA
    const { error: updateError } = await supabase
      .from("clients")
      .update({ password: newPassword })
      .eq("id", client.id);

    if (updateError) {
      console.error("UPDATE ERROR:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar senha" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CHANGE PASSWORD FATAL:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
