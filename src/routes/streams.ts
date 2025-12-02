import { Hono } from "hono";
import { withClient } from "../client";

export const streamRoutes = new Hono();

/**
 * GET /api/streams
 * Get all streams (projects/categories)
 */
streamRoutes.get("/", async (c) => {
  try {
    const streams = await withClient((client) => client.getStreamsByGroupId());
    return c.json(streams);
  } catch (error) {
    console.error("Error fetching streams:", error);
    return c.json(
      {
        error: "FETCH_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to fetch streams",
      },
      500
    );
  }
});
