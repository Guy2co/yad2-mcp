# AI Extension Plan

Goal: make this repo as easy and safe to extend with AI assistance as possible.
AI assistants make different mistakes than humans — they're great at following patterns but
weak at detecting broken runtime contracts, missing edge cases, and drift between types and
actual data shapes. Every item below targets one of those failure modes.

---

## 1. Stricter TypeScript

**Why:** AI-generated code often produces subtle bugs around optional chaining, index access,
and optional property narrowing. Turning on stricter flags makes the compiler catch these
before they reach tests.

**Changes to `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

- `noUncheckedIndexedAccess` — `arr[0]` becomes `T | undefined`, forcing null checks
- `exactOptionalPropertyTypes` — `{ a?: string }` won't accept `{ a: undefined }`
- `noImplicitOverride` — must annotate `override` on overriding class methods
- `noPropertyAccessFromIndexSignature` — must use bracket notation for index signature properties

**Effort:** Low. Fix ~10–20 type errors that surface.

---

## 2. Zod Schemas for External API Responses

**Why:** The Yad2 API is scraped, not contracted. TypeScript interfaces give compile-time
safety but no runtime guarantee. When Yad2 changes their payload structure, errors surface
as mysterious `undefined` values deep in formatter output. Zod schemas validate the shape
at the parse boundary and give clear error messages.

**What to add:**

- `src/realestate/api-schema.ts` — Zod schemas for `Yad2ApiItem`, `Yad2ApiAddress`, `Yad2FeedData`
- `src/vehicles/api-schema.ts` — Zod schemas for `Yad2VehicleApiItem`, `Yad2VehicleFeedData`

The parsers call `.parse()` (throw on mismatch) or `.safeParse()` (return structured error)
on the raw `__NEXT_DATA__` payload before handing it to the existing parsing logic.

**Benefit for AI:** When AI modifies a parser or formatter, tests will fail fast and clearly
if the assumed shape no longer matches — no debugging mysterious `undefined` chains.

**Effort:** Medium. ~80 lines of Zod schema code + update parsers to validate.

---

## 3. Test Fixtures as Ground Truth

**Why:** Current tests construct mock data inline, scattered across test files. AI generating
new tests must infer the correct shape from TypeScript types — which is error-prone. A
centralized fixture file gives a single source of truth for test data.

**What to add:**

- `src/__tests__/fixtures/realestate-api-response.json` — sanitized real Yad2 API payload
- `src/__tests__/fixtures/vehicles-api-response.json` — sanitized real vehicles payload
- `src/__tests__/fixtures/index.ts` — typed exports: `realestateFixture`, `vehiclesFixture`

Existing parser and formatter tests import from fixtures rather than re-declaring shapes inline.

**Benefit for AI:** New tests become `parseItem(fixtures.realestateFixture.items[0])` —
no guessing what shape is valid input.

**Effort:** Low-medium. Capture one real API response, sanitize, export.

---

## 4. Coverage Thresholds

**Why:** AI writes code that works for the happy path but misses edge cases. Enforced
coverage minimums mean AI must write tests for what it adds, not just for the part it already
knows works.

**Change to `vitest.config.ts`:**

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov'],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 70,
  },
}
```

**Effort:** Very low. May need to add a few tests to reach thresholds on first run.

---

## 5. Type-Level Tests with `expect-type`

**Why:** TypeScript types are part of the public contract of formatters and parsers.
AI refactoring can silently widen or narrow return types in ways that compile but break
downstream consumers. Type-level tests lock the contract.

**What to add:**

- `devDependency`: `expect-type` (lightweight, zero runtime)
- `src/__tests__/types.test.ts`:

```typescript
import { expectTypeOf } from 'expect-type';
import type { Listing, SearchResult } from '../realestate/types.js';
import { parseItem, parseResponse } from '../realestate/parser.js';

it('parseItem returns Listing', () => {
  expectTypeOf(parseItem).returns.toEqualTypeOf<Listing>();
});
it('parseResponse returns SearchResult', () => {
  expectTypeOf(parseResponse).returns.toEqualTypeOf<SearchResult>();
});
```

**Effort:** Low. ~30 lines covering key function signatures.

---

## 6. CLAUDE.md: How-to-Extend Section

**Why:** AI assistants follow patterns — if the patterns are written down, they'll follow them.
Without a "how to add a new tool" recipe, AI guesses the pattern from existing code and
sometimes gets it wrong (e.g., forgets to register in `index.ts`, misses the `handlers.ts` wiring).

**What to add to `CLAUDE.md`:**

