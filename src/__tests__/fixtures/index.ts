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

import type { Listing, Yad2ApiItem, Yad2FeedData } from '../../realestate/types.js';
import type {
  VehicleListing,
  Yad2VehicleApiItem,
  Yad2VehicleFeedData,
} from '../../vehicles/types.js';

export const FAKE_REALESTATE_ITEM: Yad2ApiItem = {
  token: 'abc123',
  price: 7500,
  currency: 'ILS',
  searchText: 'דירה 3 חדרים בתל אביב\nפרטים נוספים',
  additionalDetails: { roomsCount: 3, squareMeter: 75, property: { text: 'דירה' } },
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

/**
 * Ground-floor flat. Yad2 types `house.floor` as `number | string` and sends the Hebrew
 * word "קרקע" (ground) rather than 0 — a bare `Number()` yields `NaN`, so the parser must
 * normalize it to `null`.
 */
export const FAKE_REALESTATE_ITEM_GROUND_FLOOR: Yad2ApiItem = {
  token: 'ground1',
  price: 6000,
  currency: 'ILS',
  searchText: 'דירת גן 2 חדרים\nפרטים',
  additionalDetails: { roomsCount: 2, squareMeter: 55, property: { text: 'דירת גן' } },
  address: { city: { text: 'רמת גן' }, house: { floor: 'קרקע' } },
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

/**
 * Normalized shapes — what the parsers emit and the formatters consume.
 * Raw `Yad2*ApiItem` fixtures above are parser *input*; these are formatter *input*.
 */
export const FAKE_LISTING: Listing = {
  id: 'tok1',
  token: 'tok1',
  title: 'Test Listing',
  price: 5000,
  currency: 'ILS',
  rooms: 3,
  floor: 2,
  size: 80,
  propertyType: 'דירה',
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

export const FAKE_VEHICLE_LISTING: VehicleListing = {
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
