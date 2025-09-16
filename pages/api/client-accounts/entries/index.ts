import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        statementId,
        entryType,
        fromDate,
        toDate
      } = req.query;

      const where: any = {};
      
      if (statementId) {
        where.statementId = Number(statementId);
      }
      
      if (entryType && entryType !== 'all') {
        where.entryType = entryType;
      }
      
      if (fromDate || toDate) {
        where.date = {};
        if (fromDate) {
          where.date.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.date.lte = new Date(toDate as string);
        }
      }

      const entries = await prisma.clientAccountEntry.findMany({
        where,
        include: {
          statement: {
            include: {
              client: {
                select: {
                  id: true,
                  fullname: true
                }
              }
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });

      res.status(200).json(entries);
    } catch (error) {
      console.error('Error fetching client account entries:', error);
      res.status(500).json({ error: 'Failed to fetch client account entries' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        statementId,
        date,
        description,
        debit,
        credit,
        balance,
        entryType
      } = req.body;

      const entry = await prisma.clientAccountEntry.create({
        data: {
          statementId: Number(statementId),
          date: new Date(date),
          description,
          debit: Number(debit),
          credit: Number(credit),
          balance: Number(balance),
          entryType
        },
        include: {
          statement: {
            include: {
              client: {
                select: {
                  id: true,
                  fullname: true
                }
              }
            }
          }
        }
      });

      res.status(201).json(entry);
    } catch (error) {
      console.error('Error creating client account entry:', error);
      res.status(500).json({ error: 'Failed to create client account entry' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

