/**
 * OpenAI-compatible models endpoint
 */

import { NextResponse } from "next/server";

const MODELS = [
  {
    id: "Qwen/Qwen3-235B-A22B-Instruct-2507-FP8",
    object: "model",
    created: 1704067200, // Jan 1 2024
    owned_by: "dogecat",
  },
];

export async function GET() {
  return NextResponse.json({
    object: "list",
    data: MODELS,
  });
}
