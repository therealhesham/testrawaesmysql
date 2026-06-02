import axios from 'axios';

/**
 * Sends an SMS message to a mobile number using the Brcitco API.
 * @param to The recipient phone number (e.g. 05xxxxxxx, 966xxxxxxx, etc.)
 * @param message The text message to send
 */
export async function sendSMS(to: string, message: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const user = process.env.SMS_USER;
    const pass = process.env.SMS_PASS;
    const sender = process.env.SMS_SENDER;
    const apiUrl = process.env.SMS_API_URL || 'https://www.brcitco-api.com/api/sendsms/';

    if (!user || !pass || !sender) {
      throw new Error('SMS service credentials are missing in the environment variables (.env)');
    }

    // Clean and normalize the phone number for Saudi Arabia (must start with 966)
    let cleanPhone = to.trim().replace(/[\s\-\+\(\)]/g, '');
    
    if (cleanPhone.startsWith('00966')) {
      cleanPhone = cleanPhone.substring(5);
    } else if (cleanPhone.startsWith('966')) {
      cleanPhone = cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('05')) {
      cleanPhone = cleanPhone.substring(1); // Remove leading 0 to get 5xxxxxxx
    }
    
    const formattedRecipient = `966${cleanPhone}`;

    // Execute GET request to Brcitco SMS API
    const response = await axios.get(apiUrl, {
      params: {
        user,
        pass,
        to: formattedRecipient,
        message,
        sender,
      },
    });

    console.log(`[SMS Service] Message sent successfully to ${formattedRecipient}. Response:`, response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('[SMS Service] Error sending SMS:', error?.message || error);
    return {
      success: false,
      error: error?.message || String(error),
    };
  }
}
