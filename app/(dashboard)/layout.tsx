import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { Menu, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

function formatTokens(tokens: bigint | number): string {
  const n = typeof tokens === 'bigint' ? tokens : BigInt(tokens);
  if (n >= 1_000_000n) {
    return `${(Number(n) / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000n) {
    return `${(Number(n) / 1_000).toFixed(0)}K`;
  }
  return n.toString();
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user?.clerkUser) {
    redirect("/sign-in");
  }

  // Get subscription and token balance
  let tokensRemaining = 0n;
  let hasSubscription = false;

  if (user.dbUser?.id) {
    const subscription = await db.query.apiSubscriptions.findFirst({
      where: and(
        eq(apiSubscriptions.userId, user.dbUser.id),
        eq(apiSubscriptions.status, "active")
      ),
    });

    if (subscription) {
      hasSubscription = true;
      const allocated = subscription.tokensAllocated ?? 0n;
      const used = subscription.tokensUsed ?? 0n;
      tokensRemaining = allocated - used;
      if (tokensRemaining < 0n) tokensRemaining = 0n;
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-white/[0.06] bg-[#0a0a0b] px-4 py-6 md:flex md:flex-col">
          <Link className="mb-8 flex items-center gap-2 px-2" href="/chat">
            <Image alt="dogecat logo" className="rounded" height={24} src="/logo.svg" width={24} />
            <span className="text-base font-semibold tracking-tight">dogecat</span>
          </Link>
          <DashboardNav />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0a0a0b]/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 md:px-8">
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className="md:hidden border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]" size="sm" variant="outline">
                      <Menu className="h-4 w-4" />
                      <span className="sr-only">Open dashboard menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 border-white/[0.06] bg-[#0a0a0b] p-0">
                    <div className="border-b border-white/[0.06] px-6 py-5">
                      <Link className="flex items-center gap-2" href="/chat">
                        <Image alt="dogecat logo" className="rounded" height={24} src="/logo.svg" width={24} />
                        <span className="text-base font-semibold tracking-tight text-white">dogecat</span>
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
                {hasSubscription ? (
                  <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm font-medium text-white/70 sm:flex">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span>{formatTokens(tokensRemaining)} tokens</span>
                  </div>
                ) : (
                  <Link href="/dashboard/billing">
                    <Button className="bg-emerald-500 text-white hover:bg-emerald-400" size="sm">
                      Subscribe
                    </Button>
                  </Link>
                )}
                <UserButton 
                  afterSignOutUrl="/" 
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8"
                    }
                  }}
                />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
