"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center gap-3 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard error</h1>
      <p className="text-sm text-slate-600">Something went wrong rendering this page.</p>
      <div className="mt-2 flex gap-2">
        <Button onClick={() => reset()}>Retry</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>Dashboard</Button>
      </div>
    </main>
  );
}
