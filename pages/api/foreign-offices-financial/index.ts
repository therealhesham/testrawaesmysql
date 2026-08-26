import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { Prisma } from '@prisma/client'
import { recalculateOfficeBalances } from 'lib/foreignOfficesBalance'

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
        search,
        sortOrder,
        groupByInvoice
      } = req.query

      const orderDirection: 'asc' | 'desc' =
        String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc'

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

      if (groupByInvoice === 'true') {
        const items = await prisma.foreignOfficeFinancial.findMany({
          where: {
            ...where,
            NOT: [
              { invoiceNumber: null },
              { invoiceNumber: '' }
            ]
          },
          include: { 
            office: true,
            debitSettlements: true,
            creditSettlements: true,
          }
        });

        const groupsMap = new Map();
        items.forEach(item => {
          const key = item.invoiceNumber;
          if (!groupsMap.has(key)) {
            groupsMap.set(key, {
              id: key, // Use invoiceNumber as unique ID for React keys
              invoiceNumber: key,
              office: item.office,
              date: item.date, // keep the date of the first record
              debit: 0,
              credit: 0,
              recordsCount: 0,
              isGrouped: true,
              records: [],
              totalDebitSettled: 0,
              totalCreditSettled: 0,
            });
          }
          const group = groupsMap.get(key);
          group.debit += Number(item.debit || 0);
          group.credit += Number(item.credit || 0);
          group.recordsCount += 1;
          
          const itemDebitSettled = item.debitSettlements?.reduce((sum: number, s: any) => sum + Number(s.settledAmount), 0) || 0;
          const itemCreditSettled = item.creditSettlements?.reduce((sum: number, s: any) => sum + Number(s.settledAmount), 0) || 0;
          
          group.totalDebitSettled += itemDebitSettled;
          group.totalCreditSettled += itemCreditSettled;
          
          group.records.push(item);
        });
        
        let groupedArray = Array.from(groupsMap.values());
        
        if (req.query.hideSettled === 'true') {
          groupedArray = groupedArray.filter(group => {
            const remDebit = Math.max(0, Number(group.debit) - group.totalDebitSettled);
            const remCredit = Math.max(0, Number(group.credit) - group.totalCreditSettled);
            const isFullySettled = (Number(group.debit) > 0 || Number(group.credit) > 0) && remDebit === 0 && remCredit === 0;
            return !isFullySettled;
          });
        }
        
        groupedArray.sort((a, b) => orderDirection === 'desc' ? new Date(b.date).getTime() - new Date(a.date).getTime() : new Date(a.date).getTime() - new Date(b.date).getTime());

        const total = groupedArray.length;
        const paginatedItems = groupedArray.slice(skip, skip + limitNum);

        const pagination = {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }

        return res.status(200).json({ success: true, items: paginatedItems, pagination });
      }

      let items;
      let total;

      if (req.query.hideSettled === 'true') {
        const allItems = await prisma.foreignOfficeFinancial.findMany({
          where,
          include: {
            office: true,
            debitSettlements: true,
            creditSettlements: true,
          },
          orderBy: [{ date: orderDirection }, { id: orderDirection }],
        });

        const filteredItems = allItems.filter(item => {
            const itemDebitSettled = item.debitSettlements?.reduce((sum: number, s: any) => sum + Number(s.settledAmount), 0) || 0;
            const itemCreditSettled = item.creditSettlements?.reduce((sum: number, s: any) => sum + Number(s.settledAmount), 0) || 0;
            const remDebit = Math.max(0, Number(item.debit || 0) - itemDebitSettled);
            const remCredit = Math.max(0, Number(item.credit || 0) - itemCreditSettled);
            const isFullySettled = (Number(item.debit || 0) > 0 || Number(item.credit || 0) > 0) && Math.abs(remDebit) < 0.01 && Math.abs(remCredit) < 0.01;
            return !isFullySettled;
        });

        total = filteredItems.length;
        items = filteredItems.slice(skip, skip + limitNum);
      } else {
        const [fetchedItems, count] = await Promise.all([
          prisma.foreignOfficeFinancial.findMany({
            where,
            include: { office: true, debitSettlements: true, creditSettlements: true },
            orderBy: [{ date: orderDirection }, { id: orderDirection }],
            skip,
            take: limitNum,
          }),
          prisma.foreignOfficeFinancial.count({ where })
        ]);
        items = fetchedItems;
        total = count;
      }

      // جلب InternalmusanedContract من arrivallist لكل سجل
      const itemsWithInternalContract = await Promise.all(
        items.map(async (item) => {
          if (!item.contractNumber) {
            return { ...item, internalMusanedContract: null, contractDate: null }
          }

          // البحث في arrivallist من خلال InternalmusanedContract
          const arrival = await prisma.arrivallist.findFirst({
            where: {
              InternalmusanedContract: item.contractNumber,
            },
            select: {
              InternalmusanedContract: true,
              DateOfApplication: true,
            },
          })

          return {
            ...item,
            internalMusanedContract: arrival?.InternalmusanedContract || item.contractNumber,
            /** تاريخ العقد من قسم الربط مع إدارة المكاتب أو من الإدخال اليدوي */
            contractDate: arrival?.DateOfApplication
              ? (arrival.DateOfApplication as Date).toISOString()
              : item.contractDate 
                ? new Date(item.contractDate).toISOString() 
                : null,
            maidName: item.maidName || null,
            maidPassport: item.maidPassport || null,
          }
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
        maidName,
        maidPassport,
        contractDate,
        payment,
        description,
        credit,
        debit,
        invoice,
        invoiceNumber,
        officeId,
        records // For bulk insert
      } = req.body

      if (records && Array.isArray(records)) {
        // Bulk Insert Logic
        if (records.length === 0) return res.status(400).json({ success: false, message: 'Empty records array' });
        
        await prisma.foreignOfficeFinancial.createMany({
          data: records.map(r => ({
            date: new Date(r.date),
            clientName: r.clientName ? String(r.clientName) : null,
            contractNumber: r.contractNumber ? String(r.contractNumber) : null,
            maidName: r.maidName ? String(r.maidName) : null,
            maidPassport: r.maidPassport ? String(r.maidPassport) : null,
            contractDate: r.contractDate ? new Date(r.contractDate) : null,
            payment: r.payment ? String(r.payment) : null,
            description: r.description ? String(r.description) : null,
            credit: r.credit ? new Prisma.Decimal(r.credit) : new Prisma.Decimal(0),
            debit: r.debit ? new Prisma.Decimal(r.debit) : new Prisma.Decimal(0),
            balance: new Prisma.Decimal(0),
            invoice: r.invoice ? String(r.invoice) : null,
            invoiceNumber: r.invoiceNumber ? String(r.invoiceNumber) : null,
            officeId: Number(r.officeId),
          }))
        });

        // Recalculate balance for the first officeId (assuming all records are for the same office)
        if (records[0]?.officeId) {
          await recalculateOfficeBalances(Number(records[0].officeId));
        }
        
        return res.status(201).json({ success: true, message: 'Records created successfully' });
      } else {
        // Single Insert Logic
        if (!date || !officeId) {
          return res.status(400).json({ success: false, message: 'Missing required fields' })
        }

        const created = await prisma.foreignOfficeFinancial.create({
          data: {
            date: new Date(date),
            clientName: clientName ? String(clientName) : null,
            contractNumber: contractNumber ? String(contractNumber) : null,
            maidName: maidName ? String(maidName) : null,
            maidPassport: maidPassport ? String(maidPassport) : null,
            contractDate: contractDate ? new Date(contractDate) : null,
            payment: payment ? String(payment) : null,
            description: description ? String(description) : null,
            credit: credit ? new Prisma.Decimal(credit) : new Prisma.Decimal(0),
            debit: debit ? new Prisma.Decimal(debit) : new Prisma.Decimal(0),
            balance: new Prisma.Decimal(0),
            invoice: invoice ? String(invoice) : null,
            invoiceNumber: invoiceNumber ? String(invoiceNumber) : null,
            officeId: Number(officeId),
          },
        })

        await recalculateOfficeBalances(Number(officeId))

        const finalRecord = await prisma.foreignOfficeFinancial.findUnique({
          where: { id: created.id },
          include: { office: true },
        })

        return res.status(201).json({ success: true, item: finalRecord })
      }
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` })
  } catch (error: any) {
    console.error('Foreign Offices Financial API error:', error)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
