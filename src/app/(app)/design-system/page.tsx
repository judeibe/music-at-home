const tokenGroups = [
  {
    title: "Color",
    description: "Core app palette that drives shell, content surfaces, and emphasis states.",
    tokens: [
      { name: "--background", sampleClass: "bg-background", value: "App root background" },
      { name: "--foreground", sampleClass: "bg-foreground", value: "Primary text and icon color" },
      { name: "--surface-1", sampleClass: "bg-surface-1", value: "Primary cards and grouped panels" },
      { name: "--surface-2", sampleClass: "bg-surface-2", value: "Secondary containers and row strips" },
      { name: "--accent", sampleClass: "bg-accent", value: "Primary CTA and active emphasis" },
      {
        name: "--accent-strong",
        sampleClass: "bg-accent-strong",
        value: "Focused/high-intent interaction emphasis",
      },
    ],
  },
  {
    title: "Spacing",
    description: "Spacing rhythm for dense controls and media-first layouts.",
    tokens: [
      { name: "2", sampleClass: "p-2", value: "Micro control spacing" },
      { name: "3", sampleClass: "p-3", value: "Compact card spacing" },
      { name: "4", sampleClass: "p-4", value: "Standard section spacing" },
      { name: "5", sampleClass: "p-5", value: "Feature panel spacing" },
      { name: "6", sampleClass: "p-6", value: "Hero and large section spacing" },
    ],
  },
  {
    title: "Radius + Elevation",
    description: "Soft geometry and layered depth inspired by native media apps.",
    tokens: [
      { name: "--radius-sm", sampleClass: "rounded-sm", value: "Inputs and compact pills" },
      { name: "--radius-md", sampleClass: "rounded-md", value: "List rows and utility cards" },
      { name: "--radius-lg", sampleClass: "rounded-lg", value: "Primary card surfaces" },
      { name: "--radius-xl", sampleClass: "rounded-xl", value: "Feature containers and overlays" },
      { name: "--elevation-1", sampleClass: "shadow-elevation-1", value: "Base card lift" },
      { name: "--elevation-2", sampleClass: "shadow-elevation-2", value: "Highlighted/interactive panels" },
    ],
  },
  {
    title: "Typography",
    description: "Hierarchy for quick scanning while preserving a premium editorial tone.",
    tokens: [
      { name: "Display", sampleClass: "text-3xl font-semibold", value: "Page and hero headings" },
      { name: "Section", sampleClass: "text-xl font-semibold", value: "Route-level section headings" },
      { name: "Body", sampleClass: "text-sm", value: "Primary detail and metadata rows" },
      { name: "Micro label", sampleClass: "text-xs uppercase tracking-[0.14em]", value: "Status, tabs, and chip labels" },
    ],
  },
];

const componentInventory = [
  {
    name: "Media card",
    intent: "Album/playlist summary blocks with artwork, title, metadata, and action affordances.",
    status: "Ready for shell + Home/Library",
  },
  {
    name: "Media row",
    intent: "Dense list row for queues, search results, and favorites with progressive disclosure.",
    status: "Ready for Library/Search/Favorites",
  },
  {
    name: "Segment tabs",
    intent: "Fast mode switching between filtered media scopes and control contexts.",
    status: "Ready for Library/Players/Rooms",
  },
  {
    name: "Control cluster",
    intent: "Transport + utility controls (play/pause/next, mute, volume, grouping) with clear state.",
    status: "Ready for Players/Rooms/Devices",
  },
  {
    name: "Now-playing mini surface",
    intent: "Persistent playback context with quick controls and queue preview.",
    status: "Ready for app shell",
  },
  {
    name: "Navigation rails",
    intent: "Desktop sidebar + mobile bottom rail with clear active and auth/session cues.",
    status: "Ready for app shell",
  },
];

