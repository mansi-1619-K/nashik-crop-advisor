export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6">
      <div className="animate-pulse space-y-7">
        <div className="h-20 rounded-xl bg-border-light" />
        <div className="grid grid-cols-1 gap-7 xl:grid-cols-[400px_1fr]">
          <div className="h-96 rounded-xl bg-border-light" />
          <div className="h-96 rounded-xl bg-border-light" />
        </div>
        <div className="h-[36rem] rounded-xl bg-border-light" />
      </div>
    </main>
  );
}
