# Slack Clone Multi-Provider Production Deployment Guide 🚀

This document details the production deployment architecture, step-by-step setup instructions for **Vercel** (Frontend), **Render** (Backend), **Neon** (PostgreSQL), **Upstash** (Redis), **Cloudflare R2** (Object Storage), and **STUN/TURN** (WebRTC).

---

## 1. Production Architecture Diagram

```
                              INTERNET
                                 │
                                 ▼
                           ┌───────────┐
                           │  VERCEL   │
                           │ Frontend  │ (React 19 + Vite SPA)
                           └─────┬─────┘
                                 │
                         HTTPS & │ WSS
                                 ▼
                           ┌───────────┐
                           │  RENDER   │
                           │  Express  │ (Node.js API + Socket.IO)
                           └─────┬─────┘
                                 │
               ┌─────────────────┴─────────────────┐
               │                                   │
               ▼                                   ▼
         ┌───────────┐                       ┌───────────┐
         │   NEON    │                       │  UPSTASH  │
         │ PostgreSQL│ (Serverless SQL)      │   Redis   │ (TLS Cache/PubSub)
         └───────────┘                       └───────────┘
               │
               ▼
         ┌───────────┐
         │ CLOUDFLARE│
         │    R2     │ (Object Storage)
         └───────────┘
```

---

## 2. Environment Variable Reference Matrix

### Backend Production Environment (`Render`)

| Environment Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | Server mode | `production` |
| `PORT` | **Yes** | Web server port | Render sets automatically (e.g. `10000`) |
| `HOST` | **Yes** | Binding host address | `0.0.0.0` |
| `FRONTEND_URL` | **Yes** | Allowed CORS origin | `https://slack-clone.vercel.app` |
| `COOKIE_DOMAIN` | Optional | Custom cookie domain | `.yourdomain.com` |
| `DATABASE_URL` | **Yes** | Neon PostgreSQL URI | `postgresql://user:pass@ep-db.neon.tech/slack_clone?sslmode=require` |
| `REDIS_URL` | **Yes** | Upstash Redis TLS URI | `rediss://default:pass@cool-redis.upstash.io:6379` |
| `JWT_ACCESS_SECRET` | **Yes** | Min 32 char random secret | `prod_access_secret_89f2a019481bc...` |
| `JWT_REFRESH_SECRET` | **Yes** | Min 32 char random secret | `prod_refresh_secret_77d12a9901f...` |
| `ACCESS_TOKEN_EXPIRES_IN` | **Yes** | Token expiration duration | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | **Yes** | Refresh token duration | `7d` |
| `RESET_PASSWORD_TOKEN_EXPIRES_IN` | **Yes** | Reset password token expiry | `1h` |
| `R2_ACCOUNT_ID` | Optional | Cloudflare R2 Account ID | `a1b2c3d4e5f6...` |
| `R2_ACCESS_KEY_ID` | Optional | Cloudflare R2 Key ID | `r2_key_id_xyz...` |
| `R2_SECRET_ACCESS_KEY` | Optional | Cloudflare R2 Secret | `r2_secret_xyz...` |
| `R2_BUCKET_NAME` | Optional | R2 Bucket Name | `slack-clone-uploads` |
| `R2_PUBLIC_URL` | Optional | Public CDN URL | `https://pub-r2.dev` |
| `STUN_SERVERS` | **Yes** | WebRTC STUN URL | `stun:stun.l.google.com:19302` |
| `TURN_SERVER_URL` | Optional | WebRTC TURN Server URL | `turn:turn.yourdomain.com:3478?transport=udp` |
| `TURN_USERNAME` | Optional | TURN Auth Username | `turn_user` |
| `TURN_CREDENTIAL` | Optional | TURN Auth Credential | `turn_secret_credential` |

---

### Frontend Production Environment (`Vercel`)

> ⚠️ **EVERY `VITE_*` VARIABLE IS PUBLIC.** Never put database, Redis, JWT, or R2 secret keys in frontend environment variables.

