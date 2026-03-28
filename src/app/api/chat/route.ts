import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { ollamaUrl, model, messages } = await req.json();

  if (!ollamaUrl || !model) {
    return NextResponse.json(
      { error: "Ollama URL and model are required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Ollama error: ${response.status} - ${text}` },
        { status: response.status }
      );
    }

    // Stream the response back
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // Ollama streams newline-delimited JSON; forward each line
            const lines = chunk.split("\n").filter(Boolean);
            for (const line of lines) {
              try {
                const json = JSON.parse(line);
                const content = json.message?.content ?? "";
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch {
                // skip malformed lines
              }
            }
          }
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
      { error: `Failed to connect to Ollama: ${message}` },
      { status: 502 }
    );
  }
}
