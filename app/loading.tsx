export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-4 px-6 py-16">
      <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
      <div className="h-10 w-2/3 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
    </main>
  );
}
