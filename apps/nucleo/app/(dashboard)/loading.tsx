export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden="true">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted/60" />
        <div className="space-y-2 flex-1 max-w-md">
          <div className="h-7 bg-muted/60 rounded w-2/5" />
          <div className="h-4 bg-muted/40 rounded w-3/5" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg bg-muted/50 border border-border" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-muted/40 border border-border" />
    </div>
  );
}