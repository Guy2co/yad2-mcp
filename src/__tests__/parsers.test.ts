import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import type { SearchResult } from '../types.js';

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      newContext: vi.fn().mockResolvedValue({
        newPage: vi.fn().mockResolvedValue({
          on: vi.fn(),
          goto: vi.fn().mockResolvedValue(null),
          evaluate: vi.fn(),
        }),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

const FAKE_ITEM = {
  id: 'abc123',
  token: 'abc123',
  title: 'דירה 3 חדרים בתל אביב',
  price: 7500,
  currency: 'ILS',
  Info: [
    { key: 'rooms', value: 3 },
    { key: 'floor', value: 2 },
    { key: 'square_meters', value: 75 },
  ],
  address: {
    city: { text: 'תל אביב' },
    neighborhood: { text: 'פלורנטין' },
    street: { text: 'הלל' },
    house: { text: '5' },
  },
  info_text: 'דירה מרוהטת',
  images: [{ src: 'https://img.yad2.co.il/test.jpg' }],
  date_added: '2024-01-15',
  contact_name: 'דוד',
  contact_phone: '052-0000000',
  coordinates: { latitude: 32.06, longitude: 34.77 },
};

const FAKE_SEARCH_RESPONSE = {
  feed: {
    feed_items: [FAKE_ITEM, { id: 'platinum_item', token: 'plat1', title: 'Ad', price: 0 }],
    total_items: 1,
  },
};

const FAKE_LISTING_RESPONSE = {
  item: {
    id: 'xyz789',
    token: 'xyz789',
    title: 'דירה 4 חדרים',
    price: 2500000,
    currency: 'ILS',
    Info: [
      { key: 'rooms', value: 4 },
      { key: 'floor', value: 5 },
      { key: 'square_meters', value: 120 },
    ],
    address: { city: { text: 'חיפה' }, neighborhood: { text: 'הדר' } },
    coordinates: { latitude: 32.8, longitude: 34.99 },
  },
};

async function getMockEvaluate(): Promise<Mock> {
  const playwright = await import('playwright');
  const mockBrowser = await (playwright.chromium.launch as Mock)();
  const mockContext = await mockBrowser.newContext();
  const mockPage = await mockContext.newPage();
  return mockPage.evaluate as Mock;
}

async function doSearch(): Promise<SearchResult> {
  const { Yad2Client } = await import('../yad2-client.js');
  return new Yad2Client().search('rent', { page: 1, pageSize: 20 });
}

describe('Yad2Client.search() - filtering', () => {
  beforeEach(async () => {
    (await getMockEvaluate()).mockResolvedValue(FAKE_SEARCH_RESPONSE);
  });

  it('filters out platinum/ad items', async () => {
    expect((await doSearch()).listings.length).toBe(1);
  });

  it('reads total from feed.total_items', async () => {
    expect((await doSearch()).total).toBe(1);
  });

  it('builds correct URL from token', async () => {
    expect((await doSearch()).listings[0].url).toContain('abc123');
  });
});

describe('Yad2Client.search() - field parsing', () => {
  beforeEach(async () => {
    (await getMockEvaluate()).mockResolvedValue(FAKE_SEARCH_RESPONSE);
  });

  it('parses price, rooms, floor, size, city, neighborhood', async () => {
    const listing = (await doSearch()).listings[0];
    expect(listing.price).toBe(7500);
    expect(listing.rooms).toBe(3);
    expect(listing.floor).toBe(2);
    expect(listing.size).toBe(75);
    expect(listing.city).toBe('תל אביב');
    expect(listing.neighborhood).toBe('פלורנטין');
  });
});

describe('Yad2Client.getListing()', () => {
  beforeEach(async () => {
    (await getMockEvaluate()).mockResolvedValue(FAKE_LISTING_RESPONSE);
  });

  it('parses item correctly from { item: {...} } response shape', async () => {
    const { Yad2Client } = await import('../yad2-client.js');
    const listing = await new Yad2Client().getListing('xyz789');
    expect(listing.id).toBe('xyz789');
    expect(listing.price).toBe(2500000);
    expect(listing.rooms).toBe(4);
    expect(listing.floor).toBe(5);
    expect(listing.size).toBe(120);
    expect(listing.city).toBe('חיפה');
  });
});
