import type { NextApiRequest, NextApiResponse } from 'next';
import { sendSMS } from 'lib/sms';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Phone number (to) and message text (message) are required.' });
  }

  const result = await sendSMS(to, message);

  if (result.success) {
    return res.status(200).json({ success: true, data: result.data });
  } else {
    return res.status(500).json({ success: false, error: result.error });
  }
}
