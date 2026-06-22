## Goal
- Build a TID Portal — a digital student ID card management system with payment processing, receipt generation, admin dashboard, Supabase backend, and a payment-to-verification workflow.

## Constraints & Preferences
- Stack: React 19, TypeScript, Vite 8, Tailwind CSS 4, shadcn/ui (Radix Nova), react-router-dom v7, Supabase JS v2
- Project uses `@/` path alias, `cn()` utility for classes, dark mode via `.dark` class
- Supabase env vars in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Payment is simulated (no real gateway), passwords stored in plaintext (needs migration to Supabase Auth)
- All SQL migrations saved to `supabase/migrations/` — not applied to Supabase yet
- No server-side cron on the client — expiry enforced by reading `expires_at` and comparing to `Date.now()` at runtime
- `erasableSyntaxOnly` TS option enabled — no parameter properties in constructors

## Progress
### Done
- Analyzed project and created `AGENT.md` with architecture, conventions, routes, and data flow
- Fixed column name errors (`student_id` → `matric_number`) in `PaymentPortal.tsx` and `types/database.ts`
- Fixed ID card responsive scaling with fluid `calc(100vw / 600)` and `overflow: hidden`
- Removed unused `InfoItem` component from `IDCard.tsx`
- Created `src/lib/receipt.ts` with `generateReceiptNumber()` (MTU-YYYYMMDD-XXXXXX) and `formatReceiptDate()`
- Created `src/components/ReceiptModal.tsx` — full-screen overlay receipt with `react-to-pdf`, displays receipt number, student details, amount, validity period, status badge, PDF download
- Created `supabase/migrations/001_create_payment_transactions.sql` — append-only log table with indexes and comment
- Created `supabase/migrations/002_create_id_replacements.sql` — id_replacements table with verification columns (`verification_status`, `verified_at`, `verified_by`, `waitlist_reason`), nullable `expires_at`, BEFORE INSERT OR UPDATE trigger that only auto-sets `expires_at` when `verification_status = 'verified'`
- Created `supabase/migrations/003_invalidate_expired_ids.sql` — sweep function, `get_id_status` RPC, pg_cron schedule, preview query
- Created `src/lib/idStatus.ts` — `IDStatus` interface (includes `verification_status`, `waitlist_reason`, `verified_at`; `status_label` union: `'active' | 'expiring_soon' | 'expired' | 'revoked' | 'pending' | 'waitlisted' | 'not_found'`), `getIDStatus(matricNumber)` client-side query that factors in `verification_status` and returns `'revoked'` when `!is_valid AND days_remaining >= 0`, `revokeIDAccess(matricNumber)`, `IDStatusError`
- Created all required shadcn/ui components: `tabs.tsx`, `badge.tsx`, `select.tsx`, `alert-dialog.tsx`, `dialog.tsx`, `tooltip.tsx`, `card.tsx`, `separator.tsx`, `alert.tsx`, `collapsible.tsx`
- Created `src/pages/Admin.tsx` — full admin dashboard at `/admin` with:
  - 6-state summary cards: Active, Expiring Soon, Expired, Revoked, Pending, Waitlisted
  - Tabs: "Verifications" (first, default), "ID Status", "Transactions"
  - `deriveStatusLabel()` checks `verification_status` first: `'pending'`/`'waitlisted'` before expiry logic; split `'revoked'` from `'expired'`
  - ID Status table: 6-state filter dropdown, days remaining ("Today" / "Overdue by N"), badges for all states (amber Pending, orange Waitlisted)
  - Edit Expiry dialog, Revoke with AlertDialog + tooltip
  - 60-second auto-refresh, "Last updated" timestamp, "Run Expiry Sweep" button
  - CSV export, warning indicators for revoked/expired in Transactions tab
  - Verifications tab: "Awaiting Verification" table (pending records with receipt/amount join, Verify + Flag Issue buttons) and "Waitlisted" collapsible section (waitlisted records + reason column, Verify button)
  - Admin matric number badge/input in header (persisted to localStorage)
- Created `src/components/admin/VerifyDialog.tsx` — modal with student info panel, date input (min=tomorrow), duration shortcuts (6M/1Y/2Y), days preview, submits `expires_at + is_valid=true + verification_status='verified' + verified_at + verified_by` supabase update
- Created `src/components/admin/WaitlistDialog.tsx` — modal with student info panel, reason textarea, submits `verification_status='waitlisted' + waitlist_reason` supabase update
- Updated `PaymentPortal.tsx` — upserts into `id_replacements` with `verification_status: 'pending'`, `is_valid: false`, `expires_at: null`, resets all verification fields on conflict; inserts into `payment_transactions`; navigates to `/status` with `{ receiptNumber, amount, requestedAt, matricNumber }`; shows "Payment successful! Your request is pending admin verification." toast
- Created `src/pages/StatusPage.tsx` at `/status` — wrapped in `MainLayout`, two-column layout (Receipt + Verification Status):
  - On mount reads navigation state, calls `getIDStatus(matricNumber)`, auto-redirects if verified
  - Receipt card: receipt number, amount, date, "Download Receipt PDF" button opens `ReceiptModal`
  - Status card: pending (animated pulse badge + message + auto-refresh notice) or waitlisted (destructive badge + admin note if `waitlist_reason` set)
  - 30-second `setInterval` polling, auto-redirects to `/card/:id` on status flip to `'active'`/`'expiring_soon'`
  - "Refresh Status" button with spinner, pulsing "Checking for updates..." text
  - Handles `fromLogin: true` (no receipt state) by fetching latest `payment_transactions` from DB
