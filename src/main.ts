import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { apiKeyAuth } from "./middleware/auth";
import { userRoutes } from "./routes/user";
import { taskRoutes } from "./routes/tasks";
import { streamRoutes } from "./routes/streams";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", cors());

// Health check (no auth required)
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Protected API routes
const api = new Hono();
api.use("*", apiKeyAuth);
api.route("/user", userRoutes);
api.route("/tasks", taskRoutes);
api.route("/streams", streamRoutes);

app.route("/api", api);

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
