# Eventify – Production-Ready Event Management & Ticket Booking Platform

[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%7C%20Neon-4169E1.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22.0-2D3748.svg?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0.3-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.16-06B6D4.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Payments](https://img.shields.io/badge/Razorpay-Integrated-002970.svg?logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Tests](https://img.shields.io/badge/Vitest-31%20Passed%20(100%25)-4ade80.svg?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Deployment](https://img.shields.io/badge/Vercel-Serverless%20Ready-000000.svg?logo=vercel&logoColor=white)](https://vercel.com/)

**Eventify** is an enterprise-grade event management, ticket booking, and gate check-in platform inspired by systems like **BookMyShow** and **Eventbrite**. Engineered for modern serverless architectures, Eventify is designed to prevent overselling and race conditions under concurrent booking traffic using row-level atomic conditional PostgreSQL updates.

Configured with sensible Indian defaults (INR `₹` currency in paise precision, Asia/Kolkata `IST` timezone, and metropolitan Indian venues), the platform includes multi-tier role authorization (`CUSTOMER`, `ORGANIZER`, `ADMIN`), Razorpay payment processing, camera-based mobile QR gate verification, real-time password validation, and interactive analytics dashboards.

---

## 🔗 Project Links & Documentation

- **Live Deployment**: [https://eventify-eight-ashen.vercel.app](https://eventify-eight-ashen.vercel.app)
- **GitHub Repository**: [https://github.com/akshat5015/eventify](https://github.com/akshat5015/eventify)
- **System Architecture Specification**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Database ERD & Schema Design**: [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md)
- **Complete REST API Reference**: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- **Production Deployment Guide**: [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

---

## 🌟 Key Features & Functional Modules

### 1. High-Concurrency Inventory Engine
- **Atomic Conditional Updates**: Purchases execute `UPDATE "TicketType" SET "availableQuantity" = "availableQuantity" - :qty WHERE "id" = :id AND "availableQuantity" >= :qty` within an explicit PostgreSQL transaction (`$transaction`). If stock is insufficient, zero rows update and an immediate `409 Conflict` error is returned.
- **10-Minute Hold Window**: Reserved tickets are held in `PENDING` status for 10 minutes. Abandoned reservations are automatically returned to inventory via Vercel Cron.
- **Client Idempotency Keys**: Unique client idempotency keys prevent accidental double-billing or duplicate reservations from rapid clicks or network retries.

### 2. Multi-Role Authorization & Access Control (RBAC)
- **Role Isolation**: Strict server-side middleware enforcement across `CUSTOMER`, `ORGANIZER`, and `ADMIN`.
- **JWT & Token Rotation**: 15-minute access tokens delivered via `httpOnly`, `sameSite`, `secure` cookies paired with cryptographically hashed, rotated refresh tokens in PostgreSQL.
- **Live Password Validation**: Registration page provides real-time requirement feedback as the user types (length, uppercase, number, mandatory special characters `@, #, $, !, %`) and includes an in-field show/hide password toggle.

### 3. Public Discovery & Catalog Exploration
- **Multi-Facet Search & Filters**: Search across titles, categories (`HACKATHON`, `CONCERT`, `CONFERENCE`, `COLLEGE_FEST`, `WORKSHOP`, `CULTURAL`), Indian cities (`Bengaluru`, `Mumbai`, `New Delhi`, `Hyderabad`, `Pune`), and price ranges.
- **URL Synchronization**: All search and filter states synchronize with the browser address bar for bookmarking and sharing.
- **Performance Caching**: Catalog queries are cached via Upstash Redis REST with an automatic in-memory fallback.

### 4. Razorpay Payment Lifecycle
- **Paise Precision**: Order amounts are strictly computed in paise (₹1 = 100 paise) to prevent floating-point inaccuracies.
- **Cryptographic Verification**: Payment callbacks verify HMAC-SHA256 signatures using `crypto.timingSafeEqual` before issuing digital tickets.
- **Idempotent Webhooks**: Raw-body webhook verification with duplicate event suppression.
- **Test Mode Simulation**: Supports seamless local testing with deterministic mock orders when live merchant keys are unconfigured.

### 5. Digital QR Passes & Gate Check-In
- **Cryptographic Ticket Generation**: Issues unique alphanumeric codes (`EVT-XXXX-YYYY`) and embedded Base64 QR code data URIs.
- **Mobile Camera Scanner**: Integrated scanner powered by `html5-qrcode` auto-detects rear cameras on mobile devices.
- **Atomic Gate Admission**: Uses atomic single-scan database transitions (`UPDATE WHERE status = 'VALID'`) to prevent badge sharing, duplicate entry, or cross-gate fraud (`ALREADY_USED`, `WRONG_EVENT`, `CANCELLED`).

### 6. Role-Specific SaaS Portals
- **Customer Portal**: Order history, booking statuses, interactive digital pass view, profile settings, and notification center.
- **Organizer Studio**: Real-time sales metrics, revenue analytics with Recharts, event portfolio management, ticket tier configuration, and attendee directories.
- **Admin Console**: Platform-wide telemetry, user management with role moderation, event moderation, and immutable audit logs.

---

## 📸 Application Screenshots Gallery

| Landing Page & Hero | Events Discovery & Filters |
| :---: | :---: |
| ![Landing Page](documentation/assets/screenshot_landing.png) | ![Explore Events](documentation/assets/screenshot_explore.png) |
| **Event Details & Ticket Reservation** | **Live Password Validation on Register** |
| ![Event Details](documentation/assets/screenshot_event_details.png) | ![Register Validation](documentation/assets/screenshot_register_validation.png) |
| **Customer Bookings & Passes** | **Organizer Studio & Sales Analytics** |
| ![Customer Dashboard](documentation/assets/screenshot_customer_dashboard.png) | ![Organizer Dashboard](documentation/assets/screenshot_organizer_dashboard.png) |
| **Admin Console & Audit Journal** | **Fast Demo Login Dialog** |
| ![Admin Dashboard](documentation/assets/screenshot_admin_dashboard.png) | ![Login Page](documentation/assets/screenshot_login.png) |

---

## 🏗️ System Architecture

Eventify adopts a multi-tier serverless monorepo architecture:

```mermaid
graph TD
    subgraph Client Tier [Client Tier - React 18 & Vite SPA]
        CP[Customer Portal]
        OS[Organizer Studio]
        GS[Gate QR Scanner]
        AC[Admin Console]
    end

    subgraph Edge & Gateway [Vercel Serverless Edge]
        CDN[Vercel CDN - Static SPA Assets]
        RTR[API Router - api/index.js]
        CRON[Vercel Crons - Reminders & Cleanup]
    end

    subgraph Middleware Pipeline [Express Middleware Pipeline]
        HLM[Helmet & CORS Security]
        RL[Upstash Distributed RateLimiter]
        CK[HTTP-Only Cookie Parser]
        AUTH[JWT & RBAC Auth Guard]
        ZD[Zod Request Validators]
        ERR[Centralized Error Handler]
    end

    subgraph Business Services [Core Service Layer]
        BS[bookingService - Concurrency Engine]
        TS[ticketService - QR Code & Gate Verification]
        PS[paymentService - Razorpay Lifecycle]
        ES[eventService - Catalog & Categories]
        AS[authService & auditService]
    end

    subgraph Persistence & Cloud [Persistence & Cloud Infrastructure]
        PG[(Neon Serverless PostgreSQL 16 - Prisma)]
        RD[(Upstash Redis Cache & Rate Limit)]
        RP[Razorpay Payment Gateway]
        CL[Cloudinary CDN Media Storage]
        RS[Resend Transactional Email]
    end

    CP --> CDN
    OS --> CDN
    GS --> CDN
    AC --> CDN

    CP --> RTR
    OS --> RTR
    GS --> RTR
    AC --> RTR
    CRON --> RTR

    RTR --> HLM --> RL --> CK --> AUTH --> ZD --> BS & TS & PS & ES & AS --> ERR

    BS -->|Atomic Row Updates| PG
    TS -->|Atomic Status VALID->USED| PG
    PS -->|Order Sync & Webhooks| RP
    PS -->|ACID Confirmation| PG
    ES -->|Cache Get/Set| RD
    ES --> PG
    AS --> PG
    BS -->|Image Uploads| CL
    PS -->|Confirmation Emails| RS
```

---

## 🗄️ Database Architecture & Entity-Relationship Diagram

The database is built on **Neon Serverless PostgreSQL 16** and managed via **Prisma ORM 5.22.0** with 15 relational models:

```mermaid
erDiagram
    User ||--o{ Event : "organizes"
    User ||--o{ Booking : "places"
    User ||--o{ Payment : "makes"
    User ||--o{ Review : "writes"
    User ||--o{ Notification : "receives"
    User ||--o{ AuditLog : "initiates"
    User ||--o{ RefreshToken : "holds"
    User ||--o{ PasswordResetToken : "requests"
    User ||--o{ EmailVerificationToken : "verifies"

    Venue ||--o{ Event : "hosts"

    Event ||--|{ TicketType : "defines"
    Event ||--o{ Booking : "includes"
    Event ||--o{ Review : "receives"

    TicketType ||--o{ BookingItem : "quantifies"
    TicketType ||--o{ Ticket : "generates"

    Booking ||--|{ BookingItem : "contains"
    Booking ||--o{ Payment : "settles"
    Booking ||--o{ Ticket : "issues"

    User {
        string id PK
        string name
        string email UK
        string password
        enum role "CUSTOMER, ORGANIZER, ADMIN"
        boolean isVerified
        string phone
        datetime createdAt
    }

    Venue {
        string id PK
        string name
        string city
        string state
        int capacity
    }

    Event {
        string id PK
        string title
        string slug UK
        string category
        string organizerId FK
        string venueId FK
        enum status "DRAFT, PUBLISHED, CANCELLED, COMPLETED"
        datetime startDate
        datetime endDate
    }

    TicketType {
        string id PK
        string eventId FK
        string name
        decimal price
        int totalQuantity
        int availableQuantity "CONCURRENCY"
        int maxPerOrder
    }

    Booking {
        string id PK
        string userId FK
        string eventId FK
        decimal totalAmount
        enum status "PENDING, CONFIRMED, EXPIRED, CANCELLED"
        datetime expiresAt "10m Hold"
        string idempotencyKey UK
    }

    BookingItem {
        string id PK
        string bookingId FK
        string ticketTypeId FK
        int quantity
        decimal unitPrice
        decimal subtotal
    }

    Payment {
        string id PK
        string bookingId FK
        string userId FK
        decimal amount
        string providerOrderId
        string providerPaymentId
        enum status "PENDING, SUCCESS, FAILED, REFUNDED"
    }

    Ticket {
        string id PK
        string bookingId FK
        string ticketTypeId FK
        string ticketCode UK "EVT-XXXX-YYYY"
        text qrCode "Base64 Data URI"
        enum status "VALID, USED, CANCELLED"
        datetime checkedInAt
    }
```

---

## 🛠️ Technology Stack Breakdown

| Layer | Chosen Technology | Version | Description & Rationale |
| :--- | :--- | :--- | :--- |
| **Monorepo** | npm Workspaces | `10.x` | Clean root orchestration of `backend` and `frontend` workspaces with shared dependencies |
| **Frontend Framework** | React.js | `18.3.1` | Declarative UI, Concurrent Mode, hooks, and component ecosystem |
| **Build Tool** | Vite | `6.0.3` | Fast HMR and optimized production bundling with Rollup |
| **CSS Framework** | Tailwind CSS | `3.4.16` | Utility-first responsive styling and consistent design system |
| **Icons & Visuals** | Lucide React | `0.468.0` | Clean, modern feather-based icon set |
| **Data Visualizations** | Recharts | `2.15.0` | Composable SVG-based sales analytics charts for the Organizer Studio |
| **Client Routing** | React Router DOM | `7.0.2` | Declarative routing with nested layout wrappers and role guards |
| **State Management** | Zustand & TanStack Query | `5.0.2` / `5.62.7` | Zustand for lightweight global auth/toast stores; TanStack Query for server state caching |
| **Form Validation** | React Hook Form + Zod | `7.54.1` / `3.24.1` | Uncontrolled performant form state paired with schema-driven validation |
| **Backend Runtime** | Node.js (ESM) | `>=20.0.0` | Asynchronous, event-driven JavaScript server environment |
| **API Framework** | Express.js | `4.21.2` | Robust HTTP middleware pipeline with Vercel serverless export |
| **Database & ORM** | PostgreSQL 16 + Prisma | `5.22.0` | Type-safe schema, migrations, connection pooling, and ACID transactions |
| **Cloud Database** | Neon Serverless Postgres | `16 (AWS)` | Autoscaling PostgreSQL with pgBouncer connection pooling |
| **Cache & Rate Limiting** | Upstash Redis | `@upstash/redis` | Serverless HTTP REST Redis client with resilient in-memory fallback |
| **Payment Gateway** | Razorpay | `2.9.5` | Indian payment gateway integration with HMAC-SHA256 signature verification |
| **Camera QR Scanner** | html5-qrcode | `2.3.8` | Cross-browser HTML5 video stream QR decode library |
| **Testing Suite** | Vitest + RTL + Supertest | `2.1.8` | ESM-native test runner with sub-second execution across 31 automated tests |

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
│   │   ├── config/          # Prisma, Redis, Razorpay, Cloudinary, Resend
│   │   ├── controllers/     # Express route controllers (Admin, Auth, Booking, Events, etc.)
│   │   ├── middleware/      # Auth, RBAC, Rate Limiter, Error Handler, Upload
│   │   ├── routes/          # REST route declarations (/api/*)
│   │   ├── services/        # Atomic transactions, concurrency engine, business logic
│   │   ├── utils/           # QR generator, token hashing, API formatters
│   │   ├── validators/      # Zod input validation schemas
│   │   ├── test/            # Vitest backend automated test suites
│   │   ├── app.js           # Express application core export (serverless compatible)
│   │   └── index.js         # Local standalone HTTP server entry point
│   └── package.json
├── frontend/
│   ├── public/              # Static icons & assets
│   ├── src/
│   │   ├── components/      # Common UI, layouts, event cards, ticket selectors, QR scanner
│   │   ├── pages/           # Public, Auth, Customer, Organizer, and Admin views
│   │   ├── services/        # Axios API client modules
│   │   ├── store/           # Zustand Auth and Toast stores
│   │   ├── utils/           # INR Currency & IST Date formatters
│   │   ├── test/            # Frontend unit and component tests
│   │   ├── App.jsx          # Route declarations & role guards
│   │   └── main.jsx         # React DOM mounting
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md      # High-concurrency design & sequence diagrams
│   ├── DATABASE_DESIGN.md   # Entity-Relationship diagram & table specifications
│   ├── API_DOCUMENTATION.md # Complete REST API reference
│   └── DEPLOYMENT_GUIDE.md  # Step-by-step Vercel, Neon, & Cloudinary deployment
├── documentation/
│   └── assets/              # Application screenshots referenced in README
├── .env.example             # Documented environment variables template
├── vercel.json              # Serverless API routes and Vercel Cron definitions
├── package.json             # Root monorepo workspace configuration
└── README.md
```

---

## ⚡ Installation & Local Setup

### 1. Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher
- **PostgreSQL**: Local PostgreSQL 16 server or hosted Neon connection string

### 2. Clone & Install
```bash
git clone https://github.com/akshat5015/eventify.git
cd eventify
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `backend/.env` (and root `.env`):
```bash
cp .env.example backend/.env
cp .env.example .env
```

Ensure `DATABASE_URL` and `DIRECT_URL` point to your PostgreSQL database with appropriate placeholders:
```env
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5001

DATABASE_URL="postgresql://username:password@localhost:5432/eventify_dev"
DIRECT_URL="postgresql://username:password@localhost:5432/eventify_dev"

JWT_ACCESS_SECRET="your_jwt_access_secret_min_32_characters_here"
JWT_REFRESH_SECRET="your_jwt_refresh_secret_min_32_characters_here"
COOKIE_SECRET="your_cookie_encryption_secret_here"

RAZORPAY_KEY_ID="rzp_test_your_key_id_here"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret_here"

CRON_SECRET="your_cron_execution_secret_token_here"
```

### 4. Database Migration & Seeding
Apply versioned Prisma migrations and seed realistic Indian venues, events, and local demo accounts:
```bash
# Generate Prisma Client
npm run prisma:generate

# Apply SQL migrations
npm run prisma:migrate

# Seed sample database
npm run prisma:seed
```

#### Local Development Demo Credentials
> **Notice**: The following credentials are seeded strictly for **local development and testing** via `npm run prisma:seed`. They are not active on production deployments.

| Role | Email | Password | Pre-configured Access |
| :--- | :--- | :--- | :--- |
| **Super Admin (Local Dev Only)** | `admin@eventify.com` | `Password123!` | Access to `/admin` console, moderation, & audit logs |
| **Event Host (Local Dev Only)** | `organizer1@eventify.com` | `Password123!` | Access to `/organizer` studio, event publishing, & mobile QR scanner |
| **Attendee (Local Dev Only)** | `customer1@eventify.com` | `Password123!` | Access to `/dashboard`, ticket discovery, checkout, & digital passes |

### 5. Running the Application
Launch both backend and frontend servers concurrently:
```bash
npm run dev
```
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:5001/api`
- **Health Telemetry**: `http://localhost:5001/api/health`

---

## 🧪 Testing Instructions & Verified Results

Eventify includes 31 automated tests across frontend and backend suites:

```bash
# Run all monorepo test suites
npm run test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend
```

### Verified Test Results Summary (31/31 Passed, 100%):

- **Backend Test Suite (Vitest — 15 tests passed)**:
  - `src/test/concurrency.test.js` (2 tests):
    - Concurrent booking attempt on a single remaining ticket verifies that one request acquires the reservation, while the competing request receives an HTTP 409 Conflict without negative inventory.
    - Subsequent booking attempt when inventory is 0 immediately returns HTTP 409 Conflict.
  - `src/test/auth_rbac_qr.test.js` (13 tests):
    - Authentication & token rotation (4 tests)
    - Role-based access control across Customer, Organizer, and Admin (3 tests)
    - Razorpay payment order initialization, invalid signature rejection, QR ticket generation, duplicate check-in rejection (`ALREADY_USED`), and wrong-event check-in rejection (6 tests)

- **Frontend Test Suite (Vitest + JSDOM — 16 tests passed)**:
  - `src/test/components.test.jsx` (5 tests):
    - Currency and date formatters (INR ₹ formatting with Indian commas, Asia/Kolkata IST timezone)
    - Button variants and loading state
    - Badge variant styling
    - EventCard rendering
  - `src/test/registerPassword.test.jsx` (11 tests):
    - Zod schema password rules (5 tests: rejects missing special character, missing uppercase, missing number, too short; accepts valid password with special characters)
    - UI live validation and interaction (6 tests: live indicator updates, show/hide password toggle, submission prevention on invalid input, Customer and Organizer registration)

---

## 🚀 Vercel Production Deployment

The project is structured specifically for zero-friction Vercel deployment:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete production eventify platform"
   git push origin main
   ```
2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **Add New -> Project**.
   - Select your GitHub repository (`eventify`).
3. **Configure Build Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `frontend/dist`
4. **Configure Environment Variables**:
   Supply your production variables in the Vercel Project Settings:
   - `DATABASE_URL` and `DIRECT_URL` (from Neon Serverless PostgreSQL)
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (from Upstash)
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `RESEND_API_KEY`, `EMAIL_FROM`
   - `CRON_SECRET`
5. **Deploy**:
   Vercel compiles the Vite SPA and routes all `/api/*` requests to the serverless function handler (`api/index.js`).

---

## ⚖️ Implementation Status & Limitations

The table below documents the verified operational status of each subsystem:

| Subsystem | Operational Status | Verification Method | Operational Mode Details |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | **Fully Operational** | Prisma + Neon AWS DB | Active Neon PostgreSQL 16 database with connection pooling, 15 models, and migrations verified. |
| **Concurrency Engine** | **Fully Operational** | `concurrency.test.js` | Row-level atomic conditional updates verified under concurrent requests without negative inventory. |
| **Auth & RBAC Guards** | **Fully Operational** | `auth_rbac_qr.test.js` | Bcrypt hashing, token rotation, and HTTP-only cookie delivery verified across all 3 roles. |
| **Password UX** | **Fully Operational** | `registerPassword.test.jsx` | Live requirement checklist and show/hide toggle verified on Attendee and Event Host registration forms. |
| **Gate Check-In** | **Fully Operational** | `html5-qrcode` + API | Mobile camera QR scanning, duplicate check-in rejection (`ALREADY_USED`), and wrong-event alerts verified. |
| **Razorpay Payments** | **Integrated / Test Mode** | `paymentService.js` | Full order creation, client modal checkout, and HMAC signature verification implemented; runs in test mode with demo keys. |
| **Upstash Redis Cache** | **Integrated / Fallback** | `redis.js` & Health API | Serverless REST client implemented; automatically falls back to in-memory `MemoryCache` when credentials are unconfigured. |
| **Cloudinary Media** | **Integrated / Fallback** | `cloudinary.js` & Health API | Memory buffer stream upload pipeline implemented; falls back to curated event banners if unconfigured. |
| **Resend Email** | **Integrated / Simulation** | `resend.js` & Health API | Official SDK integrated; logs simulated email deliveries to console in local development when keys are unconfigured. |

---

## 🗺️ Future Roadmap

- [ ] **International Currency & Gateway Expansion**: Adding Stripe and PayPal rails alongside Razorpay with dynamic FX conversion and i18n multi-language support.
- [ ] **Interactive 3D / SVG Seating Chart**: Visual venue seat selector allowing attendees to choose numbered auditorium and arena seats with Redis lock reservations.
- [ ] **Offline Gate Check-In PWA**: Progressive Web App with local SQLite cached ticket manifests for entry verification during complete venue internet outages.
- [ ] **WhatsApp & SMS Pass Delivery**: Direct WhatsApp messaging of digital passes and QR codes via Twilio / Gupshup APIs upon payment confirmation.

---

## 📄 License

MIT License. Designed and engineered for production event commerce and technical portfolio demonstration.
