import type { NextApiRequest, NextApiResponse } from 'next';
import { jwtDecode } from 'jwt-decode';
import prisma from 'lib/prisma';

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key) cookies[key] = decodeURIComponent(value || '');
  });
  return cookies;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = parseCookies(req.headers.cookie);
  if (!cookies.authToken) {
    return res.status(401).json({ error: 'غير مصرح' });
  }
  try {
    jwtDecode(cookies.authToken);
  } catch {
    return res.status(401).json({ error: 'جلسة غير صالحة' });
  }

  try {
    const rows = await prisma.tickets_details.findMany({
      orderBy: { id: 'desc' },
      take: 2000,
      include: {
        order: {
          select: {
            id: true,
            bookingstatus: true,
            client: { select: { fullname: true } },
          },
        },
      },
    });

    const data = rows.map((t) => ({
      id: t.id,
      order_id: t.order_id,
      reference_id: t.reference_id,
      airlines: t.airlines,
      flight_number: t.flight_number,
      departure_date: t.departure_date
        ? (t.departure_date instanceof Date ? t.departure_date : new Date(t.departure_date)).toISOString().split('T')[0]
        : null,
      departure_time: t.departure_time,
      arrival_date: t.arrival_date
        ? (t.arrival_date instanceof Date ? t.arrival_date : new Date(t.arrival_date)).toISOString().split('T')[0]
        : null,
      arrival_time: t.arrival_time,
      departure_airport: t.departure_airport,
      arrival_airport: t.arrival_airport,
      ticketFile: t.ticketFile,
      createdAt: t.createdAt ? t.createdAt.toISOString() : null,
      order: t.order
        ? {
            id: t.order.id,
            bookingstatus: t.order.bookingstatus,
            clientName: t.order.client?.fullname ?? null,
          }
        : null,
    }));

    return res.status(200).json({ data });
  } catch (e) {
    console.error('[tickets-details GET]', e);
    return res.status(500).json({ error: 'فشل جلب بيانات التذاكر' });
  }
}
