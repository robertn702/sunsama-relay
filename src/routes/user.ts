import { Hono } from "hono";
import { withClient } from "../client";

export const userRoutes = new Hono();

/**
 * GET /api/user
 * Get current user information
 */
userRoutes.get("/", async (c) => {
  try {
    const user = await withClient((client) => client.getUser());
    return c.json(user);
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

/**
 * GET /api/user/timezone
 * Get user's timezone
 */
userRoutes.get("/timezone", async (c) => {
  try {
    const timezone = await withClient((client) => client.getUserTimezone());
    return c.json({ timezone });
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
