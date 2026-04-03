import type { SearchParams } from './types.js';
import propertyTypes from './property-types.json';
import { lookupCityArea } from './formatters.js';

function toYad2PropertyId(id: string): string {
  return propertyTypes.find((t) => t.id === id)?.yad2Id ?? id;
}

function buildPriceParam(params: SearchParams): string | undefined {
  if (params.priceMin === undefined && params.priceMax === undefined) return undefined;
  return `${params.priceMin ?? 0}-${params.priceMax ?? 99999999}`;
}

function buildSizeParam(params: SearchParams): string | undefined {
  if (params.sizeMin === undefined && params.sizeMax === undefined) return undefined;
  return `${params.sizeMin ?? 0}-${params.sizeMax ?? 99999}`;
}

function applyFeatureFiltersA(params: SearchParams, q: Record<string, string>): void {
  if (params.shelter === true) q['shelter'] = '1';
  if (params.elevator === true) q['elevator'] = '1';
  if (params.parking === true) q['parking'] = '1';
  if (params.balcony === true) q['balcony'] = '1';
  if (params.airConditioner === true) q['airConditioner'] = '1';
  if (params.warehouse === true) q['warehouse'] = '1';
}

function applyFeatureFiltersB(params: SearchParams, q: Record<string, string>): void {
  if (params.accessibility === true) q['accessibility'] = '1';
  if (params.furniture === true) q['furniture'] = '1';
  if (params.renovated === true) q['renovated'] = '1';
  if (params.bars === true) q['bars'] = '1';
}

function applyFeatureFilters(params: SearchParams, q: Record<string, string>): void {
  applyFeatureFiltersA(params, q);
  applyFeatureFiltersB(params, q);
}

function applyCityAndArea(params: SearchParams, q: Record<string, string>): void {
  if (params.city === undefined) return;
  q['city'] = params.city;
  const area = lookupCityArea(params.city);
  if (area !== undefined) q['area'] = area;
}

function applyOptionalParams(
  params: SearchParams,
  q: Record<string, string>,
  type: 'rent' | 'forsale',
): void {
  applyCityAndArea(params, q);
  if (params.rooms !== undefined) q['rooms'] = params.rooms;
  if (params.floor !== undefined) q['floor'] = params.floor;
  if (params.propertyType !== undefined) q['property'] = toYad2PropertyId(params.propertyType);
  const price = buildPriceParam(params);
  if (price !== undefined) q[type === 'forsale' ? 'price' : 'priceOnly'] = price;
  const size = buildSizeParam(params);
  if (size !== undefined) q['squaremeter'] = size;
  applyFeatureFilters(params, q);
}

/**
 * Maps `SearchParams` to yad2.co.il URL query parameters.
 *
 * Notable quirks:
 * - Price key differs by type: `priceOnly` for rent, `price` for forsale.
 * - City lookup also injects an `area` param (yad2 requires both city + area).
 * - `propertyType` is a semantic ID (e.g. `"cottage"`) mapped to yad2's numeric ID(s)
 *   via `property-types.json`. Multi-value types (cottage) are comma-separated strings.
 * - Feature filters (shelter, elevator, etc.) map to `"1"` when enabled; omitted when false.
 *
 * @param type - `"rent"` (default) or `"forsale"` — controls which price param key is used.
 */
export function buildQuery(
  params: SearchParams,
  type: 'rent' | 'forsale' = 'rent',
): Record<string, string> {
  const q: Record<string, string> = {
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 20),
  };
  applyOptionalParams(params, q, type);
  return q;
}
