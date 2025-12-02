import { Hono } from "hono";
import { withClient } from "../client";
import {
  getTasksByDayQuery,
  getArchivedTasksQuery,
  createTaskBody,
  updateTaskBody,
  snoozeTaskBody,
  completeTaskBody,
} from "../schemas";

export const taskRoutes = new Hono();

// ============ Read Operations ============

/**
 * GET /api/tasks?date=YYYY-MM-DD&timezone=America/New_York
 * Get tasks for a specific day
 */
taskRoutes.get("/", async (c) => {
  try {
    const query = getTasksByDayQuery.safeParse({
      date: c.req.query("date"),
      timezone: c.req.query("timezone"),
    });

    if (!query.success) {
      return c.json(
        {
          error: "VALIDATION_ERROR",
          message: query.error.errors[0]?.message || "Invalid query parameters",
        },
        400
      );
    }

    const tasks = await withClient((client) =>
      client.getTasksByDay(query.data.date, query.data.timezone)
    );
    return c.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks by day:", error);
    return c.json(
      {
        error: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch tasks",
      },
      500
    );
  }
});

/**
 * GET /api/tasks/backlog
 * Get backlog tasks
 */
taskRoutes.get("/backlog", async (c) => {
  try {
    const tasks = await withClient((client) => client.getTasksBacklog());
    return c.json(tasks);
  } catch (error) {
    console.error("Error fetching backlog:", error);
    return c.json(
      {
        error: "FETCH_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to fetch backlog",
      },
      500
    );
  }
});

/**
 * GET /api/tasks/archived?offset=0&limit=50
 * Get archived tasks with pagination
 */
taskRoutes.get("/archived", async (c) => {
  try {
    const query = getArchivedTasksQuery.safeParse({
      offset: c.req.query("offset"),
      limit: c.req.query("limit"),
    });

    if (!query.success) {
      return c.json(
        {
          error: "VALIDATION_ERROR",
          message: query.error.errors[0]?.message || "Invalid query parameters",
        },
        400
      );
    }

    const tasks = await withClient((client) =>
      client.getArchivedTasks(query.data.offset, query.data.limit)
    );
    return c.json({
      tasks,
      pagination: {
        offset: query.data.offset,
        limit: query.data.limit,
        count: tasks.length,
        hasMore: tasks.length === query.data.limit,
      },
    });
  } catch (error) {
    console.error("Error fetching archived tasks:", error);
    return c.json(
      {
        error: "FETCH_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to fetch archived tasks",
      },
      500
    );
  }
});

/**
 * GET /api/tasks/:id
 * Get a specific task by ID
 */
taskRoutes.get("/:id", async (c) => {
  try {
    const taskId = c.req.param("id");
    const task = await withClient((client) => client.getTaskById(taskId));

    if (!task) {
      return c.json(
        {
          error: "NOT_FOUND",
          message: `Task with ID ${taskId} not found`,
        },
        404
      );
    }

    return c.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return c.json(
      {
        error: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch task",
      },
      500
    );
  }
});

// ============ Create Operations ============

/**
 * POST /api/tasks
 * Create a new task
 */
taskRoutes.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = createTaskBody.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error: "VALIDATION_ERROR",
          message: parsed.error.errors[0]?.message || "Invalid request body",
        },
        400
      );
    }

    const { text, ...options } = parsed.data;
    const task = await withClient((client) => client.createTask(text, options));

    return c.json(task, 201);
  } catch (error) {
    console.error("Error creating task:", error);
    return c.json(
      {
        error: "CREATE_ERROR",
        message: error instanceof Error ? error.message : "Failed to create task",
      },
      500
    );
  }
});

// ============ Update Operations (Properties) ============

/**
 * PATCH /api/tasks/:id
 * Update task properties (text, notes, timeEstimate, dueDate, streamId)
 */
