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
  formatManufacturerEntry,
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

/**
 * An MCP tool result. `content` is the human-readable markdown every client renders;
 * `structuredContent` is the same data unflattened, for programmatic consumers.
 *
 * No tool declares an `outputSchema`, deliberately: the SDK turns a declared schema into
 * a hard gate (server-side Zod plus client-side Ajv against `additionalProperties: false`),
 * so a single unexpected value in a scraped payload would fail the whole call instead of
 * degrading one field. Consumers validate the shape themselves and can skip a bad row.
 */
type ToolResponse = {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

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
  return {
    content: [{ type: 'text', text: formatSearchResults(result, type) }],
    structuredContent: { ...result },
  };
}

export async function handleGetListing(params: GetListingParams): Promise<ToolResponse> {
  if (params.type === 'car') {
    const listing = await vehiclesClient.getCarListing(params.token);
    return {
      content: [{ type: 'text', text: formatVehicleListing(listing) }],
      structuredContent: { ...listing },
    };
  }
  const listing = await realEstateClient.getListing(params.token);
  return {
    content: [{ type: 'text', text: formatListing(listing) }],
    structuredContent: { ...listing },
  };
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
  return {
    content: [{ type: 'text', text: formatVehicleSearchResults(result) }],
    structuredContent: { ...result },
  };
}

export function handleListManufacturers(params: ListManufacturersParams): ToolResponse {
  const filter = params.filter?.toLowerCase();
  const withModels = filter !== undefined;
  const lines = filterManufacturers(filter).map((m) => formatManufacturerEntry(m, withModels));
  const body = lines.join(withModels ? '\n\n' : '\n');
  const hint = withModels ? '' : '\n\nPass a filter (e.g. "toyota") to list model IDs.';
  return { content: [{ type: 'text', text: `Car manufacturers:\n\n${body}${hint}` }] };
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
Pass \`filter\` (e.g. "toyota") to also get the model IDs for the matching manufacturers.

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
