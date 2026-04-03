import { describe, it, expect, vi } from 'vitest';
import type { SearchResult } from '../realestate/types.js';
import { buildQuery } from '../realestate/query-builder.js';
import {
  FAKE_REALESTATE_ITEM,
  FAKE_FEED_DATA,
  FAKE_REALESTATE_ITEM_FORSALE,
} from './fixtures/index.js';

vi.mock('../infra/browser.js', () => ({
  launchPage: vi.fn().mockResolvedValue({
    page: {},
    close: vi.fn().mockResolvedValue(undefined),
  }),
  navigateTo: vi.fn().mockResolvedValue(undefined),
  extractNextData: vi.fn(),
  extractNextDataByMatcher: vi.fn(),
  withPage: vi.fn().mockImplementation(async (fn: (page: unknown) => unknown) => fn({})),
}));

async function mockFeed(): Promise<SearchResult> {
  const { extractNextData } = await import('../infra/browser.js');
  (extractNextData as ReturnType<typeof vi.fn>).mockResolvedValue(FAKE_FEED_DATA);
  const { Yad2RealEstateClient } = await import('../realestate/yad2-realestate-client.js');
  return new Yad2RealEstateClient().search('rent', { page: 1 });
}

describe('buildQuery - feature filters', () => {
  it('sets shelter=1 and elevator=1 when true', () => {
    const q = buildQuery({ shelter: true, elevator: true });
    expect(q['shelter']).toBe('1');
    expect(q['elevator']).toBe('1');
  });

  it('omits shelter key when false', () => {
    expect(buildQuery({ shelter: false })).not.toHaveProperty('shelter');
  });

  it('maps propertyType cottage to yad2 numeric IDs', () => {
    expect(buildQuery({ propertyType: 'cottage' })['property']).toBe('5,39,55');
  });
});

describe('buildQuery - price param by type', () => {
  it('uses priceOnly for rent', () => {
    const q = buildQuery({ priceMax: 5000 }, 'rent');
    expect(q['priceOnly']).toBe('0-5000');
    expect(q).not.toHaveProperty('price');
  });

  it('uses price for forsale', () => {
    const q = buildQuery({ priceMax: 6000000 }, 'forsale');
    expect(q['price']).toBe('0-6000000');
    expect(q).not.toHaveProperty('priceOnly');
  });
});

describe('parseResponse() - filtering', () => {
  it('returns only private items, not platinum', async () => {
    const result = await mockFeed();
    expect(result.listings.length).toBe(1);
    expect(result.listings[0]?.token).toBe('abc123');
  });

  it('reads total from pagination', async () => {
    expect((await mockFeed()).total).toBe(1);
  });

  it('builds correct URL from token', async () => {
    expect((await mockFeed()).listings[0]?.url).toContain('abc123');
  });
});

describe('parseResponse() - field parsing', () => {
  it('parses price, rooms, floor, size, city, neighborhood', async () => {
    const result = await mockFeed();
    const listing = result.listings[0];
    expect(listing).toBeDefined();
    if (listing === undefined) return;
    const { additionalDetails, address } = FAKE_REALESTATE_ITEM;
    expect(listing.price).toBe(FAKE_REALESTATE_ITEM.price);
    expect(listing.rooms).toBe(additionalDetails?.roomsCount);
    expect(listing.floor).toBe(address?.house?.floor);
    expect(listing.size).toBe(additionalDetails?.squareMeter);
    expect(listing.city).toBe(address?.city?.text);
    expect(listing.neighborhood).toBe(address?.neighborhood?.text);
  });
});

describe('parseItem() via Yad2RealEstateClient.getListing()', () => {
  it('parses item fields correctly', async () => {
    const { extractNextData } = await import('../infra/browser.js');
    (extractNextData as ReturnType<typeof vi.fn>).mockResolvedValue(FAKE_REALESTATE_ITEM_FORSALE);
    const { Yad2RealEstateClient } = await import('../realestate/yad2-realestate-client.js');
    const listing = await new Yad2RealEstateClient().getListing('xyz789');
    expect(listing.token).toBe('xyz789');
    expect(listing.price).toBe(FAKE_REALESTATE_ITEM_FORSALE.price);
    expect(listing.rooms).toBe(FAKE_REALESTATE_ITEM_FORSALE.additionalDetails?.roomsCount);
    expect(listing.floor).toBe(FAKE_REALESTATE_ITEM_FORSALE.address?.house?.floor);
    expect(listing.size).toBe(FAKE_REALESTATE_ITEM_FORSALE.additionalDetails?.squareMeter);
    expect(listing.city).toBe(FAKE_REALESTATE_ITEM_FORSALE.address?.city?.text);
  });
});
