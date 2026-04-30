import { z } from 'zod';

/**
 * Zod schemas for raw Yad2 real-estate API responses extracted from __NEXT_DATA__.
 *
 * All fields are optional and schemas use `.loose()` (Zod v4) so unexpected fields from
 * Yad2 API changes never cause a hard failure — only a stderr warning.
 *
 * Use these schemas to:
 *   1. Detect Yad2 API drift early (safeParse in parsers logs mismatches to stderr).
 *   2. Validate test fixtures against the expected shape (see __tests__/fixtures).
 */

const Yad2ApiAddressSchema = z.looseObject({
  city: z.looseObject({ text: z.string().optional() }).optional(),
  neighborhood: z.looseObject({ text: z.string().optional() }).optional(),
  street: z.looseObject({ text: z.string().optional() }).optional(),
  house: z
    .looseObject({
      number: z.union([z.number(), z.string()]).optional(),
      floor: z.union([z.number(), z.string()]).optional(),
    })
    .optional(),
  coords: z.looseObject({ lat: z.number().optional(), lon: z.number().optional() }).optional(),
});

const Yad2ApiAdditionalDetailsSchema = z.looseObject({
  roomsCount: z.number().optional(),
  squareMeter: z.number().optional(),
  property: z.looseObject({ text: z.string().optional() }).optional(),
});

const Yad2ApiMetaDataSchema = z.looseObject({
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional(),
});

const Yad2ApiItemSchema = z.looseObject({
  token: z.string().optional(),
  orderId: z.number().optional(),
  adNumber: z.number().optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
  address: Yad2ApiAddressSchema.optional(),
  additionalDetails: Yad2ApiAdditionalDetailsSchema.optional(),
  metaData: Yad2ApiMetaDataSchema.optional(),
  searchText: z.string().optional(),
  dateAdded: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  adType: z.string().optional(),
});

const Yad2PaginationSchema = z.looseObject({
  total: z.number().optional(),
  totalPages: z.number().optional(),
});

export const Yad2FeedSchema = z.looseObject({
  private: z.array(Yad2ApiItemSchema).optional(),
  agency: z.array(Yad2ApiItemSchema).optional(),
  yad1: z.array(Yad2ApiItemSchema).optional(),
  platinum: z.array(Yad2ApiItemSchema).optional(),
  kingOfTheHar: z.array(Yad2ApiItemSchema).optional(),
  trio: z.array(Yad2ApiItemSchema).optional(),
  booster: z.array(Yad2ApiItemSchema).optional(),
  leadingBroker: z.array(Yad2ApiItemSchema).optional(),
  pagination: Yad2PaginationSchema.optional(),
});
