/**
 * Type-level contract tests using expect-type.
 *
 * These tests have zero runtime cost — they only check that function signatures
 * haven't drifted. If a refactor silently changes a return type, this file fails
 * at compile time (and therefore at `npm test` time via Vitest's type-checking).
 *
 * Add a test here whenever you expose a new public function from a parser,
 * formatter, or query-builder.
 */

import { expectTypeOf } from 'expect-type';
import { it } from 'vitest';
import type { Listing, SearchResult } from '../realestate/types.js';
import type { VehicleListing, VehicleSearchResult } from '../vehicles/types.js';
import type { parseItem, parseResponse } from '../realestate/parser.js';
import type { parseVehicleItem, parseVehicleResponse } from '../vehicles/parser.js';
import type { buildQuery } from '../realestate/query-builder.js';
import type { buildVehicleQuery } from '../vehicles/query-builder.js';

it('parseItem returns Listing', () => {
  expectTypeOf<ReturnType<typeof parseItem>>().toEqualTypeOf<Listing>();
});

it('parseResponse returns SearchResult', () => {
  expectTypeOf<ReturnType<typeof parseResponse>>().toEqualTypeOf<SearchResult>();
});

it('parseVehicleItem returns VehicleListing', () => {
  expectTypeOf<ReturnType<typeof parseVehicleItem>>().toEqualTypeOf<VehicleListing>();
});

it('parseVehicleResponse returns VehicleSearchResult', () => {
  expectTypeOf<ReturnType<typeof parseVehicleResponse>>().toEqualTypeOf<VehicleSearchResult>();
});

it('buildQuery returns Record<string, string>', () => {
  expectTypeOf<ReturnType<typeof buildQuery>>().toEqualTypeOf<Record<string, string>>();
});

it('buildVehicleQuery returns Record<string, string>', () => {
  expectTypeOf<ReturnType<typeof buildVehicleQuery>>().toEqualTypeOf<Record<string, string>>();
});
