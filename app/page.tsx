import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">GonkaCloud</p>
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Decentralized AI Inference, Card-Powered</h1>
      <p className="max-w-2xl text-base text-slate-600">
        Scaffold complete. Authentication, dashboard, billing, usage, API routes, and database schema are in place for implementation.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white" href="/dashboard">
          Dashboard
        </Link>
        <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" href="/chat">
          Chat Interface
        </Link>
      </div>
    </main>
  );
}
