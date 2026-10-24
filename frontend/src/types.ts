export interface MenuItem {
  id: string
  name: string
  price: number
  imageUrl: string | null
  available: boolean
}

export interface Category {
  id: string
  name: string
  menuItems: MenuItem[]
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'

export const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']

export const statusStyles: Record<string, string> = {
  PENDING: 'bg-border text-text-secondary',
  PREPARING: 'bg-accent/15 text-accent',
  READY: 'bg-success/15 text-success',
  COMPLETED: 'bg-success/15 text-success',
  CANCELLED: 'bg-accent/15 text-accent',
}

export function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}
