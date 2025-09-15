import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { Prisma } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const idParam = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  const id = Number(idParam)
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' })
  }
        try {
    if (req.method === 'GET') {
      const item = await prisma.incomeStatement.findUnique({ where: { id } })
      if (!item) return res.status(404).json({ success: false, message: 'Not found' })
      return res.status(200).json({ success: true, item })
    }

    if (req.method === 'PUT') {
      const { date, mainCategory, subCategory, amount, notes } = req.body
      const updated = await prisma.incomeStatement.update({
        where: { id },
        data: {
          date: date ? new Date(date) : undefined,
          mainCategory: mainCategory !== undefined ? String(mainCategory) : undefined,
          subCategory: subCategory !== undefined ? String(subCategory) : undefined,
          amount: amount !== undefined ? new Prisma.Decimal(amount) : undefined,
          notes: notes !== undefined ? String(notes) : undefined,
        },
      })
      return res.status(200).json({ success: true, item: updated })
    }

    if (req.method === 'DELETE') {
      await prisma.incomeStatement.delete({ where: { id } })
      return res.status(200).json({ success: true })
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` })
  } catch (error: any) {
    console.error('IncomeStatements API error:', error)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}


