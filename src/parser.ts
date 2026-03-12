import type { Listing, SearchResult, Yad2ApiItem, Yad2FeedData } from './types.js';

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
    ...toItems(feed.platinum),
    ...toItems(feed.yad1),
    ...toItems(feed.kingOfTheHar),
    ...toItems(feed.trio),
    ...toItems(feed.booster),
    ...toItems(feed.leadingBroker),
  ];
}

export function parseResponse(data: Record<string, unknown>, page: number): SearchResult {
  const feed = data as Yad2FeedData;
  const items = collectFeedItems(feed);
  const total = (feed.pagination?.total as number | undefined) ?? items.length;
  return {
    listings: items.map(parseItem),
    total,
    page,
    pageSize: items.length,
  };
}
