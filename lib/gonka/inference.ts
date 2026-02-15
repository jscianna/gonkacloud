/**
 * Gonka inference via Railway signing proxy.
 * The proxy handles wallet signing and targets non-rate-limited nodes.
 */

const GONKA_PROXY_URL = process.env.GONKA_PROXY_URL || "https://gonka-proxy-test-production.up.railway.app";
const GONKA_PROXY_KEY = process.env.GONKA_PROXY_KEY;
const INFERENCE_TIMEOUT_MS = 120_000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type GonkaChatMessage = { role: string; content: string };

/**
 * Run inference on Gonka network via the Railway signing proxy.
 */
export async function gonkaInference(params: {
  model: string;
  messages: Array<GonkaChatMessage>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}): Promise<Response> {
  console.log("=== GONKA INFERENCE (via proxy) ===");

  if (!GONKA_PROXY_KEY) {
    throw new Error("GONKA_PROXY_KEY is not set");
  }

  const payload = {
    model: params.model,
    messages: params.messages,
    stream: params.stream ?? false,
    temperature: params.temperature,
    max_tokens: params.max_tokens,
  };

  const targetUrl = `${GONKA_PROXY_URL}/v1/chat/completions`;
  console.log("Proxy URL:", targetUrl);

  // Retry loop for rate limits
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${delayMs}ms...`);
      await sleep(delayMs);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), INFERENCE_TIMEOUT_MS);

      const res = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GONKA_PROXY_KEY}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check for rate limit
      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        console.warn(`Rate limited (429). Retry-After: ${retryAfter || 'not specified'}`);
        
        if (attempt < MAX_RETRIES - 1) {
          continue;
        }
      }

      // Check for server errors (5xx)
      if (res.status >= 500 && res.status < 600) {
        console.warn(`Server error (${res.status}). Will retry...`);
        
        if (attempt < MAX_RETRIES - 1) {
          continue;
        }
      }

      console.log("Proxy response status:", res.status);
      return res;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error("Fetch error:", lastError.message);
      
      if (attempt >= MAX_RETRIES - 1) {
        break;
      }
    }
  }

  throw lastError || new Error("All inference attempts failed");
}
