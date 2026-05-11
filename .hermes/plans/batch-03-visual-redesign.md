# BATCH 3 — VISUAL REDESIGN (ALL SURFACES)

WORKSPACE: /Users/lomalinda007yahoo.com/Documents/Project Apps/restaurant-platform
DEV SERVER: localhost:5173

## Goal
Redesign ALL views for visual excellence. Three distinct design registers:
- **Customer**: iOS-native, light mode, one-view-per-screen, visual quick-read
- **Staff**: Dark theme, 3-column rail, data-dense, icons over text
- **Owner**: Data-dense dashboard, network pulse, analytics, dark theme

## Design Principles
- Icons over text where meaning is clear
- Strong contrast ratios (WCAG AA minimum, AAA preferred)
- Smooth transitions (no abrupt jumps)
- Collapsible sidebars for staff/owner views
- H/L shaped layouts, auto-rotate for floor plan
- **ABSOLUTE BANS**: No gradient text, no glassmorphism defaults, no side-stripe borders, no AI slop
- One-view-per-screen where possible (avoid scroll-heavy pages)

---

## CUSTOMER VIEWS (8 surfaces — Light, iOS style)

### 1. Welcome Hero (/)
- Full-bleed hero image/color gradient with restaurant name overlay
- "Find a Table" and "Browse Menu" as distinct buttons (primary/secondary)
- Specials horizontal scroll with discount badges
- Category grid (2 columns) with icons
- Smooth scroll between sections
- Use SF Pro font stack, 12-16px corner radii, glass tab bar

### 2. Menu View (/menu)
- Sticky header with restaurant name + search toggle
- Horizontal scrollable category tabs (iOS segmented control style)
- Item cards: image left, name/description/price right, Add/quantity controls
- Animated add-to-cart with checkmark overlay + scale bounce
- Floating cart badge bottom-right with item count + total
- Search with clear button, filter by category

### 3. Cart View (/cart)
- Item list with thumbnail, name, quantity stepper, line total
- Per-item notes expandable inline
- Order-level notes textarea
- Sticky footer with item count, total, Checkout CTA
- Empty state: icon + message + action buttons (Browse Menu, Find a Table)
- Swipe-to-delete on cart items (optional mobile UX)

### 4. Checkout View (/checkout)
- Step indicator: Order Summary → Details → Confirm
- Order type selector (Dine In / To Go / Delivery) as pill buttons
- Seat selector grid (for dine-in)
- Name input (optional)
- Notes textarea
- Table info card (for dine-in) with "Payment after meal" notice
- Prominent "Place Order" CTA
- Success state: animated checkmark + order number + auto-redirect to tracking

### 5. Tracking Timeline (/tracking/:orderId)
- Order header: ID, elapsed time, order type
- Pickup PIN display (for to-go orders) — prominent
- Spline timeline with 5 stages: New → Preparing → Ready → Picking Up → Delivered
- Active stage highlighted with brand color
- Item list with quantities and seat numbers
- Estimated time card
- "Bill & Pay" CTA when delivered (dine-in) + "Leave Feedback"
- Real-time updates via Supabase subscription

### 6. Floor Plan Grid (/floor-plan)
- Full-screen canvas with draggable/zoomable layout
- Tables as shapes (circle/rectangle/bar) with status colors
- Legend: Available (green), Occupied (gray), Reserved (indigo), New Order (blue), In Progress (green), Ready (red)
- Status filter pills
- Table selection bottom sheet: table name, seats, status, "Select & Browse Menu" CTA
- Quick stats footer: table count, seats, available count
- Full-screen toggle
- Auto-rotate for landscape orientation

### 7. Feedback Stars (/feedback/:orderId)
- Clean centered layout
- 5 interactive star buttons with hover/active states
- Star label: Poor / Fair / Good / Very Good / Excellent
- Comment textarea
- Submit button (disabled until rating selected)
- Success state: heart icon + "Thank You!" + helpful message
- "Skip" link at bottom

### 8. Discover Cards (/discover)
- Header with list/map view toggle
- Search bar with real-time filtering
- List view: restaurant cards with logo, name, cuisine type, description, address, status badge
- Map view: custom map fallback with restaurant pins
- Smooth card hover animation
- Empty state for no results

---

## STAFF VIEWS (5 surfaces — Dark theme, Material3)

### 9. Staff Login (/staff/login)
- Clean centered card on dark surface
- Role selector (FOH / Kitchen / Bar / Manager)
- PIN or credential input
- Error state with clear message

### 10. Kitchen 3-Column Rail (/staff/kitchen)
- Header: chef hat icon, staff name, active order count
- 3-column Kanban: New (blue) | In Progress (green) | Ready (red)
- Each column: header with colored dot + count, scrollable ticket list
- Tickets show: customer name, table#, elapsed timer, items grouped by seat, order notes
- Action buttons: "Accept Order" (New), "Mark Ready" (In Progress), "Awaiting Pickup" (Ready)
- Empty states per column with appropriate icons
- Real-time updates via Supabase subscription
- Left sidebar collapsed by default

### 11. FOH Floor Plan + Sidebar (/staff/foh)
- Floor plan with table shapes and real-time status colors
- Right sidebar showing active tickets (ready orders, picking-up orders)
- Collapsible sidebar (toggle with icon button)
- Table selection → shows orders for that table
- Action buttons: Pick Up, Deliver
- Real-time updates for orders and tables
- Left sidebar for view selection: Floor / Requests / Payment
- Header: staff name, restaurant name, bell icon, settings, logout

