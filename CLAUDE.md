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

## Architecture (updated)

The CLAUDE.md header description is stale — the server now exposes **8 tools**:
`search_rentals`, `search_for_sale`, `get_listing`, `list_city_codes`,
`search_cars`, `list_manufacturers`, `list_property_types`, `which_tool`.

Full data flow:
```
MCP tool call → mcp/handlers.ts → {realestate,vehicles}/yad2-*-client.ts
                                → infra/browser.ts (Playwright) → yad2.co.il
                                ← {realestate,vehicles}/parser.ts (parse __NEXT_DATA__)
                                ← {realestate,vehicles}/api-schema.ts (Zod validation)
                                ← {realestate,vehicles}/formatters.ts (markdown output)
```

## Extending

### How to add a new tool

1. Add a Zod schema to `src/mcp/tools.ts` (input shape only — no logic here).
2. Add a handler function to `src/mcp/handlers.ts` (calls client, calls formatter, returns `{ content: [{ type: 'text', text: ... }] }`).
3. Register it in `src/index.ts` inside `server.setRequestHandler(CallToolRequestSchema, ...)`.
4. Add unit tests in `src/__tests__/`.

### How to add a new search category (e.g. commercial rentals)

1. Create `src/<category>/` with: `types.ts`, `api-schema.ts`, `parser.ts`, `query-builder.ts`, `formatters.ts`, `yad2-<category>-client.ts`.
2. `parser.ts` and `formatters.ts` must be pure functions — test them without a browser.
3. The client uses `withPage()` from `src/infra/browser.ts`.
4. Wire up in `src/mcp/handlers.ts` + `src/mcp/tools.ts` + `src/index.ts`.
5. Write tests that import from `src/__tests__/fixtures/index.ts` rather than inline mock data.

### Invariants to preserve

- **stdout must be clean JSON-RPC** — MCP transport uses stdout. `console.log` is banned. Use `console.error` for all logging (goes to stderr).
- **All functions ≤ 15 lines** (blank lines and comments excluded). Extract helpers rather than making functions longer.
- **No `any`** — use `unknown` + Zod `.safeParse()` when you need runtime flexibility.
- **Zod schemas in `tools.ts` define the MCP API surface** — changing them is a breaking change for every client using the server.
- **`api-schema.ts` Zod schemas validate external API responses** — keep them in sync when the Yad2 API payload changes. Use `.passthrough()` so extra fields never throw.
- **Test fixtures live in `src/__tests__/fixtures/index.ts`** — new tests should import from there, not redeclare mock data inline.

## Before committing / pushing

Run these checks locally before pushing — they are all enforced in CI:

```bash
npm run lint          # ESLint (max-lines-per-function, no-any, etc.)
npm run format:check  # Prettier formatting
npm run build         # TypeScript compilation
npm test              # Unit tests
```

The most common CI failure is `max-lines-per-function` (≤ 15 non-blank, non-comment lines per function). If you add code to a function and it exceeds 15 lines, extract a helper rather than raising the limit.

## Code style

Enforced by ESLint + Prettier (auto-run on commit via husky + lint-staged):
- Max 15 lines per function (blank lines and comments excluded — `skipBlankLines: true, skipComments: true`)
- Explicit return types on all functions
- No `any` — everything explicitly typed
- `import type` for type-only imports
- Single quotes, 100-char line width, trailing commas (Prettier config)
