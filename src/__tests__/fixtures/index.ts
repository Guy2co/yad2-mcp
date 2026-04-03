/**
 * Shared test fixtures for unit tests.
 *
 * All fixtures represent minimal but realistic payloads as returned by the Yad2 API.
 * Import these instead of redeclaring inline mock data — this ensures tests stay in
 * sync and makes the expected API shape obvious to future contributors (human or AI).
 *
 * Validate fixtures against the Zod schemas if you're unsure the shape is correct:
 *   import { Yad2FeedSchema } from '../../realestate/api-schema.js';
 *   Yad2FeedSchema.parse(FAKE_FEED_DATA);
 */

import type { Yad2ApiItem, Yad2FeedData } from '../../realestate/types.js';
import type { Yad2VehicleApiItem, Yad2VehicleFeedData } from '../../vehicles/types.js';

export const FAKE_REALESTATE_ITEM: Yad2ApiItem = {
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

export const FAKE_REALESTATE_ITEM_FORSALE: Yad2ApiItem = {
  token: 'xyz789',
  price: 2500000,
  currency: 'ILS',
  searchText: 'דירה 4 חדרים\nפרטים',
  additionalDetails: { roomsCount: 4, squareMeter: 120 },
  address: { city: { text: 'חיפה' }, neighborhood: { text: 'הדר' }, house: { floor: 5 } },
};

export const FAKE_FEED_DATA: Yad2FeedData = {
  private: [FAKE_REALESTATE_ITEM],
  agency: [],
  platinum: [{ token: 'plat1', price: 0 }],
  pagination: { total: 1, totalPages: 1 },
};

export const FAKE_VEHICLE_ITEM: Yad2VehicleApiItem = {
  token: 'car123',
  price: 85000,
  manufacturer: { id: 1, text: 'Toyota' },
  model: { id: 10, text: 'Corolla' },
  subModel: { id: 5, text: 'Executive' },
  vehicleDates: { yearOfProduction: 2021 },
  engineType: { text: 'Petrol' },
  hand: { id: 1, text: 'יד ראשונה' },
  km: 45000,
  gear: { text: 'Automatic' },
  color: { text: 'White' },
  metaData: { coverImage: 'https://img.yad2.co.il/car.jpg', images: [] },
};

export const FAKE_VEHICLE_FEED_DATA: Yad2VehicleFeedData = {
  private: [FAKE_VEHICLE_ITEM],
  commercial: [],
  solo: [],
  pagination: { total: 10, pages: 1 },
};
