import type { Listing, SearchResult, Yad2ApiItem, Yad2FeedData } from './types.js';
import { Yad2FeedSchema } from './api-schema.js';

const ITEM_BASE = 'https://www.yad2.co.il/realestate/item';

type ItemScalars = Pick<
  Listing,
  'description' | 'images' | 'url' | 'date' | 'contactName' | 'contactPhone' | 'coordinates'
>;

function buildAddress(item: Yad2ApiItem): string {
  const addr = item.address ?? {};
  const street = addr.street?.text;
  const house = addr.house?.number !== undefined ? String(addr.house.number) : undefined;
  const neighborhood = addr.neighborhood?.text;
  const city = addr.city?.text;
  return [house, street, neighborhood, city].filter((p): p is string => p !== undefined).join(', ');
}

function buildFloor(item: Yad2ApiItem): number | null {
  const floor = item.address?.house?.floor;
  return floor !== undefined ? Number(floor) : null;
}

function buildCoordinates(item: Yad2ApiItem): { lat: number; lng: number } | null {
  const coords = item.address?.coords;
  return coords?.lat !== undefined && coords.lon !== undefined
    ? { lat: coords.lat, lng: coords.lon }
    : null;
}

function buildImages(item: Yad2ApiItem): string[] {
  const meta = item.metaData;
  if (meta?.images !== undefined && meta.images.length > 0) return meta.images;
  return meta?.coverImage !== undefined ? [meta.coverImage] : [];
}

function buildItemCore(
  item: Yad2ApiItem,
  token: string,
): Pick<Listing, 'id' | 'token' | 'title' | 'price' | 'currency'> {
  return {
    id: token,
    token,
    title: item.searchText?.split('\n')[0]?.trim() ?? '',
    price: item.price ?? null,
    currency: String(item.currency ?? 'ILS'),
  };
}

function buildItemDetails(
  item: Yad2ApiItem,
): Pick<Listing, 'rooms' | 'floor' | 'size' | 'address' | 'city' | 'neighborhood'> {
  const details = item.additionalDetails ?? {};
  return {
    rooms: details.roomsCount !== undefined ? Number(details.roomsCount) : null,
    floor: buildFloor(item),
    size: details.squareMeter !== undefined ? Number(details.squareMeter) : null,
    address: buildAddress(item),
    city: item.address?.city?.text ?? '',
    neighborhood: item.address?.neighborhood?.text ?? '',
  };
}

function buildContact(item: Yad2ApiItem): Pick<Listing, 'contactName' | 'contactPhone'> {
  return {
    contactName: item.contactName !== undefined ? String(item.contactName) : null,
    contactPhone: item.contactPhone !== undefined ? String(item.contactPhone) : null,
  };
}

function buildItemScalars(item: Yad2ApiItem, token: string): ItemScalars {
  return {
    description: item.searchText ?? '',
    images: buildImages(item),
    url: token !== '' ? `${ITEM_BASE}/${token}` : '',
    date: String(item.dateAdded ?? ''),
    ...buildContact(item),
    coordinates: buildCoordinates(item),
  };
}

/**
 * Converts a raw Yad2 API item into a normalized `Listing`.
 *
 * Key decisions:
 * - `token` falls back to `orderId` as a string if `token` is absent.
 * - Title is the first line of `searchText` (yad2 packs the full description into one field).
 * - Floor and size are coerced to numbers; missing → `null` (not `0`).
 * - Coordinates use `lon` (not `lng`) in the API; normalized to `lng` in the output.
 */
export function parseItem(item: Yad2ApiItem): Listing {
  const token = String(item.token ?? item.orderId ?? '');
  return {
    ...buildItemCore(item, token),
    ...buildItemDetails(item),
    ...buildItemScalars(item, token),
  };
}

function toItems(val: unknown): Yad2ApiItem[] {
  return Array.isArray(val) ? (val as Yad2ApiItem[]) : [];
}

function collectFeedItems(feed: Yad2FeedData): Yad2ApiItem[] {
  return [
    ...toItems(feed.private),
    ...toItems(feed.agency),
    ...toItems(feed.yad1),
    ...toItems(feed.leadingBroker),
  ];
}

function warnIfFeedInvalid(data: Record<string, unknown>): void {
  const validation = Yad2FeedSchema.safeParse(data);
  if (!validation.success) {
    console.error(
      '[yad2] feed schema mismatch — API may have changed:',
      validation.error.issues[0]?.message,
    );
  }
}

/**
 * Validates the raw feed payload against `Yad2FeedSchema`, then converts it to `SearchResult`.
 * Logs a stderr warning if the schema doesn't match (API drift) but continues parsing.
 */
export function parseResponse(data: Record<string, unknown>, page: number): SearchResult {
  warnIfFeedInvalid(data);
  const feed = data as Yad2FeedData;
  const items = collectFeedItems(feed);
  const total = (feed.pagination?.total as number | undefined) ?? items.length;
  return { listings: items.map(parseItem), total, page, pageSize: items.length };
}
