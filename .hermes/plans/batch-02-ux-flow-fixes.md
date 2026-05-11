# BATCH 2 — UX FLOW FIXES

WORKSPACE: /Users/lomalinda007yahoo.com/Documents/Project Apps/restaurant-platform
DEV SERVER: localhost:5173

## Goal
Polish the customer UX flow: enhanced item card interactions, proper floor-plan-first dine-in flow, and post-meal billing separation.

## Current State (verified)
- **Item card click**: Clicking ANYWHERE on a menu item card already adds to cart via the `handleCardClick` function in MenuView.tsx. The `onClick` is on the outer `<div>`. An animated checkmark overlay appears (check-bounce keyframe). However, the scale-bounce animation on the card itself could be stronger.
- **Checkout flow**: Already does NOT include tip selection or payment method. Only collects: order type, seat, name, notes. The BillView (at /bill/:orderId) has tip + payment — this is the correct post-meal location.
- **Floor plan**: Already implemented with realtime updates, table selection, and "Select & Browse Menu" flow. WelcomeView already links to floor plan via "Find a Table" button.
- **Cart store**: Already preserves restaurant context via Zustand persist middleware.

## What Needs Work

### 1. Enhanced Item Card Animation (MenuView.tsx)
The current animation is subtle. Make it more delightful:
- **Scale bounce**: On click, card scales to 1.03 → back to 1.0 (spring-like curve)
- **Checkmark overlay**: Animate the checkmark appearing with scale + fade
- **Ripple effect**: Brief colored ring pulse from the center
- **Add-to-cart flash**: Brief green flash on the price/count area
- Update the CSS keyframes in index.css for smoother spring-like motion (cubic-bezier)

### 2. WelcomeView → Floor Plan → Menu Flow
The welcome view currently offers "Find a Table" and "Browse Menu" as two options. For dine-in:
- Make "Find a Table" more prominent (it's already the primary CTA)
- Add a brief explanation: "Select a table to start ordering"
- After table selection on floor plan, auto-navigate to menu with table context preserved
- For to-go orders (coming from discover), skip floor plan and go directly to menu

### 3. Floor Plan as Central Dine-In View
- When a user scans a QR code (which includes restaurant_id), if it's a dine-in flow, show floor plan first before menu
- Add a "Quick order" floating button on floor plan for returning customers who already have a table
- Ensure the floor plan bottom sheet for table selection has a clean flow: select table → "Start Ordering" → menu

### 4. Checkout UX Polish (CheckoutView.tsx)
- Add visual step indicator at top (Order Summary → Details → Confirm)
- Add table info display inline (not just in a separate section)
- Show the selected table number prominently
- Add smoother transition animations between steps
- The "Payment and tip handled after meal" message in the table info section is good — keep it but make it more visible (icon + colored background)

### 5. Bill View Enhancement (BillView.tsx)
The BillView already has tip selection (0/10/15/18/20/25% + custom) and payment method (card/cash/wallet). This is correct. Polish it:
- Add receipt-style layout with dashed lines
- Show itemized list with quantities and prices
- Add "Request Assistance" button for dine-in customers
- Add smooth transitions between states
- Handle edge cases: zero-tip, custom tip edge values

### 6. Navigation Flow Consistency
- Ensure all navigation between discover → welcome → menu → cart → checkout → tracking → feedback → bill preserves restaurant context (already using cart store)
- Verify floor plan → menu navigates correctly with restaurant context
- Test edge case: user navigates directly to /menu without restaurant. Should show error with helpful message.

### 7. Track Empty States
- Cart view empty state: Add "Browse Menu" and "Find a Table" buttons
- Floor plan empty state: "No tables configured" — add helpful guidance
- Menu empty state: "No items available" with retry

## Files to Touch
- src/features/customer/menu/MenuView.tsx (animation enhancement)
- src/features/customer/welcome/WelcomeView.tsx (floor plan prominence)
- src/features/customer/checkout/CheckoutView.tsx (step indicator)
- src/features/customer/bill/BillView.tsx (receipt layout, polish)
- src/features/customer/floor-plan/FloorPlanView.tsx (quick order button, polish)
- src/features/customer/cart/CartView.tsx (empty state)
- src/index.css (animation keyframes)

## Verification
1. Click ANYWHERE on a menu item card → adds to cart with scale-bounce + checkmark animation
2. Navigate from discover → restaurant → floor plan → select table → menu → add items → cart → checkout → tracking → bill
3. Bill page shows tip selection and payment method (post-meal)
4. Floor plan is the primary action for dine-in customers on the welcome page
5. Cart store persists across all navigation (check localStorage)
