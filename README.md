# Eventify – Production-Ready Event Management & Ticket Booking Platform

[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/PostgreSQL-16%20%7C%20Neon-blue.svg)](https://www.postgresql.org/)
[![ORM](https://img.shields.io/badge/Prisma-5.22.0-indigo.svg)](https://www.prisma.io/)
[![Frontend](https://img.shields.io/badge/React-18%20%7C%20Vite%206-61dafb.svg)](https://react.dev/)
[![Payments](https://img.shields.io/badge/Razorpay-Integrated-002970.svg)](https://razorpay.com/)
[![Tests](https://img.shields.io/badge/Tests-20%20Passed-brightgreen.svg)](https://vitest.dev/)

**Eventify** is a sophisticated, production-ready, full-stack event management and live ticketing platform inspired by systems like **BookMyShow** and **Eventbrite**. It features high-concurrency inventory reservation with zero overselling guarantees, real Razorpay test-mode payment processing, atomic QR check-in gates, role-based access control, analytics dashboards, and serverless deployment readiness on Vercel.

---

## 🌟 Key Features

### 1. High-Concurrency Inventory Reservation & Race Condition Prevention
- **Atomic Conditional Updates**: Uses PostgreSQL atomic conditional statements (`WHERE "availableQuantity" >= :requestedQuantity`) inside transactions to mathematically prevent overselling or negative inventory when simultaneous purchasers compete for the last seat.
- **10-Minute Hold Expiration**: Automatically releases held inventory back to the available pool if checkout is not completed before the reservation expiration timestamp.
- **Idempotency Keys**: Protects booking submissions against network retries or double clicks via unique client idempotency tokens.

### 2. Multi-Role Authentication & Access Control (RBAC)
- **Role Isolation**: Strict server-side middleware enforcement across `CUSTOMER`, `ORGANIZER`, and `ADMIN`. Customers cannot access administrative dashboards, and organizers cannot manipulate events belonging to other organizers.
- **Token Rotation**: Short-lived JWT access tokens paired with rotated, SHA-256 hashed refresh tokens stored securely in PostgreSQL.
- **HTTP-Only Cookies**: Mitigates script injection attacks by securing session tokens in `httpOnly`, `sameSite`, and `secure` cookies.

### 3. Public Discovery & Real-Time Exploration
- **Advanced Filtering**: Full search across titles, descriptions, categories (`HACKATHON`, `CONCERT`, `CONFERENCE`, `COLLEGE_FEST`, `WORKSHOP`, `CULTURAL`), Indian cities (`Bengaluru`, `Mumbai`, `New Delhi`, `Hyderabad`, `Pune`), and price ranges.
- **URL Synchronization**: All filter parameters sync with the browser address bar, allowing bookmarked and shareable search results.
- **Performance Caching**: Public listings and event categories are cached using Upstash Redis with a resilient in-memory fallback.

### 4. Seamless Razorpay Payment Integration
- **Order Initialization**: Creates server-side Razorpay orders in Indian Rupees (₹) with amounts strictly in paise.
- **HMAC-SHA256 Verification**: Verifies payment signatures before confirming bookings and issuing tickets.
- **Idempotent Webhooks**: Secure webhook processing with raw body verification and duplicate-event suppression.

### 5. Verified Attendee Reviews & Ratings
- **Verified Review Policy**: Only customers who booked tickets for an event are permitted to leave star ratings and comments. Enforces a strict one-review-per-attendee database constraint.

### 6. Digital QR Passes & Gate Check-in
- **Unique Ticket Code Generation**: Generates cryptographically secure alphanumeric ticket references (`EVT-XXXX-YYYY`) and embedded QR codes.
- **Organizer Mobile Scanner**: Dedicated camera QR scanner (`html5-qrcode`) with instant fraud detection (`ALREADY_USED`, `WRONG_EVENT`, `INVALID`).
- **Atomic Gate Transition**: Conditional single-scan state update (`VALID` -> `USED`) preventing duplicate admissions even if multiple gates scan simultaneously.
- **Printable Passes**: Downloadable and printable boarding passes with venue address and entry requirements.

### 7. SaaS Dashboards
- **Customer Portal**: Orders history, digital tickets view, profile settings, and notification center.
- **Organizer Studio**: Real-time sales metrics, revenue analytics with Recharts, event portfolio management, and attendee directories.
- **Admin Console**: Cross-platform overview, user directory with role moderation, event status moderation, and immutable audit logs.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Monorepo** | npm Workspaces (`frontend`, `backend`), Vercel Serverless Function entry point (`api/index.js`) |
| **Frontend** | React 18, Vite 6, Tailwind CSS, TanStack Query, Zustand, React Hook Form, Zod, Lucide React, Recharts, Framer Motion, Axios, Canvas Confetti |
| **Backend** | Node.js (ESM), Express.js, Prisma ORM, Helmet, CORS, Cookie-Parser, Zod, Bcryptjs, Morgan |
| **Database** | PostgreSQL 16 / Neon Serverless PostgreSQL with connection pooling |
| **Cache & Rate Limits** | Upstash Redis (Serverless REST API) with automatic in-memory fallback |
| **Payments** | Razorpay Gateway (Test Mode / Live Mode) |
| **Media Storage** | Cloudinary (CDN) with memory buffer stream uploads |
| **Email** | Resend Transactional Email API with development fallback |
| **Testing** | Vitest, Supertest, React Testing Library, JSDOM |

---

## 📁 Repository Structure

```
eventify/
├── api/
│   └── index.js             # Vercel Serverless Function entry point
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Complete PostgreSQL schema (15 models)
│   │   ├── migrations/      # Versioned SQL migrations
│   │   └── seed.js          # Realistic Indian venues, events, & users
│   ├── src/
│   │   ├── config/          # Prisma singleton, Redis, Razorpay, Cloudinary, Resend
│   │   ├── controllers/     # Express route controllers
│   │   ├── middleware/      # Auth, RBAC, Rate Limiter, Error Handler, Upload
│   │   ├── routes/          # API route definitions (/api/*)
│   │   ├── services/        # Business logic & atomic database transactions
│   │   ├── utils/           # Token hashing, QR generation, API formatters
│   │   ├── validators/      # Zod input validation schemas
│   │   ├── test/            # Vitest backend automated test suites
│   │   ├── app.js           # Express application core export
│   │   └── index.js         # Local standalone HTTP server startup
│   └── package.json
├── frontend/
│   ├── public/              # Static icons & assets
│   ├── src/
│   │   ├── components/      # Common UI, layouts, event cards, ticket selectors, QR scanner
│   │   ├── pages/           # Public, Auth, Customer, Organizer, and Admin views
│   │   ├── services/        # Axios API clients
│   │   ├── store/           # Zustand Auth and Toast stores
│   │   ├── utils/           # INR Currency & IST Date formatters
│   │   ├── test/            # Frontend unit and component tests
│   │   ├── App.jsx          # Route declarations
│   │   └── main.jsx         # React DOM mounting
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md      # High-concurrency design & sequence diagrams
│   ├── DATABASE_DESIGN.md   # Entity-Relationship diagram & table specifications
│   ├── API_DOCUMENTATION.md # Complete REST API reference
│   └── DEPLOYMENT_GUIDE.md  # Step-by-step Vercel, Neon, & Cloudinary deployment
├── .env.example             # Documented environment variables template
├── vercel.json              # Serverless API routes and Vercel Cron definitions
├── package.json             # Root monorepo workspace configuration
└── README.md
```

---

## ⚡ Quickstart & Local Development

### 1. Prerequisites
- **Node.js**: `v20.0.0` or higher
- **PostgreSQL**: Local PostgreSQL 16 server or hosted Neon connection string

### 2. Installation
Clone the repository and install all dependencies:
```bash
git clone <repository_url> eventify
cd eventify
npm install
```

### 3. Environment Setup
Copy `.env.example` to `backend/.env` (and root `.env`):
```bash
cp .env.example backend/.env
cp .env.example .env
```
Ensure `DATABASE_URL` and `DIRECT_URL` point to your PostgreSQL database:
```env
DATABASE_URL=postgresql://akshat@localhost:5432/eventify_dev
DIRECT_URL=postgresql://akshat@localhost:5432/eventify_dev
```

### 4. Database Migration & Seeding
Apply the initial migration and populate the database with realistic sample users, Indian venues, events, and ticket tiers:
```bash
# Generate Prisma Client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate

# Seed sample data
npm run prisma:seed
```

#### Seed Credentials for Local Testing:
| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@eventify.com` | `Password123!` |
| **Organizer** | `organizer1@eventify.com` | `Password123!` |
| **Customer** | `customer1@eventify.com` | `Password123!` |

### 5. Running the Application
Launch both backend and frontend concurrently:
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`

---

## 🧪 Automated Testing

Eventify includes automated test suites covering authentication, role authorization, atomic transactions, QR verification, and high-concurrency race condition scenarios.

```bash
# Run all monorepo tests (backend + frontend)
npm run test

# Run backend test suite
npm run test:backend

# Run frontend test suite
npm run test:frontend
```

### Mandatory Concurrency Race Condition Test
Located in `backend/src/test/concurrency.test.js`:
- Creates an event where **only 1 ticket remains**.
- Fires two simultaneous booking requests from two independent customer sessions.
- **Result**: Exactly one request succeeds (`201 Created`), the concurrent competitor is safely rejected with `409 Conflict` ("Insufficient tickets remaining"), remaining inventory reaches exactly `0`, and no negative inventory or overselling occurs.

---

## 🚀 Vercel Production Deployment

The project is built specifically for Vercel deployment:
1. Push your repository to GitHub.
2. In Vercel, click **Add New -> Project**, select your repository.
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `frontend/dist`
4. Supply your production environment variables (from Neon, Upstash, Razorpay, Cloudinary, Resend).
5. Deploy! Vercel will automatically route `/api/*` to the serverless entry point `api/index.js` and serve static assets via its Edge Network.

For comprehensive instructions, consult [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md).

---

## 📄 Documentation Links
- [System Architecture Specification](docs/ARCHITECTURE.md)
- [Database ERD & Schema Design](docs/DATABASE_DESIGN.md)
- [Complete REST API Reference](docs/API_DOCUMENTATION.md)
- [Production Deployment Guide](docs/DEPLOYMENT_GUIDE.md)

---

## 🛡️ License
MIT License. Built for production portfolio demonstration.
