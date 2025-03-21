import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function POST() {
  return NextResponse.json({
    message: "This is a mock response from the OpenAI API. The API key is not configured in this deployment.",
    content: "I'm a mock AI assistant. The OpenAI API is not available in this deployment."
  });
} 