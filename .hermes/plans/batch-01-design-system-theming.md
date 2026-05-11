# BATCH 1 — DESIGN SYSTEM & THEMING

WORKSPACE: /Users/lomalinda007yahoo.com/Documents/Project Apps/restaurant-platform
DEV SERVER: localhost:5173

## Goal
Upgrade the existing DESIGN.md to a proper @google/design.md v1.0 token spec, export to CSS variables and Tailwind theme, and harden platform detection (iOS SF Pro / Android Material Design 3).

## Current State
- DESIGN.md already exists with YAML frontmatter + body (248 lines)
- Tokens cover colors, typography, spacing, shadows, components
- src/index.css has all CSS custom properties with :root (iOS) and .platform-android / .dark overrides
- Platform detection exists in App.tsx (userAgent check for ios/android/web)
- The app uses Tailwind v4 with @theme directive in index.css

## What Needs Work

### 1. Run @google/design.md CLI to lint, export
```bash
cd /Users/lomalinda007yahoo.com/Documents/Project Apps/restaurant-platform
npx -y @google/design.md lint DESIGN.md
npx -y @google/design.md export --format tailwind DESIGN.md > tailwind.theme.json
npx -y @google/design.md export --format dtcg DESIGN.md > tokens.json
```

Fix any lint errors (broken refs, WCAG contrast issues, section ordering, component property whitelist violations).

### 2. Upgrade DESIGN.md frontmatter
Ensure it follows the canonical spec:
- `version: alpha`
- Sections in order: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts
- All hex colors quoted strings
- Negative letter-spacing values quoted
- Component variants as sibling keys (button-primary-hover), not nested
- Token references like `{colors.primary}` used in component sections

### 3. Add missing token categories
- **Spacing scale**: 2/4/8/12/16/20/24/32/40/48/64/80 px with semantic aliases
- **Breakpoints**: sm(640) / md(768) / lg(1024) / xl(1280)
- **Motion tokens**: transition-fast/normal/slow, ease-out-expo, ease-spring
- **Component tokens**: MenuItemCard, FloorPlanTable, CheckoutSection, TabBar
- **Glass effect tokens**: glass-bg/border/blur for both light and dark
- **Status colors** with priority ordering for floor plan

### 4. Harden platform detection in App.tsx
- Ensure .platform-android class applies Material3 overrides (fonts, radii, shadows)
- Ensure .dark class applies to staff/owner routes
- Verify iOS SF Pro font stack falls back gracefully on non-Apple systems
- Add Android Material 3 bottom nav style (no glass, solid surface with shadow)

### 5. Verify CSS variable export matches DESIGN.md
- Every token in DESIGN.md must have a corresponding --var in index.css
- Every --var in index.css must appear in DESIGN.md
- No orphans in either direction

### 6. Verify tailwind.theme.json covers all Tailwind utility classes used in src/

## Files to Touch
- DESIGN.md (project root)
- src/index.css (CSS custom properties)
- tailwind.theme.json (generated export)
- tokens.json (generated DTCG export)
- src/App.tsx (platform detection — minor)

## Verification
1. `npx -y @google/design.md lint DESIGN.md` passes with 0 errors
2. Dev server reloads without breaking any UI
3. Platform detection works: iOS Safari shows SF Pro, Android Chrome shows Roboto
4. Staff/owner routes (.dark class) show dark theme surfaces
