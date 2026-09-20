import { NextRequest } from "next/server";
import { runLangflow, isMockMode } from "@/lib/langflow";
import { parsePerkaraResult, stripPerkaraBlock } from "@/lib/perkara";
import type { ChatMessage, QuickSearch } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
  messages?: Partial<ChatMessage>[];
  sessionId?: string;
  input: string;
  quickSearch?: QuickSearch;
}

const encoder = new TextEncoder();

function sse(payload: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const input = body.input?.trim();
  if (!input) {
    return new Response("Missing input", { status: 400 });
  }

  const sessionId = body.sessionId ?? "default";
  const quickSearch = body.quickSearch;

  const clientAbort = req.signal;
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await runLangflow({
          input,
          sessionId,
          quickSearch,
          signal: clientAbort,
          onToken: (token) => {
            try {
              controller.enqueue(sse({ type: "token", content: token }));
            } catch {
              /* stream ditutup klien */
            }
          },
        });

        const cleanText = stripPerkaraBlock(result.fullText);
        const rawPerkara =
          result.raw && typeof result.raw === "object"
            ? (result.raw as { perkara?: import("@/lib/types").Perkara[] }).perkara
            : undefined;
        const perkara = parsePerkaraResult(result.fullText, rawPerkara) ?? undefined;

        if (perkara) {
          controller.enqueue(sse({ type: "perkara", perkara }));
        }

        controller.enqueue(
          sse({
            type: "done",
            content: cleanText,
            mode: isMockMode() ? "demo" : "langflow",
            perkara: perkara ?? null,
          })
        );
      } catch (err) {
        const aborted =
          typeof err === "object" && err !== null && (err as Error).name === "AbortError";

        if (aborted) {
          controller.enqueue(sse({ type: "abort" }));
        } else {
          const message =
            err instanceof Error ? err.message : "Terjadi kesalahan saat memproses permintaan.";
          controller.enqueue(sse({ type: "error", content: message }));
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* sudah tertutup */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}