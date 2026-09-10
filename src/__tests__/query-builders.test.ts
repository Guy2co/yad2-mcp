import { describe, it, expect } from 'vitest';
import { buildQuery } from '../realestate/query-builder.js';
import { buildVehicleQuery } from '../vehicles/query-builder.js';
import type { SearchParams } from '../realestate/types.js';

const ALL_FEATURES: SearchParams = {
  shelter: true,
  elevator: true,
  parking: true,
  balcony: true,
  airConditioner: true,
  warehouse: true,
  accessibility: true,
  furniture: true,
  renovated: true,
  bars: true,
};

const FEATURE_KEYS = Object.keys(ALL_FEATURES);

const ALL_VEHICLE_PARAMS = {
  manufacturer: '19',
  model: '10',
  year: '2018-2023',
  hand: 2,
  kmMax: 90000,
  priceMin: 10000,
  priceMax: 90000,
  page: 2,
  pageSize: 40,
};

const ALL_VEHICLE_QUERY = {
  manufacturer: '19',
  model: '10',
  year: '2018-2023',
  hand: '2',
  km: '0-90000',
  price: '10000-90000',
  page: '2',
  pageSize: '40',
};

describe('buildQuery — defaults', () => {
  it('defaults page and pageSize', () =>
    expect(buildQuery({})).toEqual({ page: '1', pageSize: '20' }));

  it('honours explicit page and pageSize', () =>
    expect(buildQuery({ page: 3, pageSize: 40 })).toMatchObject({ page: '3', pageSize: '40' }));

  it('omits every optional param when none are given', () =>
    expect(Object.keys(buildQuery({}))).toEqual(['page', 'pageSize']));
});

describe('buildQuery — feature filters', () => {
  it('maps every enabled feature filter to "1"', () => {
    const q = buildQuery(ALL_FEATURES);
    for (const key of FEATURE_KEYS) expect(q[key]).toBe('1');
  });

  it('omits feature filters set to false', () => {
    const disabled = Object.fromEntries(FEATURE_KEYS.map((k) => [k, false])) as SearchParams;
    const q = buildQuery(disabled);
    for (const key of FEATURE_KEYS) expect(q[key]).toBeUndefined();
  });
});

describe('buildQuery — price range', () => {
  it('uses priceOnly for rent', () =>
    expect(buildQuery({ priceMin: 100, priceMax: 200 }, 'rent')['priceOnly']).toBe('100-200'));

  it('uses price for forsale', () =>
    expect(buildQuery({ priceMin: 100, priceMax: 200 }, 'forsale')['price']).toBe('100-200'));

  it('fills a missing upper bound with a sentinel', () =>
    expect(buildQuery({ priceMin: 100 })['priceOnly']).toBe('100-99999999'));

  it('fills a missing lower bound with zero', () =>
    expect(buildQuery({ priceMax: 200 })['priceOnly']).toBe('0-200'));

  it('omits price when neither bound is given', () =>
    expect(buildQuery({})['priceOnly']).toBeUndefined());
});

describe('buildQuery — size range', () => {
  it('fills a missing upper bound with a sentinel', () =>
    expect(buildQuery({ sizeMin: 50 })['squaremeter']).toBe('50-99999'));

  it('fills a missing lower bound with zero', () =>
    expect(buildQuery({ sizeMax: 90 })['squaremeter']).toBe('0-90'));

  it('omits size when neither bound is given', () =>
    expect(buildQuery({})['squaremeter']).toBeUndefined());
});

describe('buildQuery — city and area', () => {
  it('injects area alongside a known city code', () => {
    const q = buildQuery({ city: '5000' });
    expect(q).toMatchObject({ city: '5000' });
    expect(q['area']).toBeDefined();
  });

  it('omits area for an unknown city code', () => {
    const q = buildQuery({ city: 'not-a-city' });
    expect(q['city']).toBe('not-a-city');
    expect(q['area']).toBeUndefined();
  });
});

describe('buildQuery — passthrough params', () => {
  it('passes rooms and floor through untouched', () =>
    expect(buildQuery({ rooms: '2-4', floor: '1-5' })).toMatchObject({
      rooms: '2-4',
      floor: '1-5',
    }));

  it('maps a semantic property type to its yad2 id', () =>
    expect(buildQuery({ propertyType: 'apartment' })['property']).toBeDefined());

  it('passes an unrecognized property type through unchanged', () =>
    expect(buildQuery({ propertyType: 'made-up' })['property']).toBe('made-up'));
});

describe('buildVehicleQuery', () => {
  it('defaults page and pageSize', () =>
    expect(buildVehicleQuery({})).toEqual({ page: '1', pageSize: '20' }));

  it('maps every optional param', () =>
    expect(buildVehicleQuery(ALL_VEHICLE_PARAMS)).toEqual(ALL_VEHICLE_QUERY));
});

describe('buildVehicleQuery — price range', () => {
  it('fills a missing upper bound with a sentinel', () =>
    expect(buildVehicleQuery({ priceMin: 5000 })['price']).toBe('5000-99999999'));

  it('fills a missing lower bound with zero', () =>
    expect(buildVehicleQuery({ priceMax: 5000 })['price']).toBe('0-5000'));

  it('omits price when neither bound is given', () =>
    expect(buildVehicleQuery({ hand: 1 })['price']).toBeUndefined());
});
