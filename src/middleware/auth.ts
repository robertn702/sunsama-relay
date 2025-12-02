import type { Context, Next } from "hono";

/**
 * API key authentication middleware.
 * Validates the Authorization header against the API_KEY environment variable.
 *
 * Accepts:
 * - Authorization: Bearer <api-key>
 * - Authorization: <api-key>
 */
export async function apiKeyAuth(c: Context, next: Next) {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API_KEY environment variable is not set");
    return c.json(
      {
        error: "SERVER_MISCONFIGURED",
        message: "Server is not properly configured",
      },
      500
    );
  }

  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json(
      {
        error: "UNAUTHORIZED",
        message: "Missing Authorization header",
      },
      401
    );
  }

  // Support both "Bearer <token>" and raw "<token>" formats
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (token !== apiKey) {
    return c.json(
      {
        error: "UNAUTHORIZED",
        message: "Invalid API key",
      },
      401
    );
  }

  await next();
}
