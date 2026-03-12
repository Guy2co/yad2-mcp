# yad2-mcp

An MCP (Model Context Protocol) server that lets AI assistants search real estate listings on [yad2.co.il](https://www.yad2.co.il) — Israel's largest property marketplace.

## How it works

Yad2 uses bot protection (PerimeterX/ShieldSquare). This server uses a headless Chromium browser via [Playwright](https://playwright.dev) to load the page and extract listing data from the Next.js SSR payload (`__NEXT_DATA__`) embedded in the HTML.

## Tools

| Tool | Description |
|------|-------------|
| `search_rentals` | Search rental listings by city, rooms, price, size, floor, property type |
| `search_for_sale` | Search for-sale listings with the same filters |
| `get_listing` | Get full details of a specific listing by its token |
| `list_city_codes` | List city codes to use in searches (filterable by name) |

### Search parameters

All search tools accept these optional parameters:

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `city` | string | `"5000"` | City code — use `list_city_codes` to find them |
| `rooms` | string | `"2-4"` | Room range (e.g. `"3"`, `"1.5-3"`, `"2-4"`) |
| `priceMin` | number | `3000` | Minimum price in ILS |
| `priceMax` | number | `8000` | Maximum price in ILS |
| `sizeMin` | number | `50` | Minimum size in m² |
| `sizeMax` | number | `120` | Maximum size in m² |
| `floor` | string | `"1-5"` | Floor range (`"0"` for ground floor) |
| `propertyType` | string | `"apartment"` | One of: `apartment`, `garden_apartment`, `penthouse`, `duplex`, `roof_apartment`, `unit`, `storage`, `parking` |
| `page` | number | `1` | Page number (default: 1) |
| `pageSize` | number | `20` | Results per page (default: 20, max: 40) |

### Common city codes

| Code | City |
|------|------|
| `5000` | Tel Aviv-Yafo |
| `3000` | Haifa |
| `70` | Jerusalem |
| `8600` | Beer Sheva |
| `6300` | Netanya |
| `9000` | Rishon LeZion |
| `5100` | Herzliya |
| `1064` | Raanana |
| `2800` | Kfar Saba |
| `7200` | Modi'in |

Use the `list_city_codes` tool with a `filter` param to search others (e.g. `filter: "haifa"`).

---

## Installation & setup

### Prerequisites

- Node.js 20+
- Git

### 1. Clone and install

```bash
git clone https://github.com/Guy2co/yad2-mcp.git
cd yad2-mcp
npm install
npx playwright install chromium
npm run build
```

### 2. Add to Claude Code

Edit `~/.claude/mcp.json` (create it if it doesn't exist):

```json
{
  "mcpServers": {
    "yad2": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/yad2-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Code. The `yad2_*` tools will appear automatically.

### 3. Add to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "yad2": {
      "command": "node",
      "args": ["/absolute/path/to/yad2-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop.

### 4. Use with any MCP-compatible client

The server speaks the [MCP stdio transport](https://modelcontextprotocol.io) — it reads JSON-RPC from stdin and writes to stdout. Any MCP client can connect to it with:

```
command: node /path/to/yad2-mcp/dist/index.js
```

---

## Example usage

Once the MCP server is connected to your AI assistant, you can ask it naturally:

> "Find me 2-3 room apartments for rent in Tel Aviv under ₪8,000/month"

The assistant will call `search_rentals` with:
```json
{
  "city": "5000",
  "rooms": "2-3",
  "priceMax": 8000
}
```

> "Show me penthouses for sale in Herzliya between ₪3M and ₪6M"

```json
{
  "city": "5100",
  "propertyType": "penthouse",
  "priceMin": 3000000,
  "priceMax": 6000000
}
```

> "Get details for listing abc123"

```json
{ "token": "abc123" }
```

---

## Development

```bash
npm run build          # compile TypeScript
npm run dev            # run with ts-node (no compile step)
npm run lint           # check for lint errors
npm run lint:fix       # auto-fix lint errors
npm run format         # format with Prettier
npm run format:check   # check formatting without writing
npm test               # run unit tests
npm run test:e2e       # run e2e tests (spawns the server subprocess)
npm run test:coverage  # run unit tests with coverage report
```

A pre-commit hook runs `eslint --fix`, `prettier --write`, and `npm test` automatically on staged files.

### Code style

This project enforces strict standards suitable for open-source:

- **Max 15 lines per function** — keeps logic composable and readable
- **Explicit return types** on all functions
- **No `any`** — everything is explicitly typed
- **No deprecated APIs** — `@typescript-eslint/no-deprecated` catches stale SDK usage
- **`import type`** for type-only imports
- **`===` always** — no loose equality
- **Prettier** for consistent formatting (single quotes, 100-char width, trailing commas)

---

## Architecture

```
src/
├── index.ts          MCP server entry point — wires McpServer to tools and transport
├── tools.ts          Zod schemas defining the MCP API surface (tool inputs)
├── handlers.ts       Tool handler functions (search, get listing, list cities)
├── yad2-client.ts    Playwright-based client for yad2.co.il
├── browser.ts        Headless browser helpers (launch, navigate, extract __NEXT_DATA__)
├── parser.ts         Pure functions for parsing yad2 feed/item data into Listing objects
├── query-builder.ts  Pure functions for building yad2 URL query parameters
├── formatters.ts     Pure functions for formatting results as markdown
└── types.ts          Shared TypeScript interfaces
```

The client:
1. Launches a headless Chromium browser with a realistic user agent
2. Navigates to the relevant yad2 page
3. Waits for the `__NEXT_DATA__` script tag (Next.js SSR payload) to be attached to the DOM
4. Extracts and parses the dehydrated React Query state containing the listing feed
5. Returns structured `Listing` objects

---

## CI / Publishing

GitHub Actions runs on every push and PR:
- TypeScript build
- ESLint
- Prettier format check
- Unit tests
- E2E tests

On push to `main`/`master`, it also publishes to [GitHub Packages](https://github.com/Guy2co/yad2-mcp/packages) as `@guy2co/yad2-mcp`.

---

## License

MIT
