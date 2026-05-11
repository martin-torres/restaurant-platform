// ============================================================================
// Floor Plan Color Priority System — Shared Utility
// ============================================================================
// This module defines the canonical color priority system for table status,
// multi-status computation, customer-mode collapsing, and CSS class mapping.
// All views (customer, FOH, manager, editor) MUST use these functions so
// colors are consistent across the entire platform.
// ============================================================================

// ─── Types ───

/** The 7 fill colors + 'none' (empty). 'indigo' is border-only, never a fill. */
export type TableStatusColor =
  | 'amber'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'darkgray'
  | 'lightgray'
  | 'none'

// ─── Constants ───

/** Priority map — lower number = higher priority (1 = most urgent) */
export const STATUS_PRIORITY: Record<TableStatusColor, number> = {
  amber: 1,
  red: 2,
  green: 3,
  yellow: 4,
  blue: 5,
  darkgray: 6,
  lightgray: 7,
  none: 8,
}

/** Human-readable labels for each status color */
export const STATUS_LABELS: Record<TableStatusColor, string> = {
  amber: 'Customer Request',
  red: 'Ready to Pick Up',
  green: 'In Progress',
  yellow: 'Being Delivered',
  blue: 'New Order',
  darkgray: 'Being Cleaned',
  lightgray: 'Occupied',
  none: 'Available',
}

/** Colors that are hidden from customer view — they all collapse to lightgray fill */
export const STAFF_ONLY_COLORS: TableStatusColor[] = [
  'amber',
  'red',
  'green',
  'yellow',
  'blue',
]

// ─── Interfaces ───

/** Output of computeTableStatus — everything a rendering component needs */
export interface TableStatusResult {
  /** Highest-priority color → used as background fill */
  primary: TableStatusColor
  /** Second-highest-priority color → used as border color (null if no secondary) */
  secondary: TableStatusColor | null
  /** Whether to show indigo reservation border (takes precedence as border color) */
  hasReservation: boolean
}

// ─── Order status → color mapping ───

/**
 * Map a database order status string to a TableStatusColor.
 * Covers the standard order lifecycle plus station-specific statuses.
 */
export function orderStatusToColor(status: string): TableStatusColor {
  switch (status) {
    case 'new':
      return 'blue'
    case 'in_progress':
      return 'green'
    case 'ready':
      return 'red'
    case 'picking_up':
      return 'yellow'
    case 'delivered':
    case 'completed':
      return 'lightgray'
    case 'cancelled':
      return 'none'
    default:
      return 'lightgray'
  }
}

// ─── Core computation ───

/**
 * Compute the primary/secondary fill colors and reservation flag for a table.
 *
 * Algorithm:
 *  1. Map each order's effective status to a color via orderStatusToColor()
 *  2. If any order has is_request=true, add 'amber' to the color set
 *     (this also overrides kitchen/bar station logic at highest priority)
 *  3. Sort collected colors by priority → primary = highest, secondary = 2nd highest
 *  4. If isReserved, set hasReservation=true (indigo border, never fill)
 *  5. If no orders:
 *     - not available + being cleaned → primary=darkgray
 *     - not available + not being cleaned → primary=lightgray
 *     - available → primary=none
 */
export function computeTableStatus(params: {
  orders: Array<{ status: string; is_request?: boolean }>
  isAvailable: boolean
  isReserved: boolean
  isBeingCleaned?: boolean
}): TableStatusResult {
  const { orders, isAvailable, isReserved, isBeingCleaned } = params

  // Collect colors from all orders
  const colors: TableStatusColor[] = []

  for (const order of orders) {
    // Customer request always maps to amber (priority 1)
    if (order.is_request) {
      colors.push('amber')
      // Also process the order's regular status for secondary color
      const orderColor = orderStatusToColor(order.status)
      // Only add if it's not amber (avoid duplicate)
      if (orderColor !== 'amber' && orderColor !== 'none') {
        colors.push(orderColor)
      }
    } else {
      // Basic version: use order.status directly (no station overrides)
      const color = orderStatusToColor(order.status)
      if (color !== 'none') {
        colors.push(color)
      }
    }
  }

  // Sort by priority and pick top 2
  const sorted = colors.sort(
    (a, b) => STATUS_PRIORITY[a] - STATUS_PRIORITY[b]
  )

  const primary: TableStatusColor = sorted[0] || 'none'
  const secondary: TableStatusColor | null =
    sorted.length > 1 ? sorted[1] : null

  // Handle "no orders" table states
  if (orders.length === 0) {
    if (!isAvailable) {
      return {
        primary: isBeingCleaned ? 'darkgray' : 'lightgray',
        secondary: null,
        hasReservation: isReserved,
      }
    }
    return {
      primary: 'none',
      secondary: null,
      hasReservation: isReserved,
    }
  }

  return {
    primary,
    secondary,
    hasReservation: isReserved,
  }
}

