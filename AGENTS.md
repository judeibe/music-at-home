<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Required local skills (`@.agents/skills`)

When a task matches one of the project skills below, explicitly invoke that skill before implementing:

- `context7-mcp` for third-party library/framework/API documentation and examples.
- `shadcn` for shadcn/ui component discovery, composition, and UI implementation workflows.
- `frontend-design` for page/component UI design and visual polish work.
- `vercel-react-best-practices` for React/Next.js performance optimization and implementation best practices.

---

## Agent execution playbook

### Quick reference

| Command | Purpose |
|---|---|
| `pnpm dev` | Start dev server (hot reload) |
| `pnpm build` | Production build — run before opening a PR |
| `pnpm lint` | ESLint across all files |
| `pnpm test` | Full Vitest test suite |
| `pnpm test:file <path>` | Single test file |

### Step-by-step workflow for new features

1. **Read the issue** — understand acceptance criteria and listed dependencies.
2. **Explore the codebase** — use `search_code_subagent` to locate relevant files, then read them directly with `view`/`grep`/`glob`.
3. **Invoke the matching skill** — see the skill table above. Do this *before* writing any code.
4. **Plan first, code second** — call `report_progress` with a checklist before making changes.
5. **Make minimal, surgical changes** — touch only the files the issue requires.
6. **Validate immediately** — run `pnpm lint` and `pnpm build` after each meaningful change. Run `pnpm test` once all changes are in place.
7. **Report and commit** — call `report_progress` after each verified unit of work.
8. **Run `parallel_validation`** before finalising the PR to get Code Review + CodeQL feedback. Address all non-false-positive findings.

### Skill invocation rules

| Situation | Skill to invoke |
|---|---|
| Working with Next.js, React, Tailwind, or any third-party library | `context7-mcp` |
| Adding or modifying any UI component or page layout | `shadcn` and/or `frontend-design` |
| Optimising rendering, data-fetching, or bundle size | `vercel-react-best-practices` |

Always invoke the skill **before** writing implementation code, not after.

### Architecture conventions to follow

- **App Router only.** All routes live under `src/app/`. Do not use the Pages Router.
- **Path alias.** Use `@/` for imports from `src/` instead of deep relative paths.
- **Server vs. client boundary.** `src/lib/music-assistant/server.ts` and `session.ts` are `server-only`. Never import them from Client Components or browser-facing code.
- **API proxy pattern.** All calls to the Music Assistant instance go through `/api/music-assistant/*` route handlers, never directly from the browser.
- **Cookie-based auth.** Session tokens are HttpOnly cookies — never store them in `localStorage` or expose them to client JS.
- **Error handling.** Throw or return `MusicAssistantApiError` (from `@/lib/music-assistant/errors`) for all Music Assistant failures. Map to the standard `{ error: { code, message } }` envelope in route handlers.
- **TypeScript strictness.** `strict: true` is enabled. Keep all new code fully typed; avoid `any`.
- **Styling.** Use Tailwind utility classes. Global tokens (`--background`, `--foreground`, font vars) are defined in `src/app/globals.css`.

### Adding a new app route

1. Create `src/app/(app)/<route-name>/page.tsx` (and optionally `layout.tsx`).
2. Add the route to the nav in `src/app/(app)/_lib/navigation.ts`.
3. For data-fetching, call the relevant `/api/music-assistant/*` route handler from a Server Component or through a client-side fetch helper.
4. Add tests under `src/app/(app)/<route-name>/__tests__/`.

### Adding a new API route

1. Create `src/app/api/music-assistant/<endpoint>/route.ts`.
2. Import server helpers from `@/lib/music-assistant/server` — never from `client.ts` directly in route handlers.
3. Validate the request body with a type-guard function before using it.
4. Wrap the operation in `withMusicAssistantAuth(...)` so `401` responses auto-clear the session cookie.
5. Return the standard JSON envelope: `{ success: true, data }` or `{ error: { code, message } }`.
6. Add tests under `src/app/api/music-assistant/<endpoint>/__tests__/route.test.ts`.

### Environment variables

`MUSIC_ASSISTANT_BASE_URL` — URL of the Music Assistant instance (default: `http://localhost:8095`). Set in `.env.local` for local development; configure in the deployment environment for production.
