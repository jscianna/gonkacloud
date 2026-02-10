"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="bg-slate-50 text-slate-900">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-3 px-6 py-16">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-slate-600">Try again. If it keeps happening, check logs.</p>
          {error?.digest ? <p className="font-mono text-xs text-slate-500">Digest: {error.digest}</p> : null}
          <div className="mt-4 flex gap-2">
            <Button onClick={() => reset()}>Retry</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Go Home
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
