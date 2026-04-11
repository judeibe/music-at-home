---
name: "JavaScript/TypeScript + UI MCP Rules"
description: "Enforce Context7 for library context and shadcn MCP for UI work"
applyTo: "**/*.{js,jsx,ts,tsx}"
---
# JavaScript/TypeScript and JSX/TSX instructions

- For any task involving a third-party library, framework, SDK, API, or tool usage, **always retrieve current documentation context through Context7 MCP before implementing or editing code**.
- Use the required Context7 flow: resolve the library ID first, then query docs for the exact task.
- Do not rely on memory for library APIs when Context7 can provide current guidance.
- For any creation or modification of UI elements/components/patterns, **always use shadcn MCP tools** to discover, inspect, and add the relevant component patterns.
- Prefer shadcn registry components and examples as the first source for UI implementation patterns in this repository.
