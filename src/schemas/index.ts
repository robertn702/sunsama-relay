import { z } from "zod";

// Date string in YYYY-MM-DD format
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Date must be in YYYY-MM-DD format",
});

// ISO 8601 date-time string
const isoDateTime = z.string().datetime({ offset: true }).optional();

// ============ Query Schemas ============

export const getTasksByDayQuery = z.object({
  date: dateString,
  timezone: z.string().optional(),
});

export const getArchivedTasksQuery = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ============ Task Creation ============

export const createTaskBody = z.object({
  text: z.string().min(1, "Task text is required"),
  notes: z.string().optional(),
  timeEstimate: z.number().int().min(0).optional(),
  streamIds: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  snoozeUntil: z.string().optional(),
  private: z.boolean().optional(),
});

// ============ Task Updates (PATCH) ============

export const updateTaskBody = z
  .object({
    text: z.string().min(1).optional(),
    notes: z
      .union([
        z.object({ html: z.string() }),
        z.object({ markdown: z.string() }),
      ])
      .optional(),
    timeEstimate: z.number().int().min(0).optional(),
    dueDate: z.string().nullable().optional(),
    streamId: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// ============ Task Actions ============

export const snoozeTaskBody = z.object({
  date: dateString,
  timezone: z.string().optional(),
});

export const completeTaskBody = z
  .object({
    completedAt: isoDateTime,
  })
  .optional();

// ============ Type Exports ============

export type GetTasksByDayQuery = z.infer<typeof getTasksByDayQuery>;
export type GetArchivedTasksQuery = z.infer<typeof getArchivedTasksQuery>;
export type CreateTaskBody = z.infer<typeof createTaskBody>;
export type UpdateTaskBody = z.infer<typeof updateTaskBody>;
export type SnoozeTaskBody = z.infer<typeof snoozeTaskBody>;
export type CompleteTaskBody = z.infer<typeof completeTaskBody>;
