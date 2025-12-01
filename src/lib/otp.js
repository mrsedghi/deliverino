/**
 * OTP (One-Time Password) generation and verification
 * For development, we'll use simple 6-digit codes
 * In production, integrate with SMS provider (Twilio, AWS SNS, etc.)
 */

// In-memory store for OTPs (in production, use Redis)
// TODO: Migrate to Redis for production scalability
// Use globalThis to persist across hot reloads in Next.js development
const globalForOTP = globalThis;
if (!globalForOTP.otpStore) {
  globalForOTP.otpStore = new Map(); // Map<phone, { code, expiresAt, attempts, lastSent }>
}
const otpStore = globalForOTP.otpStore;

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
  // Normalize phone number to ensure consistency
  const normalizedPhone = phone.trim().replace(/\s+/g, "");
  console.log('[OTP Generate] Phone received:', phone);
  console.log('[OTP Generate] Phone normalized:', normalizedPhone);
  
  // Check if there's a recent OTP and enforce cooldown
  const existing = otpStore.get(normalizedPhone);
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

  otpStore.set(normalizedPhone, {
    code,
    expiresAt,
    attempts: 0,
    lastSent: new Date(),
  });

  // Log the OTP in all environments (for debugging/testing)
  console.log(`[OTP] Code for ${normalizedPhone}: ${code} (expires in ${OTP_CONFIG.expiryMinutes} minutes)`);
  console.log(`[OTP] Stored in map with key: "${normalizedPhone}"`);
  console.log(`[OTP] Current store size: ${otpStore.size}`);

  // TODO: Send SMS via provider (Twilio, AWS SNS, etc.)
  // await sendSMS(phone, `Your verification code is: ${code}`);

  return {
    code, // Always return code (for all environments - development, production, etc.)
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
  // Normalize phone number to ensure consistency (same as generateOTPForPhone)
  const normalizedPhone = phone.trim().replace(/\s+/g, "");
  
  // Debug: Log all stored OTPs and the phone being verified
  console.log('[OTP Verify] Phone received:', phone);
  console.log('[OTP Verify] Phone normalized:', normalizedPhone);
  console.log('[OTP Verify] OTP Store keys:', Array.from(otpStore.keys()));
  console.log('[OTP Verify] OTP Store size:', otpStore.size);
  
  const stored = otpStore.get(normalizedPhone);

  if (!stored) {
    // Try to find with different phone formats
    const allPhones = Array.from(otpStore.keys());
    console.log('[OTP Verify] Available phones in store:', allPhones);
    console.log('[OTP Verify] Phone match check:', {
      received: phone,
      normalized: normalizedPhone,
      available: allPhones,
      exactMatch: allPhones.includes(normalizedPhone),
    });
    
    return {
      valid: false,
      error: 'No OTP found. Please request a new one.',
    };
  }

  // Check if expired
  if (new Date() > stored.expiresAt) {
    otpStore.delete(normalizedPhone);
    return {
      valid: false,
      error: 'OTP has expired. Please request a new one.',
    };
  }

  // Check max attempts
  if (stored.attempts >= OTP_CONFIG.maxAttempts) {
    otpStore.delete(normalizedPhone);
    return {
      valid: false,
      error: 'Maximum verification attempts exceeded. Please request a new OTP.',
    };
  }

  // Verify code
  stored.attempts++;
  console.log('[OTP Verify] Code comparison:', {
    received: code,
    stored: stored.code,
    match: stored.code === code,
  });
  if (stored.code !== code) {
    const remainingAttempts = OTP_CONFIG.maxAttempts - stored.attempts;
    if (stored.attempts >= OTP_CONFIG.maxAttempts) {
      otpStore.delete(normalizedPhone);
    }
    return {
      valid: false,
      error: `Invalid OTP. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Please request a new OTP.'}`,
      remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0,
    };
  }

  // OTP verified successfully
  console.log('[OTP Verify] ✅ OTP verified successfully for:', normalizedPhone);
  otpStore.delete(normalizedPhone);
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
  const normalizedPhone = phone.trim().replace(/\s+/g, "");
  const stored = otpStore.get(normalizedPhone);
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

