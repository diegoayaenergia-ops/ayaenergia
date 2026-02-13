import { NextResponse } from "next/server";

const BASE_URL = "https://get.api.sismetro.com/";

const UNIT = process.env.SISMETRO_UNIT ?? "484";
const KEY = process.env.SISMETRO_KEY ?? "SEU_TOKEN_AQUI";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: {
      unit: UNIT,
      key: KEY,
      "Cache-Control": "no-cache",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sismetro HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

export async function GET() {
  try {
    const first = await fetchJson(`${BASE_URL}SS/listAll?page=01`);

    const totalPages = Number(first?.totalPages ?? 1);
    const firstList = Array.isArray(first?.resultList) ? first.resultList : [];

    const pages: number[] = [];
    for (let p = 2; p <= totalPages; p++) pages.push(p);

    const concurrency = 6;
    const all: any[] = [...firstList];

    for (let i = 0; i < pages.length; i += concurrency) {
      const chunk = pages.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        chunk.map((p) => fetchJson(`${BASE_URL}SS/listAll?page=${pad2(p)}`))
      );

      for (const r of results) {
        if (r.status === "fulfilled") {
          const list = Array.isArray(r.value?.resultList) ? r.value.resultList : [];
          all.push(...list);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      totalPages,
      count: all.length,
      items: all,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Erro desconhecido" },
      { status: 500 }
    );
  }
}
