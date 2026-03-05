// app/api/tecsci/health/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const apiKey = String(process.env.TECSCI_API_KEY || "").trim();
  const baseUrl = String(process.env.TECSCI_BASE_URL || "").trim();

  return NextResponse.json(
    {
      ok: true,
      vercelEnv: process.env.VERCEL_ENV || null, // production | preview | development
      hasKey: apiKey.length > 0,
      keyLen: apiKey.length,
      keyLast4: apiKey ? apiKey.slice(-4) : null,
      hasBaseUrl: baseUrl.length > 0,
      baseUrl: baseUrl || null,
      region: process.env.VERCEL_REGION || null,
      node: process.version,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}