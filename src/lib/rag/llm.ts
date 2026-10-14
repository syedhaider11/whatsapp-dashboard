import { isLlmConfigured, llmApiKey, llmBaseUrl, llmModel } from "./config";
import type { RagResult } from "./result";

export type RagContext = {
  fileName: string;
  page: number;
  content: string;
};

type ChatResponse = {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
};

const SYSTEM_PROMPT = [
  "You are an internal WhatsApp operations assistant.",
  "Answer the question using ONLY the numbered context excerpts provided.",
  "If the context does not contain the answer, say you could not find it in the indexed documents.",
  "Cite the sources you use inline as [1], [2] matching the excerpt numbers.",
].join(" ");

export async function synthesizeAnswer(
  question: string,
  contexts: RagContext[],
): Promise<RagResult<string>> {
  if (!isLlmConfigured()) {
    return { ok: false, error: "Language model is not configured (LLM_API_KEY is empty)." };
  }

  const contextBlock = contexts
    .map(
      (context, index) =>
        `[${index + 1}] ${context.fileName} (page ${context.page}):\n${context.content}`,
    )
    .join("\n\n");

  try {
    const response = await fetch(`${llmBaseUrl()}/chat/completions`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${llmApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: llmModel(),
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Context excerpts:\n\n${contextBlock}\n\nQuestion: ${question}`,
          },
        ],
      }),
    });

    const payload = (await response.json()) as ChatResponse;

    if (!response.ok || payload.error) {
      return {
        ok: false,
        error: payload.error?.message ?? `Language model returned ${response.status}.`,
      };
    }

    const answer = payload.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return { ok: false, error: "Language model returned an empty response." };
    }

    return { ok: true, data: answer };
  } catch {
    return { ok: false, error: "Network error contacting the language model." };
  }
}
