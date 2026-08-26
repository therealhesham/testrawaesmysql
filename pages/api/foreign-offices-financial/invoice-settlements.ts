import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { invoiceNumber } = req.query;

    if (!invoiceNumber || typeof invoiceNumber !== 'string') {
      return res.status(400).json({ error: 'Invalid invoice number' });
    }

    const records = await prisma.foreignOfficeFinancial.findMany({
      where: { invoiceNumber },
      include: {
        debitSettlements: {
          include: {
            creditRecord: true // The invoices settled by this debit
          },
          orderBy: { date: 'desc' }
        },
        creditSettlements: {
          include: {
            debitRecord: true // The debits used to settle this invoice
          },
          orderBy: { date: 'desc' }
        }
      },
      orderBy: { date: 'asc' }
    });

    if (!records || records.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const enrich = async (r: any) => {
      if (!r || (r.maidName && r.maidPassport) || !r.contractNumber) return;
      const arrival = await prisma.arrivallist.findFirst({
        where: { OR: [ { InternalmusanedContract: r.contractNumber }, { InternalmusanedContract: { contains: r.contractNumber } } ] },
        include: { Order: { include: { HomeMaid: true } } }
      });
      if (arrival) {
        r.maidName = arrival.Order?.HomeMaid?.Name?.trim() || arrival.HomemaidName?.trim() || r.maidName;
        r.maidPassport = arrival.Order?.HomeMaid?.Passportnumber?.trim() || arrival.PassportNumber?.trim() || r.maidPassport;
      }
    };

    for (const record of records) {
      if (record.debitSettlements) {
        for (const s of record.debitSettlements) {
          if (s.creditRecord) await enrich(s.creditRecord);
        }
      }
      if (record.creditSettlements) {
        for (const s of record.creditSettlements) {
          if (s.debitRecord) await enrich(s.debitRecord);
        }
      }
    }

    return res.status(200).json({ success: true, records });
  } catch (error) {
    console.error('Error fetching invoice settlement history:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
