import type { SearchParams } from './types.js';

function buildPriceParam(params: SearchParams): string | undefined {
  if (params.priceMin === undefined && params.priceMax === undefined) return undefined;
  return `${params.priceMin ?? 0}-${params.priceMax ?? 99999999}`;
}

function buildSizeParam(params: SearchParams): string | undefined {
  if (params.sizeMin === undefined && params.sizeMax === undefined) return undefined;
  return `${params.sizeMin ?? 0}-${params.sizeMax ?? 99999}`;
}

function applyOptionalParams(params: SearchParams, q: Record<string, string>): void {
  if (params.city !== undefined) q.city = params.city;
  if (params.rooms !== undefined) q.rooms = params.rooms;
  if (params.floor !== undefined) q.floor = params.floor;
  if (params.propertyType !== undefined) q.property = params.propertyType;
  const price = buildPriceParam(params);
  if (price !== undefined) q.priceOnly = price;
  const size = buildSizeParam(params);
  if (size !== undefined) q.squaremeter = size;
}

export function buildQuery(params: SearchParams): Record<string, string> {
  const q: Record<string, string> = {
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 20),
  };
  applyOptionalParams(params, q);
  return q;
}
