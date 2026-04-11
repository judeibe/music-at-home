# Copilot Instructions for `music-at-home`

## Build, lint, and test commands

Use `pnpm` in this repository.

| Task | Command |
| --- | --- |
| Install dependencies | `pnpm install` |
| Start dev server | `pnpm dev` |
| Create production build | `pnpm build` |
| Run production server | `pnpm start` |
| Lint | `pnpm lint` |

There is no test runner configured yet (`package.json` has no test script, and there are no `*.test.*` / `*.spec.*` files).  
When tests are added, expose both:
- a full-suite command (for example `pnpm test`)
- a single-test command (for example `pnpm test -- <path-to-test-file>`)

## High-level architecture

This is a Next.js 16 App Router project with TypeScript and Tailwind CSS v4.

- App entrypoints live in `src/app`:
  - `layout.tsx` defines the root HTML shell, global font setup (`next/font` with Geist/Geist Mono), and page-wide body layout classes.
  - `page.tsx` is the current home route (`/`), using `next/image` and Tailwind utility classes.
  - `globals.css` imports Tailwind, defines theme CSS variables, and maps font variables for utility usage.
- Path alias `@/*` maps to `src/*` (`tsconfig.json`).
- ESLint uses `eslint-config-next` with Core Web Vitals + TypeScript presets (`eslint.config.mjs`).
- Next config enables the React Compiler (`next.config.ts` with `reactCompiler: true`).

## Key conventions for this codebase

- **Treat framework guidance as version-sensitive.** This repo includes explicit agent guidance: Next.js behavior may differ from older conventions. Before making framework-level changes, consult docs in `node_modules/next/dist/docs/` and heed deprecation notes (`AGENTS.md`, `CLAUDE.md`).
- **Use App Router structure under `src/app`.** Keep route components/layouts in the App Router pattern already in use.
- **Prefer utility-first styling via Tailwind classes**, with global tokens in `src/app/globals.css` (`--background`, `--foreground`, and `@theme inline` font/color mappings).
- **Use the `@/` import alias** for code under `src/` rather than deep relative paths where practical.
- **Keep TypeScript strictness intact** (`strict: true`, `noEmit: true`) and align new code with the existing strict TS + Next lint configuration.
