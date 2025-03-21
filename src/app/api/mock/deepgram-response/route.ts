import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    message: "This is a mock response from the Deepgram API. The API key is not configured in this deployment.",
    isConfigured: false
  });
} 