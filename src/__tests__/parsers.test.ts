import { describe, it, expect, vi } from 'vitest';
import type { SearchResult } from '../types.js';

vi.mock('../browser.js', () => ({
  launchPage: vi.fn().mockResolvedValue({
    page: {},
    close: vi.fn().mockResolvedValue(undefined),
  }),
  navigateTo: vi.fn().mockResolvedValue(undefined),
  extractNextData: vi.fn(),
}));

const FAKE_ITEM = {
  token: 'abc123',
  price: 7500,
  currency: 'ILS',
  searchText: 'דירה 3 חדרים בתל אביב\nפרטים נוספים',
  additionalDetails: { roomsCount: 3, squareMeter: 75 },
  address: {
    city: { text: 'תל אביב' },
    neighborhood: { text: 'פלורנטין' },
    street: { text: 'הלל' },
    house: { number: 5, floor: 2 },
    coords: { lat: 32.06, lon: 34.77 },
  },
  metaData: { coverImage: 'https://img.yad2.co.il/test.jpg', images: [] },
};

const FAKE_FEED_DATA = {
  private: [FAKE_ITEM],
  agency: [],
  platinum: [{ token: 'plat1', price: 0 }],
  pagination: { total: 1, totalPages: 1 },
};

const FAKE_ITEM_DATA = {
  token: 'xyz789',
  price: 2500000,
  currency: 'ILS',
  searchText: 'דירה 4 חדרים\nפרטים',
  additionalDetails: { roomsCount: 4, squareMeter: 120 },
  address: { city: { text: 'חיפה' }, neighborhood: { text: 'הדר' }, house: { floor: 5 } },
};

async function mockFeed(): Promise<SearchResult> {
  const { extractNextData } = await import('../browser.js');
  (extractNextData as ReturnType<typeof vi.fn>).mockResolvedValue(FAKE_FEED_DATA);
  const { Yad2Client } = await import('../yad2-client.js');
  return new Yad2Client().search('rent', { page: 1 });
}

describe('parseResponse() - filtering', () => {
  it('returns only private items, not platinum', async () => {
    const result = await mockFeed();
    expect(result.listings.length).toBe(1);
    expect(result.listings[0].token).toBe('abc123');
  });

  it('reads total from pagination', async () => {
    expect((await mockFeed()).total).toBe(1);
  });

  it('builds correct URL from token', async () => {
    expect((await mockFeed()).listings[0].url).toContain('abc123');
  });
});

describe('parseResponse() - field parsing', () => {
  it('parses price, rooms, floor, size, city, neighborhood', async () => {
    const listing = (await mockFeed()).listings[0];
    expect(listing.price).toBe(7500);
    expect(listing.rooms).toBe(3);
    expect(listing.floor).toBe(2);
    expect(listing.size).toBe(75);
    expect(listing.city).toBe('תל אביב');
    expect(listing.neighborhood).toBe('פלורנטין');
  });
});

describe('parseItem() via Yad2Client.getListing()', () => {
  it('parses item fields correctly', async () => {
    const { extractNextData } = await import('../browser.js');
    (extractNextData as ReturnType<typeof vi.fn>).mockResolvedValue(FAKE_ITEM_DATA);
    const { Yad2Client } = await import('../yad2-client.js');
    const listing = await new Yad2Client().getListing('xyz789');
    expect(listing.token).toBe('xyz789');
    expect(listing.price).toBe(2500000);
    expect(listing.rooms).toBe(4);
    expect(listing.floor).toBe(5);
    expect(listing.size).toBe(120);
    expect(listing.city).toBe('חיפה');
  });
});
