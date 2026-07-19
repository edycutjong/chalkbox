import { NextRequest } from "next/server";
import { LIVE_GENERATION_ENABLED } from "@/lib/demo";
import { createOrchestrator } from "@/lib/harness/orchestrator-factory";
import { gatePrompt } from "@/lib/harness/safety";
import type { GenerationRequest } from "@/lib/harness/types";

export const runtime = "nodejs";

const encoder = new TextEncoder();

function sse(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/** Server boundary for every live generation call. The browser never sees a key. */
export async function POST(request: NextRequest): Promise<Response> {
  let prompt = "";
  try {
    const body = (await request.json()) as { prompt?: unknown };
    prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  } catch {
    // The stream below returns a normal UI-facing failure event.
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Cheap deterministic preflight gives the UI instant scope feedback in
        // demo mode; RealOrchestrator repeats this with Luna before Sol spends.
        const verdict = gatePrompt(prompt);
        controller.enqueue(sse("verdict", { verdict, demo: !LIVE_GENERATION_ENABLED }));
        if (verdict.decision === "reject") return;

        const generationRequest: GenerationRequest = {
          prompt,
          subject: verdict.subject ?? "math",
          gradeBand: verdict.gradeBand,
          standard: verdict.standard,
        };
        let streamedAttempt = false;
        const result = await createOrchestrator((attempt) => {
          streamedAttempt = true;
          controller.enqueue(sse("attempt", attempt));
        }).run(generationRequest);
        // StubOrchestrator is intentionally unchanged, so demo emits its
        // deterministic trace after completion while live attempts stream as
        // each Sol round finishes.
        if (!streamedAttempt) {
          for (const attempt of result.attempts) controller.enqueue(sse("attempt", attempt));
        }
        controller.enqueue(sse("result", result));
      } catch (error) {
        controller.enqueue(
          sse("error", { message: error instanceof Error ? error.message : "generation failed" }),
        );
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
    },
  });
}
