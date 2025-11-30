/**
 * Payment provider stub
 * In production, this would integrate with a real payment gateway
 * (e.g., Stripe, PayPal, Square, etc.)
 */

/**
 * Process card payment
 * @param {Object} paymentData - Payment information
 * @param {string} paymentData.cardNumber - Card number (last 4 digits for display)
 * @param {string} paymentData.expiryDate - Card expiry date (MM/YY)
 * @param {string} paymentData.cvv - Card CVV
 * @param {string} paymentData.cardholderName - Cardholder name
 * @param {number} paymentData.amount - Payment amount
 * @param {string} paymentData.currency - Currency code (default: USD)
 * @returns {Promise<Object>} Payment result
 */
export async function processCardPayment(paymentData) {
  const { amount, currency = "USD" } = paymentData;

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // In sandbox/development mode, always return success
  // In production, this would call the actual payment provider API
  if (process.env.NODE_ENV === "development" || process.env.PAYMENT_SANDBOX === "true") {
    return {
      success: true,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount,
      currency: currency,
      status: "completed",
      message: "Payment processed successfully (sandbox mode)",
    };
  }

  // Production payment processing would go here
  // Example with Stripe:
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const paymentIntent = await stripe.paymentIntents.create({
  //   amount: Math.round(amount * 100), // Convert to cents
  //   currency: currency.toLowerCase(),
  //   payment_method: paymentData.paymentMethodId,
  // });
  // return {
  //   success: paymentIntent.status === 'succeeded',
  //   transactionId: paymentIntent.id,
  //   amount: amount,
  //   currency: currency,
  //   status: paymentIntent.status,
  // };

  // For now, return success in all cases (sandbox mode)
  return {
    success: true,
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    amount: amount,
    currency: currency,
    status: "completed",
    message: "Payment processed successfully",
  };
}

/**
 * Validate payment data
 * @param {Object} paymentData - Payment information
 * @returns {Object} Validation result
 */
export function validatePaymentData(paymentData) {
  const errors = [];

  if (!paymentData.cardNumber || paymentData.cardNumber.length < 13) {
    errors.push("Invalid card number");
  }

  if (!paymentData.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
    errors.push("Invalid expiry date (format: MM/YY)");
  }

  if (!paymentData.cvv || paymentData.cvv.length < 3) {
    errors.push("Invalid CVV");
  }

  if (!paymentData.cardholderName || paymentData.cardholderName.length < 2) {
    errors.push("Invalid cardholder name");
  }

  if (!paymentData.amount || paymentData.amount <= 0) {
    errors.push("Invalid amount");
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

