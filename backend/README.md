# Slack Clone Backend — Phase 2

## Purpose

This is the standalone Express API for the Slack-like application. It provides configuration, database schema, cookie-based authentication, centralized error handling, and a health endpoint.

## Tech stack

- Node.js, Express, and TypeScript
- PostgreSQL with Prisma ORM
- dotenv and CORS
- bcryptjs, jsonwebtoken, cookie-parser, zod, and express-rate-limit
- ESLint and Prettier

## Structure

```
src/
  config/       Environment validation
  controllers/  HTTP request handlers
  lib/          Reusable Prisma client
  middleware/   Logging, 404, and centralized errors
  routes/       API route modules
  services/     Future domain services
  types/        Shared API types
  utils/        Reusable utilities
  app.ts        Express configuration
  server.ts     HTTP server lifecycle
prisma/         Database schema and migrations
```

## Environment

Copy `.env.example` to `.env`, then replace `DATABASE_URL` with a local PostgreSQL connection string. `.env` is ignored by Git.

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/slack_clone"
FRONTEND_URL="http://localhost:5173"
NODE_ENV=development
```

## PostgreSQL and Prisma

Create a PostgreSQL database named `slack_clone`, set its connection URL in `.env`, then run:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
```

For deployment environments, use `npm run prisma:deploy` after setting `DATABASE_URL`.

The initial schema includes User, Workspace, WorkspaceMember, Channel, ChannelMember, Message, Reaction, Thread, File, and Notification models. It is ready for later authentication, direct messages, threaded replies, and file handling without implementing those features now.

## Run the server

```bash
npm run dev
```

Build and run production output with:

```bash
npm run build
npm start
```

## Health check

`GET http://localhost:5000/api/health` responds with:

```json
{ "success": true, "message": "API is healthy" }
```

## Authentication API

Authentication uses short-lived access JWT and rotating refresh JWT cookies. Tokens are HTTP-only and never returned in the response body. Available endpoints are:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Local password-reset links are written to the backend terminal only in development. Before production deployment, replace this logger with an email provider.

## Not implemented yet

Workspace, channel, message, Socket.IO/WebSockets, Redis, Elasticsearch, uploads, search, real-time messaging, voice/video, and WebRTC features are intentionally not implemented yet.
