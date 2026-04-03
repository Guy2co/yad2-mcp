import { describe, it, expect, vi } from 'vitest';
import type { VehicleSearchResult } from '../vehicles/types.js';
import { FAKE_VEHICLE_ITEM, FAKE_VEHICLE_FEED_DATA } from './fixtures/index.js';

vi.mock('../infra/browser.js', () => ({
  launchPage: vi.fn().mockResolvedValue({
    page: {},
    close: vi.fn().mockResolvedValue(undefined),
  }),
  navigateTo: vi.fn().mockResolvedValue(undefined),
  extractNextDataByMatcher: vi.fn(),
  withPage: vi.fn().mockImplementation(async (fn: (page: unknown) => unknown) => fn({})),
}));

async function mockVehicleFeed(): Promise<VehicleSearchResult> {
  const { extractNextDataByMatcher } = await import('../infra/browser.js');
  (extractNextDataByMatcher as ReturnType<typeof vi.fn>).mockResolvedValue(FAKE_VEHICLE_FEED_DATA);
  const { Yad2VehiclesClient } = await import('../vehicles/yad2-vehicles-client.js');
  return new Yad2VehiclesClient().searchVehicles({ page: 1 });
}

describe('parseVehicleItem() - core fields', () => {
  it('parses manufacturer, model, subModel', async () => {
    const { listings } = await mockVehicleFeed();
    expect(listings[0]?.manufacturer).toBe(FAKE_VEHICLE_ITEM.manufacturer?.text);
    expect(listings[0]?.model).toBe(FAKE_VEHICLE_ITEM.model?.text);
    expect(listings[0]?.subModel).toBe(FAKE_VEHICLE_ITEM.subModel?.text);
  });
  it('parses year, km, hand', async () => {
    const { listings } = await mockVehicleFeed();
    expect(listings[0]?.year).toBe(FAKE_VEHICLE_ITEM.vehicleDates?.yearOfProduction);
    expect(listings[0]?.km).toBe(FAKE_VEHICLE_ITEM.km);
    expect(listings[0]?.hand).toBe(FAKE_VEHICLE_ITEM.hand?.id);
  });
});

describe('parseVehicleItem() - extra fields', () => {
  it('parses price, engine, gear, color', async () => {
    const { listings } = await mockVehicleFeed();
    expect(listings[0]?.price).toBe(FAKE_VEHICLE_ITEM.price);
    expect(listings[0]?.engineType).toBe(FAKE_VEHICLE_ITEM.engineType?.text);
    expect(listings[0]?.gear).toBe(FAKE_VEHICLE_ITEM.gear?.text);
    expect(listings[0]?.color).toBe(FAKE_VEHICLE_ITEM.color?.text);
  });
  it('builds correct URL from token', async () => {
    const { listings } = await mockVehicleFeed();
    expect(listings[0]?.url).toContain('car123');
    expect(listings[0]?.url).toContain('/vehicles/item/');
  });
});

describe('parseVehicleResponse() - result structure', () => {
  it('reads total from pagination', async () =>
    expect((await mockVehicleFeed()).total).toBe(FAKE_VEHICLE_FEED_DATA.pagination?.total));
  it('returns correct number of listings', async () =>
    expect((await mockVehicleFeed()).listings.length).toBe(1));
});

describe('Yad2VehiclesClient.getCarListing()', () => {
  it('parses single car listing correctly', async () => {
    const { extractNextDataByMatcher } = await import('../infra/browser.js');
    (extractNextDataByMatcher as ReturnType<typeof vi.fn>).mockResolvedValue(FAKE_VEHICLE_ITEM);
    const { Yad2VehiclesClient } = await import('../vehicles/yad2-vehicles-client.js');
    const listing = await new Yad2VehiclesClient().getCarListing('car123');
    expect(listing.token).toBe(FAKE_VEHICLE_ITEM.token);
    expect(listing.manufacturer).toBe(FAKE_VEHICLE_ITEM.manufacturer?.text);
    expect(listing.model).toBe(FAKE_VEHICLE_ITEM.model?.text);
    expect(listing.year).toBe(FAKE_VEHICLE_ITEM.vehicleDates?.yearOfProduction);
  });
});
