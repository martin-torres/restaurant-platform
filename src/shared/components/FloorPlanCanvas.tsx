// ============================================================================
// FloorPlanCanvas — Shared Floor Plan Rendering Component
// ============================================================================
// Renders tables and props identically across all views (customer, FOH, manager, editor).
// Uses floorPlanColors.ts for all status computation and color mapping.
// ============================================================================

import React, { useMemo, useState, useEffect, useRef } from 'react'
import type { RestaurantTable, FloorProp, FloorPlan, ChairPosition } from '../../types'
import { useTableStatusPulses } from '../hooks/useTableStatusPulses'
import {
  computeTableStatus,
  computeTableStatusExtended,
  getStatusClasses,
  getShapeClass,
  getShapeBorderRadius,
  STATUS_CSS_VARS,
  PROP_ICONS,
  PROP_LABELS,
  type TableStatusResult,
  type TableStatusColor,
} from '../utils/floorPlanColors'

// ─── Types ───

/** Mode determines which colors are visible. */
export type StatusMode = 'customer' | 'staff' | 'editor'

/**
 * Minimal order shape needed for status computation.
 * Works for both customer and staff views.
 */
export interface OrderForStatus {
  id: string
  table_id?: string
  status: string
  is_request?: boolean
  kitchen_status?: string
  bar_status?: string
  created_at?: string
}

export interface FloorPlanCanvasProps {
  tables: RestaurantTable[]
  props?: FloorProp[]
  orders?: OrderForStatus[]
  floorPlan?: FloorPlan | null
  statusMode: StatusMode
  onTableClick?: (table: RestaurantTable) => void
  onPropClick?: (prop: FloorProp) => void
  selectedTableId?: string | null
  selectedPropId?: string | null
  /** In editor mode, allows dragging tables */
  onTableMouseDown?: (e: React.MouseEvent, tableId: string) => void
  onPropMouseDown?: (e: React.MouseEvent, propId: string) => void
  onMouseMove?: (e: React.MouseEvent) => void
  onMouseUp?: () => void
  canvasRef?: React.RefObject<HTMLDivElement | null>
  className?: string
  /** Show grid background */
  showGrid?: boolean
  /** Whether to show chair dots */
  showChairs?: boolean
  /** Whether to show seat numbers (staff/editor only) */
  showSeatNumbers?: boolean
  /** Whether to show elapsed time badges (staff only) */
  showElapsed?: boolean
  /** Custom empty state */
  emptyState?: React.ReactNode
}

// ─── Main Component ───

