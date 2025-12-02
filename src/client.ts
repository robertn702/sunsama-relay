import { SunsamaClient, SunsamaAuthError, SunsamaApiError } from "sunsama-api";

let client: SunsamaClient | null = null;
let isAuthenticated = false;

/**
 * Check if an error indicates an authentication/session problem
 */
function isAuthError(error: unknown): boolean {
  if (error instanceof SunsamaAuthError) {
    return true;
  }
  if (error instanceof SunsamaApiError && error.isAuthError()) {
    return true;
  }
  // Also check for common auth-related error messages
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("unauthorized") ||
      msg.includes("unauthenticated") ||
      msg.includes("session") ||
      msg.includes("login required")
    );
  }
  return false;
}

/**
 * Authenticate and get a fresh Sunsama client
 */
async function authenticate(): Promise<SunsamaClient> {
  const email = process.env.SUNSAMA_EMAIL;
  const password = process.env.SUNSAMA_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "SUNSAMA_EMAIL and SUNSAMA_PASSWORD environment variables are required"
    );
  }

  // Reset existing client if any
  if (client) {
    try {
      client.logout();
    } catch {
      // Ignore logout errors
    }
  }

  client = new SunsamaClient();
  await client.login(email, password);
  isAuthenticated = true;

  console.log(
    `[${new Date().toISOString()}] Sunsama client authenticated successfully`
  );

  return client;
}

/**
 * Get the authenticated Sunsama client singleton.
 * Lazily authenticates on first request.
 */
export async function getClient(): Promise<SunsamaClient> {
  if (client && isAuthenticated) {
    return client;
  }
  return authenticate();
}

/**
 * Reset the client state (forces re-authentication on next request)
 */
export function resetClient(): void {
  if (client) {
    try {
      client.logout();
    } catch {
      // Ignore logout errors
    }
  }
  client = null;
  isAuthenticated = false;
}

/**
 * Execute an operation with the Sunsama client.
 * Automatically retries once with fresh authentication if session expires.
 *
 * @param operation - Function that takes the client and returns a promise
 * @returns The result of the operation
 */
export async function withClient<T>(
  operation: (client: SunsamaClient) => Promise<T>
): Promise<T> {
  const currentClient = await getClient();

  try {
    return await operation(currentClient);
  } catch (error) {
    if (isAuthError(error)) {
      console.log(
        `[${new Date().toISOString()}] Auth error detected, re-authenticating...`
      );

      // Reset and get fresh client
      resetClient();
      const freshClient = await authenticate();

      // Retry the operation once with fresh auth
      return await operation(freshClient);
    }

    // Not an auth error, rethrow
    throw error;
  }
}
