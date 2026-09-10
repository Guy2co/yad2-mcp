import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FAKE_LISTING, FAKE_VEHICLE_LISTING } from './fixtures/index.js';
import type { Listing } from '../realestate/types.js';

// handlers.ts constructs both clients at module load, which happens before plain
// `const` declarations in this file initialize — hence vi.hoisted.
const mocks = vi.hoisted(() => ({
  search: vi.fn(),
  getListing: vi.fn(),
  searchVehicles: vi.fn(),
  getCarListing: vi.fn(),
}));

vi.mock('../realestate/yad2-realestate-client.js', () => ({
  Yad2RealEstateClient: class {
    search = mocks.search;
    getListing = mocks.getListing;
  },
}));

vi.mock('../vehicles/yad2-vehicles-client.js', () => ({
  Yad2VehiclesClient: class {
    searchVehicles = mocks.searchVehicles;
    getCarListing = mocks.getCarListing;
  },
}));

import {
  handleSearch,
  handleGetListing,
  handleListCityCodes,
  handleSearchCars,
  handleListManufacturers,
  handleListPropertyTypes,
  handleWhichTool,
} from '../mcp/handlers.js';

function text(response: { content: Array<{ text: string }> }): string {
  return response.content[0]?.text ?? '';
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.search.mockResolvedValue({ listings: [FAKE_LISTING], total: 1, page: 1, pageSize: 20 });
  mocks.getListing.mockResolvedValue(FAKE_LISTING);
  mocks.searchVehicles.mockResolvedValue({
    listings: [FAKE_VEHICLE_LISTING],
    total: 1,
    page: 1,
    pageSize: 20,
  });
  mocks.getCarListing.mockResolvedValue(FAKE_VEHICLE_LISTING);
});

describe('handleSearch', () => {
  it('maps search_rentals to a rent search', async () => {
    await handleSearch('search_rentals', {});
    expect(mocks.search.mock.calls[0]?.[0]).toBe('rent');
  });

  it('maps any other tool name to a forsale search', async () => {
    await handleSearch('search_for_sale', {});
    expect(mocks.search.mock.calls[0]?.[0]).toBe('forsale');
  });

  it('returns formatted results as text content', async () => {
    const response = await handleSearch('search_rentals', {});
    expect(response.content[0]?.type).toBe('text');
    expect(text(response)).toContain(FAKE_LISTING.title);
  });
});

describe('handleGetListing', () => {
  it('routes type "car" to the vehicles client', async () => {
    const response = await handleGetListing({ token: 'car123', type: 'car' });
    expect(mocks.getCarListing).toHaveBeenCalledWith('car123');
    expect(mocks.getListing).not.toHaveBeenCalled();
    expect(text(response)).toContain('Corolla');
  });

  it('routes type "realestate" to the realestate client', async () => {
    const response = await handleGetListing({ token: 'tok1', type: 'realestate' });
    expect(mocks.getListing).toHaveBeenCalledWith('tok1');
    expect(mocks.getCarListing).not.toHaveBeenCalled();
    expect(text(response)).toContain(FAKE_LISTING.title);
  });
});

describe('handleSearchCars', () => {
  it('passes params through and formats the result', async () => {
    const response = await handleSearchCars({ manufacturer: '19' });
    expect(mocks.searchVehicles).toHaveBeenCalledWith({ manufacturer: '19' });
    expect(text(response)).toContain('Corolla');
  });
});

function firstListing(structured: Record<string, unknown> | undefined): Listing | undefined {
  return (structured?.['listings'] as Listing[] | undefined)?.[0];
}

describe('structuredContent — search results', () => {
  it('carries the fields the search markdown drops', async () => {
    const response = await handleSearch('search_rentals', {});
    const listing = firstListing(response.structuredContent);
    // formatSearchResults omits every one of these — they are the reason
    // structuredContent exists at all.
    expect(listing?.neighborhood).toBe(FAKE_LISTING.neighborhood);
    expect(listing?.coordinates).toEqual(FAKE_LISTING.coordinates);
    expect(listing?.contactPhone).toBe(FAKE_LISTING.contactPhone);
    expect(listing?.propertyType).toBe(FAKE_LISTING.propertyType);
  });

  it('reports pagination alongside the listings', async () => {
    const response = await handleSearch('search_for_sale', {});
    expect(response.structuredContent).toMatchObject({ total: 1, page: 1, pageSize: 20 });
  });
});

describe('structuredContent — single listings', () => {
  it('returns a bare listing for get_listing on realestate', async () => {
    const response = await handleGetListing({ token: 'tok1', type: 'realestate' });
    expect(response.structuredContent?.['token']).toBe(FAKE_LISTING.token);
  });

  it('returns a bare listing for get_listing on a car', async () => {
    const response = await handleGetListing({ token: 'car123', type: 'car' });
    expect(response.structuredContent?.['manufacturer']).toBe(FAKE_VEHICLE_LISTING.manufacturer);
  });
});

describe('structuredContent — vehicles and static tools', () => {
  it('is present on car searches', async () => {
    const response = await handleSearchCars({ manufacturer: '19' });
    expect(firstListing(response.structuredContent)).toBeDefined();
  });

  it('is omitted by the static list handlers', () => {
    expect(handleListCityCodes({}).structuredContent).toBeUndefined();
    expect(handleListPropertyTypes({}).structuredContent).toBeUndefined();
    expect(handleWhichTool().structuredContent).toBeUndefined();
  });
});

describe('list handlers', () => {
  it('lists all city codes when unfiltered', () => {
    expect(text(handleListCityCodes({})).split('\n').length).toBeGreaterThan(5);
  });

  it('narrows city codes when filtered', () => {
    const all = text(handleListCityCodes({}));
    const filtered = text(handleListCityCodes({ filter: 'tel' }));
    expect(filtered.length).toBeLessThan(all.length);
  });

  it('lowercases the city filter before matching', () => {
    expect(text(handleListCityCodes({ filter: 'TEL' }))).toBe(
      text(handleListCityCodes({ filter: 'tel' })),
    );
  });
});

describe('manufacturer and property-type handlers', () => {
  it('lists manufacturers with their models', () => {
    const out = text(handleListManufacturers({}));
    expect(out).toContain('Car manufacturers:');
    expect(out).toContain('manufacturer ID:');
  });

  it('narrows manufacturers when filtered', () =>
    expect(text(handleListManufacturers({ filter: 'toyota' }))).toContain('Toyota'));

  it('lists property types', () =>
    expect(text(handleListPropertyTypes({}))).toContain('## Property Types'));

  it('narrows property types when filtered', () => {
    const filtered = text(handleListPropertyTypes({ filter: 'apartment' }));
    expect(filtered.length).toBeLessThan(text(handleListPropertyTypes({})).length);
  });
});

describe('handleWhichTool', () => {
  it('returns the routing guide', () => {
    expect(text(handleWhichTool())).toContain('# Which Yad2 Tool to Use');
  });
});
