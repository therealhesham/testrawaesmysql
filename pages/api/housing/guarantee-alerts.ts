import { NextApiRequest, NextApiResponse } from 'next';
import { checkAndSendHousingGuaranteeNotifications } from 'lib/housingGuaranteeNotifier';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { forceDays } = req.query;
    let customDays: number[] | undefined = undefined;

    if (forceDays) {
      const parsed = Array.isArray(forceDays) ? forceDays[0] : forceDays;
      customDays = parsed.split(',').map((d) => parseInt(d.trim())).filter((d) => !isNaN(d));
    }

    const io = (res.socket as any)?.server?.io;

    const result = await checkAndSendHousingGuaranteeNotifications({
      forceDays: customDays && customDays.length > 0 ? customDays : undefined,
      io,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error running housing guarantee alert checker:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
