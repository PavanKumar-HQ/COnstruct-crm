import { z } from "zod";
import { QuotationStatus } from "@prisma/client";

export const CreateQuotationSchema = z.object({
  estimateId: z.string().uuid("Valid estimate ID is required"),
  validUntil: z.string().datetime("Valid expiration date is required"),
  paymentTerms: z.string().optional().nullable(),
  inclusions: z.string().optional().nullable(),
  exclusions: z.string().optional().nullable(),
  discountAmount: z.number().nonnegative().optional().default(0),
  notes: z.string().optional().nullable(),
});

export type CreateQuotationInput = z.infer<typeof CreateQuotationSchema>;

export const UpdateQuotationStatusSchema = z.object({
  status: z.nativeEnum(QuotationStatus),
  rejectionReason: z.string().optional().nullable(),
});

export type UpdateQuotationStatusInput = z.infer<typeof UpdateQuotationStatusSchema>;

