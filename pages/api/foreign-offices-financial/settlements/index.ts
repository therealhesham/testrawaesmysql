import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { officeId } = req.query;
      
      if (!officeId || typeof officeId !== 'string') {
        return res.status(400).json({ error: 'officeId is required' });
      }

      // جلب المديونيات (debit > 0) والفواتير (credit > 0)
      const records = await prisma.foreignOfficeFinancial.findMany({
        where: {
          officeId: parseInt(officeId, 10),
          OR: [
            { debit: { gt: 0 } },
            { credit: { gt: 0 } }
          ]
        },
        include: {
          debitSettlements: true,
          creditSettlements: true
        },
        orderBy: { date: 'asc' }
      });

      const debits = [];
      const credits = [];

      for (const record of records) {
        // إذا كان السجل مدين (مديونية لنا عند المكتب)
        if (record.debit && Number(record.debit) > 0) {
          const settledAmount = record.debitSettlements.reduce((sum, s) => sum + Number(s.settledAmount), 0);
          const remaining = Number(record.debit) - settledAmount;
          if (remaining > 0) {
            debits.push({
              ...record,
              remaining,
              settledAmount
            });
          }
        }
        
        // إذا كان السجل دائن (فاتورة من المكتب)
        if (record.credit && Number(record.credit) > 0) {
          const settledAmount = record.creditSettlements.reduce((sum, s) => sum + Number(s.settledAmount), 0);
          const remaining = Number(record.credit) - settledAmount;
          if (remaining > 0) {
             credits.push({
               ...record,
               remaining,
               settledAmount
             });
          }
        }
      }

      credits.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return res.status(200).json({ debits, credits });
    } catch (error) {
      console.error('Error fetching settlements:', error);
      return res.status(500).json({ error: 'Failed to fetch settlements' });
    }
  } else if (req.method === 'POST') {
    try {
      await prisma.$transaction(async (tx) => {
        const { debitAllocations, settlements } = req.body;

        if (!debitAllocations || !Array.isArray(debitAllocations) || debitAllocations.length === 0 || !settlements || !Array.isArray(settlements)) {
          return res.status(400).json({ error: 'debitAllocations (array) and settlements (array) are required' });
        }

        const debitRecordIds = debitAllocations.map((d: any) => d.id);

        const debitRecords = await tx.foreignOfficeFinancial.findMany({
          where: { id: { in: debitRecordIds } },
          include: { debitSettlements: true },
          orderBy: { date: 'asc' } // oldest first
        });

        if (debitRecords.length !== debitRecordIds.length) {
          throw new Error('لم يتم العثور على بعض المديونيات المحددة');
        }

        // Calculate remaining for each debit based on explicit allocations
        const debitsWithRemaining = debitRecords.map(d => {
          const totalSettled = d.debitSettlements.reduce((sum, s) => sum + Number(s.settledAmount), 0);
          const actualRemaining = Number(d.debit) - totalSettled;
          const userAllocated = debitAllocations.find((a: any) => a.id === d.id)?.allocatedAmount || 0;
          
          if (userAllocated > actualRemaining + 0.001) {
             throw new Error(`المبلغ المخصص لإحدى المديونيات يتجاوز رصيدها المتاح.`);
          }

          return {
            ...d,
            remainingDebit: Number(userAllocated)
          };
        });

        let currentDebitIndex = 0;

        // Helper to distribute an amount from a specific credit record across the available debits
        const distributeToDebits = async (credId: number, amtToDistribute: number) => {
           let remainingAmt = amtToDistribute;
           while(remainingAmt > 0.001 && currentDebitIndex < debitsWithRemaining.length) {
              const currentDebit = debitsWithRemaining[currentDebitIndex];
              if (currentDebit.remainingDebit <= 0.001) {
                 currentDebitIndex++;
                 continue;
              }
              const toSettle = Math.min(currentDebit.remainingDebit, remainingAmt);
              
              await tx.foreignOfficeSettlement.create({
                data: {
                  debitRecordId: currentDebit.id,
                  creditRecordId: credId,
                  settledAmount: new Prisma.Decimal(toSettle)
                }
              });
              
              currentDebit.remainingDebit -= toSettle;
              remainingAmt -= toSettle;
           }
           if (remainingAmt > 0.001) {
              throw new Error(`مبلغ التسوية يتجاوز الرصيد المتبقي لإجمالي المديونيات المحددة.`);
           }
        };

        for (const settlement of settlements) {
          const { creditRecordId, amount } = settlement;
          let settleAmount = Number(amount);

          if (settleAmount <= 0) continue;

          if (typeof creditRecordId === 'string' && creditRecordId.startsWith('INV-')) {
            const invNumber = creditRecordId.replace('INV-', '');
            const invRecords = await tx.foreignOfficeFinancial.findMany({
              where: { invoiceNumber: invNumber },
              include: { creditSettlements: true },
              orderBy: { date: 'asc' }
            });
             
            let totalRemainingInv = 0;
            for (const r of invRecords) {
               const totalSettled = r.creditSettlements.reduce((sum, s) => sum + Number(s.settledAmount), 0);
               totalRemainingInv += (Number(r.credit) - totalSettled);
            }
             
            if (totalRemainingInv + 0.01 < settleAmount) {
                throw new Error(`مبلغ التسوية (${settleAmount}) يتجاوز الرصيد المتبقي للفاتورة المجمعة ${invNumber} (${totalRemainingInv})`);
            }
             
            for (const r of invRecords) {
               if (settleAmount <= 0.001) break;
               const totalSettled = r.creditSettlements.reduce((sum, s) => sum + Number(s.settledAmount), 0);
               const rRemaining = Number(r.credit) - totalSettled;
               if (rRemaining > 0) {
                  const toSettle = Math.min(rRemaining, settleAmount);
                  await distributeToDebits(r.id, toSettle);
                  settleAmount -= toSettle;
               }
            }
          } else {
            const creditRecord = await tx.foreignOfficeFinancial.findUnique({
              where: { id: Number(creditRecordId) },
              include: { creditSettlements: true }
            });

            if (!creditRecord) {
              throw new Error(`Credit record ${creditRecordId} not found`);
            }

            const totalSettledCredit = creditRecord.creditSettlements.reduce((sum, s) => sum + Number(s.settledAmount), 0);
            const remainingCredit = Number(creditRecord.credit) - totalSettledCredit;

            if (remainingCredit + 0.01 < settleAmount) {
              throw new Error(`مبلغ التسوية (${settleAmount}) يتجاوز الرصيد المتبقي للفاتورة رقم ${creditRecord.id}`);
            }

            await distributeToDebits(Number(creditRecordId), settleAmount);
          }
        }
      });

      return res.status(200).json({ message: 'Settlements applied successfully' });
    } catch (error: any) {
      console.error('Error applying settlements:', error);
      return res.status(400).json({ error: error.message || 'Failed to apply settlements' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
