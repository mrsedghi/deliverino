import bcrypt from 'bcryptjs';

/**
 * In-memory OTP store for MVP
 * In production, use Redis or database for distributed systems
 */

// Store: { phone: { hashedOtp, expiresAt, requestCount, lastRequestTime } }
const otpStore = new Map();

// Rate limiting: max requests per phone per time window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3; // Max 3 OTP requests per minute

// OTP expiry time: 5 minutes
const OTP_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Check if phone number is rate limited
 * @param {string} phone - Phone number
 * @returns {boolean} True if rate limited
 */
export function isRateLimited(phone) {
  const record = otpStore.get(phone);
  if (!record) return false;
  
  const now = Date.now();
  const timeSinceLastRequest = now - record.lastRequestTime;
  
  // Reset if window has passed
  if (timeSinceLastRequest > RATE_LIMIT_WINDOW) {
    record.requestCount = 0;
    record.lastRequestTime = now;
    return false;
  }
  
  return record.requestCount >= MAX_REQUESTS_PER_WINDOW;
}

/**
 * Generate and store OTP for a phone number
 * @param {string} phone - Phone number
 * @returns {Promise<string>} Generated OTP (plain text for sending)
 */
export async function generateAndStoreOtp(phone) {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash the OTP
  const hashedOtp = await bcrypt.hash(otp, 10);
  
  // Store with expiry
  const now = Date.now();
  const record = otpStore.get(phone);
  
  otpStore.set(phone, {
    hashedOtp,
    expiresAt: now + OTP_EXPIRY_MS,
    requestCount: record ? record.requestCount + 1 : 1,
    lastRequestTime: now,
  });
  
  // Cleanup expired entries periodically (simple approach)
  cleanupExpiredEntries();
  
  return otp;
}

/**
 * Verify OTP for a phone number
 * @param {string} phone - Phone number
 * @param {string} code - OTP code to verify
 * @returns {Promise<boolean>} True if OTP is valid
 */
export async function verifyOtp(phone, code) {
  const record = otpStore.get(phone);
  if (!record) return false;
  
  // Check expiry
  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  
  // Verify OTP
  const isValid = await bcrypt.compare(code, record.hashedOtp);
  
  // Delete OTP after verification (one-time use)
  if (isValid) {
    otpStore.delete(phone);
  }
  
  return isValid;
}

/**
 * Cleanup expired OTP entries
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [phone, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(phone);
    }
  }
}

/**
 * Get remaining time for OTP (for debugging)
 * @param {string} phone - Phone number
 * @returns {number|null} Remaining milliseconds or null if not found
 */
export function getOtpRemainingTime(phone) {
  const record = otpStore.get(phone);
  if (!record) return null;
  
  const remaining = record.expiresAt - Date.now();
  return remaining > 0 ? remaining : null;
}

