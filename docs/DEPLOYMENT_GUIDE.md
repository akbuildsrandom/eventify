# Eventify – Production Vercel & Cloud Deployment Guide

This guide details deploying the Eventify Monorepo to **Vercel** with **Neon PostgreSQL**, **Upstash Redis**, **Cloudinary**, **Razorpay**, and **Resend**.

---

## 1. Architecture Overview

- **Hosting & Serverless Functions**: Vercel
- **Database**: Neon (Serverless PostgreSQL with connection pooling)
- **Cache & Rate Limiting**: Upstash Redis (Serverless HTTP REST API)
- **Payment Processing**: Razorpay (Test / Live Mode)
- **Media CDN**: Cloudinary
- **Transactional Email**: Resend
- **Scheduled Background Tasks**: Vercel Cron

```mermaid
flowchart LR
    VercelEdge["Vercel Edge & CDN"] --> NextStatic["Frontend React (dist/)"]
    VercelEdge --> ServerlessAPI["Serverless Function (api/index.js)"]
    ServerlessAPI --> NeonDB[("Neon PostgreSQL (Pooled)")]
    ServerlessAPI --> Upstash[("Upstash Redis (REST)")]
    ServerlessAPI --> Razorpay["Razorpay API"]
    ServerlessAPI --> Cloudinary["Cloudinary CDN"]
    ServerlessAPI --> Resend["Resend API"]
```

---

## 2. External Services Setup

### A. Neon Database (PostgreSQL)
1. Sign up at [neon.tech](https://neon.tech) and create a new project.
2. Under **Connection Details**, copy both connection strings:
   - **Pooled connection string** (enable connection pooling / PgBouncer): use this for `DATABASE_URL`.
   - **Direct connection string** (unpooled): use this for `DIRECT_URL` (required for migrations).

### B. Upstash Redis
1. Sign up at [upstash.com](https://upstash.com) and create a Redis database.
2. Select standard REST API tokens and copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### C. Razorpay Gateway
1. Create an account on [razorpay.com](https://razorpay.com).
2. Go to **Settings -> API Keys** and generate **Key ID** and **Key Secret** in **Test Mode**.
3. Go to **Settings -> Webhooks**, create a webhook pointing to `https://your-domain.vercel.app/api/payments/webhook`, set active events (`order.paid`, `payment.captured`), and copy your `RAZORPAY_WEBHOOK_SECRET`.

### D. Cloudinary
1. Sign up at [cloudinary.com](https://cloudinary.com).
2. Copy `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` from the dashboard.

### E. Resend
1. Sign up at [resend.com](https://resend.com) and generate an API key (`re_xxx`).
2. Verify your sending domain or use the default sandbox email `onboarding@resend.dev`.

---

## 3. Environment Variables Reference

Configure these environment variables in your Vercel Project Settings:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` |
| `DATABASE_URL` | Neon pooled PostgreSQL URL | `postgresql://user:pass@ep-pooler.neon.tech/neondb?sslmode=require&pgbouncer=true` |
| `DIRECT_URL` | Neon unpooled direct PostgreSQL URL | `postgresql://user:pass@ep.neon.tech/neondb?sslmode=require` |
| `JWT_ACCESS_SECRET` | 32+ character random secret | `prod_jwt_access_secret_key_random_string` |
| `JWT_REFRESH_SECRET` | 32+ character random secret | `prod_jwt_refresh_secret_key_random_string` |
| `COOKIE_SECRET` | 32+ character random secret | `prod_cookie_secret_key_random_string` |
| `FRONTEND_URL` | Production domain | `https://eventify.vercel.app` |
| `BACKEND_URL` | API base domain | `https://eventify.vercel.app` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | `https://your-db.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token | `AXxxxx...` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_xxxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `xxxxxx` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook Secret | `xxxxxx` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | `your-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `1234567890` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `xxxxxx` |
| `RESEND_API_KEY` | Resend API Key | `re_xxxxxx` |
| `EMAIL_FROM` | Sender email identity | `Eventify <notifications@yourdomain.com>` |
| `CRON_SECRET` | Secret token to secure Vercel crons | `your_random_cron_secret_token` |

---

## 4. Deploying to Vercel

### Step 1: Import Repository
1. Push your repository to GitHub.
2. In the Vercel Dashboard, click **Add New -> Project** and select your repository.
3. Configure the Project Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave at root so monorepo workspaces and `api/` are included)
   - **Build Command**: `npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install`

### Step 2: Add Environment Variables
Add all environment variables listed in Section 3 under **Settings -> Environment Variables**.

### Step 3: Run Database Migrations
Before or immediately after the first deployment, apply Prisma migrations to your Neon database:
```bash
# In your local terminal or GitHub Actions CI:
DATABASE_URL="<your_neon_direct_url>" npx --workspace=backend prisma migrate deploy
```

Optionally, seed sample events and test credentials:
```bash
DATABASE_URL="<your_neon_direct_url>" npm run prisma:seed --workspace=backend
```

### Step 4: Verify Deployment
1. Visit `https://your-domain.vercel.app/api/health` to confirm serverless backend and database connectivity.
2. Open `https://your-domain.vercel.app` to explore live events, test user registration, and book tickets!
