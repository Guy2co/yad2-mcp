import { Yad2Client } from './yad2-client.js';
import {
  extractSearchParams,
  filterCities,
  formatListing,
  formatSearchResults,
} from './formatters.js';
import type { SearchParams } from './types.js';
import type { z } from 'zod';
import type { SearchSchema, GetListingSchema, ListCityCodesSchema } from './tools.js';

export type ToolResponse = { content: Array<{ type: 'text'; text: string }>; isError?: boolean };

type SearchParams_ = z.infer<typeof SearchSchema>;
type GetListingParams = z.infer<typeof GetListingSchema>;
type ListCityCodesParams = z.infer<typeof ListCityCodesSchema>;

const client = new Yad2Client();

export async function handleSearch(toolName: string, params: SearchParams_): Promise<ToolResponse> {
  const type = toolName === 'search_rentals' ? 'rent' : 'forsale';
  const result = await client.search(type, extractSearchParams(params) as SearchParams);
  return { content: [{ type: 'text', text: formatSearchResults(result, type) }] };
}

export async function handleGetListing(params: GetListingParams): Promise<ToolResponse> {
  const listing = await client.getListing(params.token);
  return { content: [{ type: 'text', text: formatListing(listing) }] };
}

export function handleListCityCodes(params: ListCityCodesParams): ToolResponse {
  const filter = params.filter?.toLowerCase();
  const text = filterCities(filter)
    .map((c) => `${c.code.padEnd(8)} ${c.nameEn} (${c.name})`)
    .join('\n');
  return { content: [{ type: 'text', text: `City codes:\n\n${text}` }] };
}
