export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl">
        <div className="hidden w-64 border-r border-slate-200 bg-white md:block" />
        <div className="flex flex-1 flex-col">
          <div className="h-16 border-b border-slate-200 bg-white" />
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="h-24 animate-pulse rounded-xl bg-white" />
              <div className="h-24 animate-pulse rounded-xl bg-white" />
              <div className="h-24 animate-pulse rounded-xl bg-white" />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
