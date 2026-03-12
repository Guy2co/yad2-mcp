# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # compile TypeScript to dist/
npm run dev            # run with ts-node (no compile step)
npm test               # run unit tests (parsers + formatters)
npm run test:watch     # watch mode for unit tests
npm run test:coverage  # unit tests with coverage
npm run test:e2e       # e2e tests — requires `npm run build` first (spawns dist/index.js)
npm run lint           # check ESLint
npm run lint:fix       # auto-fix ESLint errors
npm run format         # format with Prettier
npm run format:check   # check formatting without writing
```

Run a single test file:
```bash
npx vitest run src/__tests__/parsers.test.ts
```

## Architecture

This is an MCP server exposing 4 tools (`search_rentals`, `search_for_sale`, `get_listing`, `list_city_codes`) that search yad2.co.il using a headless Playwright browser to bypass bot protection (PerimeterX/ShieldSquare).

**Data flow:**
```
MCP tool call → handlers.ts → Yad2Client → browser.ts (Playwright) → yad2.co.il
                                         ← parser.ts (parse __NEXT_DATA__)
                            ← formatters.ts (markdown output)
```

**Key design points:**
- `browser.ts` launches headless Chromium, navigates, then extracts listing data from the `__NEXT_DATA__` JSON script tag embedded by Next.js SSR. The dehydrated React Query state (`pageProps.dehydratedState.queries`) contains the feed.
- `parser.ts` and `formatters.ts` are pure functions — no side effects, fully unit-testable without a browser.
- `query-builder.ts` maps `SearchParams` to yad2 URL query parameters.
- `handlers.ts` is thin: it wires Zod-validated tool inputs to `Yad2Client` and formatters.
- `tools.ts` contains only Zod schemas (the MCP API surface); no logic.
- The e2e tests spawn `dist/index.js` as a subprocess and speak JSON-RPC over stdio.

## Code style

Enforced by ESLint + Prettier (auto-run on commit via husky + lint-staged):
- Max 15 lines per function
- Explicit return types on all functions
- No `any` — everything explicitly typed
- `import type` for type-only imports
- Single quotes, 100-char line width, trailing commas (Prettier config)
