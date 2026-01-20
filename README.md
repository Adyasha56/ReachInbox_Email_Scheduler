# 📧 ReachInbox Email Scheduler

A **production-grade email scheduling application** built with Next.js, BullMQ, Redis, and Prisma. Schedule, compose, and manage bulk email campaigns with rate limiting, delayed sending, and real-time tracking.

![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Redis](https://img.shields.io/badge/Redis-5.0+-red?logo=redis)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)
![BullMQ](https://img.shields.io/badge/BullMQ-Job_Queue-orange)

---

## ✨ Features Implemented

### Backend Features
| Feature | Description | Implementation |
|---------|-------------|----------------|
| 📅 **Email Scheduling** | Schedule emails for future delivery | BullMQ delayed jobs with configurable start time |
| 💾 **Persistence** | Emails survive server restarts | Prisma + PostgreSQL/SQLite for data, Redis for job queue |
| 🚦 **Rate Limiting** | Prevent SMTP throttling | Redis counters with hourly limits |
| ⚡ **Concurrency Control** | Parallel email processing | Worker concurrency config |
| 🔐 **Authentication** | Secure Google OAuth login | NextAuth with session management |
| 📊 **Job Queue** | Reliable background processing | BullMQ with retry and backoff |

### Frontend Features
| Feature | Description |
|---------|-------------|
| 🔑 **Login Page** | Google OAuth authentication |
| 📊 **Dashboard** | Overview with sidebar navigation |
| ✏️ **Compose Email** | Rich text editor with TipTap |
| 📋 **Scheduled Emails Table** | View pending emails with search |
| ✅ **Sent Emails Table** | View sent emails with status |
| 📄 **Email Detail View** | Full email content display |
| 📁 **CSV/TXT Upload** | Bulk recipient import |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│                                                                     │
│   ┌─────────┐  ┌─────────┐  ┌───────────┐  ┌─────────────────────┐ │
│   │  Login  │  │ Compose │  │ Scheduled │  │   Sent Emails       │ │
│   │  Page   │  │  Email  │  │   Table   │  │   Table + Detail    │ │
│   └────┬────┘  └────┬────┘  └─────┬─────┘  └──────────┬──────────┘ │
└────────┼────────────┼─────────────┼────────────────────┼────────────┘
         │            │             │                    │
         ▼            ▼             ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES (Backend)                     │
│                                                                     │
│   /api/auth/*          → NextAuth + Google OAuth                   │
│   /api/batch/create    → Create email campaign batch               │
│   /api/batch/list      → List all batches                          │
│   /api/email/add       → Add email to batch                        │
│   /api/email/sent      → Get sent emails                           │
│   /api/email/scheduled → Get scheduled emails                      │
│   /api/email/[id]      → Get email details                         │
│   /api/health          → Health check endpoint                     │
└────────────┬───────────────────────┬────────────────────────────────┘
             │                       │
             ▼                       ▼
┌────────────────────────┐  ┌────────────────────────┐
│     PRISMA ORM         │  │      BULLMQ QUEUE      │
│                        │  │                        │
│  • User management     │  │  • Delayed job         │
│  • Email batches       │  │    scheduling          │
│  • Email records       │  │  • Job persistence     │
│  • Session storage     │  │  • Retry with backoff  │
└───────────┬────────────┘  └───────────┬────────────┘
            │                           │
            ▼                           ▼
┌────────────────────────┐  ┌────────────────────────┐
│   PostgreSQL/SQLite    │  │        REDIS           │
│                        │  │                        │
│  • Persistent storage  │  │  • Job queue storage   │
│  • User data           │  │  • Rate limit counters │
│  • Email history       │  │  • Session cache       │
└────────────────────────┘  └───────────┬────────────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │    WORKER PROCESS      │
                           │  (email.worker.js)     │
                           │                        │
                           │  ┌──────────────────┐  │
                           │  │ 1. Fetch pending │  │
                           │  │    emails        │  │
                           │  └────────┬─────────┘  │
                           │           ▼            │
                           │  ┌──────────────────┐  │
                           │  │ 2. Check rate    │  │
                           │  │    limit (Redis) │  │
                           │  └────────┬─────────┘  │
                           │           ▼            │
                           │  ┌──────────────────┐  │
                           │  │ 3. Send via SMTP │  │
                           │  │    (Ethereal)    │  │
                           │  └────────┬─────────┘  │
                           │           ▼            │
                           │  ┌──────────────────┐  │
                           │  │ 4. Update status │  │
                           │  │    in database   │  │
                           │  └──────────────────┘  │
                           └───────────┬────────────┘
                                       ▼
                           ┌────────────────────────┐
                           │   ETHEREAL SMTP        │
                           │   (Test Email Service) │
                           │                        │
                           │   • Fake SMTP server   │
                           │   • Preview emails     │
                           │   • No real delivery   │
                           └────────────────────────┘
```

---

## 🔄 How Scheduling Works

### Email Scheduling Flow

```
User clicks "Send"
        │
        ▼
┌─────────────────────────────────────┐
│ 1. CREATE BATCH                     │
│    POST /api/batch/create           │
│    • Stores batch in database       │
│    • Creates BullMQ delayed job     │
│    • Job delay = startTime - now    │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 2. ADD EMAILS TO BATCH              │
│    POST /api/email/add (per email)  │
│    • Stores each email with         │
│      status: "pending"              │
│    • Links to batch via batchId     │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 3. JOB WAITS IN QUEUE               │
│    BullMQ holds job until           │
│    scheduled time                   │
└─────────────────┬───────────────────┘
                  │
                  ▼ (When time arrives)
┌─────────────────────────────────────┐
│ 4. WORKER PICKS UP JOB              │
│    • Fetches pending emails         │
│    • Processes each with delay      │
│    • Updates status to "sent"       │
└─────────────────────────────────────┘
```

### Persistence on Restart

**Problem:** What happens if the server crashes?

**Solution:**
| Component | Persistence Mechanism |
|-----------|----------------------|
| Email Data | Stored in PostgreSQL/SQLite via Prisma |
| Job Queue | Redis persists BullMQ jobs |
| User Sessions | Database-backed sessions |

**On Restart:**
1. BullMQ reconnects to Redis
2. Pending jobs resume automatically
3. Worker continues processing from where it left off
4. No emails are lost or duplicated

### Rate Limiting Implementation

```javascript
// In email.worker.js
const hourKey = `email_count:${batchId}:${new Date().getUTCHours()}`;

// Increment counter
const count = await redis.incr(hourKey);

// Set expiry on first use
if (count === 1) {
  await redis.expire(hourKey, 3600); // 1 hour TTL
}

// Check limit
if (count > HOURLY_LIMIT) {
  await redis.decr(hourKey);
  throw new Error("HOURLY_LIMIT_REACHED");
  // BullMQ will retry after backoff
}
```

**Rate Limit Config:**
```env
MAX_EMAILS_PER_HOUR=100   # Emails per hour per batch
EMAIL_DELAY_MS=2000       # 2 second delay between sends
```

### Concurrency Control

```javascript
// Worker configuration
new Worker("emailQueue", processor, {
  concurrency: Number(process.env.WORKER_CONCURRENCY || 2),
  connection: { host: "127.0.0.1", port: 6379 }
});
```

- **concurrency: 2** = 2 emails processed in parallel
- Prevents overwhelming SMTP server
- Configurable via `WORKER_CONCURRENCY`

---

## 🚀 How to Run (Local Development)

### Prerequisites

| Requirement | Version | Installation |
|-------------|---------|--------------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Redis | 5.0+ | See below |
| Git | Any | [git-scm.com](https://git-scm.com) |

---

### Step 1: Install Redis Locally

**Windows:**
```powershell
# Option 1: Using Chocolatey
choco install redis-64

# Option 2: Download from GitHub
# https://github.com/microsoftarchive/redis/releases

# Start Redis
redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

**Docker (All platforms):**
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

**Verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

---

### Step 2: Clone & Install

```bash
git clone https://github.com/Adyasha56/ReachInbox_Email_Scheduler.git
cd ReachInbox_Email_Scheduler
npm install
```

---

### Step 3: Setup Ethereal Email (Test SMTP)

1. Go to [https://ethereal.email](https://ethereal.email)
2. Click **"Create Ethereal Account"**
3. Copy the credentials:
   - Email: `xxxx@ethereal.email`
   - Password: `xxxxxxxxx`

> **Note:** Ethereal is a fake SMTP service. Emails are NOT delivered to real inboxes. You can view sent emails via the preview URL in worker logs.

---

### Step 4: Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth Client ID**
5. Application type: **Web application**
6. Add **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Copy **Client ID** and **Client Secret**

---

### Step 5: Create Environment File

Create `.env` file in project root:

```env
# Database (Use Neon PostgreSQL or local SQLite)
DATABASE_URL='postgresql://user:password@host/dbname?sslmode=require'
# For SQLite (simpler): DATABASE_URL="file:./dev.db"

# Redis (Local)
REDIS_URL=redis://127.0.0.1:6379

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-at-least-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Ethereal Email (from Step 3)
ETHEREAL_USER=your-ethereal-email@ethereal.email
ETHEREAL_PASS=your-ethereal-password

# Email Scheduling Config
MAX_EMAILS_PER_HOUR=100
EMAIL_DELAY_MS=2000
WORKER_CONCURRENCY=2
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
# Or use: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

### Step 6: Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev
```

---

### Step 7: Run the Application

You need **TWO terminals** running simultaneously:

**Terminal 1: Start Next.js (Frontend + Backend API)**
```bash
npm run dev
```
Server runs at: `http://localhost:3000`

**Terminal 2: Start Email Worker (BullMQ + Redis)**
```bash
npm run worker
# Or: node workers/email.worker.js
```

---

### Step 8: Test the Application

1. Open `http://localhost:3000` in browser
2. Click **"Login with Google"**
3. Go to **Compose** page
4. Add recipient emails, subject, and body
5. Set schedule time (1-2 minutes from now)
6. Click **"Send"**
7. Watch Terminal 2 (worker) for:
   ```
   📦 Processing batch: cmxxxxxx
   Sent: recipient@email.com
   Preview: https://ethereal.email/message/xxxxx
   Batch finished: cmxxxxxx
   ```
8. Click the **Preview URL** to see the email in Ethereal
9. Check **Sent** tab - email shows with "sent" status

---

## 📁 Project Structure

```
mail-scheduler/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Backend)
│   │   ├── auth/[...nextauth]/   # NextAuth handlers
│   │   ├── batch/                # Batch endpoints
│   │   │   ├── create/route.ts   # Create campaign
│   │   │   └── list/route.ts     # List batches
│   │   ├── email/                # Email endpoints
│   │   │   ├── add/route.js      # Add email to batch
│   │   │   ├── sent/route.ts     # Get sent emails
│   │   │   ├── scheduled/route.ts# Get pending emails
│   │   │   └── [id]/route.ts     # Email details
│   │   └── health/route.ts       # Health check
│   ├── dashboard/                # Dashboard pages
│   │   ├── compose/page.tsx      # Email composer
│   │   ├── scheduled/page.tsx    # Scheduled emails table
│   │   ├── sent/page.tsx         # Sent emails table
│   │   └── layout.tsx            # Dashboard layout
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Login page
├── components/                   # React components
│   ├── auth/login-form.tsx       # Login UI
│   ├── emails/                   # Email components
│   │   ├── compose-email-dialog.tsx
│   │   ├── scheduled-emails-table.tsx
│   │   └── sent-emails-table.tsx
│   ├── layout/                   # Header, Sidebar
│   └── ui/                       # shadcn/ui components
├── lib/                          # Backend utilities
│   ├── auth.ts                   # NextAuth config
│   ├── prisma.ts                 # Prisma client (API)
│   ├── prisma.js                 # Prisma client (Worker)
│   ├── queue.ts                  # BullMQ queue
│   ├── redis.ts                  # Redis client (API)
│   └── redis.js                  # Redis client (Worker)
├── workers/
│   └── email.worker.js           # Background job processor
├── prisma/
│   └── schema.prisma             # Database schema
└── .env                          # Environment variables
```

---

## 🐛 Challenges Faced & Solutions

### Local Development Challenges

| Challenge | Problem | Solution |
|-----------|---------|----------|
| **Redis Version Warning** | BullMQ recommends Redis 6.2+, Windows has 5.x | Works with warnings; use Docker for latest version |
| **ES Module Warning** | Worker uses ES modules without `"type": "module"` | Warning only, doesn't affect functionality |
| **TipTap SSR Hydration** | Rich text editor mismatch on hydration | Added `immediatelyRender: false` to editor config |
| **OAuth Redirect Issues** | Login redirects to wrong URL | Ensure `NEXTAUTH_URL=http://localhost:3000` in .env |
| **Prisma Connection Pool** | "Timed out fetching connection" error | Use singleton pattern, add connection cleanup |

### Deployment Challenges (Vercel - Attempted)

We attempted to deploy on Vercel but faced significant challenges:

| Challenge | Problem | Why It Failed |
|-----------|---------|---------------|
| **No Background Workers** | Vercel is serverless, functions timeout after 10s | BullMQ workers need to run continuously |
| **Redis Connection Type** | BullMQ needs TCP connection, Upstash provides REST | ioredis with TLS required for Upstash |
| **ioredis Type Mismatch** | BullMQ's internal ioredis version differs | Use connection config object, not Redis instance |
| **Cold Starts** | Serverless cold starts delay job processing | Not suitable for time-sensitive email scheduling |
| **Prisma Connection Limits** | Serverless creates many connections | Connection pooling issues on free tier |

### Why We Run Locally

After attempting Vercel deployment, we discovered:

1. **Vercel is Serverless:**
   - Functions timeout after 10 seconds (free tier)
   - No persistent background workers
   - Each request spawns new instance

2. **BullMQ Requirements:**
   - Needs persistent Redis TCP connection
   - Workers must run continuously 24/7
   - Not compatible with serverless architecture

3. **For Production Deployment, Consider:**
   - **Railway.app** - Supports workers + Redis
   - **Render.com** - Background worker support
   - **DigitalOcean App Platform** - Worker processes
   - **AWS EC2 / Self-hosted** - Full control

---

## 📊 API Reference

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signin/google` | POST | Initiate Google login |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/signout` | POST | Logout |

### Batch Management
| Endpoint | Method | Description | Body |
|----------|--------|-------------|------|
| `/api/batch/create` | POST | Create campaign | `{name, startTime, delayBetween, hourlyLimit}` |
| `/api/batch/list` | GET | List batches | - |

### Email Management
| Endpoint | Method | Description | Body |
|----------|--------|-------------|------|
| `/api/email/add` | POST | Add email to batch | `{batchId, to, subject, bodyText}` |
| `/api/email/sent` | GET | Get sent emails | - |
| `/api/email/scheduled` | GET | Get pending emails | - |
| `/api/email/[id]` | GET | Get email detail | - |

---

## 🔧 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | Database connection | `file:./dev.db` or PostgreSQL URL |
| `REDIS_URL` | ✅ | Redis connection | `redis://127.0.0.1:6379` |
| `NEXTAUTH_URL` | ✅ | App base URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | ✅ | Session encryption | Random 32+ char string |
| `GOOGLE_CLIENT_ID` | ✅ | OAuth client ID | From Google Console |
| `GOOGLE_CLIENT_SECRET` | ✅ | OAuth secret | From Google Console |
| `ETHEREAL_USER` | ✅ | Test SMTP email | `xxx@ethereal.email` |
| `ETHEREAL_PASS` | ✅ | Test SMTP password | From Ethereal |
| `MAX_EMAILS_PER_HOUR` | ❌ | Rate limit (default: 100) | `100` |
| `EMAIL_DELAY_MS` | ❌ | Delay between sends | `2000` (2 seconds) |
| `WORKER_CONCURRENCY` | ❌ | Parallel workers | `2` |

---

## 📝 Database Schema

```prisma
model User {
  id            String       @id @default(cuid())
  email         String       @unique
  name          String?
  image         String?
  batches       EmailBatch[]
  sessions      Session[]
  accounts      Account[]
}

model EmailBatch {
  id           String   @id @default(cuid())
  name         String
  status       String   @default("scheduled")
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  startTime    DateTime
  delayBetween Int
  hourlyLimit  Int
  emails       Email[]
  createdAt    DateTime @default(now())
}

model Email {
  id        String     @id @default(cuid())
  batchId   String
  batch     EmailBatch @relation(fields: [batchId], references: [id])
  from      String
  to        String
  subject   String
  body      String
  status    String     @default("pending")
  createdAt DateTime   @default(now())
}
```

---

## 🧪 Testing Workflow

### Test Email Scheduling

1. **Start both servers** (dev + worker)
2. **Login** with Google OAuth
3. **Compose** an email with:
   - Recipient: any valid email format
   - Subject: Test subject
   - Body: Some content
   - Schedule: 1-2 minutes from now
4. **Click Send**
5. **Watch worker terminal:**
   ```
   📦 Processing batch: cmxxxxxx
   Sent: test@example.com
   Preview: https://ethereal.email/message/xxxxx
   Batch finished: cmxxxxxx
   ```
6. **Click Preview URL** to view email in Ethereal
7. **Check Sent tab** - status should be "sent"

### Test Rate Limiting

1. Set `MAX_EMAILS_PER_HOUR=2` in .env
2. Restart worker
3. Schedule 5 emails
4. Worker will send 2, then pause
5. After 1 hour (or reset), remaining emails process

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Adyasha56**

- GitHub: [@Adyasha56](https://github.com/Adyasha56)
- Project: [ReachInbox Email Scheduler](https://github.com/Adyasha56/ReachInbox_Email_Scheduler)

---

## 🙏 Tech Stack & Acknowledgments

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org) | React framework with App Router |
| [BullMQ](https://docs.bullmq.io) | Redis-based job queue |
| [Prisma](https://prisma.io) | Type-safe database ORM |
| [Redis](https://redis.io) | In-memory data store |
| [NextAuth](https://next-auth.js.org) | Authentication |
| [shadcn/ui](https://ui.shadcn.com) | UI component library |
| [TipTap](https://tiptap.dev) | Rich text editor |
| [Ethereal](https://ethereal.email) | Fake SMTP for testing |
| [Tailwind CSS](https://tailwindcss.com) | Utility-first CSS |
