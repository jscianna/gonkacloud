import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check, Zap, Code2, Key, CreditCard, Sparkles, ArrowRight } from "lucide-react";

export default async function ApiDocsPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0b]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="dogecat" width={24} height={24} className="rounded" />
              <span className="font-semibold">dogecat</span>
            </div>
          </Link>
          
          {userId ? (
            <Link 
              href="/dashboard/api-keys" 
              className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-400"
            >
              Manage API Keys
            </Link>
          ) : (
            <Link 
              href="/sign-up" 
              className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-400"
            >
              Get Started
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06] py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent" />
        <div className="relative mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-400">
              <Sparkles className="h-3 w-3" />
              API Access
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Build with <span className="gradient-text">dogecat</span>
            </h1>
            <p className="mb-8 max-w-2xl text-lg text-white/50">
              OpenAI-compatible API powered by decentralized inference. 
              Drop-in replacement, censorship-resistant, no rate limits.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-b border-white/[0.06] py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-8 text-center text-2xl font-semibold">Simple Pricing</h2>
          
          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
            {/* Free Tier */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Free Preview</h3>
                <p className="text-sm text-white/50">Try it out on the homepage</p>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold text-white">$0</span>
              </div>
              <ul className="mb-6 space-y-3 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Web chat access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Qwen3-235B model
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Limited daily usage
                </li>
              </ul>
              <Link 
                href="/" 
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.06]"
              >
                Try Free
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="relative rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-transparent p-6">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                RECOMMENDED
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">API Access</h3>
                <p className="text-sm text-white/50">For developers & apps</p>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold text-white">$2.99</span>
                <span className="text-white/50">/month</span>
              </div>
              <ul className="mb-6 space-y-3 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  100M tokens included
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  OpenAI-compatible API
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Multiple API keys
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Priority support
                </li>
              </ul>
              <Link 
                href={userId ? "/dashboard/billing" : "/sign-up"} 
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                <CreditCard className="h-4 w-4" />
                Subscribe Now
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-white/40">
            Additional tokens: $0.50/1M input, $1.00/1M output
          </p>
        </div>
      </section>

      {/* Quick Start */}
      <section className="border-b border-white/[0.06] py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Zap className="h-5 w-5 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-semibold">Quick Start</h2>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
              <h3 className="mb-3 flex items-center gap-2 font-medium">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">1</span>
                Get your API key
              </h3>
              <p className="mb-4 text-sm text-white/60">
                Sign up and create an API key from your dashboard.
              </p>
              <Link 
                href={userId ? "/dashboard/api-keys" : "/sign-up"} 
                className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
              >
                <Key className="h-4 w-4" />
                {userId ? "Manage API Keys" : "Create Account"}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
              <h3 className="mb-3 flex items-center gap-2 font-medium">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">2</span>
                Make your first request
              </h3>
              <p className="mb-4 text-sm text-white/60">
                Use any OpenAI-compatible client. Just change the base URL.
              </p>
              
              {/* Code example */}
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1b]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                  <span className="text-xs font-medium text-white/50">Python</span>
                </div>
                <pre className="overflow-x-auto p-4 text-sm">
                  <code className="text-white/80">
{`from openai import OpenAI

client = OpenAI(
    base_url="https://dogecat.ai/api/v1",
    api_key="your-api-key"
)

response = client.chat.completions.create(
    model="Qwen/Qwen3-235B-A22B-Instruct-2507-FP8",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)`}
                  </code>
                </pre>
              </div>
            </div>

            {/* Step 3 - cURL */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
              <h3 className="mb-3 flex items-center gap-2 font-medium">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">3</span>
                Or use cURL
              </h3>
              
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1b]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                  <span className="text-xs font-medium text-white/50">Shell</span>
                </div>
                <pre className="overflow-x-auto p-4 text-sm">
                  <code className="text-white/80">
{`curl https://dogecat.ai/api/v1/chat/completions \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "Qwen/Qwen3-235B-A22B-Instruct-2507-FP8",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="border-b border-white/[0.06] py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Code2 className="h-5 w-5 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-semibold">API Reference</h2>
          </div>

          <div className="space-y-4">
            {/* Endpoint */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs font-bold text-emerald-400">POST</span>
                <code className="text-sm text-white/80">/api/v1/chat/completions</code>
              </div>
              <p className="mb-4 text-sm text-white/60">
                Create a chat completion. Fully compatible with OpenAI&apos;s API.
              </p>
              
              <h4 className="mb-3 text-sm font-medium text-white/80">Request Body</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-2 text-left font-medium text-white/50">Parameter</th>
                    <th className="pb-2 text-left font-medium text-white/50">Type</th>
                    <th className="pb-2 text-left font-medium text-white/50">Description</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  <tr className="border-b border-white/[0.05]">
                    <td className="py-2"><code className="text-emerald-300">model</code></td>
                    <td className="py-2">string</td>
                    <td className="py-2">Model ID to use</td>
                  </tr>
                  <tr className="border-b border-white/[0.05]">
                    <td className="py-2"><code className="text-emerald-300">messages</code></td>
                    <td className="py-2">array</td>
                    <td className="py-2">List of messages in the conversation</td>
                  </tr>
                  <tr className="border-b border-white/[0.05]">
                    <td className="py-2"><code className="text-emerald-300">stream</code></td>
                    <td className="py-2">boolean</td>
                    <td className="py-2">Whether to stream responses (optional)</td>
                  </tr>
                  <tr className="border-b border-white/[0.05]">
                    <td className="py-2"><code className="text-emerald-300">max_tokens</code></td>
                    <td className="py-2">integer</td>
                    <td className="py-2">Maximum tokens to generate (optional)</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code className="text-emerald-300">temperature</code></td>
                    <td className="py-2">number</td>
                    <td className="py-2">Sampling temperature 0-2 (optional)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Models */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded bg-blue-500/20 px-2 py-1 text-xs font-bold text-blue-400">GET</span>
                <code className="text-sm text-white/80">/api/v1/models</code>
              </div>
              <p className="text-sm text-white/60">
                List available models.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Available Models */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-8 text-2xl font-semibold">Available Models</h2>
          
          <div className="overflow-hidden rounded-xl border border-white/[0.08]">
            <table className="w-full">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white/50">Model</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white/50">Input / 1M</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white/50">Output / 1M</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white/50">Context</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/[0.06]">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">Qwen3-235B-A22B-Instruct-2507-FP8</p>
                      <p className="text-sm text-white/50">Latest Qwen3 MoE, 235B parameters</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/80">$0.50</td>
                  <td className="px-6 py-4 text-white/80">$1.00</td>
                  <td className="px-6 py-4 text-white/80">128K</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 text-sm text-white/40">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="dogecat" width={20} height={20} className="rounded opacity-50" />
            <span>dogecat</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white/60">Chat</Link>
            <a href="https://docs.gonka.ai" target="_blank" rel="noreferrer" className="hover:text-white/60">Docs</a>
            <a href="https://x.com/gonka_ai" target="_blank" rel="noreferrer" className="hover:text-white/60">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
