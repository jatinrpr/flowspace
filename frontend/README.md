# Slack Clone Frontend — Phase 1

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). To create a production build, run `npm run build`. Use `npm run lint` and `npm run format:check` for quality checks.

## Project structure

```
src/
  components/     Reusable UI, sidebar, channel, and messaging components
  pages/          Route-level pages
  layouts/        Page layouts
  hooks/          Shared React hooks (reserved for future use)
  store/          Zustand state stores
  services/       External-service clients, including Socket.IO preparation
  types/          Shared TypeScript models
  utils/          General utility functions (reserved for future use)
  assets/         Static frontend assets
```

## Phase 1 functionality

- React, TypeScript, Vite, Tailwind CSS, React Router, Zustand, and Socket.IO Client setup
- Routes for `/`, `/login`, `/signup`, and `/workspace`
- `/` redirects to `/login`
- Responsive Slack-style workspace shell with a sidebar, channel header, empty state, and message composer
- Typed placeholder domain models and an initial Zustand workspace store
- Socket.IO factory configured from `VITE_API_URL`, with automatic connection disabled
- Cookie-based authentication forms and protected workspace routes

Copy `.env.example` to `.env.local` to configure the future API URL.

## Planned phases

1. Authentication and workspace membership
2. Backend APIs, real-time messaging, and persisted channels
3. File sharing, search, and richer messaging
4. Calls, notifications, and production hardening
