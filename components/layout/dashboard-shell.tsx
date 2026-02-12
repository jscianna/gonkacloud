import Link from "next/link";

import { UserButton } from "@clerk/nextjs";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/api-keys", label: "API Keys" },
  { href: "/dashboard/usage", label: "Usage" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/chat", label: "Chat" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link className="text-sm font-semibold tracking-wide text-slate-900" href="/dashboard">
            dogecat
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8 md:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          {nav.map((item) => (
            <Link
              className="block rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </aside>
        <main className="rounded-xl border border-slate-200 bg-white p-6">{children}</main>
      </div>
    </div>
  );
}
