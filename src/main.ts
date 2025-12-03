import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { apiKeyAuth } from "./middleware/auth";
import { userRoutes } from "./routes/user";
import { taskRoutes } from "./routes/tasks";
import { streamRoutes } from "./routes/streams";
import { HealthResponseSchema } from "./schemas";

const app = new OpenAPIHono();

// Global middleware
app.use("*", logger());
app.use("*", cors());

// Health check (no auth required)
app.openapi(
  {
    method: "get",
    path: "/health",
    tags: ["System"],
    summary: "Health check",
    description: "Check if the server is running",
    responses: {
      200: {
        description: "Server is healthy",
        content: { "application/json": { schema: HealthResponseSchema } },
      },
    },
  },
  (c) => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() }, 200);
  }
);

// Protected API routes - mount with basePath for OpenAPI
const api = new OpenAPIHono().basePath("/api");
api.use("*", apiKeyAuth);
api.route("/user", userRoutes);
api.route("/tasks", taskRoutes);
api.route("/streams", streamRoutes);

// Mount API routes on main app
app.route("/", api);

// OpenAPI documentation endpoint
app.doc("/openapi.json", {
  openapi: "3.0.3",
  info: {
    title: "Sunsama Relay API",
    description:
      "Self-hosted REST API relay for Sunsama - connect your automation tools like N8N, Zapier, etc.",
    version: "0.1.0",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "System", description: "System endpoints" },
    { name: "User", description: "User profile operations" },
    { name: "Tasks", description: "Task CRUD operations" },
    { name: "Task Actions", description: "Task state changes (complete, schedule, etc.)" },
    { name: "Streams", description: "Stream/project operations" },
  ],
  security: [{ BearerAuth: [] }],
});

// Register security scheme
app.openAPIRegistry.registerComponent("securitySchemes", "BearerAuth", {
  type: "http",
  scheme: "bearer",
  description: "API key for authentication",
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "NOT_FOUND", message: "Endpoint not found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    {
      error: "INTERNAL_ERROR",
      message: err.message || "An unexpected error occurred",
    },
    500
  );
});

const port = parseInt(process.env.PORT || "3000", 10);

console.log(`Starting sunsama-relay on port ${port}...`);

export default {
  port,
  fetch: app.fetch,
};