export default function FloorPlanCanvas({
  tables,
  props: floorProps = [],
  orders = [],
  floorPlan,
  statusMode,
  onTableClick,
  onPropClick,
  selectedTableId,
  selectedPropId,
  onTableMouseDown,
  onPropMouseDown,
  onMouseMove,
  onMouseUp,
  canvasRef,
  className = '',
  showGrid = true,
  showChairs = true,
  showSeatNumbers = false,
  showElapsed = false,
  emptyState,
}: FloorPlanCanvasProps) {
  // ─── Compute status for each table ───
  const tableStatuses = useMemo(() => {
    const map = new Map<string, TableStatusResult & { elapsed?: number }>()
    for (const table of tables) {
      const tableOrders = orders.filter((o) => o.table_id === table.id)

      // Use extended computation for staff/editor (handles kitchen/bar statuses)
      const result =
        statusMode === 'customer'
          ? computeTableStatus({
              orders: tableOrders.map((o) => ({
                status: o.status,
                is_request: o.is_request,
              })),
              isAvailable: table.is_available,
              isReserved: table.is_reserved,
            })
          : computeTableStatusExtended({
              orders: tableOrders.map((o) => ({
                status: o.status,
                is_request: o.is_request,
                kitchen_status: o.kitchen_status,
                bar_status: o.bar_status,
              })),
              isAvailable: table.is_available,
              isReserved: table.is_reserved,
              isBeingCleaned: !table.is_available && tableOrders.length === 0,
            })

      // Calculate elapsed minutes from earliest order
      let elapsed: number | undefined
      if (tableOrders.length > 0 && showElapsed) {
        const earliest = tableOrders.reduce((min, o) => {
          const t = o.created_at ? new Date(o.created_at).getTime() : Infinity
          return t < min ? t : min
        }, Infinity)
        if (earliest !== Infinity) {
          elapsed = Math.floor((Date.now() - earliest) / 60000)
        }
      }

      map.set(table.id, { ...result, elapsed })
    }
    return map
  }, [tables, orders, statusMode, showElapsed])

  // Live pulse rings when table / order status changes
  const pulsingIds = useTableStatusPulses(tables, orders)

  const canvasW = floorPlan?.canvas_w || Math.max(...tables.map((t) => t.x + t.width), ...floorProps.map((p) => p.x + p.width), 400)
  const canvasH = floorPlan?.canvas_h || Math.max(...tables.map((t) => t.y + t.height), ...floorProps.map((p) => p.y + p.height), 400)
  const gridSize = floorPlan?.grid_size || 20

  if (tables.length === 0 && floorProps.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 px-4 ${className}`}>
        {emptyState || (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18M10 6V18M14 6V18" />
              </svg>
            </div>
            <p className="text-text-secondary text-sm text-center font-medium">
              No tables configured yet.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={canvasRef}
      className={`relative ${className}`}
      style={{
        width: canvasW,
        minHeight: canvasH,
        maxWidth: '100%',
        overflow: 'visible',
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Grid background */}
      {showGrid && (
        <div
          className="absolute inset-0 opacity-[0.03] rounded-2xl pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        />
      )}

      {/* Render props first (behind tables) */}
      {floorProps.map((prop) => (
        <FloorPropElement
          key={prop.id}
          prop={prop}
          isSelected={selectedPropId === prop.id}
          onClick={onPropClick}
          onMouseDown={onPropMouseDown}
        />
      ))}

      {/* Render tables */}
      {tables.map((table) => {
        const status = tableStatuses.get(table.id)
        if (!status) return null

        return (
          <TableElement
            key={table.id}
            table={table}
            status={status}
            statusMode={statusMode}
            isSelected={selectedTableId === table.id}
            showChairs={showChairs}
            showSeatNumbers={showSeatNumbers}
            showElapsed={showElapsed}
            pulsingIds={pulsingIds}
            onClick={onTableClick}
            onMouseDown={onTableMouseDown}
          />
        )
      })}
    </div>
  )
}

// ─── Table Element ───

interface TableElementProps {
  table: RestaurantTable
  status: TableStatusResult & { elapsed?: number }
  statusMode: StatusMode
  isSelected: boolean
  showChairs: boolean
  showSeatNumbers: boolean
  showElapsed: boolean
  pulsingIds: Set<string>
  onClick?: (table: RestaurantTable) => void
  onMouseDown?: (e: React.MouseEvent, tableId: string) => void
}

function TableElement({
  table,
  status,
  statusMode,
  isSelected,
  showChairs,
  showSeatNumbers,
  showElapsed,
  pulsingIds,
  onClick,
  onMouseDown,
}: TableElementProps) {
  const { primary, secondary, hasReservation } = status

  // Apply customer-mode collapsing
  const effectivePrimary = applyCustomerCollapse(primary, statusMode)
  const effectiveSecondary = applyCustomerCollapse(secondary, statusMode)

  // Tailwind classes
  const bgClass = getStatusClasses(effectivePrimary, statusMode)
  // Indigo (reservation) ALWAYS takes border precedence, regardless of mode
  const borderClass = hasReservation
    ? 'border-fp-indigo'
    : effectiveSecondary
      ? getStatusClasses(effectiveSecondary, statusMode, true)
      : getStatusClasses(effectivePrimary, statusMode, true)
  const shapeClass = getShapeClass(table.shape)

  // Inline style values for the editor canvas (which uses CSS custom properties)
  const bgVar = STATUS_CSS_VARS[effectivePrimary] || STATUS_CSS_VARS.none
  const borderVar = hasReservation
    ? STATUS_CSS_VARS.indigo
    : effectiveSecondary
      ? STATUS_CSS_VARS[effectiveSecondary]
      : STATUS_CSS_VARS[effectivePrimary] || STATUS_CSS_VARS.none

  // ─── Live pulse on status change ───
  const pulseClass = pulsingIds.has(table.id) ? `pulse-${status.primary || 'none'}` : ''

  // Build class string
  const containerClasses = [
    'absolute flex items-center justify-center transition-all',
    statusMode === 'editor' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
    isSelected ? 'ring-2 ring-brand-500 shadow-lg z-10' : 'z-0',
    bgClass,
    borderClass,
    'border-[3px]',
    shapeClass,
    pulseClass,
  ].filter(Boolean).join(' ')

  const handleClick = onClick ? () => onClick(table) : undefined
  const handleMouseDown = onMouseDown
    ? (e: React.MouseEvent) => onMouseDown(e, table.id)
    : undefined

  return (
    <div className="group">
      <div
        className={containerClasses}
        style={{
          left: `${table.x}px`,
          top: `${table.y}px`,
          width: `${table.width}px`,
          height: `${table.height}px`,
          transform: `rotate(${table.rotation || 0}deg)`,
          // For editor: use CSS vars. For customer/staff: Tailwind handles it.
          ...(statusMode === 'editor'
            ? {
                backgroundColor: bgVar,
                borderColor: borderVar,
                borderRadius: getShapeBorderRadius(table.shape),
              }
            : {}),
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        {/* Table label */}
        <span
          className={`text-xs font-bold drop-shadow-sm truncate px-1 ${
            effectivePrimary === 'none'
              ? 'text-gray-700'
              : 'text-white'
          }`}
        >
          {table.display_name || `T${table.table_number}`}
        </span>

        {/* Status dot (customer view) */}
        {statusMode === 'customer' && effectivePrimary !== 'none' && (
          <span
            className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border-[2.5px] border-surface ${getStatusDotClass(effectivePrimary)}`}
          />
        )}

        {/* Elapsed time badge (staff/editor) */}
        {showElapsed && status.elapsed != null && status.elapsed > 0 && (
          <span
            className={`absolute -top-1.5 -right-0.5 text-[9px] px-1 py-0.5 rounded-full ${
              status.elapsed > 20 ? 'bg-fp-red text-white font-bold' : 'bg-black/50 text-white/70'
            }`}
          >
            {status.elapsed}m
          </span>
        )}
      </div>

      {/* Chairs — positioned relative to table origin, rendered outside the table div */}
      {showChairs &&
        (table.chair_positions || []).map((chair, idx) => (
          <ChairDot
            key={`${table.id}-chair-${idx}`}
            chair={chair}
            tableX={table.x}
            tableY={table.y}
            showSeatNumber={showSeatNumbers}
            statusMode={statusMode}
          />
        ))}
    </div>
  )
}

