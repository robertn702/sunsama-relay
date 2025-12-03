import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { withClient } from "../client";
import { StreamListSchema, ErrorSchema } from "../schemas";

export const streamRoutes = new OpenAPIHono();

// ============ Route Definitions ============

const getStreamsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Streams"],
  summary: "Get streams",
  description: "Get all streams (projects/categories)",
  responses: {
    200: {
      description: "List of streams",
      content: { "application/json": { schema: StreamListSchema } },
    },
    500: {
      description: "Server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

// ============ Route Handlers ============

streamRoutes.openapi(getStreamsRoute, async (c) => {
  try {
    const streams = await withClient((client) => client.getStreamsByGroupId());
    return c.json(streams, 200);
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
