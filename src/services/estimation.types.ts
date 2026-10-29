import { z } from "zod";
import { BoqCategory } from "@prisma/client";

export const BoqItemInputSchema = z.object({
  itemCode: z.string().min(1, "Item code is required"),
  category: z.nativeEnum(BoqCategory).optional().default(BoqCategory.SUPERSTRUCTURE_RCC),
  description: z.string().min(2, "Description is required"),
  unit: z.string().min(1, "Unit of measurement is required"),
  quantity: z.number().positive("Quantity must be positive"),
  materialRate: z.number().nonnegative().optional().default(0),
  labourRate: z.number().nonnegative().optional().default(0),
  equipmentRate: z.number().nonnegative().optional().default(0),
  subcontractRate: z.number().nonnegative().optional().default(0),
  sortOrder: z.number().int().optional().default(0),
});

export type BoqItemInput = z.input<typeof BoqItemInputSchema>;
export type BoqItemParsed = z.output<typeof BoqItemInputSchema>;

export const CreateEstimateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  leadId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  markupPercentage: z.number().nonnegative().optional().default(15.0),
  taxPercentage: z.number().nonnegative().optional().default(18.0),
  items: z.array(BoqItemInputSchema).min(1, "At least one BOQ item is required"),
});

export type CreateEstimateInput = z.input<typeof CreateEstimateSchema>;

export const CreateRevisionSchema = z.object({
  notes: z.string().optional().nullable(),
  markupPercentage: z.number().nonnegative().optional().default(15.0),
  taxPercentage: z.number().nonnegative().optional().default(18.0),
  items: z.array(BoqItemInputSchema).min(1, "At least one BOQ item is required"),
});

export type CreateRevisionInput = z.input<typeof CreateRevisionSchema>;
