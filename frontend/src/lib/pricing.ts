// Mirrors backend/src/utils/pricing.js — keep the two in sync.
export const DELIVERY_FEE = 150
export const TAX_RATE = 0.05
export const MAX_QUANTITY_PER_ITEM = 50

export function calculateTotals(subtotal: number) {
  const tax = Math.round(subtotal * TAX_RATE)
  return {
    subtotal,
    deliveryFee: DELIVERY_FEE,
    tax,
    total: subtotal + DELIVERY_FEE + tax,
  }
}

export function formatPKR(amount: number) {
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`
}
