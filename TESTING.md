# Restaurant Platform — Full App Testing Guide

> Use this once the database is connected to verify every surface works.

---

## 1. SURFACE: Owner Admin Panel (Martín's View)

**URL:** `http://localhost:5173/owner/login`
**Credentials:** Email: `dr.mtorres@icloud.com` / Passcode: `2026`

### Test Scenarios

| # | Test | Expected Result |
|---|------|----------------|
| 1.1 | Log in with credentials | See main dashboard with network pulse strip |
| 1.2 | Check Network Pulse | Shows: Total Revenue (MTD), Active Orders (all restaurants), Total Restaurants (5), Growth Rate, sparklines |
| 1.3 | Restaurant Grid | See 5 cards, sized by revenue, colored by health status |
| 1.4 | Click a restaurant card | Right panel opens with details (revenue, orders, commission %, health) |
| 1.5 | Click "Restaurants" in left nav | Full restaurant list with search, sort, filter |
| 1.6 | Add a new restaurant | Form works, QR codes generate |
| 1.7 | Click "Commissions" tab | See per-restaurant commission %, network overview, distribution chart |
| 1.8 | Click "Messages" tab | See conversation threads, compose new message |
| 1.9 | Click "Analytics" tab | Revenue trends, profit by restaurant, growth rates, health grid |
| 1.10 | Click "Settings" tab | Owner profile, security, notification settings |
| 1.11 | Toggle sidebar collapse | Sidebar collapses to icons, expands back |
| 1.12 | Test mobile responsive | Reduce browser width → hamburger menu appears |

---

## 2. SURFACE: Customer Side (Dine-in / Ordering)

**URL:** `http://localhost:5173/?restaurant_id=r_dipasquale`

### 2.1 Di Pasquale — Full Order Flow

| # | Test | Expected Result |
|---|------|----------------|
| 2.1 | Open restaurant link | Welcome page with hero, promo cards, quick category picks |
| 2.2 | Click "Menú" | Full menu with category tabs (Antipasti, Ensaladas, Pastas, Pizzas, etc.) |
| 2.3 | Search bar | Type "lasagna" → filters items in real time |
| 2.4 | Add item to cart | Click "Agregar" on Lasagna → item count badge appears, cart updates |
| 2.5 | Add multiple items | Add Pizza Carbonara + Tiramisú → cart shows all with quantities |
| 2.6 | Click cart icon | Cart view: items listed, qty stepper works (+/-), total correct |
| 2.7 | Set seat number | In cart, assign items to seat 1, seat 2 |
| 2.8 | Add notes | Per-item notes + order-level notes work |
| 2.9 | Go to checkout | Payment method selection (Wallet / Card / Cash) |
| 2.10 | Select tip % | 10%, 15%, 18%, 20% or custom → total recalculates |
| 2.11 | Place order | Order created, redirected to tracking page |
| 2.12 | Order tracking | See real-time status timeline (Blue → Green → Red → Yellow → Delivered) |
| 2.13 | Floor plan | See tables: available (no fill), occupied (light gray), cleaning (dark gray), reserved (indigo border) |
| 2.14 | Select table | Tap available table → confirmation → table selected |
| 2.15 | Post-visit feedback | After delivery, rate 1-5 stars + optional comment |

### 2.2 Language Detection

| # | Test | Expected Result |
|---|------|----------------|
| 2.16 | Change browser language to English | App auto-switches to English |
| 2.17 | Change browser language to French | App auto-switches to French |
| 2.18 | Change to unsupported language (Japanese) | Falls back to Spanish |

### 2.3 Nearby Discovery (Generic QR)

| # | Test | Expected Result |
|---|------|----------------|
| 2.19 | Open `/discover` | See 5 restaurant cards with logos, names, descriptions |
| 2.20 | Toggle to map view | Map with restaurant pins |
| 2.21 | Click restaurant card | Navigates to that restaurant's welcome page |

---

## 3. SURFACE: Staff Dashboard

### 3.1 Kitchen View

**URL:** `http://localhost:5173/staff/kitchen`

| # | Test | Expected Result |
|---|------|----------------|
| 3.1 | Log in with PIN 1113 (Di Pasquale kitchen) | Kitchen ticket rail appears |
| 3.2 | See new orders | Orders appear in Blue column |
| 3.3 | Click "Aceptar" | Order moves to Green column (In Progress) |
| 3.4 | Click "Listo" | Order moves to Red column (Ready) |
| 3.5 | Red stays visible | Stays until FOH picks up |

### 3.2 Bar View

**URL:** `http://localhost:5173/staff/bar`

