import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  const { apiKey, model } = (await req.json()) as {
    apiKey: string;
    model: string;
  };

  if (!apiKey || !model) {
    return NextResponse.json(
      { error: "API key and model are required" },
      { status: 400 },
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.generateContent({
      model,
      contents: "Hello",
      config: { maxOutputTokens: 5 },
    });
    return NextResponse.json({ valid: true });
  } catch (err: unknown) {
    // Rate limit (429) means the key IS valid, just quota exhausted
    const raw = err instanceof Error ? err.message : String(err);
    if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json({ valid: true });
    }

    // Extract a clean message for actual auth/config errors
    let message = "Unknown error";
    try {
      const parsed = JSON.parse(raw);
      message = parsed?.error?.message || raw;
    } catch {
      message = raw;
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
