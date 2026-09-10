# Slack Clone Application 🚀

A full-stack, enterprise-ready Slack clone built with **React**, **TypeScript**, **Tailwind CSS**, **Node.js/Express**, **Prisma**, **PostgreSQL**, **Redis**, **Socket.IO**, and **WebRTC**.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Socket.IO Client, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Redis, Socket.IO, WebRTC
- **Testing**: Vitest, Supertest, React Testing Library, Playwright (E2E)
- **Production & Security**: Docker, Docker Compose, Helmet, Express Rate Limit, Structured JSON Logger, Request ID middleware (`X-Request-ID`), Health Check Endpoints

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js (v20+)
- PostgreSQL (v16+)
- Redis (v7+)
- npm

### 2. Quick Setup

```bash
# Clone the repository
git clone <repository-url>
cd slack-clone

# Install Backend Dependencies
cd backend
npm install
cp .env.example .env

# Generate Prisma Client & Run Database Migrations
npx prisma generate
npx prisma migrate dev

# Start Backend Server
npm run dev
```

In a new terminal:
```bash
# Install Frontend Dependencies
cd frontend
npm install
cp .env.example .env

# Start Frontend Dev Server
npm run dev
```

The application will be running at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **Readiness Check**: http://localhost:5000/api/health/ready

---

## 🧪 Running Tests

### Backend Unit & Integration Tests
```bash
cd backend
npm test                # Run test suite
npm run test:unit       # Unit tests only
npm run test:integration # API integration tests
```

### Frontend Tests
```bash
cd frontend
npm test                # Component & Store tests
npm run test:e2e        # Playwright E2E tests
```

---

## 🐳 Docker Deployment

To spin up the entire application stack using Docker Compose:

```bash
docker compose up -d --build
```

Access the application at http://localhost.

---

## 📄 Documentation

For full production deployment guidelines, database migration rules, Nginx reverse proxy configuration, and backup strategies, refer to [DEPLOYMENT.md](./DEPLOYMENT.md).
