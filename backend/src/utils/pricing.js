// Single source of truth for order pricing. The frontend mirrors these values
// in src/lib/pricing.ts so the cart summary matches what Stripe charges.
const DELIVERY_FEE = 150;
const TAX_RATE = 0.05;
const MAX_QUANTITY_PER_ITEM = 50;

function calculateTotals(subtotal) {
  const tax = Math.round(subtotal * TAX_RATE);
  return {
    subtotal,
    deliveryFee: DELIVERY_FEE,
    tax,
    total: subtotal + DELIVERY_FEE + tax,
  };
}

module.exports = { DELIVERY_FEE, TAX_RATE, MAX_QUANTITY_PER_ITEM, calculateTotals };
