import { z } from "zod";

export const CreateContractFromQuotationSchema = z.object({
  quotationId: z.string().uuid(),
  title: z.string().min(3).max(255),
  startDate: z.string().optional(),
  completionDate: z.string().optional(),
  retentionPercentage: z.number().min(0).max(100).default(5),
  advancePercentage: z.number().min(0).max(100).default(10),
  paymentTerms: z.string().optional(),
  scopeOfWork: z.string().optional(),
});

export type CreateContractFromQuotationInput = z.infer<typeof CreateContractFromQuotationSchema>;

export const CreateChangeOrderSchema = z.object({
  contractId: z.string().uuid(),
  title: z.string().min(3).max(255),
  description: z.string().min(5),
  justification: z.string().optional(),
  amount: z.number(), // Can be positive or negative
  taxAmount: z.number().min(0).default(0),
  timeExtensionDays: z.number().int().default(0),
  supportingDocsUrl: z.string().optional(),
});

export type CreateChangeOrderInput = z.infer<typeof CreateChangeOrderSchema>;

export const CreateProjectFromContractSchema = z.object({
  contractId: z.string().uuid(),
  name: z.string().min(3).max(255),
  projectManagerId: z.string().uuid().optional(),
  siteAddress: z.string().optional(),
  plannedStartDate: z.string().optional(),
  targetCompletionDate: z.string().optional(),
  initialWorkPackages: z.array(z.object({
    code: z.string(),
    name: z.string(),
    budgetAmount: z.number().positive(),
  })).optional(),
});

export type CreateProjectFromContractInput = z.infer<typeof CreateProjectFromContractSchema>;

