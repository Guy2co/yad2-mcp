import type { Listing, SearchParams, SearchResult } from './types.js';
import propertyTypes from './property-types.json';

// Codes verified against yad2's own address autocomplete
// (gw.yad2.co.il/address-autocomplete/realestate/v2).
const CITY_CODES = [
  { code: '5000', name: 'תל אביב יפו', nameEn: 'Tel Aviv-Yafo' },
  { code: '4000', name: 'חיפה', nameEn: 'Haifa' },
  { code: '3000', name: 'ירושלים', nameEn: 'Jerusalem' },
  { code: '9000', name: 'באר שבע', nameEn: 'Beer Sheva' },
  { code: '7400', name: 'נתניה', nameEn: 'Netanya' },
  { code: '7900', name: 'פתח תקווה', nameEn: 'Petah Tikva' },
  { code: '8300', name: 'ראשון לציון', nameEn: 'Rishon LeZion' },
  { code: '6100', name: 'בני ברק', nameEn: 'Bnei Brak' },
  { code: '8600', name: 'רמת גן', nameEn: 'Ramat Gan' },
  { code: '6300', name: 'גבעתיים', nameEn: 'Givatayim' },
  { code: '0070', name: 'אשדוד', nameEn: 'Ashdod' },
  { code: '2650', name: 'רמת השרון', nameEn: 'Ramat HaSharon' },
  { code: '6400', name: 'הרצליה', nameEn: 'Herzliya' },
  { code: '6600', name: 'חולון', nameEn: 'Holon' },
  { code: '8400', name: 'רחובות', nameEn: 'Rehovot' },
  { code: '6200', name: 'בת ים', nameEn: 'Bat Yam' },
  { code: '2600', name: 'אילת', nameEn: 'Eilat' },
  { code: '7300', name: 'נצרת', nameEn: 'Nazareth' },
  { code: '2400', name: 'אור יהודה', nameEn: 'Or Yehuda' },
  { code: '8700', name: 'רעננה', nameEn: 'Raanana' },
  { code: '6900', name: 'כפר סבא', nameEn: 'Kfar Saba' },
  { code: '7100', name: 'אשקלון', nameEn: 'Ashkelon' },
  { code: '1200', name: 'מודיעין מכבים רעות', nameEn: "Modi'in" },
];

function extractSearchParamsStrings(
  params: Record<string, unknown>,
): Pick<SearchParams, 'city' | 'rooms' | 'floor' | 'propertyType'> {
  return {
    city: params['city'] as string | undefined,
    rooms: params['rooms'] as string | undefined,
    floor: params['floor'] as string | undefined,
    propertyType: params['propertyType'] as string | undefined,
  };
}

function extractSearchParamsNumbers(
  params: Record<string, unknown>,
): Pick<SearchParams, 'priceMin' | 'priceMax' | 'sizeMin' | 'sizeMax' | 'page' | 'pageSize'> {
  return {
    priceMin: params['priceMin'] as number | undefined,
    priceMax: params['priceMax'] as number | undefined,
    sizeMin: params['sizeMin'] as number | undefined,
    sizeMax: params['sizeMax'] as number | undefined,
    page: (params['page'] as number | undefined) ?? 1,
    pageSize: Math.min((params['pageSize'] as number | undefined) ?? 20, 40),
  };
}

function extractFeatureFiltersA(
  params: Record<string, unknown>,
): Pick<
  SearchParams,
  'shelter' | 'elevator' | 'parking' | 'balcony' | 'airConditioner' | 'warehouse'
> {
  return {
    shelter: params['shelter'] as boolean | undefined,
    elevator: params['elevator'] as boolean | undefined,
    parking: params['parking'] as boolean | undefined,
    balcony: params['balcony'] as boolean | undefined,
    airConditioner: params['airConditioner'] as boolean | undefined,
    warehouse: params['warehouse'] as boolean | undefined,
  };
}

function extractFeatureFiltersB(
  params: Record<string, unknown>,
): Pick<SearchParams, 'accessibility' | 'furniture' | 'renovated' | 'bars'> {
  return {
    accessibility: params['accessibility'] as boolean | undefined,
    furniture: params['furniture'] as boolean | undefined,
    renovated: params['renovated'] as boolean | undefined,
    bars: params['bars'] as boolean | undefined,
  };
}

export function extractSearchParams(params: Record<string, unknown>): SearchParams {
  return {
    ...extractSearchParamsStrings(params),
    ...extractSearchParamsNumbers(params),
    ...extractFeatureFiltersA(params),
    ...extractFeatureFiltersB(params),
  };
}

export function filterCities(
  filter: string | undefined,
): Array<{ code: string; name: string; nameEn: string }> {
  if (filter === undefined) return CITY_CODES;
  return CITY_CODES.filter(
    (c) => c.name.toLowerCase().includes(filter) || c.nameEn.toLowerCase().includes(filter),
  );
}

