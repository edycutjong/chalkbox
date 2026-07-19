/** Minimal server-only client for the current OpenAI Responses API. */

export interface OpenAIResponse {
  output_text?: string;
  usage?: { total_tokens?: number };
  error?: { message?: string };
}

export class OpenAIResponseError extends Error {}

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
  if (!json.output_text) throw new OpenAIResponseError("OpenAI response contained no output_text");
  return { text: json.output_text, tokensUsed: json.usage?.total_tokens ?? 0 };
}
