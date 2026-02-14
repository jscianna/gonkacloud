"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type UsagePoint = {
  day: string;
  calls: number;
  tokens: number;
};

type UsageResponse = {
  data: UsagePoint[];
};

export function UsageBarChart() {
  const [data, setData] = useState<UsagePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsage() {
      try {
        const response = await fetch("/api/usage", { cache: "no-store" });
        if (!response.ok) {
          setData([]);
          return;
        }

        const payload = (await response.json()) as UsageResponse;
        setData(payload.data ?? []);
      } finally {
        setLoading(false);
      }
    }

    loadUsage();
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading usage chart...</p>;
  }

  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No usage yet. API activity will appear here.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
          <YAxis stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            contentStyle={{ 
              borderRadius: 8, 
              backgroundColor: "#1e293b",
              borderColor: "rgba(255,255,255,0.1)",
              color: "#fff"
            }}
            labelStyle={{ color: "rgba(255,255,255,0.7)" }}
            formatter={(value: number | string | undefined, name: string | undefined) => [
              Number(value ?? 0).toLocaleString(),
              name === "tokens" ? "Tokens" : "Calls",
            ]}
          />
          <Bar dataKey="tokens" fill="#10b981" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
