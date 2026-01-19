# 📦 Deployment Guide - Mail Scheduler

Complete deployment instructions for production environments. This guide covers database setup, environment configuration, and deployment to popular platforms.

---

## 📋 Pre-Deployment Checklist

- [ ] All environment variables set up
- [ ] Database migrations applied
- [ ] Redis server running
- [ ] Google OAuth credentials configured
- [ ] Email service (Ethereal/SMTP) configured
- [ ] Build completes successfully
- [ ] Tests passing (if applicable)
- [ ] Worker process configuration ready

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="file:./dev.db"
# For production with PostgreSQL:
# DATABASE_URL="postgresql://user:password@host:port/dbname"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"  # Change to production URL
NEXTAUTH_SECRET="your-secret-key-generate-with-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Redis
REDIS_URL="redis://localhost:6379"
# For production: redis://user:password@host:port

# Email Service (Ethereal for testing, use your SMTP for production)
ETHEREAL_USER="your-ethereal-email@ethereal.email"
ETHEREAL_PASS="your-ethereal-password"

# Worker Configuration
WORKER_CONCURRENCY="2"
MAX_EMAILS_PER_HOUR="100"
EMAIL_DELAY_MS="2000"

# Optional: Enable debug logging
DEBUG="mail-scheduler:*"
```

### Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

---

## 🗄️ Database Setup

### Option 1: SQLite (Development/Small Scale)

SQLite is already configured in `prisma/schema.prisma`. Just run migrations:

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database
npx prisma db seed
```

### Option 2: PostgreSQL (Production Recommended)

1. **Update `prisma/schema.prisma`:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. **Update `.env.local`:**

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/mail_scheduler"
```

3. **Run migrations:**

```bash
npx prisma migrate deploy
```

4. **Verify connection:**

```bash
npx prisma db execute --stdin < /dev/null
```

---

## 🔄 Redis Setup

### Local Development

```bash
# macOS (via Homebrew)
brew install redis
brew services start redis

# Linux (Ubuntu/Debian)
sudo apt-get install redis-server
sudo systemctl start redis-server

# Windows (via WSL or Docker)
docker run -d -p 6379:6379 redis:latest
```

### Production Deployment

**For Vercel/Cloud:**
- Use **Upstash Redis** (recommended): https://upstash.com/
- Use **Redis Cloud**: https://redis.com/cloud/
- Use **AWS ElastiCache**

**Example with Upstash:**
```bash
REDIS_URL="redis://default:your-password@your-endpoint.upstash.io:6379"
```

---

## 🔑 Google OAuth Setup

1. **Go to Google Cloud Console:** https://console.cloud.google.com/

2. **Create a new project:**
   - Click "Create Project"
   - Enter project name: "Mail Scheduler"

3. **Enable OAuth 2.0:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google`

4. **Copy credentials to `.env.local`:**
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

---

## 📨 Email Service Configuration

### Ethereal (Testing Only)

```bash
# Create account at https://ethereal.email

# Add to .env.local
ETHEREAL_USER="your-test-email@ethereal.email"
ETHEREAL_PASS="your-test-password"
```

### Production SMTP (Gmail, SendGrid, AWS SES, etc.)

#### Gmail:

```bash
# Enable 2FA and create App Password
# https://support.google.com/accounts/answer/185833

ETHEREAL_USER="your-email@gmail.com"
ETHEREAL_PASS="your-app-password"
```

Update `workers/email.worker.js` if using different SMTP host:

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",  // Change this
  port: 587,
  auth: {
    user: process.env.ETHEREAL_USER,
    pass: process.env.ETHEREAL_PASS,
  },
});
```

---

## 🚀 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 3. Setup database
npx prisma migrate dev

# 4. Start Redis (in another terminal)
redis-server

# 5. Start Next.js dev server
npm run dev

# 6. Start email worker (in another terminal)
npm run worker

# 7. Access application
# Frontend: http://localhost:3000
# API: http://localhost:3000/api/*
```

