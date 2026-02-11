export const PRICING: Record<string, { input: number; output: number }> = {
  "Qwen/QwQ-32B": { input: 0.5, output: 1.0 },
};

export function calculateCostUsd(model: string, promptTokens: number, completionTokens: number) {
  const pricing = PRICING[model];
  if (!pricing) {
    throw new Error(`Unknown model: ${model}`);
  }

  const input = (Math.max(0, promptTokens) * pricing.input) / 1_000_000;
  const output = (Math.max(0, completionTokens) * pricing.output) / 1_000_000;

  return input + output;
}

type ChatMessage = {
  role: string;
  content?: unknown;
};

function messageText(content: unknown): string {
  if (typeof content === "string") return content;

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
  const chars = text.length;
  return Math.ceil(chars / 4);
}

export function estimateTokens(messages: ChatMessage[]) {
  const content = messages.map((m) => messageText(m.content)).join("\n");
  const overhead = messages.length * 4;
  return roughTokenEstimateFromText(content) + overhead;
}

export function estimateCostUsd(model: string, messages: ChatMessage[], maxTokens?: number) {
  const promptTokens = estimateTokens(messages);
  const completionTokens = typeof maxTokens === "number" && Number.isFinite(maxTokens) ? Math.max(0, maxTokens) : 512;
  return calculateCostUsd(model, promptTokens, completionTokens);
}
