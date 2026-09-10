import { describe, it, expect } from 'vitest';
import { Yad2FeedSchema, REALESTATE_FEED_BUCKETS } from '../realestate/api-schema.js';
import { Yad2VehicleFeedSchema, VEHICLE_FEED_BUCKETS } from '../vehicles/api-schema.js';
import { FAKE_FEED_DATA, FAKE_VEHICLE_FEED_DATA } from './fixtures/index.js';

const ok = (schema: { safeParse: (v: unknown) => { success: boolean } }, v: unknown): boolean =>
  schema.safeParse(v).success;

describe('Yad2FeedSchema — accepts', () => {
  it('the realestate fixture', () => expect(ok(Yad2FeedSchema, FAKE_FEED_DATA)).toBe(true));

  it('unknown extra fields, being loose', () =>
    expect(ok(Yad2FeedSchema, { private: [], somethingNew: 42 })).toBe(true));

  it('any single known bucket on its own', () => {
    for (const b of REALESTATE_FEED_BUCKETS) expect(ok(Yad2FeedSchema, { [b]: [] })).toBe(true);
  });
});

describe('Yad2FeedSchema — rejects', () => {
  it('a payload whose buckets have been renamed', () =>
    expect(ok(Yad2FeedSchema, { privateFeed: [], agencyFeed: [] })).toBe(false));

  it('an empty payload', () => expect(ok(Yad2FeedSchema, {})).toBe(false));

  it('a bucket that is present but not an array', () =>
    expect(ok(Yad2FeedSchema, { private: { 0: {} } })).toBe(false));

  it('a wrong field type inside an item', () =>
    expect(ok(Yad2FeedSchema, { private: [{ price: 'not-a-number' }] })).toBe(false));
});

describe('Yad2VehicleFeedSchema — accepts', () => {
  it('the vehicles fixture', () =>
    expect(ok(Yad2VehicleFeedSchema, FAKE_VEHICLE_FEED_DATA)).toBe(true));

  it('any single known bucket on its own', () => {
    for (const b of VEHICLE_FEED_BUCKETS) {
      expect(ok(Yad2VehicleFeedSchema, { [b]: [] })).toBe(true);
    }
  });
});

describe('Yad2VehicleFeedSchema — rejects', () => {
  it('a payload whose buckets have been renamed', () =>
    expect(ok(Yad2VehicleFeedSchema, { privateCars: [] })).toBe(false));

  it('an empty payload', () => expect(ok(Yad2VehicleFeedSchema, {})).toBe(false));
});
