type RouteSkeletonProps = {
  title: string;
  description: string;
};

export function RouteSkeleton({ title, description }: RouteSkeletonProps) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-foreground/10 bg-background p-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
        <p className="text-sm leading-6 text-foreground/70">{description}</p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Section A</p>
          <p className="mt-2 text-sm font-medium">Collection and category modules</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Section B</p>
          <p className="mt-2 text-sm font-medium">Queue, sync, and user actions</p>
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-foreground/20 p-4">
        <p className="text-sm text-foreground/70">
          Foundation-only placeholder. Feature logic should be added in dedicated
          modules.
        </p>
      </div>
    </section>
  );
}
