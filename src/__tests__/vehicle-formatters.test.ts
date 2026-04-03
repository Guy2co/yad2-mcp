import { describe, it, expect } from 'vitest';
import type { VehicleListing, VehicleSearchResult } from '../vehicles/types.js';
import {
  filterManufacturers,
  formatVehicleSearchResults,
  formatVehicleListing,
} from '../vehicles/formatters.js';

const BASE: VehicleListing = {
  token: 'car123',
  price: 85000,
  manufacturer: 'Toyota',
  model: 'Corolla',
  subModel: 'Executive',
  year: 2021,
  engineType: 'Petrol',
  hand: 1,
  km: 45000,
  gear: 'Automatic',
  color: 'White',
  images: ['https://img.yad2.co.il/car.jpg'],
  url: 'https://www.yad2.co.il/vehicles/item/car123',
};

const L = (o: Partial<VehicleListing> = {}): VehicleListing => ({ ...BASE, ...o });
const R = (o: Partial<VehicleSearchResult> = {}): VehicleSearchResult => ({
  listings: [],
  total: 0,
  page: 1,
  pageSize: 20,
  ...o,
});
const RL = (l: VehicleListing): VehicleSearchResult => R({ listings: [l], total: 1 });

describe('filterManufacturers — filtering', () => {
  it('returns all when filter is undefined', () =>
    expect(filterManufacturers(undefined).length).toBeGreaterThan(1));
  it('filters by English name', () =>
    expect(filterManufacturers('toyota').map((m) => m.nameEn)).toContain('Toyota'));
  it('filters by Hebrew name', () =>
    expect(filterManufacturers('טויוטה').map((m) => m.nameEn)).toContain('Toyota'));
  it('returns empty for no match', () => expect(filterManufacturers('zzz')).toHaveLength(0));
});

describe('filterManufacturers — data shape', () => {
  it('models have id and name', () => {
    const toyota = filterManufacturers('toyota')[0];
    expect(toyota?.models[0]).toHaveProperty('id');
    expect(toyota?.models[0]).toHaveProperty('name');
  });
  it('Skoda has Scala (id 10550)', () => {
    const skoda = filterManufacturers('skoda')[0];
    expect(skoda?.id).toBe('40');
    expect(skoda?.models.find((m) => m.name === 'Scala')?.id).toBe(10550);
  });
});

describe('formatVehicleSearchResults — empty', () => {
  it('shows "No listings found"', () =>
    expect(formatVehicleSearchResults(R())).toContain('No listings found'));
  it('shows header', () =>
    expect(formatVehicleSearchResults(R())).toContain('Yad2 Vehicle Results'));
});

describe('formatVehicleSearchResults — header', () => {
  it('shows count', () => expect(formatVehicleSearchResults(RL(L()))).toContain('Found 1'));
  it('shows page number', () =>
    expect(formatVehicleSearchResults(R({ listings: [L()], total: 5, page: 2 }))).toContain(
      'page 2',
    ));
});

describe('formatVehicleSearchResults — presence', () => {
  it('includes manufacturer, model, year', () => {
    const r = formatVehicleSearchResults(RL(L()));
    expect(r).toContain('Toyota');
    expect(r).toContain('Corolla');
    expect(r).toContain('2021');
  });
  it('includes price, km, hand, token', () => {
    const r = formatVehicleSearchResults(RL(L()));
    expect(r).toContain('₪');
    expect(r).toContain('45,000 km');
    expect(r).toContain('hand 1');
    expect(r).toContain('car123');
  });
});

describe('formatVehicleSearchResults — null/empty', () => {
  it('"Price not listed" for null price', () =>
    expect(formatVehicleSearchResults(RL(L({ price: null })))).toContain('Price not listed'));
  it('omits year when null', () =>
    expect(formatVehicleSearchResults(RL(L({ year: null })))).not.toContain('**Year:**'));
  it('omits subModel when empty', () =>
    expect(formatVehicleSearchResults(RL(L({ subModel: '' })))).toContain('Toyota Corolla'));
});

describe('formatVehicleListing — core', () => {
  it('contains manufacturer, model, year, km, price', () => {
    const r = formatVehicleListing(L());
    expect(r).toContain('Toyota');
    expect(r).toContain('Corolla');
    expect(r).toContain('2021');
    expect(r).toContain('₪');
    expect(r).toContain('45');
  });
  it('contains url and subModel', () => {
    const r = formatVehicleListing(L());
    expect(r).toContain('https://www.yad2.co.il/vehicles/item/car123');
    expect(r).toContain('Executive');
  });
});

describe('formatVehicleListing — price/subModel', () => {
  it('handles null price', () =>
    expect(formatVehicleListing(L({ price: null }))).toContain('Not listed'));
  it('omits subModel when empty', () =>
    expect(formatVehicleListing(L({ subModel: '' }))).toContain('## Toyota Corolla\n'));
});

describe('formatVehicleListing — null/empty fields', () => {
  it('omits year when null', () =>
    expect(formatVehicleListing(L({ year: null }))).not.toContain('**Year:**'));
  it('omits km when null', () =>
    expect(formatVehicleListing(L({ km: null }))).not.toContain('**Km:**'));
  it('omits hand when null', () =>
    expect(formatVehicleListing(L({ hand: null }))).not.toContain('**Hand:**'));
  it('omits engine when empty', () =>
    expect(formatVehicleListing(L({ engineType: '' }))).not.toContain('**Engine:**'));
  it('omits gear when empty', () =>
    expect(formatVehicleListing(L({ gear: '' }))).not.toContain('**Gear:**'));
  it('omits color when empty', () =>
    expect(formatVehicleListing(L({ color: '' }))).not.toContain('**Color:**'));
});

describe('formatVehicleListing — images present', () => {
  it('shows image count and first url', () => {
    const r = formatVehicleListing(
      L({ images: ['https://img.yad2.co.il/a.jpg', 'https://img.yad2.co.il/b.jpg'] }),
    );
    expect(r).toContain('**Images (2):**');
    expect(r).toContain('https://img.yad2.co.il/a.jpg');
  });
  it('caps display at 5', () => {
    const images = Array.from({ length: 8 }, (_, i) => `https://img.yad2.co.il/${i}.jpg`);
    const r = formatVehicleListing(L({ images }));
    expect(r).toContain('**Images (8):**');
    expect((r.match(/- https:\/\//g) ?? []).length).toBe(5);
  });
});

describe('formatVehicleListing — no images', () => {
  it('no images section when empty', () =>
    expect(formatVehicleListing(L({ images: [] }))).not.toContain('**Images'));
});
