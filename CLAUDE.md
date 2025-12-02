# Sunsama Relay - Project Context

## Overview

Sunsama Relay is a self-hosted REST API server that wraps the `sunsama-api` package. It enables single-user automation workflows via tools like N8N, Zapier, or custom scripts.

## Architecture

```
┌──────────┐     API Key      ┌─────────────────┐    Env Credentials    ┌─────────┐
│   N8N    │ ────────────────▶│  sunsama-relay  │ ────────────────────▶ │ Sunsama │
└──────────┘   Bearer Token   └─────────────────┘    (auto-login)       └─────────┘
```

- **Single-user**: One set of Sunsama credentials per deployment
- **API key auth**: Protects the relay with a bearer token
- **Lazy auth**: Authenticates to Sunsama on first request, caches the client
- **Auto re-auth**: Automatically re-authenticates if session expires (via `withClient` wrapper)

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Validation**: Zod
- **API Client**: sunsama-api

## Project Structure

```
src/
├── main.ts              # Server entry, middleware setup
├── client.ts            # SunsamaClient singleton management
├── middleware/
│   └── auth.ts          # API key validation
├── routes/
│   ├── user.ts          # GET /api/user, GET /api/user/timezone
│   ├── tasks.ts         # Full task CRUD + actions
│   └── streams.ts       # GET /api/streams
└── schemas/
    └── index.ts         # Zod schemas for request validation
```

## API Design

### Property Updates vs Actions

- **PATCH /api/tasks/:id** - Update task properties (text, notes, timeEstimate, dueDate, streamId)
- **POST /api/tasks/:id/complete** - Action: mark complete
- **POST /api/tasks/:id/snooze** - Action: schedule to date
- **POST /api/tasks/:id/backlog** - Action: move to backlog

This separation reflects the difference between changing task *data* vs changing task *state*.

## Development Commands

```bash
bun install          # Install dependencies
bun run dev          # Run with .env file
bun run start        # Run without .env loading
bun run typecheck    # TypeScript checking
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| SUNSAMA_EMAIL | Yes | Sunsama account email |
| SUNSAMA_PASSWORD | Yes | Sunsama account password |
| API_KEY | Yes | Bearer token for authenticating requests |
| PORT | No | Server port (default: 3000) |

## Planned Enhancements

### Phase 2: Integration Support

Add GitHub/Gmail integration support to POST /api/tasks:

```json
{
  "text": "Fix bug",
  "integration": {
    "service": "github",
    "identifier": {
      "id": "I_kwDO...",
      "repositoryOwnerLogin": "owner",
      "repositoryName": "repo",
      "number": 123,
      "type": "Issue",
      "url": "https://github.com/owner/repo/issues/123"
    }
  }
}
```

## Git Rules

- Never commit `.env` files
- Never commit the `dev/` directory
- Branch naming: `{type}/{short-name}` (e.g., `feat/github-integration`)
