#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { SearchParams } from './types.js';
import { Yad2Client } from './yad2-client.js';
import {
  extractSearchParams,
  filterCities,
  formatListing,
  formatSearchResults,
} from './formatters.js';

const client = new Yad2Client();
const server = new Server({ name: 'yad2-mcp', version: '1.0.0' }, { capabilities: { tools: {} } });

// ─── Tool definitions ─────────────────────────────────────────────────────────

const SEARCH_PROPERTIES = {
  city: {
    type: 'string',
    description: 'City code (e.g. "5000" for Tel Aviv, "3000" for Haifa, "70" for Jerusalem)',
  },
  rooms: { type: 'string', description: 'Room range e.g. "2-4", "3", "1.5-3"' },
  priceMin: { type: 'number', description: 'Minimum price in ILS' },
  priceMax: { type: 'number', description: 'Maximum price in ILS' },
  sizeMin: { type: 'number', description: 'Minimum size in sqm' },
  sizeMax: { type: 'number', description: 'Maximum size in sqm' },
  floor: { type: 'string', description: 'Floor range e.g. "1-5", "0" for ground floor' },
  propertyType: {
    type: 'string',
    description: 'Property type',
    enum: [
      'apartment',
      'garden_apartment',
      'penthouse',
      'duplex',
      'roof_apartment',
      'unit',
      'storage',
      'parking',
    ],
  },
  page: { type: 'number', description: 'Page number (default: 1)' },
  pageSize: { type: 'number', description: 'Results per page (default: 20, max: 40)' },
};

const TOOLS = [
  {
    name: 'search_rentals',
    description: 'Search rental property listings on yad2.co.il',
    inputSchema: { type: 'object', properties: SEARCH_PROPERTIES },
  },
  {
    name: 'search_for_sale',
    description: 'Search properties for sale on yad2.co.il',
    inputSchema: { type: 'object', properties: SEARCH_PROPERTIES },
  },
  {
    name: 'get_listing',
    description: 'Get full details of a specific yad2 listing by its token/ID',
    inputSchema: {
      type: 'object',
      properties: { token: { type: 'string', description: 'The listing token or ID' } },
      required: ['token'],
    },
  },
  {
    name: 'list_city_codes',
    description: 'List common Israeli city codes for use in searches',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'string', description: 'Optional filter string to search city names' },
      },
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

// ─── Tool handlers ────────────────────────────────────────────────────────────

type ToolResponse = { content: Array<{ type: string; text: string }>; isError?: boolean };

async function handleSearch(
  toolName: string,
  params: Record<string, unknown>,
): Promise<ToolResponse> {
  const type = toolName === 'search_rentals' ? 'rent' : 'forsale';
  const result = await client.search(type, extractSearchParams(params) as SearchParams);
  return { content: [{ type: 'text', text: formatSearchResults(result, type) }] };
}

async function handleGetListing(params: Record<string, unknown>): Promise<ToolResponse> {
  const token = params['token'] as string | undefined;
  if (token === undefined || token === '') throw new Error('token is required');
  const listing = await client.getListing(token);
  return { content: [{ type: 'text', text: formatListing(listing) }] };
}

function handleListCityCodes(params: Record<string, unknown>): ToolResponse {
  const filter = (params['filter'] as string | undefined)?.toLowerCase();
  const text = filterCities(filter)
    .map((c) => `${c.code.padEnd(8)} ${c.nameEn} (${c.name})`)
    .join('\n');
  return { content: [{ type: 'text', text: `City codes:\n\n${text}` }] };
}

async function dispatch(name: string, params: Record<string, unknown>): Promise<ToolResponse> {
  if (name === 'search_rentals' || name === 'search_for_sale') return handleSearch(name, params);
  if (name === 'get_listing') return handleGetListing(params);
  if (name === 'list_city_codes') return handleListCityCodes(params);
  throw new Error(`Unknown tool: ${name}`);
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const params = (args ?? {}) as Record<string, unknown>;
  try {
    return await dispatch(name, params);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Yad2 MCP server running on stdio');
}

main().catch((err: unknown) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
