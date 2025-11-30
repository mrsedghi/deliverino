/**
 * OTP (One-Time Password) generation and verification
 * For development, we'll use simple 6-digit codes
 * In production, integrate with SMS provider (Twilio, AWS SNS, etc.)
 */

// In-memory store for OTPs (in production, use Redis)
const otpStore = new Map(); // Map<phone, { code, expiresAt, attempts }>

// OTP configuration
const OTP_CONFIG = {
  length: 6,
  expiryMinutes: 10,
  maxAttempts: 3,
  resendCooldownSeconds: 60,
};

/**
 * Generate a random OTP code
 * @returns {string} 6-digit OTP code
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate and store OTP for a phone number
 * @param {string} phone - Phone number
 * @returns {Object} OTP details
 */
export function generateOTPForPhone(phone) {
  // Check if there's a recent OTP and enforce cooldown
  const existing = otpStore.get(phone);
  if (existing) {
    const cooldownEnd = new Date(existing.lastSent);
    cooldownEnd.setSeconds(cooldownEnd.getSeconds() + OTP_CONFIG.resendCooldownSeconds);
    
    if (new Date() < cooldownEnd) {
      const remainingSeconds = Math.ceil((cooldownEnd - new Date()) / 1000);
      throw new Error(`Please wait ${remainingSeconds} seconds before requesting a new OTP`);
    }
  }

  const code = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_CONFIG.expiryMinutes);

  otpStore.set(phone, {
    code,
    expiresAt,
    attempts: 0,
    lastSent: new Date(),
  });

  // In development, log the OTP (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[OTP] Code for ${phone}: ${code} (expires in ${OTP_CONFIG.expiryMinutes} minutes)`);
  }

  // TODO: Send SMS via provider (Twilio, AWS SNS, etc.)
  // await sendSMS(phone, `Your verification code is: ${code}`);

  return {
    code, // Only return in development
    expiresAt,
    message: 'OTP sent successfully',
  };
}

/**
 * Verify OTP for a phone number
 * @param {string} phone - Phone number
 * @param {string} code - OTP code to verify
 * @returns {Object} Verification result
 */
export function verifyOTP(phone, code) {
  const stored = otpStore.get(phone);

  if (!stored) {
    return {
      valid: false,
      error: 'No OTP found. Please request a new one.',
    };
  }

  // Check if expired
  if (new Date() > stored.expiresAt) {
    otpStore.delete(phone);
    return {
      valid: false,
      error: 'OTP has expired. Please request a new one.',
    };
  }

  // Check max attempts
  if (stored.attempts >= OTP_CONFIG.maxAttempts) {
    otpStore.delete(phone);
    return {
      valid: false,
      error: 'Maximum verification attempts exceeded. Please request a new OTP.',
    };
  }

  // Verify code
  stored.attempts++;
  if (stored.code !== code) {
    const remainingAttempts = OTP_CONFIG.maxAttempts - stored.attempts;
    if (stored.attempts >= OTP_CONFIG.maxAttempts) {
      otpStore.delete(phone);
    }
    return {
      valid: false,
      error: `Invalid OTP. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Please request a new OTP.'}`,
      remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0,
    };
  }

  // OTP verified successfully
  otpStore.delete(phone);
  return {
    valid: true,
    message: 'OTP verified successfully',
  };
}

/**
 * Get OTP status for a phone number (for debugging)
 * @param {string} phone - Phone number
 * @returns {Object|null} OTP status
 */
export function getOTPStatus(phone) {
  const stored = otpStore.get(phone);
  if (!stored) return null;

  return {
    expiresAt: stored.expiresAt,
    attempts: stored.attempts,
    remainingAttempts: OTP_CONFIG.maxAttempts - stored.attempts,
    isExpired: new Date() > stored.expiresAt,
  };
}

/**
 * Clear expired OTPs (cleanup function)
 */
export function clearExpiredOTPs() {
  const now = new Date();
  for (const [phone, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(phone);
    }
  }
}

// Cleanup expired OTPs every 5 minutes
setInterval(clearExpiredOTPs, 5 * 60 * 1000);