---

## 🏗️ Build & Production Setup

### Build the application:

```bash
# Install dependencies
npm install

# Build Next.js
npm run build

# Verify build
npm run start
```

### Run migrations before deployment:

```bash
npx prisma migrate deploy
```

---

## ☁️ Deployment Platforms

### Option 1: Vercel (Recommended for Next.js)

**Advantages:**
- Zero-config deployment
- Automatic scaling
- Built-in Next.js optimizations
- Serverless functions

**⚠️ Limitations:**
- Serverless has timeout limits (10-60 seconds)
- Email worker needs separate container
- Database should be PostgreSQL (not SQLite)

**Setup:**

1. **Push code to GitHub**

2. **Go to Vercel:** https://vercel.com/

3. **Import project:**
   - Click "Import Project"
   - Select your Git repository
   - Configure project settings

4. **Set environment variables:**
   - Go to Settings → Environment Variables
   - Add all variables from `.env.local`

5. **Database:**
   - Switch to PostgreSQL (recommended)
   - Use Vercel Postgres or Upstash PostgreSQL

6. **Redis:**
   - Use Upstash Redis
   - Add `REDIS_URL` environment variable

7. **Deploy:**
   - Click Deploy
   - Vercel automatically builds and deploys

8. **Email Worker (Separate):**

   Create a separate worker deployment (see Docker section below)

**Deployment URL:** https://mail-scheduler-[id].vercel.app

---

### Option 2: Docker + Any Cloud (AWS, DigitalOcean, Railway, etc.)

**Advantages:**
- Full control over environment
- Can run worker process
- Scalable
- Works everywhere

**Dockerfile:**

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy application
COPY . .

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

**Docker Compose (for local development):**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: mail_scheduler
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/mail_scheduler
      REDIS_URL: redis://redis:6379
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: your-secret
      GOOGLE_CLIENT_ID: your-client-id
      GOOGLE_CLIENT_SECRET: your-client-secret
      ETHEREAL_USER: your-email
      ETHEREAL_PASS: your-password
    depends_on:
      - postgres
      - redis

  worker:
    build: .
    command: npm run worker
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/mail_scheduler
      REDIS_URL: redis://redis:6379
      ETHEREAL_USER: your-email
      ETHEREAL_PASS: your-password
      WORKER_CONCURRENCY: 2
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

**Build and run:**

```bash
docker-compose up -d
```

---

### Option 3: Railway

**Advantages:**
- Easy deployment with GitHub
- Built-in PostgreSQL & Redis
- Good for side projects

**Steps:**

1. **Push code to GitHub**

2. **Go to Railway:** https://railway.app/

3. **Create new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"

4. **Add services:**
   - Add PostgreSQL plugin
   - Add Redis plugin

5. **Deploy application:**
   - Railway auto-deploys from GitHub

6. **Set environment variables:**
   - Go to Variables
   - Add all required variables
   - Railway provides `DATABASE_URL` and `REDIS_URL` automatically

---

### Option 4: DigitalOcean App Platform

**Steps:**

1. **Create DigitalOcean account**

2. **Go to App Platform:** https://cloud.digitalocean.com/apps

3. **Create new app:**
   - Select GitHub repository
   - Configure build settings

4. **Add components:**
   - Web service (Next.js app)
   - Worker service (email worker)
   - PostgreSQL database
   - Redis cache

5. **Deploy:**
   - Set environment variables
   - Click Deploy

---

## 🔧 Email Worker Deployment

The worker process is **critical** for email delivery. It must run continuously.

### Option A: Run with PM2 (Recommended for VPS)

```bash
# Install PM2 globally
npm install -g pm2

# Start worker with PM2
pm2 start workers/email.worker.js --name "email-worker"

# Start Next.js with PM2
pm2 start "npm start" --name "next-app"

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup
```

### Option B: Docker Service (Recommended for Cloud)

Already included in Docker Compose above.

