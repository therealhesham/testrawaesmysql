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
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
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

  const raw = req.query.id;
  const idStr = Array.isArray(raw) ? raw[0] : raw;
  const ticketId = Number(idStr);
  if (!Number.isFinite(ticketId) || ticketId <= 0) {
    return res.status(400).json({ error: 'معرف السجل غير صالح' });
  }

  const orderIdParam = req.query.order_id;
  const orderIdStr = Array.isArray(orderIdParam) ? orderIdParam[0] : orderIdParam;
  const expectedOrderId =
    orderIdStr != null && String(orderIdStr).trim() !== ''
      ? Number(orderIdStr)
      : null;

  try {
    const existing = await prisma.tickets_details.findUnique({
      where: { id: ticketId },
      select: { id: true, order_id: true },
    });
    if (!existing) {
      return res.status(404).json({ error: 'السجل غير موجود' });
    }
    if (
      expectedOrderId != null &&
      Number.isFinite(expectedOrderId) &&
      existing.order_id !== expectedOrderId
    ) {
      return res.status(403).json({ error: 'السجل لا يتبع هذا الطلب' });
    }

    await prisma.tickets_details.delete({
      where: { id: ticketId },
    });

    return res.status(200).json({ ok: true });
  } catch (e: unknown) {
    const code = typeof e === 'object' && e !== null && 'code' in e ? (e as { code?: string }).code : undefined;
    if (code === 'P2025') {
      return res.status(404).json({ error: 'السجل غير موجود' });
    }
    console.error('[tickets-details DELETE]', e);
    return res.status(500).json({ error: 'فشل حذف السجل' });
  }
}
