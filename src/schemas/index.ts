import { z } from "@hono/zod-openapi";

// ============ Common Schemas ============

export const ErrorSchema = z
  .object({
    error: z.string(),
    message: z.string(),
  })
  .openapi("Error");

// Date string in YYYY-MM-DD format
export const DateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .openapi({ example: "2025-12-03", description: "Date in YYYY-MM-DD format" });

// ============ Task Schemas ============

// Use a loose schema that accepts any task structure from Sunsama API
export const TaskSchema = z
  .object({
    _id: z.string(),
    text: z.string(),
  })
  .catchall(z.unknown())
  .openapi("Task");

export const TaskListSchema = z.array(TaskSchema).openapi("TaskList");

// ============ Stream Schemas ============

// Use a loose schema that accepts any stream structure from Sunsama API
export const StreamSchema = z
  .object({
    _id: z.string(),
    streamName: z.string(),
  })
  .catchall(z.unknown())
  .openapi("Stream");

export const StreamListSchema = z.array(StreamSchema).openapi("StreamList");

// ============ User Schemas ============

export const UserSchema = z
  .object({
    _id: z.string(),
  })
  .catchall(z.unknown())
  .openapi("User");

export const TimezoneSchema = z
  .object({
    timezone: z.string().openapi({ example: "America/Los_Angeles" }),
  })
  .openapi("Timezone");

// ============ Query Schemas ============

export const GetTasksByDayQuerySchema = z.object({
  date: DateString,
  timezone: z.string().optional().openapi({ example: "America/New_York" }),
});

export const GetArchivedTasksQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0).openapi({ example: 0 }),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50)
    .openapi({ example: 50 }),
});

// ============ Integration Schemas ============

export const GithubIntegrationIdentifierSchema = z.object({
  id: z.string().openapi({ description: "GitHub issue or PR ID" }),
  repositoryOwnerLogin: z
    .string()
    .openapi({ description: "GitHub repository owner login" }),
  repositoryName: z.string().openapi({ description: "GitHub repository name" }),
  number: z
    .number()
    .int()
    .openapi({ description: "GitHub issue or PR number" }),
  type: z
    .enum(["Issue", "PullRequest"])
    .openapi({ description: "Type of GitHub item" }),
  url: z
    .string()
    .url()
    .openapi({ description: "URL to the GitHub issue or PR" }),
});

export const GithubIntegrationSchema = z
  .object({
    service: z.literal("github"),
    identifier: GithubIntegrationIdentifierSchema,
  })
  .openapi("GithubIntegration");

export const GmailIntegrationIdentifierSchema = z.object({
  id: z.string().openapi({ description: "Gmail message ID" }),
  messageId: z.string().openapi({ description: "Gmail message ID" }),
  accountId: z.string().openapi({ description: "Gmail account ID" }),
  url: z.string().url().openapi({ description: "URL to the Gmail message" }),
});

export const GmailIntegrationSchema = z
  .object({
    service: z.literal("gmail"),
    identifier: GmailIntegrationIdentifierSchema,
  })
  .openapi("GmailIntegration");

export const TaskIntegrationSchema = z
  .discriminatedUnion("service", [
    GithubIntegrationSchema,
    GmailIntegrationSchema,
  ])
  .openapi("TaskIntegration");

// ============ Request Body Schemas ============

export const CreateTaskBodySchema = z
  .object({
    text: z
      .string()
      .min(1)
      .openapi({ description: "Task title", example: "Review pull requests" }),
    notes: z.string().optional().openapi({ description: "Task description" }),
    timeEstimate: z
      .number()
      .int()
      .min(0)
      .optional()
      .openapi({ description: "Estimated time in minutes", example: 30 }),
    streamIds: z
      .array(z.string())
      .optional()
      .openapi({ description: "Stream/project IDs" }),
    dueDate: z
      .string()
      .optional()
      .openapi({ description: "Due date (ISO 8601)" }),
    snoozeUntil: z
      .string()
      .optional()
      .openapi({ description: "Schedule date (ISO 8601)" }),
    private: z
      .boolean()
      .optional()
      .openapi({ description: "Private task flag" }),
    integration: TaskIntegrationSchema.optional().openapi({
      description: "External service integration (GitHub, Gmail)",
    }),
  })
  .openapi("CreateTaskRequest");

export const UpdateTaskBodySchema = z
  .object({
    text: z.string().min(1).optional().openapi({ description: "Task title" }),
    notes: z
      .union([
        z.object({ html: z.string() }),
        z.object({ markdown: z.string() }),
      ])
      .optional()
      .openapi({ description: "Task notes - provide either html or markdown" }),
    timeEstimate: z
      .number()
      .int()
      .min(0)
      .optional()
      .openapi({ description: "Estimated time in minutes" }),
    dueDate: z
      .string()
      .nullable()
      .optional()
      .openapi({ description: "Due date (null to clear)" }),
    streamId: z
      .string()
      .optional()
      .openapi({ description: "Stream/project ID" }),
  })
  .openapi("UpdateTaskRequest");

export const SnoozeTaskBodySchema = z
  .object({
    date: DateString,
    timezone: z.string().optional().openapi({ example: "America/New_York" }),
  })
  .openapi("SnoozeTaskRequest");

export const CompleteTaskBodySchema = z
  .object({
    completedAt: z
      .string()
      .datetime({ offset: true })
      .optional()
      .openapi({ description: "Completion timestamp" }),
  })
  .openapi("CompleteTaskRequest");

// ============ Response Schemas ============

export const HealthResponseSchema = z
  .object({
    status: z.string().openapi({ example: "ok" }),
    timestamp: z.string().openapi({ example: "2025-12-03T12:00:00.000Z" }),
  })
  .openapi("HealthResponse");

export const ArchivedTasksResponseSchema = z
  .object({
    tasks: TaskListSchema,
    pagination: z.object({
      offset: z.number(),
      limit: z.number(),
      count: z.number(),
      hasMore: z.boolean(),
    }),
  })
  .openapi("ArchivedTasksResponse");

export const TaskActionResponseSchema = z
  .object({
    message: z.string(),
    taskId: z.string(),
  })
  .catchall(z.unknown())
  .openapi("TaskActionResponse");

export const UpdateTaskResponseSchema = z
  .object({
    message: z.string(),
    taskId: z.string(),
    updatedFields: z.array(z.string()),
  })
  .openapi("UpdateTaskResponse");

export const CreateTaskResponseSchema = z
  .object({})
  .catchall(z.unknown())
  .openapi("CreateTaskResponse");

// ============ Path Parameter Schemas ============

export const TaskIdParamSchema = z.object({
  id: z
    .string()
    .openapi({ description: "Task ID", example: "69303d8792cb70e36cb4bf08" }),
});

// ============ Type Exports ============

export type GetTasksByDayQuery = z.infer<typeof GetTasksByDayQuerySchema>;
export type GetArchivedTasksQuery = z.infer<typeof GetArchivedTasksQuerySchema>;
export type CreateTaskBody = z.infer<typeof CreateTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof UpdateTaskBodySchema>;
export type SnoozeTaskBody = z.infer<typeof SnoozeTaskBodySchema>;
export type CompleteTaskBody = z.infer<typeof CompleteTaskBodySchema>;