// ─── Chair Dot ───

interface ChairDotProps {
  chair: ChairPosition
  tableX: number
  tableY: number
  showSeatNumber: boolean
  statusMode: StatusMode
}

function ChairDot({ chair, tableX, tableY, showSeatNumber, statusMode }: ChairDotProps) {
  // Chair positions are relative to the table's center in the editor
  // In the canvas, tables use left/top for position, so we need to offset
  // from table origin. The chair x/y offsets are from the table's center
  // (or from 0,0 within the table element for the editor view).
  // In the customer view (FloorPlanView), chairs use absolute positioning
  // relative to the canvas, so we add table.x/y.
  const isEditorStyle = statusMode === 'editor'

  if (isEditorStyle) {
    // Editor: chairs are rendered INSIDE the table div using position:absolute
    // relative to the table element. The chair.x/y are offsets from table center.
    // This is returned as part of the table element, not here.
    // For non-editor views, we render chairs outside the table div.
    return null
  }

  // Customer & Staff: chairs rendered at absolute canvas position
  return (
    <div className="group">
      <div
        className="absolute w-2.5 h-2.5 rounded-full bg-text-muted border-2 border-surface shadow-sm"
        style={{
          left: `${tableX + chair.x}px`,
          top: `${tableY + chair.y}px`,
        }}
      />
      {showSeatNumber && (
        <div
          className="absolute text-[7px] text-text-muted font-mono"
          style={{
            left: `${tableX + chair.x}px`,
            top: `${tableY + chair.y + 8}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {chair.seat_number}
        </div>
      )}
    </div>
  )
}

// ─── Prop Element ───

interface FloorPropElementProps {
  prop: FloorProp
  isSelected: boolean
  onClick?: (prop: FloorProp) => void
  onMouseDown?: (e: React.MouseEvent, propId: string) => void
}

function FloorPropElement({ prop, isSelected, onClick, onMouseDown }: FloorPropElementProps) {
  const icon = PROP_ICONS[prop.prop_type] || PROP_ICONS.other
  const label = prop.display_name || prop.label || PROP_LABELS[prop.prop_type] || prop.prop_type

  const handleClick = onClick ? () => onClick(prop) : undefined
  const handleMouseDown = onMouseDown
    ? (e: React.MouseEvent) => onMouseDown(e, prop.id)
    : undefined

  // Window props get a special CAD-style rendering
  const isWindow = prop.prop_type === 'window'
  const showLabel = (prop.width || 40) > 50 && (prop.display_name || prop.label)

  return (
    <div
      className={`absolute flex items-center justify-center text-xs ${
        isSelected ? 'ring-2 ring-brand-400 rounded-sm' : ''
      } ${!prop.is_available ? 'opacity-50' : ''}`}
      style={{
        left: prop.x,
        top: prop.y,
        width: prop.width || 40,
        height: prop.height || 40,
        transform: prop.rotation ? `rotate(${prop.rotation}deg)` : undefined,
        zIndex: 0,
        cursor: onMouseDown ? 'move' : 'default',
        borderRadius:
          prop.shape === 'circle'
            ? '50%'
            : prop.shape === 'booth_u' || prop.shape === 'booth_half_u'
              ? '12px 12px 0 0'
              : '8px',
        backgroundColor: !prop.is_available
          ? 'var(--color-fp-darkgray)'
          : prop.is_interactive
            ? 'var(--color-surface-hover)'
            : 'var(--color-surface)',
        borderColor: prop.is_reserved ? 'var(--color-fp-indigo)' : 'var(--color-border)',
        borderWidth: prop.is_reserved ? '3px' : '2px',
        borderStyle: 'solid',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      title={`${label} (click to select)`}
    >
      {/* Display name or icon */}
      {showLabel ? (
        <span className="text-[10px] font-bold text-text drop-shadow-sm truncate px-1">{label}</span>
      ) : isWindow ? (
        /* CAD-style 2D window: thick outline with cross */
        <div className="relative w-full h-full">
          <div className="absolute inset-0 border-[3px] border-text-muted/60 rounded-sm" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-[2px] bg-text-muted/30" />
            <div className="absolute inset-y-0 left-1/2 w-[2px] bg-text-muted/30" />
          </div>
        </div>
      ) : (
        <span className="text-sm opacity-60" title={label}>
          {icon}
        </span>
      )}
      {/* Chairs — if seats > 0 */}
      {(prop.chair_positions || []).map((chair) => (
        <div
          key={`chair-${chair.seat_number}`}
          className="absolute w-3 h-3 rounded-full bg-brand-500/70 border border-brand-600"
          style={{
            left: chair.x - 6,
            top: chair.y - 6,
            transform: chair.rotation ? `rotate(${chair.rotation}deg)` : undefined,
          }}
        />
      ))}
    </div>
  )
}

// ─── Convenience: compute table status map ───

/**
 * Hook-friendly utility: compute the status map for all tables.
 * Useful for views that need to access status data outside the canvas.
 */
export function useTableStatusMap(
  tables: RestaurantTable[],
  orders: OrderForStatus[],
  mode: StatusMode
): Map<string, TableStatusResult & { elapsed?: number }> {
  return useMemo(() => {
    const map = new Map<string, TableStatusResult & { elapsed?: number }>()
    for (const table of tables) {
      const tableOrders = orders.filter((o) => o.table_id === table.id)

      const result =
        mode === 'customer'
          ? computeTableStatus({
              orders: tableOrders.map((o) => ({
                status: o.status,
                is_request: o.is_request,
              })),
              isAvailable: table.is_available,
              isReserved: table.is_reserved,
            })
          : computeTableStatusExtended({
              orders: tableOrders.map((o) => ({
                status: o.status,
                is_request: o.is_request,
                kitchen_status: o.kitchen_status,
                bar_status: o.bar_status,
              })),
              isAvailable: table.is_available,
              isReserved: table.is_reserved,
              isBeingCleaned: !table.is_available && tableOrders.length === 0,
            })

      const earliest = tableOrders.reduce((min, o) => {
        const t = o.created_at ? new Date(o.created_at).getTime() : Infinity
        return t < min ? t : min
      }, Infinity)
      const elapsed = earliest !== Infinity ? Math.floor((Date.now() - earliest) / 60000) : undefined

      map.set(table.id, { ...result, elapsed })
    }
    return map
  }, [tables, orders, mode])
}

// ─── Helper: Apply customer collapse ───

function applyCustomerCollapse(
  color: TableStatusColor | null,
  mode: StatusMode
): TableStatusColor {
  if (!color) return 'none'
  if (mode === 'customer') {
    switch (color) {
      case 'amber':
      case 'red':
      case 'green':
      case 'yellow':
      case 'blue':
        return 'lightgray'
      default:
        return color
    }
  }
  return color
}

// ─── Helper: Status dot class ───

function getStatusDotClass(color: TableStatusColor): string {
  switch (color) {
    case 'amber':
      return 'bg-fp-amber'
    case 'red':
      return 'bg-fp-red'
    case 'green':
      return 'bg-fp-green'
    case 'yellow':
      return 'bg-fp-yellow'
    case 'blue':
      return 'bg-fp-blue'
    case 'darkgray':
      return 'bg-fp-darkgray'
    case 'lightgray':
      return 'bg-text-muted'
    case 'none':
      return 'bg-success'
    default:
      return 'bg-text-muted'
  }
}