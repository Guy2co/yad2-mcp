import type {
  VehicleListing,
  VehicleSearchResult,
  Yad2VehicleApiItem,
  Yad2VehicleFeedData,
} from './types.js';
import { Yad2VehicleFeedSchema } from './api-schema.js';

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

/**
 * Converts a raw Yad2 vehicle API item into a normalized `VehicleListing`.
 *
 * Key decisions:
 * - Text fields (manufacturer, model, gear, color) are extracted from nested `{ text }` objects.
 * - `hand` is the numeric ID (1 = first hand), not the display text.
 * - Missing numeric fields (price, year, km, hand) normalize to `null`.
 */
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

function warnIfVehicleFeedInvalid(data: Record<string, unknown>): void {
  const validation = Yad2VehicleFeedSchema.safeParse(data);
  if (!validation.success) {
    console.error(
      '[yad2] vehicle feed schema mismatch — API may have changed:',
      validation.error.issues[0]?.message,
    );
  }
}

/**
 * Validates the raw feed payload against `Yad2VehicleFeedSchema`, then converts to `VehicleSearchResult`.
 * Logs a stderr warning if the schema doesn't match (API drift) but continues parsing.
 */
export function parseVehicleResponse(
  data: Record<string, unknown>,
  page: number,
): VehicleSearchResult {
  warnIfVehicleFeedInvalid(data);
  const feed = data as Yad2VehicleFeedData;
  const items = collectVehicleFeedItems(feed);
  const total = feed.pagination?.total ?? items.length;
  return { listings: items.map(parseVehicleItem), total, page, pageSize: items.length };
}
