import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { Prisma } from '@prisma/client'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { from, to } = req.query

      const where: any = {}
      if (from || to) {
        where.date = {}
        if (from) where.date.gte = new Date(String(from))
        if (to) where.date.lte = new Date(String(to))
      }

      const items = await prisma.incomeStatement.findMany({
        where,
        orderBy: { date: 'desc' },
      })
      return res.status(200).json({ success: true, items })
    }

    if (req.method === 'POST') {
      const { date, mainCategory, subCategory, amount, notes } = req.body

      if (!date || !mainCategory || amount === undefined) {
        return res.status(400).json({ success: false, message: 'Missing required fields' })
      }
      const created = await prisma.incomeStatement.create({
        data: {
          date: new Date(date),
          mainCategory: String(mainCategory),
          subCategory: subCategory ? String(subCategory) : null,
          amount: new Prisma.Decimal(amount),
          notes: notes ? String(notes) : null,
        },
      })
      return res.status(201).json({ success: true, item: created })
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` })
  } catch (error: any) {
    console.error('IncomeStatements API error:', error)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}


