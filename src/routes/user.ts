import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { withClient } from "../client";
import { UserSchema, TimezoneSchema, ErrorSchema } from "../schemas";

export const userRoutes = new OpenAPIHono();

// ============ Route Definitions ============

const getUserRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["User"],
  summary: "Get current user",
  description: "Get the authenticated user's profile",
  responses: {
    200: {
      description: "User profile",
      content: { "application/json": { schema: UserSchema } },
    },
    500: {
      description: "Server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const getUserTimezoneRoute = createRoute({
  method: "get",
  path: "/timezone",
  tags: ["User"],
  summary: "Get user timezone",
  description: "Get the authenticated user's timezone",
  responses: {
    200: {
      description: "User timezone",
      content: { "application/json": { schema: TimezoneSchema } },
    },
    500: {
      description: "Server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

// ============ Route Handlers ============

userRoutes.openapi(getUserRoute, async (c) => {
  try {
    const user = await withClient((client) => client.getUser());
    return c.json(user, 200);
  } catch (error) {
    console.error("Error fetching user:", error);
    return c.json(
      {
        error: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch user",
      },
      500
    );
  }
});

userRoutes.openapi(getUserTimezoneRoute, async (c) => {
  try {
    const timezone = await withClient((client) => client.getUserTimezone());
    return c.json({ timezone }, 200);
  } catch (error) {
    console.error("Error fetching timezone:", error);
    return c.json(
      {
        error: "FETCH_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to fetch timezone",
      },
      500
    );
  }
});
