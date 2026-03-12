import { z } from 'zod';

export const SearchSchema = z.object({
  city: z
    .string()
    .optional()
    .describe('City code (e.g. "5000" for Tel Aviv, "3000" for Haifa, "70" for Jerusalem)'),
  rooms: z.string().optional().describe('Room range e.g. "2-4", "3", "1.5-3"'),
  priceMin: z.number().optional().describe('Minimum price in ILS'),
  priceMax: z.number().optional().describe('Maximum price in ILS'),
  sizeMin: z.number().optional().describe('Minimum size in sqm'),
  sizeMax: z.number().optional().describe('Maximum size in sqm'),
  floor: z.string().optional().describe('Floor range e.g. "1-5", "0" for ground floor'),
  propertyType: z
    .enum([
      'apartment',
      'garden_apartment',
      'penthouse',
      'duplex',
      'roof_apartment',
      'unit',
      'storage',
      'parking',
    ])
    .optional()
    .describe('Property type'),
  page: z.number().optional().describe('Page number (default: 1)'),
  pageSize: z.number().optional().describe('Results per page (default: 20, max: 40)'),
});

export const GetListingSchema = z.object({
  token: z.string().describe('The listing token or ID'),
});

export const ListCityCodesSchema = z.object({
  filter: z.string().optional().describe('Optional filter string to search city names'),
});