| Environment Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | **Yes** | Render Express Backend API URL | `https://slack-backend.onrender.com` |
| `VITE_SOCKET_URL` | **Yes** | Render Socket.IO Server URL | `https://slack-backend.onrender.com` |

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Provision Neon PostgreSQL Database
1. Sign up / log into [Neon Console](https://console.neon.tech).
2. Click **Create Project** and name it `slack-clone`.
3. Copy the pooled connection string (`DATABASE_URL`) from the Neon dashboard.
   - Example: `postgresql://slack_owner:npg_12345@ep-cool-pool.us-east-2.aws.neon.tech/slack_clone?sslmode=require`

---

### Step 2: Provision Upstash Redis
1. Sign up / log into [Upstash Console](https://console.upstash.com).
2. Click **Create Database**, select region, and choose **Redis**.
3. Copy the TLS Redis URL (`REDIS_URL`).
   - Example: `rediss://default:abc12345@cool-redis.upstash.io:6379`

---

### Step 3: Configure Cloudflare R2 Object Storage (Optional/Recommended)
1. Sign up / log into [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Navigate to **R2** -> **Create Bucket** named `slack-clone-uploads`.
3. Create an API Token with `Admin Read & Write` permissions.
4. Copy `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`.

---

### Step 4: Deploy Backend to Render
1. Sign up / log into [Render Dashboard](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository containing `backend/`.
4. Configure service settings:
   - **Name**: `slack-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm run start`
   - **Health Check Path**: `/api/health`
5. Environment Variables:
   Add all keys listed in the *Backend Production Environment* table above.

---

### Step 5: Deploy Frontend to Vercel
1. Sign up / log into [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository containing `frontend/`.
4. Configure framework settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   - `VITE_API_URL`: `https://slack-backend.onrender.com`
   - `VITE_SOCKET_URL`: `https://slack-backend.onrender.com`
6. Click **Deploy**.

---

## 4. Database Migrations Rule
> ⚠️ **NEVER RUN `prisma migrate reset` OR `prisma db push` IN PRODUCTION.**

Run safe forward production migrations using:
```bash
npx prisma migrate deploy
```

---

## 5. WebRTC STUN/TURN Setup
WebRTC audio and video calls require TURN servers when users navigate across symmetric corporate NATs or cellular data networks.

For production, specify TURN credentials in Render environment:
```env
TURN_SERVER_URL=turn:turn.yourdomain.com:3478?transport=udp
TURN_USERNAME=your_username
TURN_CREDENTIAL=your_credential
```
The backend automatically returns these ICE servers to connected clients via `GET /api/huddles/ice-servers`.

---

## 6. Deployment Smoke Test Procedure

After deploying frontend and backend to production, run this 20-step verification test:

1. Open frontend Vercel URL (`https://slack-clone.vercel.app`).
2. Register a new user (`User A`).
3. Log in with `User A` and verify session cookies (`access_token`, `refresh_token`).
4. Create a new workspace (e.g. `Acme Corp`).
5. Create a new channel (e.g. `#announcements`).
6. Send a text message in `#announcements`.
7. Edit the message and add an emoji reaction.
8. Reply to the message in a thread.
9. Upload a file attachment (image or PDF).
10. Open an incognito browser window and sign up `User B`.
11. Invite `User B` to workspace via invitation link or Admin panel.
12. Accept invitation with `User B` and join `Acme Corp`.
13. Send a message as `User B` and verify real-time Socket.IO delivery to `User A`.
14. Verify online presence indicator (🟢 Online) updates in real time.
15. Start a Direct Message (DM) between `User A` and `User B`.
16. Initiate an Audio Huddle in channel `#announcements`.
17. Join huddle with `User B` and test microphone mute/unmute.
18. Enable camera and verify WebRTC video stream rendering.
19. Enable screen sharing and verify stream broadcast.
20. Log in as Workspace Owner, navigate to `/workspace/:id/admin`, inspect Security Audit Logs, and verify event entries.

---

## 7. Rollback Strategy

1. **Frontend (Vercel)**:
   - Navigate to Vercel Dashboard -> **Deployments**.
   - Select the previous successful deployment and click **Promote to Production**.
2. **Backend (Render)**:
   - Navigate to Render Dashboard -> **Deploys**.
   - Select previous commit build and click **Rollback**.
3. **Database (Neon)**:
   - If a deployment fails due to schema migration issues, use Neon's **Point-in-Time Restore (PITR)** branch feature to restore a snapshot prior to migration.
