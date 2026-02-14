/**
 * Gonka client utilities - model list and endpoint resolution
 */

import { resolveEndpoints } from "gonka-openai";

export const GONKA_MODELS = ["Qwen/Qwen3-235B-A22B-Instruct-2507-FP8"] as const;
export const DEFAULT_GONKA_MODEL = GONKA_MODELS[0];

const GONKA_NODE_URL = process.env.GONKA_NODE_URL || "http://node1.gonka.ai:8000";

let endpointsCache: Awaited<ReturnType<typeof resolveEndpoints>> | null = null;
let endpointsCacheAt = 0;
const ENDPOINT_CACHE_TTL_MS = 60_000;

export async function resolveGonkaEndpoints() {
  const now = Date.now();
  if (endpointsCache && now - endpointsCacheAt < ENDPOINT_CACHE_TTL_MS) {
    return endpointsCache;
  }

  const endpoints = await resolveEndpoints({ sourceUrl: GONKA_NODE_URL });
  endpointsCache = endpoints;
  endpointsCacheAt = now;
  return endpoints;
}
