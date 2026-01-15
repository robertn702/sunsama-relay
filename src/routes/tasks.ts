import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { withClient } from "../client";
import {
  TaskListSchema,
  TaskSchema,
  ErrorSchema,
  GetTasksByDayQuerySchema,
  GetArchivedTasksQuerySchema,
  CreateTaskBodySchema,
  UpdateTaskBodySchema,
  SnoozeTaskBodySchema,
  CompleteTaskBodySchema,
  TaskIdParamSchema,
  ArchivedTasksResponseSchema,
  TaskActionResponseSchema,
  UpdateTaskResponseSchema,
  CreateTaskResponseSchema,
} from "../schemas";

export const taskRoutes = new OpenAPIHono();

// ============ Route Definitions ============

const getTasksByDayRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Tasks"],
  summary: "Get tasks by day",
  description: "Get all tasks scheduled for a specific day",
  request: {
    query: GetTasksByDayQuerySchema,
  },
  responses: {
    200: {
      description: "List of tasks",
      content: { "application/json": { schema: TaskListSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorSchema } },
    },
    500: {
      description: "Server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const getBacklogRoute = createRoute({
  method: "get",
  path: "/backlog",
  tags: ["Tasks"],
  summary: "Get backlog tasks",
  description: "Get all tasks in the backlog (unscheduled)",
  responses: {
    200: {
      description: "List of backlog tasks",
      content: { "application/json": { schema: TaskListSchema } },
    },
    500: {
      description: "Server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const getArchivedRoute = createRoute({
  method: "get",
  path: "/archived",
  tags: ["Tasks"],
  summary: "Get archived tasks",
  description: "Get archived/completed tasks with pagination",
  request: {
    query: GetArchivedTasksQuerySchema,
  },
  responses: {
    200: {
      description: "Paginated list of archived tasks",
      content: { "application/json": { schema: ArchivedTasksResponseSchema } },
    },
    500: {
      description: "Server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const getTaskByIdRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Tasks"],
  summary: "Get task by ID",
  description: "Get a specific task by its ID",
  request: {
    params: TaskIdParamSchema,
  },
  responses: {
    200: {
      description: "Task details",
      content: { "application/json": { schema: TaskSchema } },
    },
    404: {
      description: "Task not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
    500: {
      description: "Server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const createTaskRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Tasks"],
  summary: "Create task",
  description: "Create a new task",
  request: {
    body: {
      content: { "application/json": { schema: CreateTaskBodySchema } },
    },
  },
  responses: {
    201: {
      description: "Task created successfully",
      content: { "application/json": { schema: CreateTaskResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorSchema } },
    },
    500: {
      description: "Server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const updateTaskRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Tasks"],
  summary: "Update task properties",
  description: "Update task text, notes, time estimate, due date, or stream",
  request: {
    params: TaskIdParamSchema,
    body: {
      content: { "application/json": { schema: UpdateTaskBodySchema } },
    },
  },
  responses: {
    200: {
      description: "Task updated successfully",
      content: { "application/json": { schema: UpdateTaskResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorSchema } },
    },
    500: {
      description: "Server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const deleteTaskRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Tasks"],
  summary: "Delete task",
  description: "Delete a task",
  request: {
    params: TaskIdParamSchema,
  },
  responses: {
    200: {
      description: "Task deleted successfully",
      content: { "application/json": { schema: TaskActionResponseSchema } },
    },
    500: {
      description: "Server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const completeTaskRoute = createRoute({
  method: "post",
  path: "/{id}/complete",
  tags: ["Task Actions"],
  summary: "Mark task complete",
  description: "Mark a task as completed",
  request: {
    params: TaskIdParamSchema,
    body: {
      content: { "application/json": { schema: CompleteTaskBodySchema } },
      required: false,
    },
  },
  responses: {
    200: {
      description: "Task marked as complete",
      content: { "application/json": { schema: TaskActionResponseSchema } },
    },
    500: {
      description: "Server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const snoozeTaskRoute = createRoute({
  method: "post",
  path: "/{id}/snooze",
  tags: ["Task Actions"],
  summary: "Schedule task",
  description: "Schedule or reschedule a task to a specific date",
  request: {
    params: TaskIdParamSchema,
    body: {
      content: { "application/json": { schema: SnoozeTaskBodySchema } },
    },
  },
  responses: {
    200: {
      description: "Task scheduled successfully",
      content: { "application/json": { schema: TaskActionResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorSchema } },
    },
    500: {
      description: "Server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const backlogTaskRoute = createRoute({
  method: "post",
  path: "/{id}/backlog",
  tags: ["Task Actions"],
  summary: "Move task to backlog",
  description: "Unschedule a task and move it to the backlog",
  request: {
    params: TaskIdParamSchema,
  },
  responses: {
    200: {
      description: "Task moved to backlog",
      content: { "application/json": { schema: TaskActionResponseSchema } },
    },
    500: {
      description: "Server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

// ============ Route Handlers ============

taskRoutes.openapi(getTasksByDayRoute, async (c) => {
  try {
    const { date, timezone } = c.req.valid("query");
    const tasks = await withClient((client) =>
      client.getTasksByDay(date, timezone),
    );
    return c.json(tasks, 200);
  } catch (error) {
    console.error("Error fetching tasks by day:", error);
    return c.json(
      {
        error: "FETCH_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to fetch tasks",
      },
      500,
    );
  }
});

taskRoutes.openapi(getBacklogRoute, async (c) => {
  try {
    const tasks = await withClient((client) => client.getTasksBacklog());
    return c.json(tasks, 200);
  } catch (error) {
    console.error("Error fetching backlog:", error);
    return c.json(
      {
        error: "FETCH_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to fetch backlog",
      },
      500,
    );
  }
});

taskRoutes.openapi(getArchivedRoute, async (c) => {
  try {
    const { offset, limit } = c.req.valid("query");
    const tasks = await withClient((client) =>
      client.getArchivedTasks(offset, limit),
    );
    return c.json(
      {
        tasks,
        pagination: {
          offset,
          limit,
          count: tasks.length,
          hasMore: tasks.length === limit,
        },
      },
      200,
    );
  } catch (error) {
    console.error("Error fetching archived tasks:", error);
    return c.json(
      {
        error: "FETCH_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch archived tasks",
      },
      500,
    );
  }
});

taskRoutes.openapi(getTaskByIdRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const task = await withClient((client) => client.getTaskById(id));

    if (!task) {
      return c.json(
        {
          error: "NOT_FOUND",
          message: `Task with ID ${id} not found`,
        },
        404,
      );
    }

    return c.json(task, 200);
  } catch (error) {
    console.error("Error fetching task:", error);
    return c.json(
      {
        error: "FETCH_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to fetch task",
      },
      500,
    );
  }
});

taskRoutes.openapi(createTaskRoute, async (c) => {
  try {
    const { text, snoozeUntil, dueDate, ...options } = c.req.valid("json");

    // Convert date strings to Date objects for sunsama-api
    const taskOptions = {
      ...options,
      ...(snoozeUntil && { snoozeUntil: new Date(snoozeUntil) }),
      ...(dueDate && { dueDate: new Date(dueDate) }),
    };

    const task = await withClient((client) =>
      client.createTask(text, taskOptions),
    );
    return c.json(task, 201);
  } catch (error) {
    console.error("Error creating task:", error);
    return c.json(
      {
        error: "CREATE_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to create task",
      },
      500,
    );
  }
});

taskRoutes.openapi(updateTaskRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const updates = c.req.valid("json");
    const { text, notes, timeEstimate, dueDate, streamId } = updates;

    if (text !== undefined) {
      await withClient((client) => client.updateTaskText(id, text));
    }

    if (notes !== undefined) {
      await withClient((client) => client.updateTaskNotes(id, notes));
    }

    if (timeEstimate !== undefined) {
      await withClient((client) =>
        client.updateTaskPlannedTime(id, timeEstimate),
      );
    }

    if (dueDate !== undefined) {
      const dueDateValue = dueDate === null ? null : new Date(dueDate);
      await withClient((client) => client.updateTaskDueDate(id, dueDateValue));
    }

    if (streamId !== undefined) {
      await withClient((client) => client.updateTaskStream(id, streamId));
    }

    return c.json(
      {
        message: "Task updated successfully",
        taskId: id,
        updatedFields: Object.keys(updates),
      },
      200,
    );
  } catch (error) {
    console.error("Error updating task:", error);
    return c.json(
      {
        error: "UPDATE_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to update task",
      },
      500,
    );
  }
});

taskRoutes.openapi(deleteTaskRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const result = await withClient((client) => client.deleteTask(id));

    return c.json(
      {
        message: "Task deleted successfully",
        taskId: id,
        result,
      },
      200,
    );
  } catch (error) {
    console.error("Error deleting task:", error);
    return c.json(
      {
        error: "DELETE_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to delete task",
      },
      500,
    );
  }
});

taskRoutes.openapi(completeTaskRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    let completedAt = new Date();

    try {
      const body = c.req.valid("json");
      if (body?.completedAt) {
        completedAt = new Date(body.completedAt);
      }
    } catch {
      // Body is optional, use default completedAt
    }

    const result = await withClient((client) =>
      client.updateTaskComplete(id, completedAt),
    );

    return c.json(
      {
        message: "Task marked as complete",
        taskId: id,
        completedAt: completedAt.toISOString(),
        result,
      },
      200,
    );
  } catch (error) {
    console.error("Error completing task:", error);
    return c.json(
      {
        error: "UPDATE_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to complete task",
      },
      500,
    );
  }
});

taskRoutes.openapi(snoozeTaskRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const { date, timezone } = c.req.valid("json");

    const options = timezone ? { timezone } : undefined;
    const result = await withClient((client) =>
      client.updateTaskSnoozeDate(id, date, options),
    );

    return c.json(
      {
        message: "Task scheduled successfully",
        taskId: id,
        scheduledDate: date,
        result,
      },
      200,
    );
  } catch (error) {
    console.error("Error snoozing task:", error);
    return c.json(
      {
        error: "UPDATE_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to snooze task",
      },
      500,
    );
  }
});

taskRoutes.openapi(backlogTaskRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const result = await withClient((client) =>
      client.updateTaskSnoozeDate(id, null),
    );

    return c.json(
      {
        message: "Task moved to backlog",
        taskId: id,
        result,
      },
      200,
    );
  } catch (error) {
    console.error("Error moving task to backlog:", error);
    return c.json(
      {
        error: "UPDATE_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to move task to backlog",
      },
      500,
    );
  }
});
