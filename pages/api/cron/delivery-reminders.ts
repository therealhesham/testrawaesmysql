import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'pages/api/globalprisma';
import { sendSMS } from 'lib/sms';

// Add headers to bypass simple browser caching
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = new Date();
    
    // Create formatter for Saudi Arabia timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false
    }); // Output example: "06/06/2026, 14"

    const getRiyadhDateAndHour = (date: Date) => {
       const parts = formatter.formatToParts(date);
       const y = parts.find(p => p.type === 'year')?.value;
       const m = parts.find(p => p.type === 'month')?.value;
       const d = parts.find(p => p.type === 'day')?.value;
       let h = parts.find(p => p.type === 'hour')?.value || '00';
       if (h === '24') h = '00'; // 24 is returned for midnight in some Node versions
       return { dateStr: `${y}-${m}-${d}`, hourStr: h };
    };

    // Calculate the target hours: 12 hours ahead and 2 hours ahead
    const target12hDate = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const target2hDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const { dateStr: target12hDateStr, hourStr: target12hHour } = getRiyadhDateAndHour(target12hDate);
    const { dateStr: target2hDateStr, hourStr: target2hHour } = getRiyadhDateAndHour(target2hDate);

    // Helper to extract "YYYY-MM-DD" from a JS Date object as stored in Prisma
    const getDateString = (d: Date) => d.toISOString().split('T')[0];

    // Grouping structure to hold our notifications before sending
    type NotificationPayload = {
      phone: string;
      officerName: string;
      timeHoursStr: string; // "14" or "02" to group identical hours
      targetDate: Date;
      maids: { name: string; type: 'وصول' | 'مغادرة داخلية' | 'مغادرة خارجية' }[];
    };
    const notifications: Record<string, NotificationPayload> = {};

    // 1. Fetch all potential records from DB that have a delivery officer and some date set
    const records = await prisma.arrivallist.findMany({
      where: {
        deliveryOfficer: { not: null },
        // We don't filter by status to be safe, any assigned arrival needs handling
      },
      include: {
        Order: {
          include: {
            HomeMaid: true,
            client: true
          }
        }
      }
    });

    // We process in memory because `Time` is stored as a string like "14:30"
    for (const record of records) {
      if (!record.deliveryOfficer) continue;
      
      const maidName = record.Order?.HomeMaid?.Name || "عاملة غير محددة";
      const officerName = record.deliveryOfficer;
      
      const checkAndAdd = (dateObj: Date | null, timeStr: string | null, type: 'وصول' | 'مغادرة داخلية' | 'مغادرة خارجية') => {
        if (!dateObj || !timeStr) return;
        
        const recordDateStr = getDateString(new Date(dateObj));
        // Simple extraction: assuming "14:30" or "02:30", just grab the first digits
        const match = timeStr.match(/^(\d{1,2})/);
        if (!match) return;
        
        // Ensure 2 digit padding
        const recordHourStr = match[1].padStart(2, '0'); 
        
        // Check 12 hours
        if (recordDateStr === target12hDateStr && recordHourStr === target12hHour) {
          const key = `${officerName}-12h`;
          if (!notifications[key]) notifications[key] = { phone: '', officerName, targetDate: target12hDate, timeHoursStr: recordHourStr, maids: [] };
          notifications[key].maids.push({ name: maidName, type });
        }
        
        // Check 2 hours
        if (recordDateStr === target2hDateStr && recordHourStr === target2hHour) {
          const key = `${officerName}-2h`;
          if (!notifications[key]) notifications[key] = { phone: '', officerName, targetDate: target2hDate, timeHoursStr: recordHourStr, maids: [] };
          notifications[key].maids.push({ name: maidName, type });
        }
      };

      checkAndAdd(record.KingdomentryDate, record.KingdomentryTime, 'وصول');
      checkAndAdd(record.internaldeparatureDate, record.internaldeparatureTime, 'مغادرة داخلية');
      checkAndAdd(record.externaldeparatureDate, record.externaldeparatureTime, 'مغادرة خارجية');
    }

    const messagesSent = [];

    // 2. Resolve phone numbers and send SMS
    for (const key in notifications) {
      const payload = notifications[key];
      if (payload.maids.length === 0) continue;

      // Find user phone number by matching username
      const user = await prisma.user.findFirst({
        where: { username: payload.officerName }
      });

      if (user && user.phonenumber) {
        payload.phone = user.phonenumber;
        
        const is12h = key.endsWith('-12h');
        const formattedDate = payload.targetDate.toLocaleDateString('ar-SA');
        const timePeriod = is12h ? '12 ساعة' : 'ساعتين';

        // Construct message
        let message = `تنبيه من النظام: لديك موعد بعد ${timePeriod} (${formattedDate} الساعة ${payload.timeHoursStr}:00)\n\n`;
        message += `التفاصيل:\n`;
        payload.maids.forEach((m, idx) => {
          message += `${idx + 1}. ${m.type} - العاملة: ${m.name}\n`;
        });
        message += `\nيرجى الترتيب والتواجد في الموعد المحدد.`;

        // Send SMS
        const result = await sendSMS(payload.phone, message);
        messagesSent.push({
          officer: payload.officerName,
          phone: payload.phone,
          maidsCount: payload.maids.length,
          success: result.success
        });
      } else {
         console.warn(`Delivery officer not found or has no phone number: ${payload.officerName}`);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Cron job executed successfully', 
      processed: messagesSent.length,
      details: messagesSent 
    });

  } catch (error: any) {
    console.error('Error in cron job delivery-reminders:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
