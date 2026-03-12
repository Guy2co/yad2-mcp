#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  SearchSchema,
  GetListingSchema,
  ListCityCodesSchema,
  SearchCarsSchema,
  ListManufacturersSchema,
  WhichToolSchema,
} from './mcp/tools.js';
import {
  handleSearch,
  handleGetListing,
  handleListCityCodes,
  handleSearchCars,
  handleListManufacturers,
  handleWhichTool,
} from './mcp/handlers.js';
import { version } from '../package.json';

const server = new McpServer({ name: 'yad2-mcp', version });

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
    description:
      'Get full details of a specific yad2 listing by its token/ID. Use type="realestate" (default) for property listings or type="car" for vehicle listings.',
    inputSchema: GetListingSchema,
  },
  async (params) => handleGetListing(params),
);

server.registerTool(
  'list_city_codes',
  {
    description: 'List common Israeli city codes for use in real estate searches',
    inputSchema: ListCityCodesSchema,
  },
  (params) => handleListCityCodes(params),
);

server.registerTool(
  'search_cars',
  {
    description: 'Search used car listings on yad2.co.il',
    inputSchema: SearchCarsSchema,
  },
  async (params) => handleSearchCars(params),
);

server.registerTool(
  'list_manufacturers',
  {
    description: 'List car manufacturer IDs for use in vehicle searches',
    inputSchema: ListManufacturersSchema,
  },
  (params) => handleListManufacturers(params),
);

server.registerTool(
  'which_tool',
  {
    description: 'Get a guide explaining when to use each yad2-mcp tool',
    inputSchema: WhichToolSchema,
  },
  () => handleWhichTool(),
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
