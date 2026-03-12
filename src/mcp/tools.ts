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
      'cottage',
      'townhouse',
      'building',
      'land',
      'agricultural',
      'commercial_space',
    ])
    .optional()
    .describe('Property type (use list_property_types to see all options)'),
  shelter: z.boolean().optional().describe('Has shelter/safe room (ממ"ד)'),
  elevator: z.boolean().optional().describe('Has elevator'),
  parking: z.boolean().optional().describe('Has parking space'),
  balcony: z.boolean().optional().describe('Has balcony'),
  ac: z.boolean().optional().describe('Has air conditioning'),
  storage: z.boolean().optional().describe('Has storage room'),
  accessibility: z.boolean().optional().describe('Wheelchair accessible'),
  pets: z.boolean().optional().describe('Pets allowed'),
  furnished: z.boolean().optional().describe('Furnished'),
  boiler: z.boolean().optional().describe('Has solar boiler'),
  doorman: z.boolean().optional().describe('Has doorman/concierge'),
  page: z.number().optional().describe('Page number (default: 1)'),
  pageSize: z.number().optional().describe('Results per page (default: 20, max: 40)'),
});

export const GetListingSchema = z.object({
  token: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/)
    .max(50)
    .describe('The listing token or ID'),
  type: z
    .enum(['realestate', 'car'])
    .optional()
    .default('realestate')
    .describe('Listing type: "realestate" (default) or "car"'),
});

export const ListCityCodesSchema = z.object({
  filter: z.string().optional().describe('Optional filter string to search city names'),
});

export const SearchCarsSchema = z.object({
  manufacturer: z
    .string()
    .optional()
    .describe('Manufacturer ID (use list_manufacturers to find IDs)'),
  model: z.string().optional().describe('Model ID (use list_manufacturers to find model IDs)'),
  year: z.string().optional().describe('Year or year range e.g. "2020", "2018-2023"'),
  priceMin: z.number().optional().describe('Minimum price in ILS'),
  priceMax: z.number().optional().describe('Maximum price in ILS'),
  kmMax: z.number().optional().describe('Maximum kilometers'),
  hand: z.number().optional().describe('Hand number (e.g. 1 for first hand)'),
  page: z.number().optional().describe('Page number (default: 1)'),
  pageSize: z.number().optional().describe('Results per page (default: 20)'),
});

export const ListManufacturersSchema = z.object({
  filter: z.string().optional().describe('Optional filter string to search manufacturer names'),
});

export const ListPropertyTypesSchema = z.object({
  filter: z.string().optional().describe('Optional filter string to search type names'),
});

export const WhichToolSchema = z.object({});
