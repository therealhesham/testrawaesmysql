import axios from 'axios';

/**
 * Sends an SMS message to a mobile number using the Brcitco API.
 * @param to The recipient phone number (e.g. 05xxxxxxx, 966xxxxxxx, etc.)
 * @param message The text message to send
 */
export async function sendSMS(to: string, message: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const user = process.env.MSEGAT_USERNAME;
    const apiKey = process.env.MSEGAT_API_KEY;
    const sender = process.env.MSEGAT_SENDER_NAME;
    const apiUrl = process.env.MSEGAT_API_URL || 'https://www.msegat.com/gw/sendsms.php';

    if (!user || !apiKey || !sender) {
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

    // Execute POST request to Msegat SMS API
    const response = await axios.post(apiUrl, {
      userName: user,
      apiKey: apiKey,
      numbers: formattedRecipient,
      userSender: sender,
      msg: message,
      msgEncoding: "UTF8"
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
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
