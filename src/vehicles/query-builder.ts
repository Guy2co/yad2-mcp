import type { VehicleSearchParams } from './types.js';

function buildVehiclePriceParam(params: VehicleSearchParams): string | undefined {
  if (params.priceMin === undefined && params.priceMax === undefined) return undefined;
  return `${params.priceMin ?? 0}-${params.priceMax ?? 99999999}`;
}

function applyVehicleOptionalParams(params: VehicleSearchParams, q: Record<string, string>): void {
  if (params.manufacturer !== undefined) q['manufacturer'] = params.manufacturer;
  if (params.model !== undefined) q['model'] = params.model;
  if (params.year !== undefined) q['year'] = params.year;
  if (params.hand !== undefined) q['hand'] = String(params.hand);
  if (params.kmMax !== undefined) q['km'] = `0-${params.kmMax}`;
  const price = buildVehiclePriceParam(params);
  if (price !== undefined) q['price'] = price;
}

/**
 * Maps `VehicleSearchParams` to yad2.co.il/vehicles URL query parameters.
 *
 * Notable quirks:
 * - `manufacturer` and `model` are numeric IDs from `manufacturers.json`, not display names.
 * - `hand` is a numeric ordinal (1 = first hand, 2 = second hand, etc.).
 * - `kmMax` maps to a range param `0-{kmMax}` (yad2 always needs the lower bound).
 */
export function buildVehicleQuery(params: VehicleSearchParams): Record<string, string> {
  const q: Record<string, string> = {
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 20),
  };
  applyVehicleOptionalParams(params, q);
  return q;
}
