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
  if (params.shelter === true) q.shelter = '1';
  if (params.elevator === true) q.elevator = '1';
  if (params.parking === true) q.parking = '1';
  if (params.balcony === true) q.balcony = '1';
  if (params.ac === true) q.ac = '1';
  if (params.storage === true) q.storage = '1';
}

function applyFeatureFiltersB(params: SearchParams, q: Record<string, string>): void {
  if (params.accessibility === true) q.accessibility = '1';
  if (params.pets === true) q.pets = '1';
  if (params.furnished === true) q.furnished = '1';
  if (params.boiler === true) q.boiler = '1';
  if (params.doorman === true) q.doorman = '1';
}

function applyFeatureFilters(params: SearchParams, q: Record<string, string>): void {
  applyFeatureFiltersA(params, q);
  applyFeatureFiltersB(params, q);
}

function applyCityAndArea(params: SearchParams, q: Record<string, string>): void {
  if (params.city === undefined) return;
  q.city = params.city;
  const area = lookupCityArea(params.city);
  if (area !== undefined) q.area = area;
}

function applyOptionalParams(
  params: SearchParams,
  q: Record<string, string>,
  type: 'rent' | 'forsale',
): void {
  applyCityAndArea(params, q);
  if (params.rooms !== undefined) q.rooms = params.rooms;
  if (params.floor !== undefined) q.floor = params.floor;
  if (params.propertyType !== undefined) q.property = toYad2PropertyId(params.propertyType);
  const price = buildPriceParam(params);
  if (price !== undefined) q[type === 'forsale' ? 'price' : 'priceOnly'] = price;
  const size = buildSizeParam(params);
  if (size !== undefined) q.squaremeter = size;
  applyFeatureFilters(params, q);
}

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
