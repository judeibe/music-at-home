type RouteSkeletonProps = {
  title: string;
  description: string;
};

export function RouteSkeleton({ title, description }: RouteSkeletonProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-black/10 bg-background p-6 dark:border-white/15">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-foreground/70">{description}</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-24 rounded-lg border border-dashed border-black/20 bg-black/5 dark:border-white/20 dark:bg-white/5" />
        <div className="h-24 rounded-lg border border-dashed border-black/20 bg-black/5 dark:border-white/20 dark:bg-white/5" />
        <div className="h-24 rounded-lg border border-dashed border-black/20 bg-black/5 dark:border-white/20 dark:bg-white/5" />
      </div>
    </section>
  );
}
