# MTU One ID Portal

Digital student ID card management system for Mountain Top University with payment processing, admin verification workflows, and receipt generation.

## Tech Stack

- **Framework**: React 19, TypeScript, Vite 8
- **Styling**: Tailwind CSS 4, shadcn/ui (Radix Nova primitives)
- **Routing**: react-router-dom v7
- **Backend**: Supabase (PostgreSQL, REST API)
- **PDF**: react-to-pdf, jsbarcode

## Features

- **Student Login** — Matric number + password authentication
- **Digital ID Card** — 3D flip card with front/back faces, responsive scaling, PDF download
- **Payment Portal** — Simulated payment flow upserting pending verification records
- **ID Status Polling** — Automatic 60-second check; redirects to payment on expiry/revocation
- **Public Verification** — `/verify/:id` route shows student identity and courses; only active/expiring-soon IDs display as verified
- **Admin Dashboard** — Routed sub-views:
  - **Awaiting Verification** — Verify/waitlist pending students with bulk actions
  - **Waitlisted** — Review and verify waitlisted students
  - **ID Status** — Overview with filters, search, revoke capability
  - **Transactions** — Filterable payment log with CSV export and pagination
- **Receipt Modal** — Full-screen overlay with PDF download, includes receipt number and validity period
- **Status Page** — Post-payment status with 30-second polling and auto-redirect

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run SQL migrations from `supabase/migrations/` in the Supabase SQL editor (001–004 in order).

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Migrations

Located in `supabase/migrations/`:

1. `001_create_payment_transactions.sql` — Append-only payment log
2. `002_create_id_replacements.sql` — ID replacement records with verification columns and trigger
3. `003_invalidate_expired_ids.sql` — Expiry sweep function, `get_id_status` RPC, pg_cron schedule
4. `004_remove_verified_by.sql` — Drop deprecated `verified_by` column

Requires `pg_cron` extension for automatic expiry invalidation.

## Project Structure

```
src/
├── components/
│   ├── admin/       # VerifyDialog, WaitlistDialog, AdminNavbar
│   └── ui/          # shadcn/ui primitives (button, dialog, badge, etc.)
├── hooks/           # Custom hooks (useIDStatusPoll)
├── layouts/         # AdminLayout, MainLayout
├── lib/             # Utilities (idStatus, receipt, supabase client)
└── pages/
    ├── admin/       # AwaitingVerification, Waitlisted, IDStatus, Transactions
    └── ...          # Home, Signup, IDCard, Verify, Status, Payment
```
