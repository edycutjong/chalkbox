import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createResponse,
  extractOutputText,
  OpenAIResponseError,
} from "@/lib/harness/openai-responses";

/**
 * These tests fully stub `fetch` — no test in this file, or anywhere else in
 * the suite, is allowed to make a real network call. See env-safety.test.ts
 * and live-generation-opt-in.test.ts for the companion spend-guard tests.
 */

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mockFetchOnce(response: {
  ok: boolean;
  status: number;
  body: unknown;
}): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValueOnce({
    ok: response.ok,
    status: response.status,
    json: async () => response.body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("extractOutputText", () => {
  it("prefers the SDK convenience field when present", () => {
    expect(extractOutputText({ output_text: "hello" })).toBe("hello");
  });

  it("falls back to aggregating output-item content parts", () => {
    const text = extractOutputText({
      output: [
        {
          content: [
            { type: "output_text", text: "a" },
            { type: "other", text: "ignored" },
          ],
        },
        { content: [{ type: "output_text", text: "b" }] },
      ],
    });
    expect(text).toBe("ab");
  });

  it("ignores an empty output_text and falls back to the raw REST shape", () => {
    expect(
      extractOutputText({
        output_text: "",
        output: [{ content: [{ type: "output_text", text: "x" }] }],
      }),
    ).toBe("x");
  });

  it("returns an empty string when neither shape has usable content", () => {
    expect(extractOutputText({})).toBe("");
    expect(extractOutputText({ output: [{ content: [{ type: "output_text" }] }] })).toBe("");
  });

  it("tolerates an output item with no content array at all", () => {
    expect(extractOutputText({ output: [{}] })).toBe("");
  });
});

describe("createResponse", () => {
  it("posts to the OpenAI Responses endpoint with the expected request shape", async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      status: 200,
      body: { output_text: "hello", usage: { total_tokens: 123 } },
    });

    const result = await createResponse("sk-test", { model: "gpt-5.6-sol" }, 5_000);

    expect(result).toEqual({ text: "hello", tokensUsed: 123 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: "Bearer sk-test",
      "Content-Type": "application/json",
    });
    expect(init.body).toBe(JSON.stringify({ model: "gpt-5.6-sol" }));
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("defaults tokensUsed to 0 when usage is absent", async () => {
    mockFetchOnce({ ok: true, status: 200, body: { output_text: "hi" } });
    const result = await createResponse("sk-test", {}, 1_000);
    expect(result.tokensUsed).toBe(0);
  });

  it("aggregates the raw REST output shape when output_text is missing", async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      body: { output: [{ content: [{ type: "output_text", text: "raw shape" }] }] },
    });
    const result = await createResponse("sk-test", {}, 1_000);
    expect(result.text).toBe("raw shape");
  });

  it("throws OpenAIResponseError with the API's message on a non-OK response", async () => {
    mockFetchOnce({ ok: false, status: 400, body: { error: { message: "bad request" } } });
    await expect(createResponse("sk-test", {}, 1_000)).rejects.toMatchObject({
      message: "bad request",
    });
    mockFetchOnce({ ok: false, status: 400, body: { error: { message: "bad request" } } });
    await expect(createResponse("sk-test", {}, 1_000)).rejects.toBeInstanceOf(OpenAIResponseError);
  });

  it("falls back to a generic HTTP-status message when the API omits one", async () => {
    mockFetchOnce({ ok: false, status: 500, body: {} });
    await expect(createResponse("sk-test", {}, 1_000)).rejects.toMatchObject({
      message: "OpenAI HTTP 500",
    });
  });

  it("throws when the response is OK but carries no usable output text", async () => {
    mockFetchOnce({ ok: true, status: 200, body: { output_text: "" } });
    await expect(createResponse("sk-test", {}, 1_000)).rejects.toMatchObject({
      message: "OpenAI response contained no output text",
    });
  });
});
