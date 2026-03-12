#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SearchSchema, GetListingSchema, ListCityCodesSchema } from './tools.js';
import { handleSearch, handleGetListing, handleListCityCodes } from './handlers.js';

const server = new McpServer({ name: 'yad2-mcp', version: '1.0.0' });

server.registerTool(
  'search_rentals',
  { description: 'Search rental property listings on yad2.co.il', inputSchema: SearchSchema },
  async (params) => handleSearch('search_rentals', params),
);

server.registerTool(
  'search_for_sale',
  { description: 'Search properties for sale on yad2.co.il', inputSchema: SearchSchema },
  async (params) => handleSearch('search_for_sale', params),
);

server.registerTool(
  'get_listing',
  {
    description: 'Get full details of a specific yad2 listing by its token/ID',
    inputSchema: GetListingSchema,
  },
  async (params) => handleGetListing(params),
);

server.registerTool(
  'list_city_codes',
  {
    description: 'List common Israeli city codes for use in searches',
    inputSchema: ListCityCodesSchema,
  },
  (params) => handleListCityCodes(params),
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Yad2 MCP server running on stdio');
}

main().catch((err: unknown) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
