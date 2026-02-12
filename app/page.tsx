import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRICING } from "@/lib/api/pricing";

function formatPrice(value: number) {
  return value.toFixed(2);
}

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  const pricingRows = Object.entries(PRICING);

  return (
    <main className="min-h-screen bg-[#0b0d10] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b0d10]/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link className="flex items-center gap-2 text-base font-semibold tracking-tight text-white" href="/">
            <Image alt="dogecat logo" className="rounded-sm bg-white/90 p-0.5" height={24} src="/logo.svg" width={24} />
            <span>dogecat</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <a className="text-slate-300 transition hover:text-white" href="#pricing">
              Pricing
            </a>
            <a className="text-slate-300 transition hover:text-white" href="https://docs.gonka.ai" rel="noreferrer" target="_blank">
              Docs
            </a>
            <Link className="rounded-md border border-white/20 px-3 py-1.5 text-slate-100 transition hover:bg-white/10" href="/sign-in">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-6 pb-20 pt-24">
        <div className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-emerald-200">
          Decentralized AI Inference
        </div>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          AI Inference Without the Crypto Hassle
        </h1>
        <p className="max-w-3xl text-lg text-slate-300">
          Access decentralized GPU power with your credit card. OpenAI-compatible API, pay-as-you-go.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200" href="/sign-up">
            Get Started
          </Link>
          <a className="rounded-md border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10" href="#pricing">
            View Pricing
          </a>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="text-lg text-white">OpenAI Compatible</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">Drop-in replacement, change one line of code.</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="text-lg text-white">Pay with Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">No crypto wallets, no token swaps, just USD.</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="text-lg text-white">Decentralized</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">Censorship-resistant, no single point of failure.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold tracking-tight text-white">Pricing</h2>
          <p className="mt-2 text-sm text-slate-300">Per 1M tokens. Add credits to get started.</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full">
            <thead className="bg-white/[0.04]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Model</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Input / 1M</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Output / 1M</th>
              </tr>
            </thead>
            <tbody>
              {pricingRows.map(([model, price]) => (
                <tr className="border-t border-white/10" key={model}>
                  <td className="px-4 py-3 text-sm font-medium text-white">{model}</td>
                  <td className="px-4 py-3 text-sm text-slate-200">${formatPrice(price.input)}</td>
                  <td className="px-4 py-3 text-sm text-slate-200">${formatPrice(price.output)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-6 text-sm text-slate-400 sm:flex-row sm:items-center">
          <div className="flex gap-5">
            <a className="transition hover:text-white" href="https://docs.gonka.ai" rel="noreferrer" target="_blank">
              Docs
            </a>
            <a className="transition hover:text-white" href="#pricing">
              Pricing
            </a>
            <a className="transition hover:text-white" href="https://x.com" rel="noreferrer" target="_blank">
              Twitter
            </a>
          </div>
          <p>Powered by Gonka.ai</p>
        </div>
      </footer>
    </main>
  );
}
