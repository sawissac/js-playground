import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, type Content } from "@google/genai";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const { apiKey, model, messages } = (await req.json()) as {
    apiKey: string;
    model: string;
    messages: ChatMessage[];
  };

  if (!apiKey || !model) {
    return NextResponse.json(
      { error: "Gemini API key and model are required" },
      { status: 400 },
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  // Separate system instruction from conversation
  const systemParts: string[] = [];
  const history: Content[] = [];
  let lastUserMessage = "";

  for (const msg of messages) {
    if (msg.role === "system") {
      systemParts.push(msg.content);
    } else if (msg.role === "user") {
      lastUserMessage = msg.content;
      history.push({ role: "user", parts: [{ text: msg.content }] });
    } else if (msg.role === "assistant") {
      history.push({ role: "model", parts: [{ text: msg.content }] });
    }
  }

  // Pop the last user message from history (it will be sent via sendMessageStream)
  if (history.length > 0 && history[history.length - 1].role === "user") {
    history.pop();
  }

  try {
    const chat = ai.chats.create({
      model,
      history,
      config:
        systemParts.length > 0
          ? { systemInstruction: systemParts.join("\n\n") }
          : undefined,
    });

    const stream = await chat.sendMessageStream({ message: lastUserMessage });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text ?? "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to connect to Gemini: ${message}` },
      { status: 502 },
    );
  }
}