taskRoutes.patch("/:id", async (c) => {
  try {
    const taskId = c.req.param("id");
    const body = await c.req.json();
    const parsed = updateTaskBody.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error: "VALIDATION_ERROR",
          message: parsed.error.errors[0]?.message || "Invalid request body",
        },
        400
      );
    }

    const updates = parsed.data;

    // Apply each update using withClient for each operation
    // This ensures auth retry works for each individual call
    if (updates.text !== undefined) {
      await withClient((client) => client.updateTaskText(taskId, updates.text!));
    }

    if (updates.notes !== undefined) {
      await withClient((client) => client.updateTaskNotes(taskId, updates.notes!));
    }

    if (updates.timeEstimate !== undefined) {
      await withClient((client) =>
        client.updateTaskPlannedTime(taskId, updates.timeEstimate!)
      );
    }

    if (updates.dueDate !== undefined) {
      const dueDate = updates.dueDate === null ? null : new Date(updates.dueDate);
      await withClient((client) => client.updateTaskDueDate(taskId, dueDate));
    }

    if (updates.streamId !== undefined) {
      await withClient((client) =>
        client.updateTaskStream(taskId, updates.streamId!)
      );
    }

    return c.json({
      message: "Task updated successfully",
      taskId,
      updatedFields: Object.keys(updates),
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return c.json(
      {
        error: "UPDATE_ERROR",
        message: error instanceof Error ? error.message : "Failed to update task",
      },
      500
    );
  }
});

// ============ Action Operations ============

/**
 * POST /api/tasks/:id/complete
 * Mark a task as complete
 */
taskRoutes.post("/:id/complete", async (c) => {
  try {
    const taskId = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const parsed = completeTaskBody.safeParse(body);

    const completedAt =
      parsed.success && parsed.data?.completedAt
        ? new Date(parsed.data.completedAt)
        : new Date();

    const result = await withClient((client) =>
      client.updateTaskComplete(taskId, completedAt)
    );

    return c.json({
      message: "Task marked as complete",
      taskId,
      completedAt: completedAt.toISOString(),
      result,
    });
  } catch (error) {
    console.error("Error completing task:", error);
    return c.json(
      {
        error: "UPDATE_ERROR",
        message: error instanceof Error ? error.message : "Failed to complete task",
      },
      500
    );
  }
});

/**
 * POST /api/tasks/:id/snooze
 * Schedule/reschedule a task to a specific date
 */
taskRoutes.post("/:id/snooze", async (c) => {
  try {
    const taskId = c.req.param("id");
    const body = await c.req.json();
    const parsed = snoozeTaskBody.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error: "VALIDATION_ERROR",
          message: parsed.error.errors[0]?.message || "Invalid request body",
        },
        400
      );
    }

    const options = parsed.data.timezone
      ? { timezone: parsed.data.timezone }
      : undefined;
    const result = await withClient((client) =>
      client.updateTaskSnoozeDate(taskId, parsed.data.date, options)
    );

    return c.json({
      message: "Task scheduled successfully",
      taskId,
      scheduledDate: parsed.data.date,
      result,
    });
  } catch (error) {
    console.error("Error snoozing task:", error);
    return c.json(
      {
        error: "UPDATE_ERROR",
        message: error instanceof Error ? error.message : "Failed to snooze task",
      },
      500
    );
  }
});

/**
 * POST /api/tasks/:id/backlog
 * Move a task to the backlog (unschedule)
 */
taskRoutes.post("/:id/backlog", async (c) => {
  try {
    const taskId = c.req.param("id");
    const result = await withClient((client) =>
      client.updateTaskSnoozeDate(taskId, null)
    );

    return c.json({
      message: "Task moved to backlog",
      taskId,
      result,
    });
  } catch (error) {
    console.error("Error moving task to backlog:", error);
    return c.json(
      {
        error: "UPDATE_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to move task to backlog",
      },
      500
    );
  }
});

// ============ Delete Operations ============

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
taskRoutes.delete("/:id", async (c) => {
  try {
    const taskId = c.req.param("id");
    const result = await withClient((client) => client.deleteTask(taskId));

    return c.json({
      message: "Task deleted successfully",
      taskId,
      result,
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return c.json(
      {
        error: "DELETE_ERROR",
        message: error instanceof Error ? error.message : "Failed to delete task",
      },
      500
    );
  }
});
