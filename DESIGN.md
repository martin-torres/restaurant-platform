---
name: "Restaurant Platform Design Tokens"
version: "1.0.0"
description: "Design tokens for the Restaurant Platform — multi-tenant PWA with iOS-native customer surfaces and Material Design 3 staff/owner surfaces"
register: product
platform: web
colors:
  primary: "#5c7cfa"
  secondary: "#4c6ef5"
  accent: "#f59f00"
---

# Restaurant Platform — Design Token Specification

## Meta
- Spec: `@google/design.md` v1.0
- Generated: 2026-05-09
- Updated: 2026-05-09
- Platform: Multi-tenant PWA (iOS/Material3)
- Register: Product (customer = iOS native, staff/owner = Material Design 3)

## Color System

### Brand Palette (per-restaurant overridable via DB)
| Token | Default | CSS Variable | Source |
|---|---|---|---|
| primary | #5c7cfa | --color-brand-500 | restaurant.primary_color |
| secondary | #4c6ef5 | --color-brand-600 | restaurant.secondary_color |
| accent | #f59f00 | --color-accent | restaurant.accent_color |

Primary scale generated via OKLCH chroma stepping: 50/100/200/300/400/500/600/700/800/900.
All brand colors use OKLCH. Reduce chroma as lightness approaches 0 or 100.
Never use `#000` or `#fff`. Tint every neutral toward the brand hue (chroma 0.005-0.01).

### Surface Tokens (Light — iOS Customer)
| Token | OKLCH Value | Hex Approx |
|---|---|---|
| --surface | oklch(100% 0.005 260) | #ffffff |
| --surface-alt | oklch(97% 0.008 260) | #f8f9fa |
| --surface-hover | oklch(95% 0.01 260) | #f1f3f5 |
| --border | oklch(88% 0.01 260) | #dee2e6 |
| --border-light | oklch(92% 0.008 260) | #e9ecef |
| --text | oklch(21% 0.02 260) | #212529 |
| --text-secondary | oklch(50% 0.03 260) | #6c757d |
| --text-muted | oklch(70% 0.02 260) | #adb5bd |

### Surface Tokens (Dark — Material3 Staff/Owner)
| Token | OKLCH Value | Hex Approx |
|---|---|---|
| --surface | oklch(16% 0.015 270) | #1a1b23 |
| --surface-alt | oklch(19% 0.02 270) | #22232e |
| --surface-hover | oklch(23% 0.025 270) | #2a2b38 |
| --border | oklch(27% 0.03 270) | #2e303e |
| --border-light | oklch(22% 0.02 270) | #252735 |
| --text | oklch(92% 0.01 270) | #e9ecef |
| --text-secondary | oklch(68% 0.02 270) | #9ca3af |
| --text-muted | oklch(50% 0.02 270) | #6b7280 |

### Status Colors (Consistent Across All Surfaces)
| Token | Hex | OKLCH |
|---|---|---|
| --success | #2b8a3e | oklch(55% 0.14 145) |
| --warning | #e67700 | oklch(60% 0.15 70) |
| --danger | #c92a2a | oklch(45% 0.18 30) |
| --info | #1971c2 | oklch(50% 0.14 250) |

### Floor Plan Status Colors (Priority-ordered)
| Token | Hex | Priority | Meaning |
|---|---|---|---|
| fp-amber | #f59f00 | 1 | Customer request |
| fp-red | #e03131 | 2 | Ready to pick up |
| fp-green | #2f9e44 | 3 | In progress |
| fp-yellow | #fcc419 | 4 | Being delivered |
| fp-blue | #1c7ed6 | 5 | New order |
| fp-darkgray | #495057 | 6 | Being cleaned |
| fp-lightgray | #dee2e6 | 7 | Occupied, no issue |
| fp-indigo | #6741d9 | 8 | Reservation (border) |

## Typography

### iOS (Customer) — SF Pro
| Token | Value | Usage |
|---|---|---|
| --font-sans | 'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif | Body, UI |
| --font-display | 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif | Headings, hero |
| --font-mono | 'SF Mono', ui-monospace, 'SFMono-Regular', monospace | Code, numbers |

### Android / Web (Staff, Owner) — Material Design 3
| Token | Value | Usage |
|---|---|---|
| --font-sans | 'Google Sans', 'Roboto', system-ui, -apple-system, sans-serif | Body, UI |
| --font-display | 'Google Sans Display', 'Google Sans', system-ui, sans-serif | Headings |
| --font-mono | 'JetBrains Mono', 'Roboto Mono', ui-monospace, monospace | Code |

### Type Scale
```
10 / 11 / 12 / 13 / 14 / 15 / 16 / 18 / 20 / 24 / 30 / 36 / 48 px
```
Ratio: 1.25 between major steps. Body: 16px (1rem). Caption: 12px.

Body line length capped at 65-75ch. Hierarchy through scale + weight contrast.

## Spacing Scale
Base unit: 4px (0.25rem).

```
2 / 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 px
```

Vary spacing for rhythm. Same padding everywhere is monotony.

## Border Radius
| Token | Value | Usage |
|---|---|---|
| --radius-sm | 6px (0.375rem) | Small badges, dots |
| --radius-md | 8px (0.5rem) | Buttons, inputs |
| --radius-lg | 12px (0.75rem) | Cards, dialogs |
| --radius-xl | 16px (1rem) | Modals, sheets |
| --radius-2xl | 24px (1.5rem) | Bottom sheets, large containers |
| --radius-full | 9999px | Pills, avatars |

