import { z } from 'zod';

/**
 * Zod schemas for raw Yad2 vehicles API responses extracted from __NEXT_DATA__.
 *
 * All fields are optional and schemas use `.loose()` (Zod v4) so unexpected fields from
 * Yad2 API changes never cause a hard failure — only a stderr warning.
 *
 * Use these schemas to:
 *   1. Detect Yad2 API drift early (safeParse in parsers logs mismatches to stderr).
 *   2. Validate test fixtures against the expected shape (see __tests__/fixtures).
 */

const TextFieldSchema = z.looseObject({ text: z.string().optional() });
const IdTextFieldSchema = z.looseObject({
  id: z.union([z.number(), z.string()]).optional(),
  text: z.string().optional(),
});

const Yad2VehicleMetaDataSchema = z.looseObject({
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional(),
});

const Yad2VehicleApiItemSchema = z.looseObject({
  token: z.string().optional(),
  price: z.number().optional(),
  manufacturer: IdTextFieldSchema.optional(),
  model: IdTextFieldSchema.optional(),
  subModel: IdTextFieldSchema.optional(),
  vehicleDates: z.looseObject({ yearOfProduction: z.number().optional() }).optional(),
  engineType: TextFieldSchema.optional(),
  hand: IdTextFieldSchema.optional(),
  km: z.number().optional(),
  gear: TextFieldSchema.optional(),
  color: TextFieldSchema.optional(),
  metaData: Yad2VehicleMetaDataSchema.optional(),
});

const Yad2VehiclePaginationSchema = z.looseObject({
  total: z.number().optional(),
  pages: z.number().optional(),
  perPage: z.number().optional(),
});

export const Yad2VehicleFeedSchema = z.looseObject({
  private: z.array(Yad2VehicleApiItemSchema).optional(),
  commercial: z.array(Yad2VehicleApiItemSchema).optional(),
  solo: z.array(Yad2VehicleApiItemSchema).optional(),
  platinum: z.array(Yad2VehicleApiItemSchema).optional(),
  boost: z.array(Yad2VehicleApiItemSchema).optional(),
  pagination: Yad2VehiclePaginationSchema.optional(),
});
