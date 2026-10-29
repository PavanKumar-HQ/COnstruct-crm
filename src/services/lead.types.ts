import { z } from "zod";
import { LeadPriority } from "@prisma/client";

export const CreateLeadSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  source: z.string().min(2, "Source is required"),
  priority: z.nativeEnum(LeadPriority).optional().default(LeadPriority.MEDIUM),
  constructionType: z.string().optional().nullable(),
  estimatedBudget: z.number().positive().optional().nullable(),
  expectedStartDate: z.string().datetime().optional().nullable(),
  expectedCloseDate: z.string().datetime().optional().nullable(),
  requirements: z.string().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  siteAddress: z.string().optional().nullable(),
});

export type CreateLeadInput = z.input<typeof CreateLeadSchema>;
