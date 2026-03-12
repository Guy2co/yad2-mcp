import type { VehicleListing, VehicleSearchResult } from './types.js';
import manufacturersData from './manufacturers.json';

export interface ManufacturerEntry {
  id: string;
  name: string;
  nameEn: string;
  models: Array<{ id: number; name: string }>;
}

export const MANUFACTURERS: ManufacturerEntry[] = manufacturersData as ManufacturerEntry[];

export function filterManufacturers(filter: string | undefined): ManufacturerEntry[] {
  if (filter === undefined) return MANUFACTURERS;
  const lower = filter.toLowerCase();
  return MANUFACTURERS.filter(
    (m) => m.name.toLowerCase().includes(lower) || m.nameEn.toLowerCase().includes(lower),
  );
}

function buildEntryDetails(listing: VehicleListing): string[] {
  const details: string[] = [];
  if (listing.km !== null) details.push(`${listing.km.toLocaleString()} km`);
  if (listing.hand !== null) details.push(`hand ${listing.hand}`);
  if (listing.engineType !== '') details.push(listing.engineType);
  if (listing.gear !== '') details.push(listing.gear);
  return details;
}

function formatVehicleListingEntry(listing: VehicleListing): string {
  const price = listing.price !== null ? `₪${listing.price.toLocaleString()}` : 'Price not listed';
  const subModel = listing.subModel !== '' ? ' ' + listing.subModel : '';
  const lines = [`### ${listing.manufacturer} ${listing.model}${subModel}`, `**Price:** ${price}`];
  if (listing.year !== null) lines.push(`**Year:** ${listing.year}`);
  const details = buildEntryDetails(listing);
  if (details.length > 0) lines.push(`**Details:** ${details.join(' · ')}`);
  if (listing.color !== '') lines.push(`**Color:** ${listing.color}`);
  lines.push(`**Token:** ${listing.token}`, `**URL:** ${listing.url}`);
  return lines.join('\n');
}

export function formatVehicleSearchResults(result: VehicleSearchResult): string {
  const header = [
    `## Yad2 Vehicle Results`,
    `Found ${result.total} listings (page ${result.page}, showing ${result.listings.length})`,
    '',
  ];
  if (result.listings.length === 0)
    return [...header, 'No listings found for these search criteria.'].join('\n');
  return [...header, ...result.listings.map(formatVehicleListingEntry), ''].join('\n');
}

function formatVehicleListingImages(listing: VehicleListing): string[] {
  if (listing.images.length === 0) return [];
  return [
    `\n**Images (${listing.images.length}):**`,
    ...listing.images.slice(0, 5).map((img) => `- ${img}`),
  ];
}

function buildListingLines(listing: VehicleListing, price: string): string[] {
  const subModel = listing.subModel !== '' ? ' ' + listing.subModel : '';
  const lines = [
    `## ${listing.manufacturer} ${listing.model}${subModel}`,
    '',
    `**Price:** ${price}`,
  ];
  if (listing.year !== null) lines.push(`**Year:** ${listing.year}`);
  if (listing.km !== null) lines.push(`**Km:** ${listing.km.toLocaleString()}`);
  if (listing.hand !== null) lines.push(`**Hand:** ${listing.hand}`);
  if (listing.engineType !== '') lines.push(`**Engine:** ${listing.engineType}`);
  if (listing.gear !== '') lines.push(`**Gear:** ${listing.gear}`);
  if (listing.color !== '') lines.push(`**Color:** ${listing.color}`);
  return lines;
}

export function formatVehicleListing(listing: VehicleListing): string {
  const price = listing.price !== null ? `₪${listing.price.toLocaleString()}` : 'Not listed';
  const lines = buildListingLines(listing, price);
  if (listing.url !== '') lines.push(`\n**URL:** ${listing.url}`);
  lines.push(...formatVehicleListingImages(listing));
  return lines.join('\n');
}