| # | Test | Expected Result |
|---|------|----------------|
| 3.6 | Log in with PIN 1114 (Di Pasquale bar) | Bar ticket rail (drinks only) |
| 3.7 | Accept drink orders | Same 3-color workflow as kitchen |

### 3.3 FOH (Front of House)

**URL:** `http://localhost:5173/staff/foh`

| # | Test | Expected Result |
|---|------|----------------|
| 3.8 | Log in with PIN 1112 (FOH view) | 3-panel dashboard: left nav, center floor plan, right sidebar |
| 3.9 | Verify floor plan colors | Tables show correct colors for their status |
| 3.10 | Multi-status table | Table with New + Ready shows both colors (background + border) |
| 3.11 | Kitchen marks Ready | Right sidebar auto-opens with ticket details + seat numbers |
| 3.12 | Click "Recoger" | Ticket clears from kitchen rail, appears in FOH |
| 3.13 | Click "Entregar" | Ticket cleared, table status updates |

### 3.4 Manager Dashboard

**URL:** `http://localhost:5173/staff/manager`

| # | Test | Expected Result |
|---|------|----------------|
| 3.14 | Log in with PIN 1111 (Manager) | Full dashboard with pulse strip |
| 3.15 | Check pulse metrics | Sales today, active orders, avg wait time, anomalies |
| 3.16 | Click a table on floor plan | Right panel shows table details + items + elapsed time |
| 3.17 | Switch bottom tabs | Hourly sales chart, item popularity, heat map |
| 3.18 | Click "Staff Manager" (left nav) | Staff list with names, roles, PINs, active status |
| 3.19 | Click "Menu Editor" | CRUD table of all menu items, edit price inline, toggle availability |
| 3.20 | Click "Floor Plan Editor" | Canvas with table selector, drag-drop tables, rotate, delete |
| 3.21 | Add a new table | Drag from left panel → drops on canvas → chairs auto-appear |
| 3.22 | Rotate table 90° | Table rotates correctly, chairs stay in position |
| 3.23 | Click "Inventory" | Stock levels, low-stock alerts, add/edit items |

---

## 4. REAL-TIME SYNC TEST (Critical)

| # | Test | Expected Result |
|---|------|----------------|
| 4.1 | Open customer + FOH + Kitchen in 3 browser tabs | All three showing same restaurant |
| 4.2 | Customer places order (customer tab) | Kitchen tab: Blue ticket appears instantly. FOH tab: table turns Blue |
| 4.3 | Kitchen accepts (kitchen tab) | Customer tab: status changes to In Progress (Green). FOH tab: table turns Green |
| 4.4 | Kitchen marks Ready (kitchen tab) | FOH tab: right sidebar auto-opens with ticket. Customer tab: status Ready (Red) |
| 4.5 | FOH picks up (FOH tab) | Kitchen tab: ticket disappears. Customer tab: status Being Delivered (Yellow) |
| 4.6 | FOH delivers (FOH tab) | Customer tab: Delivered ✅. Table returns to occupied (light gray) |

---

## 5. ERROR STATES & EDGE CASES

| # | Test | Expected Result |
|---|------|----------------|
| 5.1 | Open `/` without restaurant_id | Welcome page with no restaurant context → shows "no restaurant" state |
| 5.2 | Open invalid restaurant_id | Error state with retry button |
| 5.3 | Add item with 0 stock | Item shows "Agotado" (sold out) in menu, cannot add to cart |
| 5.4 | Empty cart checkout | Checkout button disabled or shows empty state |
| 5.5 | Staff wrong PIN | Error message: "PIN incorrecto" |
| 5.6 | Cancel order mid-flow | Order cancelled, table returns to available |
| 5.7 | Slow network | Loading spinners on all views |

---

## 6. DESIGN CONSISTENCY CHECK

| # | Check | Expected Result |
|---|-------|----------------|
| 6.1 | Customer side → portrait mobile | Vertical layout, bottom nav, responsive |
| 6.2 | Staff side → landscape | Horizontal layout, full-width floor plan, left sidebar |
| 6.3 | Owner panel → desktop | Data-dense, big numbers, pulse strip, charts |
| 6.4 | Dark mode (staff + owner) | Dark backgrounds, white text, semantic colors |
| 6.5 | Light mode (customer) | Light backgrounds, brand colors |
| 6.6 | All surfaces use same color tokens | Floor plan colors match across customer/staff/foh |
| 6.7 | Collapsible sidebars | All sidebars collapse to icons with indicators |
| 6.8 | Color before text | Status colors visible before reading labels |

---

## Test Pass Criteria

All tests in sections 1-4 must pass. Section 5 edge cases should work gracefully (no crashes). Section 6 is visual QA.
