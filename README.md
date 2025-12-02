# Sunsama Relay

A self-hosted REST API relay for Sunsama. Connect your automation tools (N8N, Zapier, etc.) to your Sunsama account.

> **Note**: This is a single-user, self-hosted server. You host it with your own Sunsama credentials and protect it with an API key.

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/robertn702/sunsama-relay.git
cd sunsama-relay
bun install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
SUNSAMA_EMAIL=your-email@example.com
SUNSAMA_PASSWORD=your-sunsama-password
API_KEY=your-random-api-key    # Generate with: openssl rand -hex 32
PORT=3000
```

### 3. Run

```bash
# Development
bun run dev

# Production
bun run start
```

### 4. Test

```bash
curl http://localhost:3000/health

curl -H "Authorization: Bearer your-api-key" \
  http://localhost:3000/api/user
```

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Create .env file with your credentials
cp .env.example .env
# Edit .env...

# Start the server
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Using Docker Directly

```bash
docker build -t sunsama-relay .

docker run -d \
  -p 3000:3000 \
  -e SUNSAMA_EMAIL=your-email@example.com \
  -e SUNSAMA_PASSWORD=your-password \
  -e API_KEY=your-api-key \
  --name sunsama-relay \
  sunsama-relay
```

## API Reference

All endpoints except `/health` require authentication via the `Authorization` header:

```
Authorization: Bearer your-api-key
```

### Health Check

```
GET /health
```

Returns server status (no auth required).

---

### User

#### Get Current User

```
GET /api/user
```

#### Get User Timezone

```
GET /api/user/timezone
```

---

### Tasks

#### Get Tasks by Day

```
GET /api/tasks?date=2025-01-20&timezone=America/New_York
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `date` | Yes | Date in YYYY-MM-DD format |
| `timezone` | No | IANA timezone (defaults to user's timezone) |

#### Get Backlog Tasks

```
GET /api/tasks/backlog
```

#### Get Archived Tasks

```
GET /api/tasks/archived?offset=0&limit=50
```

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `offset` | No | 0 | Pagination offset |
| `limit` | No | 50 | Max 100 |

#### Get Task by ID

```
GET /api/tasks/:id
```

#### Create Task

```
POST /api/tasks
Content-Type: application/json

{
  "text": "Task title",
  "notes": "Optional notes",
  "timeEstimate": 30,
  "streamIds": ["stream-id"],
  "dueDate": "2025-01-25",
  "snoozeUntil": "2025-01-20",
  "private": false
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `text` | Yes | Task title |
| `notes` | No | Task description |
| `timeEstimate` | No | Estimated minutes |
| `streamIds` | No | Array of stream IDs |
| `dueDate` | No | Due date |
| `snoozeUntil` | No | Scheduled date |
| `private` | No | Private task flag |

#### Update Task Properties

```
PATCH /api/tasks/:id
Content-Type: application/json

{
  "text": "Updated title",
  "notes": { "markdown": "Updated **notes**" },
  "timeEstimate": 45,
  "dueDate": "2025-01-25",
  "streamId": "stream-id"
}
```

All fields are optional. Only include the fields you want to update.

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | Task title |
| `notes` | object | `{ "html": "..." }` or `{ "markdown": "..." }` |
| `timeEstimate` | number | Estimated minutes |
| `dueDate` | string \| null | Due date (null to clear) |
| `streamId` | string | Stream/project ID |

#### Mark Task Complete

```
POST /api/tasks/:id/complete
Content-Type: application/json

{
  "completedAt": "2025-01-20T10:30:00Z"  // Optional
}
```

#### Schedule Task (Snooze)

```
POST /api/tasks/:id/snooze
Content-Type: application/json

{
  "date": "2025-01-25",
  "timezone": "America/New_York"  // Optional
}
```

#### Move Task to Backlog

```
POST /api/tasks/:id/backlog
```

#### Delete Task

```
DELETE /api/tasks/:id
```

---

### Streams

#### Get All Streams

```
GET /api/streams
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | VALIDATION_ERROR | Invalid request parameters |
| 401 | UNAUTHORIZED | Missing or invalid API key |
| 404 | NOT_FOUND | Resource not found |
| 500 | INTERNAL_ERROR | Server error |

## N8N Integration

1. In N8N, create an HTTP Request node
2. Set the base URL to your relay server (e.g., `http://localhost:3000`)
3. Add a header: `Authorization: Bearer your-api-key`
4. Configure the endpoint and method as needed

Example: Get today's tasks

```
Method: GET
URL: http://localhost:3000/api/tasks?date={{$now.format('yyyy-MM-dd')}}
Headers:
  Authorization: Bearer your-api-key
```

## Session Management

The relay automatically handles Sunsama session management:

- **Lazy authentication**: Authenticates to Sunsama on the first API request
- **Session caching**: Reuses the authenticated session for subsequent requests
- **Auto re-authentication**: If a session expires, the relay automatically re-authenticates and retries the request

You don't need to manage sessions or handle token refresh - just keep the server running.

## Security Considerations

- **Never expose this server to the public internet without additional protection**
- Use a reverse proxy (nginx, Caddy) with HTTPS
- Consider IP allowlisting
- Rotate your API key periodically
- The API key is transmitted in headers - always use HTTPS in production

## License

MIT