// ─── Helpers for extended order type ───

/**
 * Type guard / cast for orders that may have kitchen_status / bar_status
 * fields (used in FOH and manager views). These fields don't exist on the
 * minimal { status, is_request } type, but the computeTableStatus function
 * references them via type assertion in view-specific code.
 */
export interface ExtendedOrderStatus {
  status: string
  is_request?: boolean
  kitchen_status?: string
  bar_status?: string
}

/**
 * Compute table status using the extended order type (with kitchen/bar statuses).
 * This is the version used by staff views.
 */
export function computeTableStatusExtended(params: {
  orders: ExtendedOrderStatus[]
  isAvailable: boolean
  isReserved: boolean
  isBeingCleaned?: boolean
}): TableStatusResult {
  const { orders, isAvailable, isReserved, isBeingCleaned } = params

  const colors: TableStatusColor[] = []

  for (const order of orders) {
    if (order.is_request) {
      colors.push('amber')
      // Also process main status for potential secondary color
      const orderColor = orderStatusToColor(order.status)
      if (orderColor !== 'amber' && orderColor !== 'none') {
        colors.push(orderColor)
      }
    } else {
      // Check station-specific statuses first
      let effectiveStatus = order.status
      if (
        order.kitchen_status === 'ready' ||
        order.bar_status === 'ready'
      ) {
        effectiveStatus = 'ready'
      } else if (
        order.kitchen_status === 'in_progress' ||
        order.bar_status === 'in_progress'
      ) {
        effectiveStatus = 'in_progress'
      } else if (
        order.kitchen_status === 'new' ||
        order.bar_status === 'new'
      ) {
        effectiveStatus = 'new'
      }

      const color = orderStatusToColor(effectiveStatus)
      if (color !== 'none') {
        colors.push(color)
      }
    }
  }

  const sorted = colors.sort(
    (a, b) => STATUS_PRIORITY[a] - STATUS_PRIORITY[b]
  )

  const primary: TableStatusColor = sorted[0] || 'none'
  const secondary: TableStatusColor | null =
    sorted.length > 1 ? sorted[1] : null

  if (orders.length === 0) {
    if (!isAvailable) {
      return {
        primary: isBeingCleaned ? 'darkgray' : 'lightgray',
        secondary: null,
        hasReservation: isReserved,
      }
    }
    return {
      primary: 'none',
      secondary: null,
      hasReservation: isReserved,
    }
  }

  return {
    primary,
    secondary,
    hasReservation: isReserved,
  }
}

// ─── CSS class mapping ───

/**
 * CSS variable values for each color, used when inline styles are needed
 * (e.g., the editor canvas uses CSS custom properties).
 */
export const STATUS_CSS_VARS: Record<TableStatusColor | 'indigo', string> = {
  amber: 'var(--color-fp-amber)',
  red: 'var(--color-fp-red)',
  green: 'var(--color-fp-green)',
  yellow: 'var(--color-fp-yellow)',
  blue: 'var(--color-fp-blue)',
  darkgray: 'var(--color-fp-darkgray)',
  lightgray: 'var(--color-fp-lightgray)',
  none: 'var(--color-surface-hover)',
  indigo: 'var(--color-fp-indigo)',
}

/**
 * Map a TableStatusColor to Tailwind background classes, respecting the mode:
 *  - 'staff' / 'editor': all 8 colors render as-is
 *  - 'customer': amber/red/green/yellow/blue all collapse to lightgray
 *
 * @param color   The fill color to convert
 * @param mode    'staff', 'customer', or 'editor'
 * @param isBorder If true, returns border classes instead of bg classes
 */
