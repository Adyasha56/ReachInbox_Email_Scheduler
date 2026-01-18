
---

# ReachInbox Email Scheduler

## Overview

A **production-grade email scheduling application** with a modern frontend and robust backend. Schedule, compose, and manage bulk email campaigns with rate limiting, delayed sending, and real-time tracking.

The system allows authenticated users to:
- Compose rich-text emails with formatting options
- Schedule emails for future delivery
- Set per-hour rate limits and delays between sends
- View sent and scheduled emails
- Track email status in real-time
- Support multiple recipient emails

> ✨ Full-stack application with React frontend + Next.js backend
> 🔐 Secure Google OAuth authentication
> 📨 BullMQ + Redis powered email scheduling
> 🎨 Modern UI with Tailwind CSS + shadcn/ui

---

## 🧠 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  (Next.js 16 | Compose | Scheduled | Sent | Detail View)   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ (Google OAuth)
                       v
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes (App Router)                │
│                                                              │
│  ├── /api/auth/* (NextAuth + Google)                       │
│  ├── /api/batch/create, list                               │
│  ├── /api/email/add, sent, scheduled                        │
│  └── /api/health                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        v              v              v
    Prisma ORM     BullMQ Queue    Redis Cache
        │              │              │
        v              v              v
   SQLite DB      Delayed Jobs   Rate Limiting
                       │
                       v
              ┌────────────────────┐
              │  Worker Process    │
              │  (email.worker.js) │
              │                    │
              │ ├─ Rate Limiting   │
              │ ├─ Delay Logic     │
              │ └─ SMTP Sender     │
              └────────────────────┘
                       │
                       v
              ┌────────────────────┐
              │  Ethereal SMTP     │
              │  (Email Service)   │
              └────────────────────┘
```

---

## 🧰 Tech Stack

### Frontend
- **Framework:** Next.js 16.1.3 with App Router
- **Language:** TypeScript
- **UI Library:** React 19.2.3
- **Styling:** Tailwind CSS 4
- **Components:** shadcn/ui (Dialog, Button, Input, Badge, Table, etc.)
- **Icons:** lucide-react
- **Rich Text Editor:** TipTap (with formatting toolbar)
- **Authentication:** NextAuth v4.24.13
- **HTTP Client:** Axios
- **Date Formatting:** date-fns

### Backend
- **Runtime:** Node.js
- **Framework:** Next.js API Routes
- **Database:** Prisma ORM v5.22.0 (SQLite dev)
- **Queue System:** BullMQ (Job scheduling)
- **Cache:** Redis 5.0+
- **Authentication:** NextAuth with Google OAuth
- **Email:** Nodemailer + Ethereal SMTP
- **Worker:** Separate Node.js process

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Redis 5.0+ (Docker recommended)
- Google OAuth credentials

### Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd ReachInbox_Email_Scheduler
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables** (`.env`)
```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Database
DATABASE_URL="file:./dev.db"

# Redis
REDIS_URL=redis://localhost:6379

# Email Service (Ethereal)
ETHEREAL_USER=your-ethereal-email@ethereal.email
ETHEREAL_PASS=your-ethereal-password

# Email Scheduling Config
MAX_EMAILS_PER_HOUR=1
EMAIL_DELAY_MS=2000
WORKER_CONCURRENCY=2
```

4. **Setup database**
```bash
npx prisma migrate dev
```

5. **Start Redis** (Docker)
```bash
docker run -d -p 6379:6379 redis:latest
```

6. **Run development server**
```bash
npm run dev
```

7. **In a new terminal, start the email worker**
```bash
node workers/email.worker.js
```

8. **Open browser**
```
http://localhost:3000
```

---

## 📱 Frontend Features

### Dashboard Pages

#### 1. **Compose Email** (`/dashboard/compose`)
- Rich text editor with formatting toolbar (Bold, Italic, Strikethrough, Lists, Code, Quote)
- Multiple email recipient support (manual input, comma/space/newline separated)
- CSV/TXT file upload for batch email parsing
- Subject and email content input
- Scheduling options with preset times (Tomorrow, 10 AM, 11 AM, 3 PM)
- Rate limiting and delay configuration
- Toast notifications for user feedback
- Form validation with specific error messages

**Key Components:**
- TipTap editor with `immediatelyRender: false` for SSR safety
- Email chip display with "+X more" indicator
- Send Later modal with preset time options
- Paperclip and Clock icons in header for file attachment and scheduling

#### 2. **Sent Emails** (`/dashboard/sent`)
- Clean list view of all sent emails
- Search and filter functionality
- Recipient, status, subject, and date display
- Click to view email details
- Refresh button to sync latest data
- Text size optimized (text-xs) for compact layout

#### 3. **Email Detail** (`/dashboard/sent/[id]`)
- Full email content display with HTML rendering
- Sender information with avatar
- Timestamp and metadata
- Back navigation button
- Action buttons (Star, Archive, Delete placeholders)
- Dynamic routing based on email ID

#### 4. **Scheduled Emails** (`/dashboard/scheduled`)
- Same list view as sent emails
- Yellow "Pending" status badge
- Search and filter for scheduled emails
- Click to view scheduled email details
- Auto-refresh every 30 seconds

### UI/UX Features
- **Toast Notifications:** All errors and confirmations via toasts (3-second auto-dismiss)
- **Icons:** Lucide React icons throughout (Mail, Clock, Paperclip, Filter, etc.)
- **Responsive Design:** Mobile-friendly with Tailwind CSS
- **Loading States:** Spinners and loading text for async operations
- **Empty States:** Helpful empty state messages with icons

---

## 🔐 Authentication

### Google OAuth Flow
1. User clicks "Login with Google"
2. NextAuth handles OAuth redirect
3. Backend validates token with Google
4. Creates session in database via PrismaAdapter
5. Frontend receives session cookie (HTTP-only)
6. User logged in securely

### Session Management
- Sessions stored in database (Prisma)
- HTTP-only cookies prevent XSS attacks
- Frontend calls `useSession()` hook to get user info
- Automatic redirect to login if session expires

**Auth Endpoints:**
```
POST   /api/auth/signin/google      # Google login
GET    /api/auth/session             # Get current session
POST   /api/auth/signout             # Logout
```

---

## 📧 Email Scheduling & Sending

### Workflow

1. **User Composes Email**
   - Fills subject, body, recipients
   - Selects scheduling time and rate limits
   - Clicks "Send"

2. **Backend Creates Batch**
   ```
   POST /api/batch/create
   {
     "name": "Campaign Name",
     "startTime": "2026-01-19T10:00:00Z",
     "delayBetween": 2000,
     "hourlyLimit": 1
   }
   ```
   - Batch stored in database
   - BullMQ job created with delay

3. **Backend Adds Emails**
   ```
   POST /api/email/add
   {
     "batchId": "...",
     "to": "user@example.com",
     "subject": "...",
     "bodyText": "..."
   }
   ```
   - Each email stored with `status: "pending"`

4. **Worker Processes Jobs**
   - Runs on separate Node.js process
   - Fetches pending emails
   - Enforces rate limits (max emails per hour)
   - Adds delay between sends
   - Sends via Ethereal SMTP
   - Updates status to `"sent"` or `"failed"`

5. **Frontend Displays**
   - Scheduled tab shows pending emails
   - Sent tab shows sent emails
   - Real-time updates every 30 seconds

### Rate Limiting (Redis)
- Tracks emails sent per hour per batch
- Prevents exceeding `MAX_EMAILS_PER_HOUR`
- Uses Redis counters with TTL

### Delay Logic
- `EMAIL_DELAY_MS`: Milliseconds between sends (prevents SMTP rate limits)
- `WORKER_CONCURRENCY`: Number of parallel email sends

---

## 🛠️ API Endpoints

### Batch Management
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/batch/create` | Create email campaign batch |
| GET | `/api/batch/list` | List all batches |

**Example: Create Batch**
```bash
curl -X POST http://localhost:3000/api/batch/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 Newsletter",
    "startTime": "2026-01-20T10:00:00Z",
    "delayBetween": 2000,
    "hourlyLimit": 1
  }'
```

### Email Management
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/email/add` | Add email to batch |
| GET | `/api/email/sent` | Get sent emails |
| GET | `/api/email/scheduled` | Get scheduled emails |
| GET | `/api/email/:id` | Get email details |

**Example: Add Email**
```bash
curl -X POST http://localhost:3000/api/email/add \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "...",
    "to": "user@example.com",
    "subject": "Hello",
    "bodyText": "<p>This is HTML content</p>"
  }'
```

---

## 📊 Database Schema

### User
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  batches       EmailBatch[]
  sessions      Session[]
  accounts      Account[]
}
```

### EmailBatch
```prisma
model EmailBatch {
  id           String    @id @default(cuid())
  name         String
  status       String    @default("scheduled")
  userId       String
  user         User      @relation(fields: [userId], references: [id])
  startTime    DateTime
  delayBetween Int
  hourlyLimit  Int
  emails       Email[]
  createdAt    DateTime  @default(now())
}
```

### Email
```prisma
model Email {
  id        String    @id @default(cuid())
  batchId   String
  batch     EmailBatch @relation(fields: [batchId], references: [id])
  to        String
  subject   String
  body      String
  status    String    @default("pending")
  createdAt DateTime  @default(now())
}
```

---

## 🏃 Running the Application

### Development

**Terminal 1: Start Next.js dev server**
```bash
npm run dev
```
Runs on `http://localhost:3000`

**Terminal 2: Start email worker**
```bash
node workers/email.worker.js
```
Processes scheduled emails continuously

**Terminal 3 (optional): View Redis data**
```bash
redis-cli
> KEYS *
> GET key-name
```

### Production Build
```bash
npm run build
npm run start
```

### Linting & Format
```bash
npm run lint
```

---

## 🐛 Troubleshooting

### Issue: Build fails with TypeScript errors
```bash
npm run build
# Check output for file paths and line numbers
```

### Issue: Redis connection error
```bash
redis-cli ping
# Should respond: PONG
# If not, start Redis: docker run -d -p 6379:6379 redis:latest
```

### Issue: Emails not sending
1. Check worker is running: `node workers/email.worker.js`
2. Verify Redis is running: `redis-cli ping`
3. Check `.env` has correct Ethereal credentials
4. View worker logs for error messages

### Issue: Login not working
1. Verify Google OAuth credentials in `.env`
2. Ensure `NEXTAUTH_SECRET` is set
3. Check database has sessions table: `npx prisma migrate status`

---

## 📝 Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXTAUTH_URL` | NextAuth callback URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Session encryption key | `random-secret-key` |
| `GOOGLE_CLIENT_ID` | OAuth client ID | From Google Console |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | From Google Console |
| `DATABASE_URL` | Prisma database URL | `file:./dev.db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `ETHEREAL_USER` | Ethereal email address | `user@ethereal.email` |
| `ETHEREAL_PASS` | Ethereal password | From ethereal.email |
| `MAX_EMAILS_PER_HOUR` | Rate limit | `1` |
| `EMAIL_DELAY_MS` | Delay between sends | `2000` |
| `WORKER_CONCURRENCY` | Parallel sends | `2` |

---

## 🤝 Contributing

When sharing changes:
1. Create a patch file: `git diff > changes.patch`
2. Share the patch file with collaborators
3. They apply with: `git apply changes.patch`

---

## 📄 License

MIT



  * Delay between emails
  * Hourly rate limit

---

## 🚦 Rate Limiting & Throttling

* Redis-backed counters track emails sent per hour
* Configurable via environment variables
* When hourly limit is exceeded:

  * ❌ Emails are NOT dropped
  * ❌ Job is NOT permanently failed
  * ✅ Job is retried in the next hour window

---

## 🔁 Restart Safety & Idempotency

### Restart Safety

* Delayed jobs live in Redis
* Worker reconnects automatically
* Future emails still send at correct time

### Idempotency

* Emails are processed only if `status = pending`
* Sent emails are never reprocessed
* Restarting worker does not cause duplicates

---

## ⚙️ Environment Variables

Create a `.env` file:

```env
DATABASE_URL="file:./dev.db"
REDIS_URL="redis://localhost:6379"

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=supersecret

GOOGLE_CLIENT_ID=xxxx
GOOGLE_CLIENT_SECRET=xxxx

ETHEREAL_USER=xxxx@ethereal.email
ETHEREAL_PASS=xxxx

MAX_EMAILS_PER_HOUR=100
EMAIL_DELAY_MS=2000
WORKER_CONCURRENCY=2
```

---

## 🧠 Redis Setup (Local)

### Install Redis (Windows)

1. Download Redis:

```
https://github.com/tporadowski/redis/releases
```

2. Install and run:

```bash
redis-server
```

Verify:

```bash
redis-cli ping
# PONG
```

---

## 📧 Ethereal SMTP Setup

Ethereal is a **fake SMTP service** used for testing.

### Create account

```bash
node -e "require('nodemailer').createTestAccount().then(console.log)"
```

Add credentials to `.env`.

### Email Preview

After sending, worker logs:

```
Preview URL: https://ethereal.email/message/XXXX
```

Open URL to view email.

---

## ▶️ Running the Project

### Start Redis

```bash
redis-server
```

### Start Next.js backend

```bash
npm run dev
```

### Start worker (separate terminal)

```bash
npm run worker
```

---

## 📡 API Reference & Testing

> ⚠️ All APIs require authentication
> Use browser (cookies) for testing

---

### 1️⃣ Create Email Batch (Campaign)

```
POST /api/batch/create
```

#### Request Body

```json
{
  "name": "Test Campaign",
  "startTime": "2026-01-20T11:10:00Z",
  "delayBetween": 2,
  "hourlyLimit": 100
}
```

#### Response

```json
{
  "id": "batch_id",
  "status": "scheduled"
}
```

---

### 2️⃣ Add Email to Batch

```
POST /api/email/add
```

#### Request Body

```json
{
  "batchId": "batch_id",
  "to": "test@example.com",
  "subject": "Hello",
  "bodyText": "This is a test email"
}
```

---

### 3️⃣ Get Scheduled Emails (Dashboard)

```
GET /api/email/scheduled
```

Returns all pending emails for logged-in user.

---

### 4️⃣ Get Sent Emails

```
GET /api/email/sent
```

Returns all sent emails.

---

### 5️⃣ Get All Batches

```
GET /api/batch/list
```

Returns all campaigns for user.

---

## 🧪 Testing Restart Safety

1. Create a batch with start time 5 minutes later
2. Stop backend + worker
3. Restart everything
4. Emails still send correctly

---

## 🧪 Testing Rate Limit

1. Set:

```env
MAX_EMAILS_PER_HOUR=1
```

2. Add 3 emails to batch

Expected:

* 1 email sent
* Job retries next hour
* Remaining emails sent later

---

## What This System Does NOT Use

* ❌ cron jobs
* ❌ node-cron
* ❌ agenda
* ❌ in-memory schedulers

---

## ✅ Requirement Compliance Summary

| Requirement         | Status |
| ------------------- | ------ |
| BullMQ delayed jobs | ✅      |
| No cron             | ✅      |
| Restart safe        | ✅      |
| No duplicate emails | ✅      |
| Rate limiting       | ✅      |
| Concurrency         | ✅      |
| Ethereal SMTP       | ✅      |
| Relational DB       | ✅      |

---

## 🏁 Conclusion

This backend demonstrates a **scalable, fault-tolerant email scheduling architecture** with proper rate limiting, authentication, and restart safety — closely matching real-world systems used by email platforms.


