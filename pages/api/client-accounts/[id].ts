import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const entryType = Array.isArray(req.query.entryType) ? req.query.entryType[0] : req.query.entryType;
      const fromDateStr = Array.isArray(req.query.fromDate) ? req.query.fromDate[0] : req.query.fromDate;
      const toDateStr = Array.isArray(req.query.toDate) ? req.query.toDate[0] : req.query.toDate;
      const searchStr = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search;

      const whereClause = {
        AND: [] as Prisma.ClientAccountEntryWhereInput[]
      };

      if (entryType && entryType !== 'all') {
        whereClause.AND.push({ entryType });
      }
      if (fromDateStr) {
        whereClause.AND.push({ date: { gte: new Date(fromDateStr) } });
      }
      if (toDateStr) {
        whereClause.AND.push({ date: { lte: new Date(toDateStr) } });
      }
      if (searchStr) {
        whereClause.AND.push({ description: { contains: searchStr } });
      }

      const statement = await prisma.clientAccountStatement.findUnique({
        where: { id: Number(id) },
        include: {
          client: {
            select: {
              id: true,
              fullname: true,
              phonenumber: true,
              nationalId: true,
              city: true,
              address: true,
              createdAt: true
            }
          },
          entries: {
            where: whereClause.AND.length > 0 ? whereClause : undefined,
            orderBy: { date: 'desc' }
          }
        }
      });

      if (!statement) {
        return res.status(404).json({ error: 'Not found' });
      }

      const entries = statement.entries;
      const totalDebit = entries.reduce((sum, e) => sum + Number(e.debit), 0);
      const totalCredit = entries.reduce((sum, e) => sum + Number(e.credit), 0);
      const netAmount = totalCredit - totalDebit;

      res.status(200).json({
        ...statement,
        totals: { totalDebit, totalCredit, netAmount }
      });
    } catch (error) {
      console.error('Error fetching client account statement:', error);
      res.status(500).json({ error: 'Failed to fetch client account statement' });
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        contractNumber,
        officeName,
        totalRevenue,
        totalExpenses,
        netAmount,
        contractStatus,
        notes
      } = req.body;

      const statement = await prisma.clientAccountStatement.update({
        where: {
          id: Number(id)
        },
        data: {
          contractNumber,
          officeName,
          totalRevenue: Number(totalRevenue),
          totalExpenses: Number(totalExpenses),
          netAmount: Number(netAmount),
          contractStatus,
          notes
        },
        include: {
          client: {
            select: {
              id: true,
              fullname: true,
              phonenumber: true,
              nationalId: true
            }
          }
        }
      });

      res.status(200).json(statement);
    } catch (error) {
      console.error('Error updating client account statement:', error);
      res.status(500).json({ error: 'Failed to update client account statement' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.clientAccountStatement.delete({
        where: {
          id: Number(id)
        }
      });

      res.status(200).json({ message: 'Client account statement deleted successfully' });
    } catch (error) {
      console.error('Error deleting client account statement:', error);
      res.status(500).json({ error: 'Failed to delete client account statement' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

