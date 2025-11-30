import { isRateLimited, generateAndStoreOtp } from '@/lib/otp-store';
import { sendSms } from '@/lib/sms';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone } = req.body;

    // Validate phone number
    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const normalizedPhone = phone.trim();

    // Check rate limiting
    if (isRateLimited(normalizedPhone)) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.' 
      });
    }

    // Generate OTP
    const otp = await generateAndStoreOtp(normalizedPhone);

    // Send OTP via SMS (stub)
    await sendSms(normalizedPhone, `Your verification code is: ${otp}`);

    // In development, log the OTP for testing
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔐 OTP for ${normalizedPhone}: ${otp}`);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error in request-otp:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

