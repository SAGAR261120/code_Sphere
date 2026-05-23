export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin" />
        <p className="text-text-secondary text-sm">Loading...</p>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-48 bg-surface-2 rounded-lg mb-4" />
      <div className="h-4 bg-surface-2 rounded w-3/4 mb-2" />
      <div className="h-3 bg-surface-2 rounded w-1/2" />
    </div>
  );
}
