import { z } from "zod";
import { ActivityStatus, ActivityType, LeadPriority } from "@prisma/client";

export const CreateActivitySchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  leadId: z.string().uuid().optional().nullable(),
  type: z.nativeEnum(ActivityType),
  subject: z.string().min(2, "Subject is required"),
  description: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.nativeEnum(LeadPriority).optional().default(LeadPriority.MEDIUM),
  assignedToId: z.string().uuid().optional().nullable(),
});

export type CreateActivityInput = z.input<typeof CreateActivitySchema>;
