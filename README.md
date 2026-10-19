# Scan&Dine — Modern QR Restaurant Ordering & Staff Workspaces

Scan&Dine is a full-stack restaurant ordering MVP built with Next.js, React, TypeScript, Prisma and PostgreSQL. This edition includes a redesigned, responsive customer storefront with warm cream and forest-green styling, food photography, a curated Popular Picks section, searchable categorized menu cards, and a slide-out order panel. It now has a public customer menu and separate, login-protected staff workspaces.

## Separate websites / workspaces
- **Customer menu:** `http://localhost:3000/` — public, no account required. A table QR opens `/?table=<qrToken>`, preselects the table, and customers can browse and place orders.
- **Kitchen:** `http://localhost:3000/kitchen` — staff login required; view live tickets and move orders through Preparing, Ready and Served.
- **Service:** `http://localhost:3000/service` — staff login required; review tables, print bills, record manually received payments, and close fully paid sessions.
- **Admin:** `http://localhost:3000/admin` — admin login required; add menu items, set Popular Picks, toggle out-of-stock items, safely delete items without order history, create tables/VIP rooms and print QR codes.
- **Staff login:** `http://localhost:3000/login` — redirects each authenticated user to their role workspace.

Staff routes are protected by signed, HTTP-only session cookies and role checks. Staff-only APIs also check roles server-side. Customer order submission remains public by design; customers cannot access staff ticket lists or change order status.

## Requirements
Install Node.js 20.9+ and Docker Desktop. These instructions target Windows PowerShell.

## Run locally
1. Extract the ZIP to a folder such as `C:\Projects\scandine` and open it in VS Code.
2. Install dependencies: `npm install`
3. Create environment file: `Copy-Item .env.example .env`
4. Start PostgreSQL: `docker compose up -d db`
5. Sync the current Prisma schema (including the `popular` menu flag): `npx prisma db push`
6. Generate Prisma client: `npx prisma generate`
7. Seed sample menu, featured favorites, 10 standard tables, 5 VIP rooms, and development staff accounts: `npm run db:seed`
8. Start app: `npm run dev`
9. Open `http://localhost:3000`.

## Development staff accounts
Seed creates the following development accounts. Change these passwords and set a long random `AUTH_SECRET` before any non-local deployment.

| Role | Email | Password | Workspace |
|---|---|---|---|
| Admin | `admin@scandine.local` | `Admin123!` | `/admin` |
| Kitchen | `kitchen@scandine.local` | `Kitchen123!` | `/kitchen` |
| Service | `service@scandine.local` | `Service123!` | `/service` |

These are development-only credentials, not production defaults.

## Popular Picks and availability
- The customer homepage displays available items with `popular = true` in its Popular Picks section.
- In Admin → Menu inventory, use **Make popular / Remove popular** to feature or unfeature items.
- When adding an item, enable **Feature as a popular pick** to include it immediately.
- Out-of-stock items are omitted from the customer menu and cannot be submitted in new orders.
- Seed data features a few sample dishes and drinks. Re-running the seed script refreshes the sample items’ popular flags and the documented development passwords.

## QR workflow
1. Sign in as admin and print a QR code for each table/VIP room.
2. Print each code and place it on its matching table.
3. A customer scans with their phone camera; the URL opens the public menu with the table token selected.
4. The customer places an order without creating an account.
5. The order appears in Kitchen after the staff workspace refreshes (about every four seconds).
6. Service can review table totals, print a bill, record a manual payment, then close the table once all orders are served and fully paid.

**Local QR note:** QR codes generated while running on `localhost` work on that same computer only. To scan from a phone, run the app on a network-accessible host and set `NEXT_PUBLIC_APP_URL` to the host's reachable LAN IP or deployed HTTPS URL before printing QR codes. Phone and computer must be able to reach each other.

## Security and scope notes
This is a development/portfolio MVP, not yet a production-ready restaurant POS. The staff UI is role-separated and protected, and ticket/admin APIs enforce roles. Before production, add an admin-managed staff account screen and password reset, rate limiting, CSRF/origin protections, audit logs, backups, HTTPS, monitoring, QR-token rotation, and formal payment/session-close workflows. Service bill printing uses the browser print dialog. Payment methods are records only; this app does not process card payments or verify external QR payments.

## Troubleshooting
- Database connection error: ensure Docker Desktop is running and `docker compose ps` shows PostgreSQL healthy.
- Prisma client missing: run `npx prisma generate`.
- Missing `popular` column or Prisma table error: run `npx prisma db push`, then `npx prisma generate`. Review any schema-change warnings and back up valuable data first.
- Empty menu or no Popular Picks on an existing database: run `npm run db:seed`, then refresh the customer page.
- Port 3000 in use: run `npm run dev -- -p 3001`.