export function filterPropertyTypes(
  filter: string | undefined,
): Array<{ id: string; name: string; nameEn: string }> {
  if (filter === undefined) return propertyTypes;
  return propertyTypes.filter(
    (t) =>
      t.name.toLowerCase().includes(filter) ||
      t.nameEn.toLowerCase().includes(filter) ||
      t.id.toLowerCase().includes(filter),
  );
}

export function formatPrice(listing: Listing, type: 'rent' | 'forsale'): string {
  if (listing.price === null) return 'Price not listed';
  return `₪${listing.price.toLocaleString()}${type === 'rent' ? '/month' : ''}`;
}

export function formatListingDetails(listing: Listing): string {
  return [
    listing.rooms !== null ? `${listing.rooms} rooms` : '',
    listing.size !== null ? `${listing.size}m²` : '',
    listing.floor !== null ? `floor ${listing.floor}` : '',
  ]
    .filter((s) => s !== '')
    .join(' · ');
}

function formatListingEntryLines(listing: Listing, type: 'rent' | 'forsale'): string[] {
  const lines = [
    `### ${listing.title !== '' ? listing.title : listing.address}`,
    `**Price:** ${formatPrice(listing, type)}`,
  ];
  const details = formatListingDetails(listing);
  if (details !== '') lines.push(`**Details:** ${details}`);
  if (listing.address !== '') lines.push(`**Address:** ${listing.address}`);
  return lines;
}

function formatDescription(description: string): string {
  return `**Description:** ${description.slice(0, 200)}${description.length > 200 ? '...' : ''}`;
}

export function formatListingEntry(listing: Listing, type: 'rent' | 'forsale'): string {
  const lines = formatListingEntryLines(listing, type);
  if (listing.description !== '') lines.push(formatDescription(listing.description));
  lines.push(`**Token:** ${listing.token}`, `**URL:** ${listing.url}`);
  if (listing.date !== '') lines.push(`**Listed:** ${listing.date}`);
  return lines.join('\n');
}

function buildResultHeader(result: SearchResult, label: string): string[] {
  return [
    `## Yad2 ${label} Results`,
    `Found ${result.total} listings (page ${result.page}, showing ${result.listings.length})`,
    '',
  ];
}

export function formatSearchResults(result: SearchResult, type: 'rent' | 'forsale'): string {
  const header = buildResultHeader(result, type === 'rent' ? 'Rental' : 'For Sale');
  if (result.listings.length === 0)
    return [...header, 'No listings found for these search criteria.'].join('\n');
  return [...header, ...result.listings.map((l) => formatListingEntry(l, type)), ''].join('\n');
}

function formatListingMeta(listing: Listing): string[] {
  const lines: string[] = [];
  if (listing.rooms !== null) lines.push(`**Rooms:** ${listing.rooms}`);
  if (listing.size !== null) lines.push(`**Size:** ${listing.size}m²`);
  if (listing.floor !== null) lines.push(`**Floor:** ${listing.floor}`);
  if (listing.address !== '') lines.push(`**Address:** ${listing.address}`);
  if (listing.neighborhood !== '') lines.push(`**Neighborhood:** ${listing.neighborhood}`);
  return lines;
}

function formatListingImages(listing: Listing): string[] {
  if (listing.images.length === 0) return [];
  return [
    `\n**Images (${listing.images.length}):**`,
    ...listing.images.slice(0, 5).map((img) => `- ${img}`),
  ];
}

function formatListingContactInfo(listing: Listing): string[] {
  const lines: string[] = [];
  if (listing.contactName !== null) lines.push(`\n**Contact:** ${listing.contactName}`);
  if (listing.contactPhone !== null) lines.push(`**Phone:** ${listing.contactPhone}`);
  if (listing.url !== '') lines.push(`\n**URL:** ${listing.url}`);
  if (listing.date !== '') lines.push(`**Listed:** ${listing.date}`);
  if (listing.coordinates !== null)
    lines.push(`**Coordinates:** ${listing.coordinates.lat}, ${listing.coordinates.lng}`);
  return lines;
}

function formatListingContact(listing: Listing): string[] {
  const desc = listing.description !== '' ? [`\n**Description:**\n${listing.description}`] : [];
  return [...desc, ...formatListingContactInfo(listing), ...formatListingImages(listing)];
}

export function formatListing(listing: Listing): string {
  const priceStr = listing.price !== null ? listing.price.toLocaleString() : 'Not listed';
  return [
    `## ${listing.title !== '' ? listing.title : listing.address}`,
    '',
    `**Price:** ₪${priceStr} ${listing.currency}`,
    ...formatListingMeta(listing),
    ...formatListingContact(listing),
  ].join('\n');
}
