# Contributing to yad2-mcp

Thank you for your interest in contributing! This document explains how to get set up, what's in scope, and the standards every contribution must meet.

---

## Project scope

This project has a single, focused purpose: **expose yad2.co.il as an MCP server**.

Yad2 is Israel's largest marketplace and covers many product categories beyond real estate — vehicles, jobs, pets, electronics, and more. All of these are in scope. Contributions that expand coverage to new yad2 categories are especially welcome.

**In scope:**
- New MCP tools for yad2 product categories (vehicles, jobs, pets, electronics, etc.)
- Improvements to existing real estate search (filters, pagination, detail fields)
- Parser improvements as yad2's `__NEXT_DATA__` structure evolves
- Bug fixes and reliability improvements

**Out of scope:**
- Support for other marketplaces or websites
- General-purpose utilities unrelated to yad2
- Breaking the stdio MCP transport contract

---

## Getting started

### Prerequisites

- Node.js 20+
- Git
- [gitleaks](https://github.com/gitleaks/gitleaks) (`brew install gitleaks` on macOS)

### Setup

```bash
git clone https://github.com/Guy2co/yad2-mcp.git
cd yad2-mcp
npm install
npx playwright install chromium
npm run build
```

### Verify everything works

```bash
npm run lint
npm test
```

---

## Adding a new yad2 category

Each yad2 product category follows the same pattern. Here's what to add:

### 1. Types (`src/types.ts`)

Add interfaces for the new category's API item shape, mirroring what `__NEXT_DATA__` returns for that category's page.

### 2. Parser (`src/parser.ts` or a new `src/<category>-parser.ts`)

Add pure `parseItem` and `parseResponse` functions. Keep each function under 15 lines — split if needed.

### 3. Client (`src/yad2-client.ts`)

Add a method for the new category. Follow the existing `search` / `getListing` pattern:
- Use `navigateTo` + `extractNextData` from `browser.ts`
- Pass the correct `__NEXT_DATA__` query key for the category

### 4. Tools (`src/tools.ts`)

Add a Zod schema for the new tool's input parameters.

### 5. Handlers (`src/handlers.ts`)

Add a handler function that calls the client and formats the result.

### 6. Register the tool (`src/index.ts`)

Call `server.registerTool(...)` with the new schema and handler.

### 7. Tests

- Add unit tests in `src/__tests__/` for any complex parsing logic
- Mock `browser.ts` as the existing tests do — never make real network calls in unit tests

---

## Code standards

All contributions must pass the full CI pipeline. The pre-commit hook enforces most of this automatically.

### Rules

| Rule | Detail |
|------|--------|
| **Max 15 lines per function** | Split large functions into focused helpers |
| **Explicit return types** | Every function must declare its return type |
| **No `any`** | Use proper types or `unknown` with narrowing |
| **No deprecated APIs** | `@typescript-eslint/no-deprecated` is enforced |
| **`import type`** | Use for type-only imports |
| **`===` always** | No loose equality |
| **No secrets** | gitleaks runs on every commit and in CI |
| **Prettier formatting** | Single quotes, 100-char width, trailing commas |

### Running the checks manually

```bash
npm run lint          # ESLint + Prettier check
npm run lint:fix      # Auto-fix what can be fixed
npm run format        # Run Prettier
npm test              # Unit tests
npm run test:e2e      # End-to-end tests (requires built dist/)
```

### Hooks

| Hook | Runs |
|------|------|
| `pre-commit` | lint-staged, unit tests, gitleaks (staged files) |
| `pre-push` | version bump (patch) with your commit message |

---

## How yad2 data extraction works

Yad2 uses Next.js SSR. Listing data is embedded in a `<script id="__NEXT_DATA__">` tag as dehydrated React Query state — there is no separate API call to intercept.

The extraction flow:
1. Playwright navigates to the category page
2. `extractNextData(page, queryKey)` in `browser.ts` waits for `#__NEXT_DATA__` and reads it
3. The relevant query is found by its key (e.g. `"realestate-rent-feed"`)
4. The feed data is parsed into `Listing` objects

To find the correct query key for a new category, inspect `__NEXT_DATA__` on the target page:

```js
// Run in browser devtools on the target yad2 page
JSON.parse(document.getElementById('__NEXT_DATA__').textContent)
  .props.pageProps.dehydratedState.queries
  .map(q => q.queryKey[0])
```

---

## Pull request checklist

- [ ] `npm run lint` passes with no errors
- [ ] `npm test` passes
- [ ] New parsing logic has unit tests
- [ ] No secrets or credentials in any file
- [ ] Contribution stays within the yad2 MCP scope
- [ ] Functions stay under 15 lines
- [ ] All new functions have explicit return types

---

## Questions?

Open an issue on [GitHub](https://github.com/Guy2co/yad2-mcp/issues).
