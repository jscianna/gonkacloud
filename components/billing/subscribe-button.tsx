"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SubscribeButton() {
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);

    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start subscription");
        setLoading(false);
      }
    } catch (e) {
      alert("Failed to start subscription");
      setLoading(false);
    }
  }

  return (
    <Button 
      onClick={handleSubscribe}
      disabled={loading}
      className="w-full bg-emerald-500 py-6 text-lg font-semibold text-white hover:bg-emerald-400"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading...
        </>
      ) : (
        "Subscribe Now"
      )}
    </Button>
  );
}
