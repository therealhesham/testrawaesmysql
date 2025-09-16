import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { Prisma } from '@prisma/client'

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
      await prisma.foreignOfficeFinancial.delete({
        where: { id: Number(id) },
      })

      return res.status(200).json({ success: true, message: 'Record deleted successfully' })
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` })
  } catch (error: any) {
    console.error('Foreign Office Financial API error:', error)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
