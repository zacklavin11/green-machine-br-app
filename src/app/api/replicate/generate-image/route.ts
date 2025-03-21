import { NextResponse } from "next/server";
import Replicate from "replicate";

// Only create Replicate instance if valid token is available
const replicate = process.env.REPLICATE_API_TOKEN && 
                  process.env.REPLICATE_API_TOKEN !== "r8-placeholder" ? 
                  new Replicate({
                    auth: process.env.REPLICATE_API_TOKEN,
                  }) : null;

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    // Check if API token is valid
    if (!replicate) {
      return NextResponse.json(
        { 
          error: "Replicate API configuration is missing or invalid. Please set up a valid REPLICATE_API_TOKEN in the environment variables.",
          mockOutput: [
            "https://replicate-api-placeholder-image.example/mock-generated-image.png"
          ]
        },
        { status: 200 }
      );
    }

    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
      {
        input: {
          prompt: prompt,
          image_dimensions: "512x512",
          num_outputs: 1,
          num_inference_steps: 50,
          guidance_scale: 7.5,
          scheduler: "DPMSolverMultistep",
        },
      }
    );

    return NextResponse.json({ output }, { status: 200 });
  } catch (error) {
    console.error("Error from Replicate API:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
