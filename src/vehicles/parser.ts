import type {
  VehicleListing,
  VehicleSearchResult,
  Yad2VehicleApiItem,
  Yad2VehicleFeedData,
} from './types.js';

const ITEM_BASE = 'https://www.yad2.co.il/vehicles/item';

function buildVehicleImages(item: Yad2VehicleApiItem): string[] {
  const meta = item.metaData;
  if (meta?.images !== undefined && meta.images.length > 0) return meta.images;
  return meta?.coverImage !== undefined ? [meta.coverImage] : [];
}

type VehicleFields = Omit<VehicleListing, 'images' | 'url'>;

function txt(field: { text?: string } | undefined): string {
  return field?.text ?? '';
}

function parseVehicleItemFields(item: Yad2VehicleApiItem): VehicleFields {
  return {
    token: String(item.token ?? ''),
    price: item.price ?? null,
    year: item.vehicleDates?.yearOfProduction ?? null,
    hand: item.hand?.id ?? null,
    km: item.km ?? null,
    manufacturer: txt(item.manufacturer),
    model: txt(item.model),
    subModel: txt(item.subModel),
    engineType: txt(item.engineType),
    gear: txt(item.gear),
    color: txt(item.color),
  };
}

export function parseVehicleItem(item: Yad2VehicleApiItem): VehicleListing {
  const fields = parseVehicleItemFields(item);
  return {
    ...fields,
    images: buildVehicleImages(item),
    url: fields.token !== '' ? `${ITEM_BASE}/${fields.token}` : '',
  };
}

function toItems(val: unknown): Yad2VehicleApiItem[] {
  return Array.isArray(val) ? (val as Yad2VehicleApiItem[]) : [];
}

function collectVehicleFeedItems(feed: Yad2VehicleFeedData): Yad2VehicleApiItem[] {
  return [...toItems(feed.private), ...toItems(feed.commercial), ...toItems(feed.solo)];
}

export function parseVehicleResponse(
  data: Record<string, unknown>,
  page: number,
): VehicleSearchResult {
  const feed = data as Yad2VehicleFeedData;
  const items = collectVehicleFeedItems(feed);
  const total = feed.pagination?.total ?? items.length;
  return {
    listings: items.map(parseVehicleItem),
    total,
    page,
    pageSize: items.length,
  };
}
