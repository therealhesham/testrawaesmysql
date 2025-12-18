import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { Prisma } from '@prisma/client'
import eventBus from 'lib/eventBus'
import { jwtDecode } from 'jwt-decode'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid ID' })
  }

  try {
    if (req.method === 'GET') {
      const item = await prisma.foreignOfficeFinancial.findUnique({
        where: { id: Number(id) },
        include: {
          office: true,
        },
      })

      if (!item) {
        return res.status(404).json({ success: false, message: 'Record not found' })
      }

      return res.status(200).json({ success: true, item })
    }

    if (req.method === 'PUT') {
      const { 
        clientName, 
        contractNumber, 
        payment, 
        description, 
        credit, 
        debit, 
        balance 
      } = req.body

      const updated = await prisma.foreignOfficeFinancial.update({
        where: { id: Number(id) },
        data: {
          clientName: clientName ? String(clientName) : undefined,
          contractNumber: contractNumber ? String(contractNumber) : undefined,
          payment: payment ? String(payment) : undefined,
          description: description ? String(description) : undefined,
          credit: credit !== undefined ? new Prisma.Decimal(credit) : undefined,
          debit: debit !== undefined ? new Prisma.Decimal(debit) : undefined,
          balance: balance !== undefined ? new Prisma.Decimal(balance) : undefined,
        },
        include: {
          office: true,
        },
      })

      return res.status(200).json({ success: true, item: updated })
    }

    if (req.method === 'DELETE') {
      // Get user info for logging
      const cookieHeader = req.headers.cookie;
      let userId: number | null = null;
      if (cookieHeader) {
        try {
          const cookies: { [key: string]: string } = {};
          cookieHeader.split(";").forEach((cookie) => {
            const [key, value] = cookie.trim().split("=");
            cookies[key] = decodeURIComponent(value);
          });
          if (cookies.authToken) {
            const token = jwtDecode(cookies.authToken) as any;
            userId = Number(token.id);
          }
        } catch (e) {
          // Ignore token errors
        }
      }

      const record = await prisma.foreignOfficeFinancial.findUnique({
        where: { id: Number(id) },
      });

      await prisma.foreignOfficeFinancial.delete({
        where: { id: Number(id) },
      });

      // تسجيل الحدث
      if (record && userId) {
        eventBus.emit('ACTION', {
          type: `حذف سجل مالي مكتب خارجي #${id} - ${record.clientName || 'غير محدد'}`,
          actionType: 'delete',
          userId: userId,
        });
      }

      return res.status(200).json({ success: true, message: 'Record deleted successfully' })
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` })
  } catch (error: any) {
    console.error('Foreign Office Financial API error:', error)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
