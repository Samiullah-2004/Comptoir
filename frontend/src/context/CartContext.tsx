import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { MAX_QUANTITY_PER_ITEM } from '../lib/pricing'

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  imageUrl: string | null
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  clearCart: () => void
  total: number
  count: number
}

const STORAGE_KEY = 'cart'

const CartContext = createContext<CartContextType | null>(null)

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)

  // Persist so the cart survives refreshes and a cancelled Stripe checkout.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Storage can be full or blocked (private mode) — the cart still works in memory.
    }
  }, [items])

  function addItem(item: Omit<CartItem, 'quantity'>, quantity: number = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId)
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.menuItemId
            ? { ...i, quantity: Math.min(MAX_QUANTITY_PER_ITEM, i.quantity + quantity) }
            : i
        )
      }
      return [...prev, { ...item, quantity: Math.min(MAX_QUANTITY_PER_ITEM, quantity) }]
    })
  }

  function updateQuantity(menuItemId: string, quantity: number) {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.menuItemId !== menuItemId)
      return prev.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity: Math.min(MAX_QUANTITY_PER_ITEM, quantity) } : i
      )
    })
  }

  function removeItem(menuItemId: string) {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId))
  }

  // Stable identity (and a no-op when already empty) so effects can depend
  // on it without re-firing every render.
  const clearCart = useCallback(() => {
    setItems((prev) => (prev.length === 0 ? prev : []))
  }, [])

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
