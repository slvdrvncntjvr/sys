export default function ProtectedLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 h-24 animate-pulse rounded-2xl bg-slate-200" />
      <div className="mb-4 h-40 animate-pulse rounded-2xl bg-slate-200" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
