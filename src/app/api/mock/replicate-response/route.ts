import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({
    message: "This is a mock response from the Replicate API. The API key is not configured in this deployment.",
    output: [
      "https://replicate-api-placeholder-image.example/mock-generated-image.png"
    ]
  });
} 