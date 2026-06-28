import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'pages/api/globalprisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow GET and POST for cron jobs
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = new Date();
    // الحصول على التاريخ بتوقيت السعودية (+3)
    const saudiTimeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const parts = saudiTimeFormatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1; // months are 0-indexed in JS
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
    
    // Create a Date object representing midnight in Saudi Time, but using local system's midnight is tricky if we compare to ISO strings.
    // Since Prisma stores dates as ISO strings (e.g. 2026-06-30T00:00:00.000Z), we should construct an ISO string that represents the end of the Saudi day.
    
    const saudiTodayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // End of the day in Saudi time in UTC would be: 
    // Saudi is UTC+3. Midnight Saudi next day is 21:00 UTC today.
    // But since the DB stores just the Date part (e.g., 2026-06-30T00:00:00.000Z), we can just query for <= "YYYY-MM-DDT23:59:59.999Z" of the Saudi day.
    const endOfSaudiDayISO = `${saudiTodayString}T23:59:59.999Z`;

    // 1. Process Internal Departures
    const pendingInternalDepartures = await prisma.arrivallist.findMany({
      where: {
        internaldeparatureDate: {
          lte: endOfSaudiDayISO,
        },
        Order: {
          isNot: null
        }
      },
      include: {
        Order: {
          include: {
            HomeMaid: true,
          }
        }
      }
    });

    let processedInternal = 0;
    for (const departure of pendingInternalDepartures) {
      if (!departure.Order?.HomemaidId) continue;

      const activeHousing = await prisma.housedworker.findFirst({
        where: {
          homeMaid_id: departure.Order.HomemaidId,
          isActive: true
        }
      });

      if (activeHousing) {
        await prisma.housedworker.update({
          where: { id: activeHousing.id },
          data: {
            isActive: false,
            deparatureReason: departure.internalReason || 'مغادرة داخلية',
            deparatureHousingDate: departure.internaldeparatureDate,
            checkIns: {
              updateMany: {
                where: { isActive: true },
                data: { isActive: false }
              }
            }
          }
        });
        processedInternal++;
      }
    }

    // 2. Process External Departures
    const pendingExternalDepartures = await prisma.arrivallist.findMany({
      where: {
        externaldeparatureDate: {
          lte: endOfSaudiDayISO,
        },
        Order: {
          isNot: null
        }
      },
      include: {
        Order: {
          include: {
            HomeMaid: true,
          }
        }
      }
    });

    let processedExternal = 0;
    for (const departure of pendingExternalDepartures) {
      if (!departure.Order?.HomemaidId) continue;

      // Evict from housing
      const activeHousing = await prisma.housedworker.findFirst({
        where: {
          homeMaid_id: departure.Order.HomemaidId,
          isActive: true
        }
      });

      if (activeHousing) {
        await prisma.housedworker.update({
          where: { id: activeHousing.id },
          data: {
            isActive: false,
            deparatureReason: departure.externalReason || 'مغادرة خارجية',
            deparatureHousingDate: departure.externaldeparatureDate,
            checkIns: {
              updateMany: {
                where: { isActive: true },
                data: { isActive: false }
              }
            }
          }
        });
      }

      // Update Homemaid status to 'مغادرة خارجية'
      const homemaid = await prisma.homemaid.findUnique({
        where: { id: departure.Order.HomemaidId }
      });

      if (homemaid && homemaid.bookingstatus !== 'مغادرة خارجية') {
        await prisma.homemaid.update({
          where: { id: departure.Order.HomemaidId },
          data: {
            isApproved: false,
            bookingstatus: 'مغادرة خارجية',
          }
        });

        // Hide orders
        await prisma.neworder.updateMany({
          where: { HomemaidId: departure.Order.HomemaidId },
          data: {
            isAvailable: false,
            isHidden: true,
          }
        });
        processedExternal++;
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Processed upcoming departures correctly',
      processedInternal,
      processedExternal
    });

  } catch (error: any) {
    console.error('Error in cron job process-departures:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