### Option C: Separate Container in Kubernetes

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: email-worker
spec:
  containers:
  - name: worker
    image: your-registry/mail-scheduler:latest
    command: ["npm", "run", "worker"]
    env:
    - name: DATABASE_URL
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: url
    - name: REDIS_URL
      valueFrom:
        secretKeyRef:
          name: redis-secret
          key: url
```

---

## ✅ Verification Checklist

After deployment:

- [ ] Application loads at your domain
- [ ] Can log in with Google OAuth
- [ ] Can compose and schedule emails
- [ ] Scheduled emails list displays correctly
- [ ] Can view sent emails
- [ ] Worker process is running (check logs)
- [ ] Emails are being sent (check email inbox)
- [ ] Database connections working
- [ ] Redis connection working
- [ ] No console errors in browser

---

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check DATABASE_URL in .env.local
# Verify database service is running
npx prisma db execute --stdin < /dev/null
```

### Redis Connection Error

```bash
# Verify Redis is running
redis-cli ping
# Should return: PONG

# Check REDIS_URL
redis-cli -u your-redis-url ping
```

### Worker Not Processing Emails

```bash
# Check if worker process is running
pm2 list

# View worker logs
pm2 logs email-worker

# Verify Redis connection in worker
# Check email queue in Redis
redis-cli lrange emailQueue 0 -1
```

### Google OAuth Not Working

- Verify `NEXTAUTH_URL` matches your domain
- Check Google OAuth redirect URIs are configured
- Clear browser cookies and cache
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Emails Not Sending

- Check worker logs: `npm run worker` (local) or container logs (cloud)
- Verify `ETHEREAL_USER` and `ETHEREAL_PASS`
- Check email body is valid HTML/text
- Verify rate limiting not exceeded (`MAX_EMAILS_PER_HOUR`)
- Check Redis for stuck jobs

---

## 🔒 Security Best Practices

- ✅ Use HTTPS only
- ✅ Set strong `NEXTAUTH_SECRET`
- ✅ Never commit `.env.local` to Git
- ✅ Use environment variables for all secrets
- ✅ Rotate Google OAuth credentials periodically
- ✅ Use PostgreSQL in production (not SQLite)
- ✅ Enable database encryption at rest
- ✅ Use Redis AUTH in production
- ✅ Set up rate limiting for API endpoints
- ✅ Monitor email sending for abuse

---

## 📊 Performance Optimization

### Database:
- Add indexes on frequently queried fields
- Use connection pooling (Prisma handles this)
- Archive old emails periodically

### Redis:
- Monitor memory usage
- Set appropriate TTLs for cache keys
- Use Upstash for managed Redis

### Email Worker:
- Adjust `WORKER_CONCURRENCY` based on CPU
- Set `EMAIL_DELAY_MS` appropriately
- Monitor queue depth in Redis

### Frontend:
- Images are already optimized by Next.js
- Use React.memo for expensive components
- Enable compression at reverse proxy level

---

## 📈 Scaling Considerations

As usage grows:

1. **Database:** Migrate from SQLite to PostgreSQL
2. **Redis:** Use managed Redis (Upstash, Redis Cloud)
3. **Worker:** Run multiple worker instances with same Redis
4. **API:** Deploy multiple API instances behind load balancer
5. **Storage:** Consider S3 for file uploads if added

---

## 🚨 Monitoring & Logs

### Application Logs:
```bash
# Vercel
vercel logs

# Docker
docker logs container-name

# PM2
pm2 logs email-worker
```

### Database:
```bash
# PostgreSQL logs
SELECT * FROM pg_stat_statements;
```

### Redis:
```bash
# Monitor Redis commands
redis-cli monitor

# Check queue size
redis-cli llen emailQueue
```

---

## 📞 Support & Resources

- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- NextAuth Docs: https://next-auth.js.org/
- BullMQ Docs: https://docs.bullmq.io/
- Redis Docs: https://redis.io/docs/
- Nodemailer: https://nodemailer.com/

---

**Happy deploying! 🎉**
