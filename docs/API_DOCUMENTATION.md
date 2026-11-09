# Eventify – REST API Documentation

Base URL: `http://localhost:5000/api` (Local) / `/api` (Production / Vercel)

---

## 1. Response Envelope Standards

All Eventify REST API endpoints return a predictable JSON payload:

### Success Response
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {},
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 12,
    "totalPages": 9
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    }
  ]
}
```

---

## 2. Authentication & Account Endpoints

### Register User
- **Method**: `POST`
- **Route**: `/api/auth/register`
- **Rate Limit**: 15 req / 10 min
- **Access**: Public
- **Body**:
  ```json
  {
    "name": "Aarav Sharma",
    "email": "aarav@example.com",
    "password": "Password123!",
    "role": "CUSTOMER",
    "phone": "+91 98765 43210"
  }
  ```
- **Response**: `201 Created`

### Login
- **Method**: `POST`
- **Route**: `/api/auth/login`
- **Rate Limit**: 10 req / min
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "aarav@example.com",
    "password": "Password123!"
  }
  ```
- **Response**: `200 OK` (Sets HTTP-Only cookies `accessToken` and `refreshToken`)

### Refresh Tokens
- **Method**: `POST`
- **Route**: `/api/auth/refresh`
- **Access**: Cookie Authenticated
- **Response**: `200 OK` (Rotates refresh token in database, sets new cookie pair)

### Sign Out
- **Method**: `POST`
- **Route**: `/api/auth/logout`
- **Access**: Public / Authenticated
- **Response**: `200 OK` (Revokes refresh token, clears auth cookies)

### Current User Profile
- **Method**: `GET`
- **Route**: `/api/auth/me`
- **Access**: Authenticated (`CUSTOMER`, `ORGANIZER`, `ADMIN`)

### Update Profile
- **Method**: `PUT`
- **Route**: `/api/auth/profile`
- **Access**: Authenticated

### Change Password
- **Method**: `PUT`
- **Route**: `/api/auth/change-password`
- **Access**: Authenticated

---

## 3. Events Endpoints

### List Published Events
- **Method**: `GET`
- **Route**: `/api/events`
- **Access**: Public (Cached via Upstash / Memory store, 5 min TTL)
- **Query Parameters**:
  - `search`: string (matches title & description)
  - `category`: string (`HACKATHON`, `CONCERT`, `CONFERENCE`, `COLLEGE_FEST`, `WORKSHOP`, `SPORTS`, `CULTURAL`)
  - `city`: string (e.g. `Bengaluru`, `Mumbai`, `New Delhi`)
  - `sort`: `upcoming` | `newest` | `popularity` | `price_asc`
  - `page`: integer (default 1)
  - `limit`: integer (default 12)

### Get Event Details
- **Method**: `GET`
- **Route**: `/api/events/:id` (Accepts UUID or slug)
- **Access**: Public

### Create Event
- **Method**: `POST`
- **Route**: `/api/events`
- **Access**: Authenticated (`ORGANIZER`, `ADMIN`)
- **Body**:
  ```json
  {
    "title": "Bangalore AI Hackathon 2026",
    "category": "HACKATHON",
    "description": "36-hour intense decentralized AI hackathon with prizes...",
    "startDate": "2026-12-15T09:00:00.000Z",
    "endDate": "2026-12-16T21:00:00.000Z",
    "venueId": "UUID-of-venue",
    "ticketTypes": [
      {
        "name": "Student Pass",
        "price": 299,
        "totalQuantity": 500,
        "maxPerOrder": 4,
        "salesStart": "2026-11-01T00:00:00.000Z",
        "salesEnd": "2026-12-15T09:00:00.000Z"
      }
    ]
  }
  ```

### Publish Event
- **Method**: `PATCH`
- **Route**: `/api/events/:id/publish`
- **Access**: Authenticated (`ORGANIZER` owner, `ADMIN`)

### Cancel Event
- **Method**: `PATCH`
- **Route**: `/api/events/:id/cancel`
- **Access**: Authenticated (`ORGANIZER` owner, `ADMIN`)

---

## 4. Ticket Reservation & Booking Endpoints

### Create Atomic Ticket Reservation
- **Method**: `POST`
- **Route**: `/api/bookings`
- **Headers**:
  - `Idempotency-Key`: string (unique client submission token)
- **Access**: Authenticated (`CUSTOMER`, `ORGANIZER`, `ADMIN`)
- **Body**:
  ```json
  {
    "eventId": "UUID-of-event",
    "items": [
      {
        "ticketTypeId": "UUID-of-ticket-type",
        "quantity": 2
      }
    ]
  }
  ```
