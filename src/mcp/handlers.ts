import { Yad2RealEstateClient } from '../realestate/yad2-realestate-client.js';
import { Yad2VehiclesClient } from '../vehicles/yad2-vehicles-client.js';
import {
  extractSearchParams,
  filterCities,
  filterPropertyTypes,
  formatListing,
  formatSearchResults,
} from '../realestate/formatters.js';
import {
  filterManufacturers,
  formatVehicleListing,
  formatVehicleSearchResults,
} from '../vehicles/formatters.js';
import type { SearchParams } from '../realestate/types.js';
import type { z } from 'zod';
import type {
  SearchSchema,
  GetListingSchema,
  ListCityCodesSchema,
  SearchCarsSchema,
  ListManufacturersSchema,
  ListPropertyTypesSchema,
} from './tools.js';

type ToolResponse = { content: Array<{ type: 'text'; text: string }>; isError?: boolean };

type SearchParams_ = z.infer<typeof SearchSchema>;
type GetListingParams = z.infer<typeof GetListingSchema>;
type ListCityCodesParams = z.infer<typeof ListCityCodesSchema>;
type SearchCarsParams = z.infer<typeof SearchCarsSchema>;
type ListManufacturersParams = z.infer<typeof ListManufacturersSchema>;
type ListPropertyTypesParams = z.infer<typeof ListPropertyTypesSchema>;

const realEstateClient = new Yad2RealEstateClient();
const vehiclesClient = new Yad2VehiclesClient();

export async function handleSearch(toolName: string, params: SearchParams_): Promise<ToolResponse> {
  const type = toolName === 'search_rentals' ? 'rent' : 'forsale';
  const result = await realEstateClient.search(type, extractSearchParams(params) as SearchParams);
  return { content: [{ type: 'text', text: formatSearchResults(result, type) }] };
}

export async function handleGetListing(params: GetListingParams): Promise<ToolResponse> {
  if (params.type === 'car') {
    const listing = await vehiclesClient.getCarListing(params.token);
    return { content: [{ type: 'text', text: formatVehicleListing(listing) }] };
  }
  const listing = await realEstateClient.getListing(params.token);
  return { content: [{ type: 'text', text: formatListing(listing) }] };
}

export function handleListCityCodes(params: ListCityCodesParams): ToolResponse {
  const filter = params.filter?.toLowerCase();
  const text = filterCities(filter)
    .map((c) => `${c.code.padEnd(8)} ${c.nameEn} (${c.name})`)
    .join('\n');
  return { content: [{ type: 'text', text: `City codes:\n\n${text}` }] };
}

export async function handleSearchCars(params: SearchCarsParams): Promise<ToolResponse> {
  const result = await vehiclesClient.searchVehicles(params);
  return { content: [{ type: 'text', text: formatVehicleSearchResults(result) }] };
}

export function handleListManufacturers(params: ListManufacturersParams): ToolResponse {
  const filter = params.filter?.toLowerCase();
  const lines = filterManufacturers(filter).map((m) => {
    const modelList = m.models.map((mod) => `${mod.name} (${mod.id})`).join(', ');
    return `**${m.nameEn}** (${m.name}) — manufacturer ID: ${m.id}\n  Models: ${modelList}`;
  });
  return { content: [{ type: 'text', text: `Car manufacturers:\n\n${lines.join('\n\n')}` }] };
}

export function handleListPropertyTypes(params: ListPropertyTypesParams): ToolResponse {
  const filter = params.filter?.toLowerCase();
  const lines = filterPropertyTypes(filter).map(
    (t) => `- **${t.nameEn}** (${t.name}): \`${t.id}\``,
  );
  return {
    content: [{ type: 'text', text: `## Property Types\n\n${lines.join('\n')}` }],
  };
}

const WHICH_TOOL_TEXT = `# Which Yad2 Tool to Use

## Real Estate Tools

### \`search_rentals\`
Search for rental properties. Use when the user wants to **rent** an apartment, house, or other property.
- Params: city, rooms, priceMin/Max, sizeMin/Max, floor, propertyType, page, pageSize
- Feature filters: shelter, elevator, parking, balcony, ac, storage, accessibility, pets, furnished, boiler, doorman (all boolean)
- Use \`list_city_codes\` to find city codes, \`list_property_types\` to find property type IDs.

### \`search_for_sale\`
Search for properties for sale. Use when the user wants to **buy** real estate.
- Same params as \`search_rentals\`.

### \`list_city_codes\`
Returns a list of Israeli city codes and names. Use before \`search_rentals\` or \`search_for_sale\` when you need a city code.

### \`list_property_types\`
Returns a list of property type IDs and names (Hebrew/English). Use before \`search_rentals\` or \`search_for_sale\` when you need a property type ID.

## Vehicle Tools

### \`search_cars\`
Search for used cars on yad2. Use when the user wants to **buy a car**.
- Params: manufacturer, model, year, priceMin/Max, kmMax, hand, page, pageSize
- Use \`list_manufacturers\` to find manufacturer IDs.

### \`list_manufacturers\`
Returns a list of car manufacturer IDs and names. Use before \`search_cars\` when you need a manufacturer ID.

## General Tools

### \`get_listing\`
Fetch full details for a specific listing by token/ID.
- For real estate listings: \`type: "realestate"\` (default)
- For car listings: \`type: "car"\`

### \`which_tool\` (this tool)
Returns this guide. Use when unsure which tool to call.`;

export function handleWhichTool(): ToolResponse {
  return { content: [{ type: 'text', text: WHICH_TOOL_TEXT }] };
}