### 12. Bar Rail (/staff/bar)
- Header: wine glass icon, staff name, active order count
- 3-column Kanban (same pattern as Kitchen): New | In Progress | Ready
- Bar-specific styling (wine glass icon, subtle colors)
- Same ticket structure as Kitchen
- Action buttons: Accept, Mark Ready

### 13. Manager Dashboard (/staff/manager/*)
- Left sidebar: Dashboard, Floor Plan, Menu, Staff, Inventory
- Dashboard: pulse strip of active orders, revenue today, table occupancy
- Floor plan viewer (same as Kitchen but with management controls)
- Menu management: categories, items, pricing, availability toggle
- Staff management: view/edit/remove staff, shift schedules
- Inventory tracking: stock levels, low stock alerts
- All on dark theme, collapsible sidebar, data-dense layout

---

## OWNER PANEL (8 surfaces — Dark theme, data-dense)

### 14. Owner Login (/owner/login)
- Clean centered card
- Email/password or SSO
- "Forgot password" link

### 15. Owner Dashboard (/owner)
- Network pulse: active restaurants, total orders today, revenue, commissions (4 metric cards)
- Restaurant grid sorted by revenue (largest restaurants more prominent)
- Quick stats: new signups, churn rate, avg order value
- Recent activity feed
- Alert strip for issues (offline restaurants, low inventory)

### 16. Restaurants Grid (/owner/restaurants)
- Grid of all restaurants sized by revenue
- Each card: logo, name, revenue, order count, status (online/offline)
- Search/filter by name, status, cuisine type
- Click to view restaurant detail (metrics, orders, staff)

### 17. Analytics Graphs (/owner/analytics)
- Revenue chart (7d/30d/90d) with sparklines
- Order volume trend
- Top restaurants by revenue
- Customer satisfaction trend
- Hourly/daily/weekly breakdowns
- All chart data from existing API

### 18. Commissions (/owner/commissions)
- Commission summary: total collected, pending, paid out
- Per-restaurant commission breakdown
- Date range filter
- Export to CSV option

### 19. Messaging (/owner/messages)
- Inbox: conversations with restaurant owners
- Notification badge on sidebar (currently 3)
- Message compose/reply
- Thread view with timestamps

### 20. Settings (/owner/settings)
- Owner profile
- Notification preferences
- Payout settings
- API keys
- Team management

### 21. Owner Sidebar
- 6 nav items: Dashboard, Restaurants, Commissions, Messages (badge), Analytics, Settings
- Collapsible (icon-only mode)
- Active indicator line
- User avatar + name at top
- Logout at bottom
- Mobile hamburger menu

---

## COMPONENT SPECS

### Layout Patterns
- **L-shape**: Sidebar (fixed left) + main content area (scrollable right)
- **H-shape**: Two sidebars (left nav + right panel) + center content
- **Full-screen**: Floor plan, tracking, checkout (hides bottom nav)
- **Collapsible sidebars**: Left nav collapses to icons, right panel slides away

### Cards
- Customer: white on gray bg, 16px radius, subtle shadow
- Staff/owner: elevated cards on dark bg, 12px radius, visible shadow
- No identical card grids — vary sizes and layouts

### Navigation
- Customer: iOS-style glass tab bar (blur + centered labels)
- Staff: Material3 bottom nav or side nav
- Owner: Collapsible left sidebar
- Tab bar hidden on checkout/tracking/feedback/bill

### Transitions
- Route changes: fade + slide
- Card interactions: scale on press (active:scale-95)
- Modals: slide up from bottom (iOS) or fade + scale (Material3)
- Add-to-cart: checkmark bounce + card pulse

## Files to Touch
- src/index.css (dark theme variables, component styles, animations)
- src/features/customer/welcome/WelcomeView.tsx
- src/features/customer/menu/MenuView.tsx
- src/features/customer/cart/CartView.tsx
- src/features/customer/checkout/CheckoutView.tsx
- src/features/customer/tracking/TrackingView.tsx
- src/features/customer/floor-plan/FloorPlanView.tsx
- src/features/customer/feedback/FeedbackView.tsx
- src/features/customer/discovery/DiscoveryView.tsx
- src/features/customer/bill/BillView.tsx
- src/features/staff/auth/StaffLogin.tsx
- src/features/staff/foh/FOHDashboard.tsx
- src/features/staff/kitchen/KitchenView.tsx
- src/features/staff/bar/BarView.tsx
- src/features/staff/manager/ManagerDashboard.tsx
- src/features/owner/OwnerLogin.tsx
- src/features/owner/dashboard/OwnerDashboard.tsx
- src/features/owner/dashboard/OwnerHome.tsx
- src/features/owner/dashboard/RestaurantsPage.tsx
- src/features/owner/dashboard/AnalyticsPage.tsx
- src/features/owner/dashboard/CommissionsPage.tsx
- src/features/owner/dashboard/MessagingPage.tsx
- src/features/owner/dashboard/SettingsPage.tsx

## Verification
1. All 8 customer views render correctly at localhost:5173 with iOS theme
2. All 5 staff views render with dark theme at /staff/*
3. All owner views render with dark theme at /owner/*
4. No gradient text, no glassmorphism defaults, no side-stripe borders
5. Icons used prominently, smooth transitions between states
6. Strong contrast on all text elements
7. Collapsible sidebars work on staff/owner
8. All navigation flows work end-to-end