const routeBlueprints = [
  {
    route: "Home",
    desktop: "Hero status strip + two-column telemetry + quick actions grid.",
    mobile: "Stacked status cards, sticky mini-player, single-column actions.",
  },
  {
    route: "Library + Search",
    desktop: "Filter bar, segmented tabs, dense media cards with metadata chips.",
    mobile: "Horizontal tabs, larger tap targets, progressive list loading.",
  },
  {
    route: "Players + Rooms + Devices",
    desktop: "Control-focused rows with grouped state badges and compact diagnostics.",
    mobile: "Command clusters with bottom-safe spacing and reduced visual noise.",
  },
  {
    route: "Favorites + Auth",
    desktop: "Collection-centric cards and guided onboarding split layouts.",
    mobile: "Priority actions first, checklist/feedback panels as collapsible stacks.",
  },
];

const accessibilityChecks = [
  "Contrast targets: body text >= 4.5:1, large text >= 3:1, interactive elements visibly distinct.",
  "Keyboard path: logical tab order across nav, mini-player controls, and route-level actions.",
  "Focus states: visible non-color-only outlines on every interactive element.",
  "Semantics: landmarks (header/nav/main), headings in sequence, alerts and status regions announced.",
  "Touch ergonomics: mobile controls maintain comfortable target size and safe-area spacing.",
];

export default function DesignSystemPage() {
  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-border-subtle bg-background p-5">
      <header className="rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-elevation-1">
        <p className="text-xs uppercase tracking-[0.14em] text-foreground/65">Issue #28</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
          Apple Music-inspired UI system
        </h1>
        <p className="mt-2 text-sm leading-6 text-foreground/75">
          Storybook-style inventory for the new visual language, route blueprint targets, and
          accessibility criteria before route-by-route implementation.
        </p>
      </header>

      <section aria-labelledby="token-spec-heading" className="flex flex-col gap-3">
        <h2 id="token-spec-heading" className="text-sm font-semibold uppercase tracking-[0.12em]">
          Token spec
        </h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {tokenGroups.map((group) => (
            <article
              key={group.title}
              className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-elevation-1"
            >
              <header>
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <p className="mt-1 text-xs text-foreground/70">{group.description}</p>
              </header>
              <ul className="flex flex-col gap-2">
                {group.tokens.map((token) => (
                  <li
                    key={token.name}
                    className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-xl border border-border-subtle bg-background p-3"
                  >
                    <span
                      className={`size-5 rounded-full border border-border-subtle ${token.sampleClass}`}
                      aria-hidden="true"
                    />
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs font-semibold">{token.name}</p>
                      <p className="text-xs text-foreground/70">{token.value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="component-inventory-heading" className="flex flex-col gap-3">
        <h2
          id="component-inventory-heading"
          className="text-sm font-semibold uppercase tracking-[0.12em]"
        >
          Component inventory
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {componentInventory.map((item) => (
            <article
              key={item.name}
              className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-elevation-1"
            >
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="text-sm text-foreground/75">{item.intent}</p>
              <p className="text-xs uppercase tracking-[0.12em] text-accent-strong">{item.status}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="route-blueprints-heading" className="flex flex-col gap-3">
        <h2 id="route-blueprints-heading" className="text-sm font-semibold uppercase tracking-[0.12em]">
          Route blueprints
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-surface-1 shadow-elevation-1">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Desktop and mobile redesign targets by route group</caption>
            <thead className="border-b border-border-subtle">
              <tr className="text-xs uppercase tracking-[0.12em] text-foreground/65">
                <th scope="col" className="px-3 py-2 font-semibold">
                  Route group
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Desktop target
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Mobile target
                </th>
              </tr>
            </thead>
            <tbody>
              {routeBlueprints.map((item) => (
                <tr key={item.route} className="border-b border-border-subtle/80 last:border-0">
                  <th scope="row" className="px-3 py-3 text-sm font-semibold text-foreground">
                    {item.route}
                  </th>
                  <td className="px-3 py-3 text-sm text-foreground/80">{item.desktop}</td>
                  <td className="px-3 py-3 text-sm text-foreground/80">{item.mobile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="accessibility-heading" className="flex flex-col gap-3">
        <h2 id="accessibility-heading" className="text-sm font-semibold uppercase tracking-[0.12em]">
          Accessibility validation checklist
        </h2>
        <ol className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-1 p-4 text-sm text-foreground/80 shadow-elevation-1">
          {accessibilityChecks.map((item) => (
            <li key={item} className="rounded-xl border border-border-subtle bg-background px-3 py-2">
              {item}
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
