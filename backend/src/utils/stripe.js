const Stripe = require('stripe');

// Created lazily so the server (and the test suite) can boot without a Stripe
// key — only the checkout mutation actually needs it.
let stripe;

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Payments are not configured on this server');
  }
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

module.exports = { getStripe };