A `## Extending` section covering:

```markdown
### How to add a new tool

1. Add Zod schema to `src/mcp/tools.ts` (input shape only — no logic here)
2. Add handler function to `src/mcp/handlers.ts` (calls client, calls formatter, returns MCP response)
3. Register the tool in `src/index.ts` (server.setRequestHandler → call handler)
4. Add unit tests in `src/__tests__/`

### How to add a new search category (e.g. commercial rentals)

1. Create `src/<category>/` with: `types.ts`, `parser.ts`, `query-builder.ts`, `formatters.ts`, `yad2-<category>-client.ts`
2. Parser and formatter are pure functions — test them without a browser
3. Client uses `withPage()` from `src/infra/browser.ts`
4. Wire up in `src/mcp/handlers.ts` + `src/mcp/tools.ts` + `src/index.ts`

### Invariants to preserve

- `console.log` is forbidden — stdout must be clean JSON-RPC (MCP transport). Use `console.error` only.
- All functions ≤ 15 lines. Extract helpers rather than making functions longer.
- No `any`. Use `unknown` + Zod if you need runtime flexibility.
- Zod schemas in `tools.ts` define the MCP API surface — changing them is a breaking change.
```

**Effort:** Very low. Write once, pays off every future session.

---

## 7. JSDoc on Public Functions

**Why:** TypeScript types tell AI *what*, but not *why*. JSDoc comments on the key public
functions give AI the context needed to modify them correctly — what the function assumes,
what side effects it has, what it returns in edge cases.

**What to document:**

High-priority (unclear intent, easy to break wrong):
- `extractNextData` / `extractNextDataByMatcher` in `browser.ts` — explain `__NEXT_DATA__` structure
- `buildQuery` in both `query-builder.ts` files — explain yad2 URL parameter quirks
- `parseItem` / `parseVehicleItem` — explain which API fields are nullable vs just absent
- `withPage` — explain resource management contract (always closes browser)

Format: short `/** ... */` block, one `@param` per non-obvious param, one `@returns` line.

**Effort:** Low. ~15–20 targeted JSDoc blocks, no wholesale documentation pass needed.

---

## 8. ESLint: Tighten AI-Risky Rules

**Why:** A few additional rules catch the specific mistakes AI tends to make in this codebase.

**Additions to `eslint.config.mjs`:**

```js
// Prevents AI from using loose equality in Zod/API comparisons
'eqeqeq': ['error', 'always'],                      // already have ===, make explicit

// Prevents swallowing errors silently
'@typescript-eslint/no-floating-promises': 'error',

// Prevents AI from returning void implicitly in async functions
'@typescript-eslint/no-misused-promises': 'error',

// Prevents AI from adding catch blocks that swallow errors
'@typescript-eslint/prefer-promise-reject-errors': 'error',
```

The last three are especially important for `async` code in `browser.ts` and clients.

**Effort:** Low. Fix any new violations that surface (likely 0–5).

---

## Summary Table

| # | Change | Files Touched | Effort | AI Risk Mitigated |
|---|--------|--------------|--------|-------------------|
| 1 | Stricter TypeScript | `tsconfig.json` | Low | Wrong optional/index access |
| 2 | Zod API schemas | `src/realestate/api-schema.ts`, `src/vehicles/api-schema.ts` | Medium | Silent API shape drift |
| 3 | Shared test fixtures | `src/__tests__/fixtures/` | Low-Med | Wrong test data assumptions |
| 4 | Coverage thresholds | `vitest.config.ts` | Very Low | Untested code paths |
| 5 | Type-level tests | `src/__tests__/types.test.ts` | Low | Silent type contract breaks |
| 6 | CLAUDE.md how-to-extend | `CLAUDE.md` | Very Low | Wrong extension patterns |
| 7 | JSDoc on public fns | `browser.ts`, parsers, query-builders | Low | Misunderstood contracts |
| 8 | Additional ESLint rules | `eslint.config.mjs` | Low | Async/promise bugs |

---

## Recommended Implementation Order

1. **CLAUDE.md** (6) — zero risk, immediate benefit for every future session
2. **Coverage thresholds** (4) — one-liner, enforces test discipline going forward
3. **Stricter TypeScript** (1) — surface latent bugs before adding new code
4. **ESLint rules** (8) — low effort, catches async bugs early
5. **Zod API schemas** (2) — highest value for runtime safety, moderate effort
6. **Test fixtures** (3) — makes new tests easy to write correctly
7. **Type-level tests** (5) — locks public contracts
8. **JSDoc** (7) — iterative, add as functions are touched
