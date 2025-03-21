import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.DEEPGRAM_API_KEY || null;
  
  if (!apiKey || apiKey === "") {
    return NextResponse.json({
      error: "Deepgram API key is not configured.",
      isConfigured: false
    });
  }
  
  return NextResponse.json({
    key: apiKey,
    isConfigured: true
  });
}
