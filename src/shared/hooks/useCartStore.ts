// ============================================================================
// Zustand Cart Store — Customer cart state management
// ============================================================================
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, MenuItem, OrderType } from '../../types'

interface CartState {
  restaurant_id: string | null
  table_id: string | null
  seat_number: number | null
  order_type: OrderType
  items: CartItem[]
  notes: string

  // Actions
  setRestaurantId: (id: string) => void
  setTable: (tableId: string, seatNumber?: number) => void
  setSeatNumber: (seat: number | null) => void
  setOrderType: (type: OrderType) => void
  setNotes: (notes: string) => void
  addItem: (menuItem: MenuItem, quantity?: number) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  updateItemSeat: (menuItemId: string, seatNumber?: number) => void
  updateItemNotes: (menuItemId: string, notes?: string) => void
  clearCart: () => void
  getItemCount: () => number
  getSubtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurant_id: null,
      table_id: null,
      seat_number: null,
      order_type: 'dine_in' as OrderType,
      items: [],
      notes: '',

      setRestaurantId: (id: string) => set({ restaurant_id: id }),

      setTable: (tableId: string, seatNumber?: number) =>
        set({ table_id: tableId, seat_number: seatNumber ?? null }),

      setSeatNumber: (seat: number | null) => set({ seat_number: seat }),

      setOrderType: (type: OrderType) => set({ order_type: type }),

      setNotes: (notes: string) => set({ notes }),

      addItem: (menuItem: MenuItem, quantity = 1) => {
        const { items } = get()
        const existing = items.find(
          (item) => item.menu_item.id === menuItem.id
        )
        if (existing) {
          set({
            items: items.map((item) =>
              item.menu_item.id === menuItem.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          })
        } else {
          set({
            items: [
              ...items,
              {
                menu_item: menuItem,
                quantity,
                seat_number: get().seat_number ?? undefined,
                selected_options: {},
                notes: undefined,
              },
            ],
          })
        }
      },

      removeItem: (menuItemId: string) =>
        set({
          items: get().items.filter(
            (item) => item.menu_item.id !== menuItemId
          ),
        }),

      updateQuantity: (menuItemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId)
          return
        }
        set({
          items: get().items.map((item) =>
            item.menu_item.id === menuItemId
              ? { ...item, quantity }
              : item
          ),
        })
      },

      updateItemSeat: (menuItemId: string, seatNumber?: number) =>
        set({
          items: get().items.map((item) =>
            item.menu_item.id === menuItemId
              ? { ...item, seat_number: seatNumber }
              : item
          ),
        }),

      updateItemNotes: (menuItemId: string, notes?: string) =>
        set({
          items: get().items.map((item) =>
            item.menu_item.id === menuItemId
              ? { ...item, notes }
              : item
          ),
        }),

      clearCart: () =>
        set({
          items: [],
          table_id: null,
          seat_number: null,
          notes: '',
        }),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.menu_item.price * item.quantity,
          0
        ),
    }),
    {
      name: 'restaurant-cart-storage',
      partialize: (state) => ({
        restaurant_id: state.restaurant_id,
        table_id: state.table_id,
        seat_number: state.seat_number,
        order_type: state.order_type,
        items: state.items,
        notes: state.notes,
      }),
    }
  )
)
