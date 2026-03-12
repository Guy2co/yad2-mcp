import { Yad2Client } from './yad2-client.js';
import {
  extractSearchParams,
  filterCities,
  formatListing,
  formatSearchResults,
} from './formatters.js';
import type { SearchParams } from './types.js';

export type ToolResponse = { content: Array<{ type: string; text: string }>; isError?: boolean };

const client = new Yad2Client();

export async function handleSearch(
  toolName: string,
  params: Record<string, unknown>,
): Promise<ToolResponse> {
  const type = toolName === 'search_rentals' ? 'rent' : 'forsale';
  const result = await client.search(type, extractSearchParams(params) as SearchParams);
  return { content: [{ type: 'text', text: formatSearchResults(result, type) }] };
}

export async function handleGetListing(params: Record<string, unknown>): Promise<ToolResponse> {
  const token = params['token'] as string | undefined;
  if (token === undefined || token === '') throw new Error('token is required');
  const listing = await client.getListing(token);
  return { content: [{ type: 'text', text: formatListing(listing) }] };
}

export function handleListCityCodes(params: Record<string, unknown>): ToolResponse {
  const filter = (params['filter'] as string | undefined)?.toLowerCase();
  const text = filterCities(filter)
    .map((c) => `${c.code.padEnd(8)} ${c.nameEn} (${c.name})`)
    .join('\n');
  return { content: [{ type: 'text', text: `City codes:\n\n${text}` }] };
}

export async function dispatch(
  name: string,
  params: Record<string, unknown>,
): Promise<ToolResponse> {
  if (name === 'search_rentals' || name === 'search_for_sale') return handleSearch(name, params);
  if (name === 'get_listing') return handleGetListing(params);
  if (name === 'list_city_codes') return handleListCityCodes(params);
  throw new Error(`Unknown tool: ${name}`);
}
