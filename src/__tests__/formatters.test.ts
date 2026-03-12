import { describe, it, expect } from 'vitest';
import type { Listing, SearchResult } from '../realestate/types.js';
import {
  formatPrice,
  formatListingDetails,
  formatListingEntry,
  formatSearchResults,
  formatListing,
  extractSearchParams,
  filterCities,
  filterPropertyTypes,
} from '../realestate/formatters.js';

const BASE_LISTING: Listing = {
  id: 'tok1',
  token: 'tok1',
  title: 'Test Listing',
  price: 5000,
  currency: 'ILS',
  rooms: 3,
  floor: 2,
  size: 80,
  address: 'הלל 5, תל אביב',
  city: 'תל אביב',
  neighborhood: 'פלורנטין',
  description: 'Nice apartment',
  images: ['https://img.yad2.co.il/a.jpg'],
  url: 'https://www.yad2.co.il/realestate/item/tok1',
  date: '2024-01-15',
  contactName: 'דוד',
  contactPhone: '052-0000000',
  coordinates: { lat: 32.06, lng: 34.77 },
};

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return { ...BASE_LISTING, ...overrides };
}

function makeResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return { listings: [], total: 0, page: 1, pageSize: 20, ...overrides };
}

describe('formatPrice', () => {
  it('returns "Price not listed" when price is null', () => {
    expect(formatPrice(makeListing({ price: null }), 'rent')).toBe('Price not listed');
  });

  it('formats rent price with ₪ and /month', () => {
    const r = formatPrice(makeListing({ price: 7500 }), 'rent');
    expect(r).toContain('₪');
    expect(r).toContain('/month');
  });

  it('formats forsale price without /month', () => {
    const r = formatPrice(makeListing({ price: 2000000 }), 'forsale');
    expect(r).toContain('₪');
    expect(r).not.toContain('/month');
  });
});

describe('formatListingDetails - null cases', () => {
  it('returns empty string when all fields are null', () => {
    expect(formatListingDetails(makeListing({ rooms: null, size: null, floor: null }))).toBe('');
  });

  it('includes rooms when present', () => {
    expect(formatListingDetails(makeListing({ size: null, floor: null }))).toContain('3 rooms');
  });

  it('includes size when present', () => {
    expect(formatListingDetails(makeListing({ rooms: null, floor: null }))).toContain('80m²');
  });
});

describe('formatListingDetails - all fields', () => {
  it('joins all fields with ·', () => {
    const result = formatListingDetails(makeListing());
    expect(result).toContain('·');
    expect(result).toContain('3 rooms');
    expect(result).toContain('80m²');
    expect(result).toContain('floor 2');
  });
});

describe('formatListingEntry', () => {
  it('contains title, price, token, and url', () => {
    const result = formatListingEntry(makeListing(), 'rent');
    expect(result).toContain('Test Listing');
    expect(result).toContain('₪');
    expect(result).toContain('tok1');
    expect(result).toContain('https://www.yad2.co.il/realestate/item/tok1');
  });
});

describe('formatSearchResults', () => {
  it('shows "No listings found" when empty', () => {
    expect(formatSearchResults(makeResult(), 'rent')).toContain('No listings found');
  });

  it('shows header and count when listings present', () => {
    const r = formatSearchResults(makeResult({ listings: [makeListing()], total: 1 }), 'rent');
    expect(r).toContain('Yad2 Rental Results');
    expect(r).toContain('Found 1');
  });
});

describe('formatListing', () => {
  it('contains title, price, rooms, size, floor, address, contact, coordinates', () => {
    const result = formatListing(makeListing());
    expect(result).toContain('Test Listing');
    expect(result).toContain('₪');
    expect(result).toContain('80m²');
    expect(result).toContain('Floor');
    expect(result).toContain('Address');
    expect(result).toContain('Contact');
    expect(result).toContain('32.06');
  });
});

describe('extractSearchParams - defaults', () => {
  it('defaults page to 1 and pageSize to 20', () => {
    const r = extractSearchParams({});
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(20);
  });

  it('caps pageSize at 40', () => {
    expect(extractSearchParams({ pageSize: 100 }).pageSize).toBe(40);
  });
});

describe('extractSearchParams - passthrough', () => {
  it('passes through city, rooms, floor', () => {
    const r = extractSearchParams({ city: '5000', rooms: '2-4', floor: '1-3' });
    expect(r.city).toBe('5000');
    expect(r.rooms).toBe('2-4');
    expect(r.floor).toBe('1-3');
  });
});

describe('extractSearchParams - feature filters', () => {
  it('passes through shelter and elevator when true', () => {
    const r = extractSearchParams({ shelter: true, elevator: true });
    expect(r.shelter).toBe(true);
    expect(r.elevator).toBe(true);
  });

  it('shelter is undefined when not provided', () => {
    expect(extractSearchParams({}).shelter).toBeUndefined();
  });
});

describe('filterPropertyTypes', () => {
  it('returns all 14 types when filter is undefined', () => {
    expect(filterPropertyTypes(undefined)).toHaveLength(14);
  });

  it('returns cottage entry when filtering by "villa"', () => {
    const results = filterPropertyTypes('villa');
    expect(results.some((t) => t.id === 'cottage')).toBe(true);
  });

  it('returns apartment entry when filtering by Hebrew "דירה"', () => {
    const results = filterPropertyTypes('דירה');
    expect(results.some((t) => t.id === 'apartment')).toBe(true);
  });
});

describe('filterCities', () => {
  it('returns all cities when filter is undefined', () => {
    expect(filterCities(undefined).length).toBeGreaterThan(1);
  });

  it('filters to entries matching "tel"', () => {
    const names = filterCities('tel').map((c) => c.nameEn.toLowerCase());
    expect(names.some((n) => n.includes('tel'))).toBe(true);
  });

  it('includes code 5000 for "tel aviv" filter', () => {
    expect(filterCities('tel aviv').map((c) => c.code)).toContain('5000');
  });
});
