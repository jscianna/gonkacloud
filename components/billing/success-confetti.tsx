"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";

export function SuccessConfetti() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  useEffect(() => {
    if (success === "true") {
      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();

      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/billing");
    }
  }, [success]);

  if (success !== "true") return null;

  return (
    <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
      <p className="text-lg font-semibold text-emerald-400">🎉 Welcome to Dogecat Pro!</p>
      <p className="mt-1 text-sm text-emerald-300/70">Your subscription is now active. You have 100M tokens to use.</p>
    </div>
  );
}
