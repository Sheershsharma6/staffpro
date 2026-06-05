# StaffPro — Recruitment & Staffing Platform

A complete self-hosted platform for Recruitment, Training, Marketing, Placement, and Subscription management. Built with React + Node.js + PostgreSQL.

---

## Stack

| Layer      | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Vite + TailwindCSS       |
| Backend   | Node.js + Express                   |
| Database  | PostgreSQL                          |
| ORM       | Prisma                              |
| Auth      | JWT                                 |
| Payments  | Stripe                              |
| Deploy    | Docker + Docker Compose             |

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker (optional for containerized setup)

### 2. Clone and configure
```bash
git clone <your-repo>
cd staffpro
cp .env.example backend/.env
# Edit backend/.env with your DB, JWT secret, and Stripe keys
```

### 3. Database setup
```bash
cd backend
npm install
npx prisma migrate dev --name init
node src/utils/seed.js
```

### 4. Start backend
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### 5. Start frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Default login
- **Email:** admin@staffpro.com
- **Password:** Admin@123

---

## Docker Deployment (Production)

```bash
# Create .env in project root
cat > .env << EOF
DB_PASSWORD=your_secure_db_password
JWT_SECRET=your_64_char_random_string_here
FRONTEND_URL=https://your-domain.com
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
EOF

# Build and start
cd docker
docker compose up -d --build

# First-time: run migrations + seed
docker compose exec backend npx prisma migrate deploy
docker compose exec backend node src/utils/seed.js
```

---

## Stripe Setup

1. Create account at https://dashboard.stripe.com
2. Get API keys from Dashboard > Developers > API keys
3. Create subscription plans in Dashboard > Products
4. Copy the Price ID (starts with `price_`) for each plan
5. Set up webhook endpoint: `POST https://your-domain.com/api/payments/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `customer.subscription.*`, `invoice.payment_succeeded`
6. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Role Permissions Matrix

| Role                     | Candidates | Recruitment | Training | Marketing | Interviews | Placement | Payments | Admin |
|--------------------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| SUPER_ADMIN / ADMIN      | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| RECRUITMENT_MANAGER      | ✅ | ✅ | 👁 | 👁 | 👁 | 👁 | ❌ | ❌ |
| SALES_RECRUITER          | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| TRAINING_MANAGER         | 👁 | ❌ | ✅ | ❌ | 👁 | ❌ | ❌ | ❌ |
| TRAINER                  | 👁 | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| MARKETING_MANAGER        | 👁 | ❌ | ❌ | ✅ | ✅ | 👁 | ❌ | ❌ |
| DAY_MARKETING_RECRUITER  | 👁 | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| NIGHT_MARKETING_RECRUITER| 👁 | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| PLACEMENT_MANAGER        | 👁 | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| FINANCE_ADMIN            | 👁 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| CANDIDATE_CUSTOMER       | 👁 own | ❌ | ❌ | ❌ | ❌ | ❌ | 👁 own | ❌ |

✅ = Full access | 👁 = Read only | ❌ = No access

---

## Folder Structure

```
staffpro/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server entry
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT + role guards
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── candidates.js
│   │   │   ├── recruitment.js    # Also exports training + marketing routers
│   │   │   ├── training.js
│   │   │   ├── marketing.js
│   │   │   ├── interviews.js
│   │   │   ├── placements.js
│   │   │   ├── payments.js       # Full Stripe integration
│   │   │   ├── reports.js
│   │   │   ├── admin.js
│   │   │   └── users.js
│   │   ├── services/
│   │   │   ├── activityService.js
│   │   │   └── resumeParser.js   # PDF parsing + skill extraction
│   │   └── utils/
│   │       └── seed.js           # Initial admin + status configs
│   ├── prisma/
│   │   └── schema.prisma         # Full database schema
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Router
│   │   ├── lib/api.js            # Axios client
│   │   ├── store/authStore.js    # Zustand auth
│   │   ├── components/layout/Layout.jsx
│   │   └── pages/
│   │       ├── auth/LoginPage.jsx
│   │       ├── dashboard/DashboardPage.jsx
│   │       ├── candidates/       # List, Add, Profile
│   │       ├── recruitment/RecruitmentPage.jsx
│   │       ├── training/
│   │       ├── marketing/
│   │       ├── interviews/
│   │       ├── placement/
│   │       ├── payments/
│   │       ├── reports/
│   │       └── admin/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── prisma/schema.prisma          # Shared schema reference
├── docker/docker-compose.yml
└── .env.example
```

---

## API Reference

### Auth
- `POST /api/auth/login` — Login, returns JWT
- `GET /api/auth/me` — Get current user

### Candidates
- `GET /api/candidates` — List (search, country, source, page)
- `POST /api/candidates` — Create
- `GET /api/candidates/:id` — Full profile
- `PATCH /api/candidates/:id` — Update
- `POST /api/candidates/:id/resume` — Upload resume (multipart)
- `POST /api/candidates/:id/notes` — Add note

### Pipeline
- `GET/PATCH /api/recruitment/:candidateId`
- `GET/PATCH /api/training/:candidateId`
- `GET/PATCH /api/marketing/:candidateId`

### Interviews
- `GET /api/interviews` — List with filters
- `POST /api/interviews` — Create interview/screening/assessment
- `PATCH /api/interviews/:id` — Update

### Placements
- `GET /api/placements` — List
- `POST /api/placements` — Create
- `PATCH /api/placements/:id` — Update

### Payments (Stripe)
- `GET /api/payments/plans` — List subscription plans
- `POST /api/payments/create-customer` — Create Stripe customer
- `POST /api/payments/create-subscription` — Create subscription
- `POST /api/payments/cancel-subscription` — Cancel
- `GET /api/payments/portal/:candidateId` — Stripe Customer Portal URL
- `GET /api/payments/history/:candidateId` — Payment history
- `POST /api/payments/webhook` — Stripe webhook handler

### Reports
- `GET /api/reports/dashboard`
- `GET /api/reports/recruitment`
- `GET /api/reports/training`
- `GET /api/reports/marketing`
- `GET /api/reports/placement`
- `GET /api/reports/interviews`
- `GET /api/reports/payments`

### Admin
- `GET/POST/PATCH/DELETE /api/admin/statuses` — Manage status configs
- `GET/POST/PATCH/DELETE /api/users` — User management

---

## License

This code is fully owned by you. No open-source restrictions on the business logic.
