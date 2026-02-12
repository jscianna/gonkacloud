import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Menu, Wallet } from "lucide-react";
import { redirect } from "next/navigation";

import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getCurrentUser } from "@/lib/auth";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user?.clerkUser) {
    redirect("/sign-in");
  }

  const balance = Number.parseFloat(user.dbUser?.balanceUsd ?? "0");
  const safeBalance = Number.isFinite(balance) ? balance : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 border-r border-slate-200 bg-white px-4 py-6 md:flex md:flex-col">
          <Link className="mb-8 flex items-center gap-2 px-2" href="/dashboard">
            <div className="rounded-md bg-slate-900 px-2 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">GC</div>
            <span className="text-base font-semibold tracking-tight">dogecat</span>
          </Link>
          <DashboardNav />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 md:px-8">
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className="md:hidden" size="sm" variant="outline">
                      <Menu className="h-4 w-4" />
                      <span className="sr-only">Open dashboard menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0">
                    <div className="border-b border-slate-200 px-6 py-5">
                      <Link className="flex items-center gap-2" href="/dashboard">
                        <div className="rounded-md bg-slate-900 px-2 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">GC</div>
                        <span className="text-base font-semibold tracking-tight">dogecat</span>
                      </Link>
                    </div>
                    <div className="p-4">
                      <SheetClose asChild>
                        <div>
                          <DashboardNav />
                        </div>
                      </SheetClose>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 sm:flex">
                  <Wallet className="h-4 w-4" />
                  <span>{formatCurrency(safeBalance)} remaining</span>
                </div>
                <Link href="/dashboard/billing">
                  <Button className="bg-emerald-600 text-white hover:bg-emerald-500" size="sm">
                    Add Credits
                  </Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
