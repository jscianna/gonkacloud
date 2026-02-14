"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, KeyRound, LayoutDashboard, MessageSquare, BarChart3, Code2, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type DashboardNavProps = {
  onNavigate?: () => void;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/dashboard/usage", label: "Usage", icon: BarChart3 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/api-docs", label: "API Docs", icon: Code2 },
];

export function DashboardNav({ onNavigate }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive 
                ? "bg-emerald-500/10 text-emerald-400" 
                : "text-white/60 hover:bg-white/[0.06] hover:text-white"
            )}
            href={item.href}
            key={item.href}
            onClick={onNavigate}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
