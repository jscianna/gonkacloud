export const PRICING: Record<string, { input: number; output: number }> = {
  "llama-3.3-70b": { input: 0.6, output: 1.2 },
  "mixtral-8x22b": { input: 0.4, output: 0.8 },
  // Add more models here.
};

export function calculateCostUsd(model: string, promptTokens: number, completionTokens: number) {
  const pricing = PRICING[model];
  if (!pricing) {
    throw new Error(`Unknown model: ${model}`);
  }

  const input = (Math.max(0, promptTokens) * pricing.input) / 1_000_000;
  const output = (Math.max(0, completionTokens) * pricing.output) / 1_000_000;

  // Keep extra precision for accounting; callers can format as needed.
  return input + output;
}

type ChatMessage = {
  role: string;
  content?: unknown;
};

function messageText(content: unknown): string {
  if (typeof content === "string") return content;

  // Handle OpenAI-style array content: [{type:'text', text:'...'}]
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part && typeof (part as any).text === "string") {
          return (part as any).text as string;
        }
        return "";
      })
      .join(" ");
  }

  return "";
}

function roughTokenEstimateFromText(text: string) {
  // Very rough: ~4 chars/token for English, plus a little overhead.
  const chars = text.length;
  return Math.ceil(chars / 4);
}

export function estimateTokens(messages: ChatMessage[]) {
  const content = messages.map((m) => messageText(m.content)).join("\n");
  // Small overhead per message.
  const overhead = messages.length * 4;
  return roughTokenEstimateFromText(content) + overhead;
}

export function estimateCostUsd(model: string, messages: ChatMessage[], maxTokens?: number) {
  const promptTokens = estimateTokens(messages);
  const completionTokens = typeof maxTokens === "number" && Number.isFinite(maxTokens) ? Math.max(0, maxTokens) : 512;
  return calculateCostUsd(model, promptTokens, completionTokens);
}
