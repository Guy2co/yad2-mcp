import { describe, it, expect } from 'vitest';
import {
  SearchSchema,
  GetListingSchema,
  ListCityCodesSchema,
  SearchCarsSchema,
  ListManufacturersSchema,
  ListPropertyTypesSchema,
  WhichToolSchema,
} from '../mcp/tools.js';

describe('SearchSchema', () => {
  it('accepts an empty input — every field is optional', () => {
    expect(SearchSchema.safeParse({}).success).toBe(true);
  });

  it('rejects an unknown property type', () => {
    expect(SearchSchema.safeParse({ propertyType: 'castle' }).success).toBe(false);
  });

  it('rejects a non-numeric price', () => {
    expect(SearchSchema.safeParse({ priceMin: '1000' }).success).toBe(false);
  });
});

const FULL_SEARCH_INPUT = {
  city: '5000',
  rooms: '2-4',
  priceMin: 1000,
  priceMax: 9000,
  sizeMin: 40,
  sizeMax: 120,
  floor: '1-5',
  propertyType: 'apartment',
  shelter: true,
  page: 2,
  pageSize: 40,
};

describe('SearchSchema — full parameter set', () => {
  it('accepts every documented field', () =>
    expect(SearchSchema.safeParse(FULL_SEARCH_INPUT).success).toBe(true));
});

describe('GetListingSchema', () => {
  it('defaults type to realestate', () => {
    expect(GetListingSchema.parse({ token: 'abc123' }).type).toBe('realestate');
  });

  it('accepts type car', () => {
    expect(GetListingSchema.parse({ token: 'abc123', type: 'car' }).type).toBe('car');
  });
});

describe('GetListingSchema — input validation', () => {
  it('requires a token', () => {
    expect(GetListingSchema.safeParse({}).success).toBe(false);
  });

  it('rejects a token with unsafe characters', () => {
    expect(GetListingSchema.safeParse({ token: '../../etc/passwd' }).success).toBe(false);
    expect(GetListingSchema.safeParse({ token: 'a b' }).success).toBe(false);
  });

  it('rejects an over-long token', () => {
    expect(GetListingSchema.safeParse({ token: 'a'.repeat(51) }).success).toBe(false);
  });

  it('rejects an unknown listing type', () => {
    expect(GetListingSchema.safeParse({ token: 'abc', type: 'boat' }).success).toBe(false);
  });
});

describe('SearchCarsSchema', () => {
  it('accepts an empty input', () => {
    expect(SearchCarsSchema.safeParse({}).success).toBe(true);
  });

  it('rejects a non-numeric hand', () => {
    expect(SearchCarsSchema.safeParse({ hand: 'first' }).success).toBe(false);
  });
});

describe('filter-only schemas', () => {
  it('accept an optional filter string', () => {
    for (const schema of [ListCityCodesSchema, ListManufacturersSchema, ListPropertyTypesSchema]) {
      expect(schema.safeParse({}).success).toBe(true);
      expect(schema.safeParse({ filter: 'tel' }).success).toBe(true);
      expect(schema.safeParse({ filter: 5 }).success).toBe(false);
    }
  });
});

describe('WhichToolSchema', () => {
  it('takes no parameters', () => {
    expect(WhichToolSchema.safeParse({}).success).toBe(true);
  });
});