- **Response**: `201 Created`
  - Reserves inventory conditionally: `WHERE "availableQuantity" >= requestedQuantity`
  - Sets 10-minute hold timestamp `expiresAt`
  - Returns `booking` in `PENDING` state

### Get My Bookings
- **Method**: `GET`
- **Route**: `/api/bookings/my`
- **Access**: Authenticated

### Cancel Pending Reservation
- **Method**: `POST`
- **Route**: `/api/bookings/:id/cancel`
- **Access**: Authenticated (Booking Owner)
- **Response**: `200 OK` (Releases held inventory back to available pool)

---

## 5. Payments & Razorpay Integration

### Create Payment Order
- **Method**: `POST`
- **Route**: `/api/payments/create-order`
- **Access**: Authenticated
- **Body**:
  ```json
  {
    "bookingId": "UUID-of-pending-booking"
  }
  ```
- **Response**: `200 OK` (Returns `orderId`, `amount` in paise, `currency`, and `keyId`)

### Verify Payment & Generate Passes
- **Method**: `POST`
- **Route**: `/api/payments/verify`
- **Access**: Authenticated
- **Body**:
  ```json
  {
    "bookingId": "UUID",
    "razorpayOrderId": "order_xxx",
    "razorpayPaymentId": "pay_xxx",
    "razorpaySignature": "hmac_sha256_signature"
  }
  ```
- **Response**: `200 OK` (Validates HMAC-SHA256 signature, transitions booking to `CONFIRMED`, generates verifiable tickets with QR data URLs)

### Razorpay Webhook Callback
- **Method**: `POST`
- **Route**: `/api/payments/webhook`
- **Headers**: `X-Razorpay-Signature`
- **Access**: Public (HMAC Verified with Raw Request Body)

---

## 6. QR Code Tickets & Check-In Verification

### Get User Digital Passes
- **Method**: `GET`
- **Route**: `/api/tickets/my`
- **Access**: Authenticated

### Get Single Digital Pass
- **Method**: `GET`
- **Route**: `/api/tickets/:id`
- **Access**: Authenticated (Ticket Owner, Event Organizer, Admin)

### Gate Check-in Ticket Verification
- **Method**: `POST`
- **Route**: `/api/tickets/check-in`
- **Access**: Authenticated (`ORGANIZER` of event, `ADMIN`)
- **Body**:
  ```json
  {
    "ticketCode": "EVT-CODE-XXXX",
    "eventId": "UUID-of-target-event"
  }
  ```
- **Response**:
  - `200 OK`: Valid pass; transitions atomically from `VALID` to `USED`
  - `400 Bad Request`: `ALREADY_USED`, `WRONG_EVENT`, or `INVALID`

### Event Gate Check-in Statistics
- **Method**: `GET`
- **Route**: `/api/tickets/events/:eventId/stats`
- **Access**: Authenticated (`ORGANIZER`, `ADMIN`)

---

## 7. Organizer Dashboard & Analytics Endpoints

- `GET /api/organizer/dashboard`: KPI summaries (Revenue, sold passes, capacity) and Recharts aggregated data.
- `GET /api/organizer/events`: Organizer's event portfolio with financial summaries.
- `GET /api/organizer/attendees`: Filtered guest list with real-time gate admission state.
- `GET /api/organizer/analytics`: Historical daily revenue and pass volume trends.

---

## 8. Administrator Endpoints

- `GET /api/admin/dashboard`: System-wide throughput and security audit logs.
- `GET /api/admin/users`: Server-side paginated user management.
- `PATCH /api/admin/users/:id/role`: Change user role (`CUSTOMER`, `ORGANIZER`, `ADMIN`).
- `GET /api/admin/events`: All platform events across all organizers.
- `PATCH /api/admin/events/:id/status`: Moderation status update (`PUBLISHED`, `DRAFT`, `CANCELLED`).
- `GET /api/admin/bookings`: Cross-platform financial booking inspect.
- `GET /api/admin/audit-logs`: Immutable security audit logs.

---

## 9. Automated Cron Endpoints

Protected by `Authorization: Bearer <CRON_SECRET>` or `X-Cron-Secret` header:
- `ALL /api/cron/cleanup-reservations`: Atomically releases held inventory from expired reservations.
- `ALL /api/cron/reminders`: Dispatches transactional event reminders 24 hours prior to event start.
