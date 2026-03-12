import { describe, it, expect, vi } from 'vitest';
import type { VehicleSearchResult } from '../vehicles/types.js';

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

const FAKE_VEHICLE_ITEM = {
  token: 'car123',
  price: 85000,
  manufacturer: { id: '1', text: 'Toyota' },
  model: { id: '10', text: 'Corolla' },
  subModel: { id: '5', text: 'Executive' },
  vehicleDates: { yearOfProduction: 2021 },
  engineType: { text: 'Petrol' },
  hand: { id: 1, text: 'יד ראשונה' },
  km: 45000,
  gear: { text: 'Automatic' },
  color: { text: 'White' },
  metaData: { coverImage: 'https://img.yad2.co.il/car.jpg', images: [] },
};

const FAKE_VEHICLE_FEED_DATA = {
  private: [FAKE_VEHICLE_ITEM],
  commercial: [],
  solo: [],
  pagination: { total: 10, pages: 1 },
};

async function mockVehicleFeed(): Promise<VehicleSearchResult> {
  const { extractNextDataByMatcher } = await import('../infra/browser.js');
  (extractNextDataByMatcher as ReturnType<typeof vi.fn>).mockResolvedValue(FAKE_VEHICLE_FEED_DATA);
  const { Yad2VehiclesClient } = await import('../vehicles/yad2-vehicles-client.js');
  return new Yad2VehiclesClient().searchVehicles({ page: 1 });
}

describe('parseVehicleItem() - core fields', () => {
  it('parses manufacturer, model, subModel', async () => {
    const { listings } = await mockVehicleFeed();
    expect(listings[0].manufacturer).toBe('Toyota');
    expect(listings[0].model).toBe('Corolla');
    expect(listings[0].subModel).toBe('Executive');
  });
  it('parses year, km, hand', async () => {
    const { listings } = await mockVehicleFeed();
    expect(listings[0].year).toBe(2021);
    expect(listings[0].km).toBe(45000);
    expect(listings[0].hand).toBe(1);
  });
});

describe('parseVehicleItem() - extra fields', () => {
  it('parses price, engine, gear, color', async () => {
    const { listings } = await mockVehicleFeed();
    expect(listings[0].price).toBe(85000);
    expect(listings[0].engineType).toBe('Petrol');
    expect(listings[0].gear).toBe('Automatic');
    expect(listings[0].color).toBe('White');
  });
  it('builds correct URL from token', async () => {
    const { listings } = await mockVehicleFeed();
    expect(listings[0].url).toContain('car123');
    expect(listings[0].url).toContain('/vehicles/item/');
  });
});

describe('parseVehicleResponse() - result structure', () => {
  it('reads total from pagination', async () => expect((await mockVehicleFeed()).total).toBe(10));
  it('returns correct number of listings', async () =>
    expect((await mockVehicleFeed()).listings.length).toBe(1));
});

describe('Yad2VehiclesClient.getCarListing()', () => {
  it('parses single car listing correctly', async () => {
    const { extractNextData } = await import('../infra/browser.js');
    (extractNextData as ReturnType<typeof vi.fn>).mockResolvedValue(FAKE_VEHICLE_ITEM);
    const { Yad2VehiclesClient } = await import('../vehicles/yad2-vehicles-client.js');
    const listing = await new Yad2VehiclesClient().getCarListing('car123');
    expect(listing.token).toBe('car123');
    expect(listing.manufacturer).toBe('Toyota');
    expect(listing.model).toBe('Corolla');
    expect(listing.year).toBe(2021);
  });
});
