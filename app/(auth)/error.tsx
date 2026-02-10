"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AuthError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-lg font-semibold">Auth error</h1>
        <p className="mt-1 text-sm text-slate-600">Something failed while loading authentication.</p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => reset()}>Retry</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/sign-in")}>Sign in</Button>
        </div>
      </div>
    </main>
  );
}
