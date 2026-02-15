"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function SegmentError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="mt-1 text-sm text-slate-600">Retry loading this section.</p>
      <div className="mt-4 flex gap-2">
        <Button onClick={() => reset()}>Retry</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>Go to Dashboard</Button>
      </div>
    </div>
  );
}
