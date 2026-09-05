import { createContext, useContext, useState, type ReactNode } from 'react'

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  clearCart: () => void
  total: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  function addItem(item: Omit<CartItem, 'quantity'>, quantity: number = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId)
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [...prev, { ...item, quantity }]
    })
  }

  function updateQuantity(menuItemId: string, quantity: number) {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.menuItemId !== menuItemId)
      return prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i))
    })
  }

  function removeItem(menuItemId: string) {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId))
  }

  function clearCart() {
    setItems([])
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}