export function getStatusClasses(
  color: TableStatusColor,
  mode: 'staff' | 'customer' | 'editor',
  isBorder?: boolean
): string {
  // Collapse staff-only colors for customer mode
  const effectiveColor: TableStatusColor =
    mode === 'customer' && STAFF_ONLY_COLORS.includes(color)
      ? 'lightgray'
      : color

  if (isBorder) {
    return getBorderClasses(effectiveColor)
  }
  return getBackgroundClasses(effectiveColor)
}

/** Tailwind background classes for each status color */
function getBackgroundClasses(color: TableStatusColor): string {
  switch (color) {
    case 'amber':
      return 'bg-fp-amber/20'
    case 'red':
      return 'bg-fp-red/20'
    case 'green':
      return 'bg-fp-green/20'
    case 'yellow':
      return 'bg-fp-yellow/20'
    case 'blue':
      return 'bg-fp-blue/20'
    case 'darkgray':
      return 'bg-fp-darkgray/20'
    case 'lightgray':
      return 'bg-fp-lightgray/30'
    case 'none':
      return 'bg-white'
    default:
      return 'bg-white'
  }
}

/** Tailwind border classes for each status color */
function getBorderClasses(color: TableStatusColor): string {
  switch (color) {
    case 'amber':
      return 'border-fp-amber'
    case 'red':
      return 'border-fp-red'
    case 'green':
      return 'border-fp-green'
    case 'yellow':
      return 'border-fp-yellow'
    case 'blue':
      return 'border-fp-blue'
    case 'darkgray':
      return 'border-fp-darkgray'
    case 'lightgray':
      return 'border-fp-lightgray'
    case 'none':
      return 'border-gray-300'
    default:
      return 'border-gray-300'
  }
}

/**
 * Get the Tailwind classes for the indigo reservation border.
 * Indigo = ALWAYS on border, NEVER on background fill, per spec section 2.3.
 */
export function getReservationBorderClasses(): string {
  return 'border-fp-indigo border-2'
}

/**
 * Convenience: compute the full set of CSS classes for a table's visual state.
 * Returns { containerClasses, inlineStyles } — containerClasses has Tailwind
 * bg/border classes, inlineStyles has CSS variable overrides for the editor
 * canvas that uses inline styles.
 */
export function getTableVisualClasses(params: {
  status: TableStatusResult
  mode: 'staff' | 'customer' | 'editor'
  isSelected?: boolean
  shape: string
}): {
  bgClass: string
  borderClass: string
  hasReservationBorder: boolean
  shapeClass: string
} {
  const { status, mode, shape } = params

  const bgClass = getStatusClasses(status.primary, mode)
  const borderClass = status.secondary
    ? getStatusClasses(status.secondary, mode, true)
    : getStatusClasses(status.primary, mode, true)

  const hasReservationBorder = status.hasReservation
  const shapeClass = getShapeClass(shape)

  return {
    bgClass,
    borderClass,
    hasReservationBorder,
    shapeClass,
  }
}

/** Get shape-specific Tailwind border-radius class */
export function getShapeClass(shape: string): string {
  switch (shape) {
    case 'circle':
      return 'rounded-full'
    case 'booth_u':
    case 'booth_half_u':
      return 'rounded-t-xl' // top-left and top-right rounded
    case 'bar':
      return 'rounded-xl'
    case 'square':
    case 'rectangle':
    default:
      return 'rounded-xl'
  }
}

/** Get CSS border-radius value for inline styles (editor canvas) */
export function getShapeBorderRadius(shape: string): string {
  switch (shape) {
    case 'circle':
      return '50%'
    case 'booth_u':
    case 'booth_half_u':
      return '12px 12px 0 0'
    case 'bar':
      return '8px'
    case 'square':
    case 'rectangle':
    default:
      return '8px'
  }
}

/** Prop type → emoji icon mapping (canonical source) */
export const PROP_ICONS: Record<string, string> = {
  stage: '🎭',
  bathroom: '🚻',
  window: '🪟',
  staircase: '🪜',
  wall: '🧱',
  plant: '🌿',
  other: '📦',
}

/** Prop type → default label mapping */
export const PROP_LABELS: Record<string, string> = {
  stage: 'Stage',
  bathroom: 'Bathroom',
  window: 'Window',
  staircase: 'Staircase',
  wall: 'Wall',
  plant: 'Plant',
  other: 'Prop',
}