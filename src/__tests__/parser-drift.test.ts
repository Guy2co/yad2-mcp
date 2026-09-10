import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseItem, parseResponse } from '../realestate/parser.js';
import { parseVehicleResponse } from '../vehicles/parser.js';
import {
  FAKE_FEED_DATA,
  FAKE_REALESTATE_ITEM_GROUND_FLOOR,
  FAKE_VEHICLE_FEED_DATA,
} from './fixtures/index.js';

type Spy = ReturnType<typeof vi.spyOn>;

afterEach(() => vi.restoreAllMocks());

function captureStderr(): Spy {
  return vi.spyOn(console, 'error').mockImplementation(() => undefined);
}

function asRecord(v: unknown): Record<string, unknown> {
  return v as Record<string, unknown>;
}

describe('parseResponse — drift warnings', () => {
  it('stays silent on a valid feed', () => {
    const spy = captureStderr();
    parseResponse(asRecord(FAKE_FEED_DATA), 1);
    expect(spy).not.toHaveBeenCalled();
  });

  it('warns when the feed buckets have been renamed', () => {
    const spy = captureStderr();
    parseResponse({ privateFeed: [] }, 1);
    expect(String(spy.mock.calls[0]?.[0])).toContain('feed schema mismatch');
  });
});

describe('parseResponse — drift warning detail', () => {
  it('reports the offending path for a nested mismatch', () => {
    const spy = captureStderr();
    parseResponse({ private: [{ price: 'not-a-number' }] }, 1);
    expect(spy.mock.calls[0]?.[1]).toBe('private.0.price');
  });

  it('reports (root) when the mismatch has no path', () => {
    const spy = captureStderr();
    parseResponse({ privateFeed: [] }, 1);
    expect(spy.mock.calls[0]?.[1]).toBe('(root)');
  });
});

describe('parseResponse — degraded result', () => {
  it('still returns a result after warning', () => {
    captureStderr();
    const expected = { listings: [], total: 0, page: 2, pageSize: 0 };
    expect(parseResponse({ privateFeed: [] }, 2)).toEqual(expected);
  });
});

describe('parseItem — non-numeric numeric fields', () => {
  it('normalizes a Hebrew floor label to null rather than NaN', () => {
    const listing = parseItem(FAKE_REALESTATE_ITEM_GROUND_FLOOR);
    expect(listing.floor).toBeNull();
    expect(listing.floor).not.toBeNaN();
  });

  it('keeps the rest of the listing intact', () => {
    const listing = parseItem(FAKE_REALESTATE_ITEM_GROUND_FLOOR);
    expect(listing.rooms).toBe(2);
    expect(listing.size).toBe(55);
    expect(listing.propertyType).toBe('דירת גן');
  });
});

describe('parseItem — unparseable measurements', () => {
  it('normalizes unparseable rooms and size to null', () => {
    const listing = parseItem({
      token: 't',
      additionalDetails: { roomsCount: 'הרבה', squareMeter: '' },
    } as unknown as Parameters<typeof parseItem>[0]);
    expect(listing.rooms).toBeNull();
    expect(listing.size).toBeNull();
  });
});

describe('parseVehicleResponse — drift warnings', () => {
  it('stays silent on a valid feed', () => {
    const spy = captureStderr();
    parseVehicleResponse(asRecord(FAKE_VEHICLE_FEED_DATA), 1);
    expect(spy).not.toHaveBeenCalled();
  });

  it('warns when the vehicle feed buckets have been renamed', () => {
    const spy = captureStderr();
    parseVehicleResponse({ privateCars: [] }, 1);
    expect(String(spy.mock.calls[0]?.[0])).toContain('vehicle feed schema mismatch');
  });
});

describe('parseVehicleResponse — drift warning detail', () => {
  it('reports the offending path for a nested mismatch', () => {
    const spy = captureStderr();
    parseVehicleResponse({ private: [{ km: 'lots' }] }, 1);
    expect(spy.mock.calls[0]?.[1]).toBe('private.0.km');
  });

  it('still returns a result after warning', () => {
    captureStderr();
    const expected = { listings: [], total: 0, page: 3, pageSize: 0 };
    expect(parseVehicleResponse({ privateCars: [] }, 3)).toEqual(expected);
  });
});
