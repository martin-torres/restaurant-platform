# Supabase → InsForge Migration

**Date:** May 10, 2026
**Project:** Restaurant Platform (CompleteDONDapp)
**Source:** Supabase `auushbzgsjxyulkchwae`
**Target:** InsForge `2y542jyv.us-east` (Dond my first project)

---

## Overview

Complete migration of the Restaurant Platform from Supabase to InsForge — database schema, seed data, realtime triggers, and app SDK all migrated. Production build passes with zero errors.

---

## Phase 1 — Database Schema

All 36 tables migrated with full schema:

| Category | Tables |
|----------|--------|
| **Core** | restaurants, restaurant_settings |
| **Floor Plan** | floor_plans, restaurant_tables, floor_props |
| **Staff** | staff, staff_shifts |
| **Menu** | menu_items |
| **Inventory** | inventory_items, inventory_alerts |
| **Orders** | orders, order_items |
| **Payments** | payments |
| **Marketing** | promos, events, marketing_campaigns, campaign_redemptions |
| **Customer** | anonymous_visits, customer_profiles, customer_visits, ip_to_customer, visit_feedback |
| **QR** | restaurant_qr_codes |
| **Messaging** | message_threads, messages |
| **Owners** | restaurant_owners, platform_owner |
| **Platform** | restaurant_commissions, platform_revenue, platform_metrics, restaurant_health_log |
| **Audit** | staff_actions, owner_actions, table_status_history |
| **Tracking** | waste_log, review_aggregations |

7 custom enum types: `table_shape`, `staff_role`, `order_status`, `order_type`, `payment_method`, `qr_type`, `message_urgency`

19 indexes created for query performance.

18 tables with RLS enabled, 10 open-read/insert policies.

Extensions installed: `pgcrypto` (already present), `uuid-ossp`

---

## Phase 2 — Seed Data

5 restaurants fully loaded:

| Restaurant | Slug | Mode | Menu Items | Staff |
|------------|------|------|-----------|-------|
| Di Pasquale | di-pasquale | dine-in | 38 | 4 |
| Azúcar y Nuez | azucar-y-nuez | to-go | 17 | 0 |
| Los Bucaneros | los-bucaneros | dine-in | 28 | 3 |
| Sencillito Café | sencillito-cafe | dine-in | 22 | 0 |
| Maui Café | maui-cafe | dine-in | 27 | 0 |

Additional seed data:
- 5 restaurant owners
- 2 floor plans (Di Pasquale: 6 tables, Bucaneros: 12 tables)
- 5 promotions
- 7 QR codes
- 10 sample reviews
- Platform owner account (Martín Torres)

---

## Phase 3 — App Code Migration

**SDK swap:** `@supabase/supabase-js` → `@insforge/sdk`

Changes made:

| File | Change |
|------|--------|
| `src/lib/supabase.ts` | Rewritten with InsForge SDK + Supabase-compatible adapter (handles `.insert()` array format, bridges realtime) |
| `.env` | `VITE_SUPABASE_URL` → `VITE_INSFORGE_URL`, `VITE_SUPABASE_ANON_KEY` → `VITE_INSFORGE_ANON_KEY` |
| `package.json` | Added `@insforge/sdk@latest` dependency |

**No changes needed in** any `src/shared/api/*.ts` file — the adapter in `supabase.ts` exposes the same `supabase.from().select().eq()` API that all 6 API modules use.

**Realtime:** 3 PostgreSQL triggers created on InsForge for live updates:
- `orders` → `db:public:orders` channel
- `staff` → `db:public:staff` channel  
- `restaurant_tables` → `db:public:restaurant_tables` channel

---

## Verification

- TypeScript compilation: ✅ zero errors
- Vite production build: ✅ 2,444 modules, 1.01s, 0 errors
- Output: `dist/index.html` (0.46 KB), `dist/assets/index-*.css` (74 KB), `dist/assets/index-*.js` (1.2 MB)

---

## InsForge Project Details

| Property | Value |
|----------|-------|
| Project ID | `424fc85d-39c7-46b7-b769-ae31e50f8769` |
| App Key | `2y542jyv` |
| Region | `us-east` |
| API URL | `https://2y542jyv.us-east.insforge.app` |
| ANON Key | (in `.env` file) |
| API Key (admin) | (in `~/.insforge/project.json`) |
| CLI | `npx @insforge/cli db query <sql> --unrestricted` |
| SDK | `npm install @insforge/sdk` |
| Dashboard | https://insforge.dev/dashboard/project/424fc85d-39c7-46b7-b769-ae31e50f8769 |

---

## CLI Quick Reference

```bash
# Database
npx @insforge/cli db query "SELECT * FROM restaurants" --unrestricted
npx @insforge/cli db tables
npx @insforge/cli db migrations list

# Metadata
npx @insforge/cli metadata

# Secrets
npx @insforge/cli secrets get ANON_KEY

# Functions
npx @insforge/cli functions list
npx @insforge/cli functions deploy <slug>
