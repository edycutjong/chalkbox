/** Minimal server-only client for the current OpenAI Responses API. */

export interface OpenAIResponse {
  /** SDK convenience field — present via the OpenAI SDK, ABSENT in the raw REST body. */
  output_text?: string;
  /** Raw REST shape: output items → content parts → { type: "output_text", text }. */
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  usage?: { total_tokens?: number };
  error?: { message?: string };
}

export class OpenAIResponseError extends Error {}

/** Aggregate the assistant text from either the SDK helper or the raw REST output. */
export function extractOutputText(json: OpenAIResponse): string {
  if (typeof json.output_text === "string" && json.output_text.length > 0) {
    return json.output_text;
  }
  const parts: string[] = [];
  for (const item of json.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === "output_text" && typeof part.text === "string") {
        parts.push(part.text);
      }
    }
  }
  return parts.join("");
}

export async function createResponse(
  apiKey: string,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<{ text: string; tokensUsed: number }> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const json = (await response.json()) as OpenAIResponse;
  if (!response.ok)
    throw new OpenAIResponseError(json.error?.message ?? `OpenAI HTTP ${response.status}`);
  const text = extractOutputText(json);
  if (!text) throw new OpenAIResponseError("OpenAI response contained no output text");
  return { text, tokensUsed: json.usage?.total_tokens ?? 0 };
}
