/**
 * SMS provider stub for development
 * In production, replace with actual SMS provider integration
 */

/**
 * Send SMS message (stub implementation)
 * @param {string} phone - Phone number to send SMS to
 * @param {string} message - Message content
 * @returns {Promise<boolean>} Success status
 */
export async function sendSms(phone, message) {
  // Stub implementation - logs the message instead of sending
  console.log('📱 SMS Stub - Would send SMS:');
  console.log(`   To: ${phone}`);
  console.log(`   Message: ${message}`);
  console.log('');
  
  // In production, integrate with actual SMS provider:
  // - Twilio
  // - AWS SNS
  // - MessageBird
  // - etc.
  
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return true;
}

