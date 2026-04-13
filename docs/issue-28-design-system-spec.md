# Issue #28 — Apple Music-inspired UI Spec (PR1)

This document defines the baseline visual language and implementation checkpoints for issue #28 before route-level redesign work begins.

## Scope of this PR

- Design token system (color, spacing, typography, radius, elevation)
- Storybook-style component inventory (captured in-app at `/design-system`)
- Route-by-route blueprint targets (desktop and mobile)
- Accessibility validation matrix

## Visual language direction

- **Tone:** premium, media-first, low-noise controls with high readability
- **Layout posture:** immersive content surfaces + persistent playback context
- **Interaction model:** quick transport actions and clear state transitions

## Token baseline

Token values are implemented in `src/app/globals.css`.

### Color

- `--background`
- `--foreground`
- `--surface-1`
- `--surface-2`
- `--border-subtle`
- `--accent`
- `--accent-strong`

### Spacing

- Shared spacing rhythm centers on utility scale `2/3/4/5/6` for controls, cards, and sections.

### Typography

- Display: page/feature titles
- Section: route-level section headings
- Body: metadata and primary copy
- Micro labels: uppercase state chips and control labels

### Radius and elevation

- Radius tokens: `--radius-sm/md/lg/xl`
- Shadow tokens: `--elevation-1/2`

## Component inventory

Inventory is rendered on `/design-system` and covers:

1. Media card
2. Media row
3. Segment tabs
4. Control cluster
5. Now-playing mini surface
6. Navigation rails (desktop + mobile)

## Route blueprint checklist

- Home
- Library
- Search
- Players
- Rooms
- Devices
- Favorites
- Auth

Each route has desktop/mobile intent captured in `/design-system`.

## Accessibility matrix

- Contrast thresholds for text and control surfaces
- Keyboard path across shell + route controls
- Visible focus treatments
- Landmark/heading semantics and announced status regions
- Mobile touch target and safe-area behavior

## Follow-up implementation branches

- `feat/28-shell-redesign`
- `feat/28-route-redesign-core`
- `feat/28-route-redesign-remaining`