iOS customer: 12-16px corner radius (rounded-xl/rounded-2xl).
Material3 staff/owner: 8-12px corner radius (rounded-lg/rounded-xl).

## Elevation & Shadow

### Light (iOS Customer)
| Token | Value |
|---|---|
| --shadow-sm | 0 1px 2px oklch(0% 0 0 / 0.05) |
| --shadow-md | 0 4px 6px -1px oklch(0% 0 0 / 0.07), 0 2px 4px -2px oklch(0% 0 0 / 0.05) |
| --shadow-lg | 0 10px 15px -3px oklch(0% 0 0 / 0.08), 0 4px 6px -4px oklch(0% 0 0 / 0.04) |
| --shadow-xl | 0 20px 25px -5px oklch(0% 0 0 / 0.1), 0 8px 10px -6px oklch(0% 0 0 / 0.05) |

### Dark (Material3 Staff/Owner)
| Token | Value |
|---|---|
| --shadow-sm | 0 1px 2px oklch(0% 0 0 / 0.3) |
| --shadow-md | 0 4px 6px oklch(0% 0 0 / 0.35) |
| --shadow-lg | 0 10px 15px oklch(0% 0 0 / 0.4) |
| --shadow-xl | 0 20px 25px oklch(0% 0 0 / 0.45) |

### Material3 Elevation Levels (Staff/Owner)
| Level | Usage | Shadow |
|---|---|---|
| 0 | Surface default | none |
| 1 | Card resting | --shadow-sm |
| 2 | Elevated card, FAB | --shadow-md |
| 3 | Modal, dialog | --shadow-lg |
| 5 | Bottom sheet, nav drawer | --shadow-xl |

## Icon System
- lucide-react for all icons
- Prefer icons over text labels where meaning is clear
- Status colors visible before reading labels (color before text)
- Minimum tap target: 44px (iOS HIG) / 48px (Material3)
- Badge counts on nav items where relevant

## Motion & Animation
| Token | Value |
|---|---|
| --transition-fast | 150ms ease-out |
| --transition-normal | 200ms ease-out |
| --transition-slow | 300ms ease-out |
| --ease-out-expo | cubic-bezier(0.16, 1, 0.3, 1) |
| --ease-spring | spring(1, 100, 10) |

### Animation Patterns
- Don't animate CSS layout properties
- Ease out with exponential curves (ease-out-quart/quint/expo). No bounce, no elastic.
- Scale effect on press (active:scale-95)
- Fade + slide for route changes
- Pulse animation for urgent statuses
- Checkmark bounce on add-to-cart

## Platform-Specific Patterns

### iOS (Customer Surface)
| Element | Pattern |
|---|---|
| Tab bar | Glass blur, safe areas, centered labels |
| Navigation | Large title headers, back chevron, right actions |
| Modals | Bottom-up sheet with grabber handle (rounded-2xl top) |
| Cards | White on gray bg, 16px radius, subtle shadow |
| Buttons | Pill-shaped (rounded-full) or rounded-xl, system blue |
| Segmented controls | iOS-style pill segmented control |
| Pickers | Scroll wheel pickers |
| Search | iOS-style search bar with cancel button |
| Transitions | Slide from right (push), slide up (modals) |

### Material Design 3 (Staff/Owner Surface)
| Element | Pattern |
|---|---|
| Bottom nav | Material3 bottom navigation with active indicator |
| Top bar | Material3 top app bar, colored status bar |
| Cards | M3 elevated cards, 12px radius, subtle elevation |
| Buttons | M3 filled/outlined/text buttons, 20px height |
| Chips | M3 filter/choice/input chips |
| Dialogs | M3 alert dialog with max-width 560px |
| Side nav | M3 navigation drawer (owner dashboard) |
| Data tables | M3 data tables with sticky headers |
| Snackbars | M3 snackbar with action button |

## Responsive Breakpoints
| Name | Width | Target |
|---|---|---|
| sm | 640px | Mobile default |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Wide |

## Component Tokens

### MenuItemCard
```
--menu-card-radius: 16px
--menu-card-padding: 12px
--menu-card-image-radius: 12px
--menu-card-image-size: 80px
--menu-card-gap: 12px
```

### FloorPlanTable
```
--fp-table-radius: 12px
--fp-table-border-width: 2px
--fp-table-label-size: 12px
--fp-chair-dot-size: 10px
```

### CheckoutSection
```
--checkout-radius: 16px
--checkout-padding: 16px
--checkout-section-gap: 20px
```

### TabBar
```
--tabbar-height: 56px
--tabbar-icon-size: 22px
--tabbar-label-size: 10px
--tabbar-safe-bottom: env(safe-area-inset-bottom, 0px)
```

## Glass Effect
```
--glass-bg: oklch(100% 0.005 260 / 0.8)
--glass-border: oklch(100% 0.005 260 / 0.2)
--glass-blur: 12px
```
Dark variant:
```
--glass-bg: oklch(16% 0.015 270 / 0.85)
--glass-border: oklch(100% 0 0 / 0.08)
```

## Export Note
All CSS custom properties in this spec are defined in `src/index.css`.
For Tailwind v4, these are available via `@theme` directive in `index.css`.
No separate `tailwind.config.js` is needed for Tailwind v4 — all theme extensions live in CSS.
