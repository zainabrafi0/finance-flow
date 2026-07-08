# FinanceFlow — Personal Finance Dashboard Monorepo

FinanceFlow is a premium, real-time personal finance manager built using a modern TypeScript stack. It enables users to control their portfolios, manage multi-currency accounts, create dynamic budgets with live alerts, track savings goals, and automate recurring transaction plans.

---

## 🚀 Key Features

* **Real-time WebSockets**: Dynamic wallet balance syncing and budget notifications (warning at 80%, critical alert at 100%) delivered instantly using Socket.io.
* **High-Speed Redis Caching**: Dashboard statistics and heavy database aggregations are cached in memory for sub-5ms load times, with auto-invalidation on mutations.
* **OTP Verification**: Secure sign-up email confirmation and password reset workflows using expiring Mongoose TTL indexes and Nodemailer SMTP.
* **Recurring Transactions Engine**: Autonomous daily scheduler processing monthly subscriptions, salary inputs, or regular bills.
* **Security & Audit Logs**: Immutable chronological logging of user activities (login sessions, profile alterations, wallet modifications).
* **Premium Glassmorphic Design**: Curated pastel color schemes, smooth micro-animations, and true Dark Mode support with high contrast layout styling.

---

## 📁 Repository Structure

```
finance-flow/
├── frontend/        # Next.js App Router frontend application
└── backend/         # NestJS modular architecture backend application
```

### 1. Frontend Technologies
* Next.js App Router (React 19)
* Redux Toolkit (Global State Management)
* Axios (Http client with HttpOnly cookie credentials)
* TailwindCSS & PostCSS (Styling)
* Socket.io-client (Real-time gateway listeners)
* Recharts (Interactive visualization charts)

### 2. Backend Technologies
* NestJS (Modules, Controllers, Services, Guards)
* MongoDB & Mongoose (Database models, schemas, TTL indexes)
* WebSockets Gateway (Socket.io room integration)
* Cache Manager & Redis (Response performance caching)
* Nodemailer (Email verification SMTP system)
* Passport JWT (Secure cookie-based validation guards)

---

## 🛠️ Installation & Setup

### Prerequisites
* Node.js (v18 or higher)
* MongoDB (Local or Atlas)
* Redis (Optional, falls back to memory cache if empty)
* SMTP Server (Gmail App Password or AWS SES credentials)

### Step 1: Environment Configuration
Create `.env` files in both subdirectories using the templates:

* **Backend**: Copy `backend/.env.example` to `backend/.env` and specify port, database URL, SMTP configuration, and optional Redis URL.
* **Frontend**: Copy `frontend/.env.example` (or set `NEXT_PUBLIC_API_URL` to point to the backend server, typically `http://localhost:3001`).

### Step 2: Running Backend
```bash
cd backend
npm install
npm run start:dev
```

### Step 3: Running Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
