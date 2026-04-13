# Music at Home

A Next.js 16 App Router web client for [Music Assistant](https://music-assistant.io/), providing a self-hosted music management interface with multi-room playback, library browsing, and device management.

---

## Architecture

### Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI components | shadcn/ui |
| Testing | Vitest + Testing Library |
| Runtime | Node.js / React 19 |

### Project structure

```
src/
├── app/
│   ├── (app)/               # Route group — app shell + all feature pages
│   │   ├── _components/     # Shared UI (AppNav, RouteSkeleton, …)
│   │   ├── _lib/            # Client-side helpers (navigation items, library utils)
│   │   ├── layout.tsx        # App shell: header, sidebar nav, main content area
│   │   ├── page.tsx          # Home dashboard (/)
│   │   ├── auth/             # Authentication (/auth)
│   │   ├── players/          # Playback controls (/players)
│   │   ├── library/          # Media library (/library)
│   │   ├── search/           # Unified search (/search)
│   │   ├── favorites/        # Pinned items (/favorites)
│   │   ├── rooms/            # Multi-room grouping (/rooms)
│   │   ├── devices/          # Device management (/devices)
│   │   └── design-system/    # Issue #28 UI tokens + inventory (/design-system)
│   ├── api/
│   │   └── music-assistant/  # Proxy route handlers
│   │       ├── auth/login/   # POST /api/music-assistant/auth/login
│   │       ├── auth/logout/  # POST /api/music-assistant/auth/logout
│   │       └── command/      # POST /api/music-assistant/command
│   ├── globals.css           # Tailwind imports + CSS theme variables
│   └── layout.tsx            # Root HTML shell, fonts (Geist/Geist Mono)
├── docs/
│   ├── music-assitant-api.json   # Music Assistant OpenAPI spec (reference)
│   └── issue-28-design-system-spec.md # Apple Music-inspired UI spec baseline
└── lib/
    └── music-assistant/
        ├── client.ts         # MusicAssistantApiClient — typed HTTP client
        ├── server.ts         # Server-only helpers: session login/logout/command
        ├── session.ts        # HttpOnly cookie management (server-only)
        ├── errors.ts         # MusicAssistantApiError + factory functions
        ├── browser.ts        # Browser-side auth helpers
        └── types.ts          # Shared TypeScript types
```

### Data flow

```
Browser → (app) route page
            └→ Server Component or Client Component
                 └→ POST /api/music-assistant/* (Next.js route handler)
                       └→ server.ts helpers
                             └→ MusicAssistantApiClient (client.ts)
                                   └→ Music Assistant instance (MUSIC_ASSISTANT_BASE_URL)
```

Session tokens are stored in an HttpOnly cookie (`music_assistant_session`, 7-day TTL) and forwarded as a `Bearer` header to the upstream Music Assistant API.

---

## Setup

### Prerequisites

- Node.js ≥ 18
- [pnpm](https://pnpm.io/) (managed via corepack — run `corepack enable` once)
- A running [Music Assistant](https://music-assistant.io/) instance

### Environment variables

Create a `.env.local` file at the project root:

```bash
# URL of your Music Assistant instance (no trailing slash)
# Defaults to http://localhost:8095 if not set
MUSIC_ASSISTANT_BASE_URL=http://your-music-assistant-host:8095
```

### Install and run

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Contributor commands

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server with hot reload |
| `pnpm build` | Create a production build |
| `pnpm start` | Run the production server (requires `pnpm build` first) |
| `pnpm lint` | Run ESLint across the project |
| `pnpm test` | Run the full test suite (Vitest) |
| `pnpm test:file <path>` | Run a single test file |
| `pnpm test:watch` | Run tests in watch mode |

**Example — run one test file:**

```bash
pnpm test:file src/lib/music-assistant/__tests__/errors.test.ts
```

---

## Music Assistant API integration

Three server-side route handlers proxy requests to the Music Assistant instance. All responses use a consistent `{ success, data }` / `{ error: { code, message } }` envelope.

### Routes

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/music-assistant/auth/login` | `{ username, password, providerId? }` | Log in; stores session cookie |
| `POST` | `/api/music-assistant/auth/logout` | — | Clear session cookie |
| `POST` | `/api/music-assistant/command` | `{ command, args? }` | Execute an authenticated command |

`providerId` defaults to `"builtin"` when omitted.

### Session cookie

The session token is stored as an HttpOnly, SameSite=Lax cookie named `music_assistant_session`. In production the cookie is also flagged `Secure`. The cookie expires after 7 days; a `401` response from the upstream API automatically clears it.

### Error codes

| Code | HTTP status | Meaning |
|---|---|---|
| `BAD_REQUEST` | 400 | Malformed or missing request payload |
| `UNAUTHORIZED` | 401 | Missing or invalid session token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `SERVER_ERROR` | 5xx | Upstream Music Assistant error |
| `NETWORK_ERROR` | — | Could not reach Music Assistant |
| `UNKNOWN_ERROR` | 500 | Unexpected server-side failure |

---

## Testing

The project uses [Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/). Test files live alongside the code they test in `__tests__/` sub-directories.

```bash
# Run the full test suite
pnpm test

# Run a single test file
pnpm test:file <path-to-test-file>
# e.g. pnpm test:file src/lib/music-assistant/__tests__/errors.test.ts

# Run tests in watch mode
pnpm test:watch
```

---

## Deployment

The easiest deployment target is [Vercel](https://vercel.com/new). Set the `MUSIC_ASSISTANT_BASE_URL` environment variable in the Vercel project settings.

For self-hosted deployments:

```bash
pnpm build
pnpm start
```