- Created `src/pages/PaymentPage.tsx` at `/payment` — reads `matricNumber`/`studentName` from navigation state, renders `PaymentPortal` with cancel → home, guards missing state with redirect
- Updated `Home.tsx` — post-login routing uses `switch` on `status_label`: `'active'`/`'expiring_soon'` → `/card/:id`; `'pending'` → `/status`; `'waitlisted'` → `/status` + error toast; `'expired'` → `/payment` + expired date toast; `'revoked'` → `/payment` + revoked toast; default (`not_found`) → `/payment`
- Updated `IDCard.tsx` — handles `'pending'` and `'waitlisted'` in `checkStatus()` with redirects and toasts
- Updated `types/database.ts` — `IDReplacement` interface includes `is_valid`, `verification_status`, `verified_at`, `verified_by`, `waitlist_reason`
- Updated `App.tsx` — added routes for `/status` and `/payment`
- Migrated all navigation: `PaymentPortal` → `/status`, logged-in pending/waitlisted → `/status`, expired/revoked/not_found → `/payment`

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- `verification_status` column replaces implicit active/expired routing: `'pending'` → student waits for admin, `'waitlisted'` → student on hold, `'verified'` → standard expiry logic applies
- `expires_at` is nullable — only set during admin verification, not at payment time; DB trigger only auto-sets it when `verification_status = 'verified'`
- `getIDStatus()` now returns `'revoked'` as a distinct `status_label` (was merged into `'expired'` before)
- Single `deriveStatusLabel()` in Admin replaces `computeIdStatus()` + `getBadgeLabel()` — checks `verification_status` before date logic
- `StatusPage` replaces the old post-payment `ReceiptModal` for student-facing status; `ReceiptModal` still used for PDF downloads via button
- `/payment` route delegates to `PaymentPortal` via navigation state; no inline payment in `Home.tsx` anymore
- Admin matric number stored in localStorage and displayed/editable in dashboard header
- Duration shortcut chips (6M / 1Y / 2Y) in VerifyDialog auto-fill the date input

## Next Steps
- Run SQL migrations 001–003 in Supabase SQL editor to create tables, indexes, triggers, functions
- Test full flow: login → expired → `/payment` → pay → `/status` (pending) → admin verifies → `/card/:id`
- Test full admin flow: flag pending student → waitlisted → verify from waitlisted
- Migrate password handling to Supabase Auth (currently plaintext)

## Critical Context
- `PGRST204` error resolved: `student_id` → `matric_number` throughout
- TS errors resolved: `TS6133` (unused `InfoItem`, unused `status`, unused `Input`), `TS1294` (`erasableSyntaxOnly` parameter properties), `TS2678` (missing `'revoked'` in union type)
- `payment_transactions`, `id_replacements`, and `get_id_status` RPC do not exist yet in Supabase — must apply migrations first
- `pg_cron` extension must be enabled for the scheduled job: `CREATE EXTENSION IF NOT EXISTS pg_cron;`
- Build compiles clean (`npm run build` passes with only pre-existing font warnings)
- `radix-ui` v1.4.3 provides all primitives (Dialog, Collapsible, etc.) via `"radix-ui"` unified import

## Relevant Files
- `src/lib/idStatus.ts`: `IDStatus` interface (7-label union), `getIDStatus()` (verification-aware), `revokeIDAccess()`, `IDStatusError`
- `src/lib/receipt.ts`: `generateReceiptNumber()`, `formatReceiptDate()` utilities
- `src/components/PaymentPortal.tsx`: upserts pending record, navigates to `/status` after payment
- `src/components/ReceiptModal.tsx`: full-screen overlay receipt with PDF download
- `src/components/admin/VerifyDialog.tsx`: verify modal with date picker, duration shortcuts, supabase update
- `src/components/admin/WaitlistDialog.tsx`: waitlist modal with reason textarea, supabase update
- `src/components/ui/collapsible.tsx`: Radix Nova Collapsible wrapper
- `src/pages/StatusPage.tsx`: two-column status page, 30s poll, auto-redirect on verify, receipt from state or DB
- `src/pages/PaymentPage.tsx`: `/payment` route wrapper, reads state from navigation
- `src/pages/Home.tsx`: login gate with `switch` routing to `/card`, `/status`, or `/payment`
- `src/pages/IDCard.tsx`: student ID card with pending/waitlisted guards and window-focus listener
- `src/pages/Admin.tsx`: full dashboard — 3 tabs (Verifications default), 6-state verify-aware summary + id_status + transactions tables, edit/revoke/sweep actions, admin matric header
- `src/components/ui/tabs.tsx`, `badge.tsx`, `select.tsx`, `alert-dialog.tsx`, `dialog.tsx`, `tooltip.tsx`, `card.tsx`, `separator.tsx`, `alert.tsx`: shadcn/ui components
- `src/types/database.ts`: `IDReplacement` interface with verification fields
- `src/App.tsx`: routers for `/`, `/signup`, `/card/:id`, `/verify/:matricNumber`, `/status`, `/payment`, `/admin`
- `src/index.css`: Tailwind v4 — ID card styles with responsive scaler
- `supabase/migrations/001_create_payment_transactions.sql`: payment_transactions DDL
- `supabase/migrations/002_create_id_replacements.sql`: id_replacements + verification columns + nullable expires_at + trigger
- `supabase/migrations/003_invalidate_expired_ids.sql`: sweep function + get_id_status RPC + cron schedule
