import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),transparent_55%)]" />
      <div className="relative flex flex-col items-center gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-6">
          <SignUp />
        </div>
        <p className="max-w-sm text-center text-xs text-slate-500">
          By signing up, you agree to our{" "}
          <Link href="/legal/terms" className="text-emerald-600 hover:underline">
            Terms of Service
          </Link>
          ,{" "}
          <Link href="/legal/privacy" className="text-emerald-600 hover:underline">
            Privacy Policy
          </Link>
          , and{" "}
          <Link href="/legal/acceptable-use" className="text-emerald-600 hover:underline">
            Acceptable Use Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
