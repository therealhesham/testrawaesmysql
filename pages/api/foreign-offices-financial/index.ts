import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { Prisma } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { 
        officeId, 
        fromDate, 
        toDate, 
        movementType, 
        page = '1', 
        limit = '10',
        search 
      } = req.query

      const where: any = {}
      
      if (officeId) {
        where.officeId = Number(officeId)
      }
      
      if (fromDate || toDate) {
        where.date = {}
        if (fromDate) where.date.gte = new Date(String(fromDate))
        if (toDate) where.date.lte = new Date(String(toDate))
      }
      
      if (movementType) {
        if (movementType === 'debit') {
          where.debit = { gt: 0 }
        } else if (movementType === 'credit') {
          where.credit = { gt: 0 }
        }
      }

      if (search) {
        const searchStr = String(search).trim()
        where.OR = [
          { clientName: { contains: searchStr } },
          { contractNumber: { contains: searchStr } },
          { description: { contains: searchStr } },
          { office: { office: { contains: searchStr } } },
        ]
      }

      const pageNum = parseInt(String(page))
      const limitNum = parseInt(String(limit))
      const skip = (pageNum - 1) * limitNum

      const [items, total] = await Promise.all([
        prisma.foreignOfficeFinancial.findMany({
          where,
          include: {
            office: true,
          },
          orderBy: { date: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.foreignOfficeFinancial.count({ where })
      ])

      // جلب InternalmusanedContract من arrivallist لكل سجل
      const itemsWithInternalContract = await Promise.all(
        items.map(async (item) => {
          if (!item.contractNumber) {
            return { ...item, internalMusanedContract: null };
          }

          // البحث في arrivallist من خلال InternalmusanedContract
          const arrival = await prisma.arrivallist.findFirst({
            where: {
              InternalmusanedContract: item.contractNumber,
            },
            select: {
              InternalmusanedContract: true,
            },
          });

          return {
            ...item,
            internalMusanedContract: arrival?.InternalmusanedContract || null,
          };
        })
      );

      const pagination = {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
      
      return res.status(200).json({ success: true, items: itemsWithInternalContract, pagination })
    }

    if (req.method === 'POST') {
      const { 
        date, 
        clientName, 
        contractNumber, 
        payment, 
        description, 
        credit, 
        debit, 
        balance, 
        invoice,
        officeId 
      } = req.body

      if (!date || !clientName || !officeId) {
        return res.status(400).json({ success: false, message: 'Missing required fields' })
      }
      
      const created = await prisma.foreignOfficeFinancial.create({
        data: {
          date: new Date(date),
          clientName: String(clientName),
          contractNumber: contractNumber ? String(contractNumber) : null,
          payment: payment ? String(payment) : null,
          description: description ? String(description) : null,
          credit: credit ? new Prisma.Decimal(credit) : new Prisma.Decimal(0),
          debit: debit ? new Prisma.Decimal(debit) : new Prisma.Decimal(0),
          balance: balance ? new Prisma.Decimal(balance) : new Prisma.Decimal(0),
          invoice: invoice ? String(invoice) : null,
          officeId: Number(officeId),
        },
        include: {
          office: true,
        },
      })
      
      return res.status(201).json({ success: true, item: created })
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` })
  } catch (error: any) {
    console.error('Foreign Offices Financial API error:', error)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
