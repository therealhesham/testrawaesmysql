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

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === '' || s.toLowerCase() === 'null' || s === 'N/A') return null;
  return s;
}

function parseDateOnly(v: unknown): Date | null {
  if (v == null) return null;
  const s = String(v).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (Number.isNaN(dt.getTime())) return null;
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
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

  const rawId = req.query.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
  const orderId = Number(idStr);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'معرف الطلب غير صالح' });
  }

  const order = await prisma.neworder.findUnique({ where: { id: orderId } });
  if (!order) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }

  const body = req.body as {
    tickets_details?: Record<string, unknown>;
    ticketFile?: string | null;
  };

  const incoming = body?.tickets_details;
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return res.status(400).json({ error: 'بيانات tickets_details مطلوبة' });
  }

  const ticketFileOverride =
    typeof body.ticketFile === 'string' && body.ticketFile.trim() !== ''
      ? body.ticketFile.trim()
      : null;

  const ticketFile = ticketFileOverride ?? str(incoming.ticketFile);

  try {
    const row = await prisma.tickets_details.create({
      data: {
        order_id: orderId,
        ticketFile,
        reference_id: str(incoming.reference_id),
        airlines: str(incoming.airlines),
        flight_number: str(incoming.flight_number),
        departure_date: parseDateOnly(incoming.departure_date),
        departure_time: str(incoming.departure_time),
        arrival_date: parseDateOnly(incoming.arrival_date),
        arrival_time: str(incoming.arrival_time),
        departure_airport: str(incoming.departure_airport),
        arrival_airport: str(incoming.arrival_airport),
      },
    });

    return res.status(201).json({ tickets_details: row });
  } catch (e) {
    console.error('[tickets-details] create:', e);
    return res.status(500).json({ error: 'فشل حفظ بيانات التذكرة' });
  }
}
