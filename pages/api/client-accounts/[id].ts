// import '../../lib/loggers'; // استدعاء loggers.ts في بداية التطبيق
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';

const prisma = new PrismaClient();

// Helper function to get user info from cookies
const getUserFromCookies = (req: NextApiRequest) => {
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      cookies[key] = decodeURIComponent(value);
    });
  }
  
  if (cookies.authToken) {
    try {
      const token = jwtDecode(cookies.authToken) as any;
      return { userId: Number(token.id), username: token.username };
    } catch (error) {
      console.error('Error decoding token:', error);
      return { userId: null, username: 'غير محدد' };
    }
  }
  
  return { userId: null, username: 'غير محدد' };
};

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
            orderBy: { date: 'asc' }
          }
        }
      });

      // Get order data separately if orderId exists
      let orderData = null;
      if ((statement as any)?.orderId) {
        orderData = await prisma.neworder.findUnique({
          where: { id: (statement as any).orderId },
          include: {
            HomeMaid: {
              include: {
                office: true
              }
            },
            arrivals: {
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          }
        });
      }

      if (!statement) {
        return res.status(404).json({ error: 'Not found' });
      }

      const entries = statement.entries;
      const totalDebit = entries.reduce((sum: number, e: { debit: Prisma.Decimal }) => sum + Number(e.debit), 0);
      const totalCredit = entries.reduce((sum: number, e: { credit: Prisma.Decimal }) => sum + Number(e.credit), 0);
      const netAmount = Number(totalCredit) - Number(totalDebit);

      res.status(200).json({
        ...statement,
        order: orderData,
        totals: { totalDebit, totalCredit, netAmount }
      });
    } catch (error) {
      console.error('Error fetching client account statement:', error);
      res.status(500).json({ error: 'Failed to fetch client account statement' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        contractNumber,
        officeName,
        contractStatus,
        notes,
        attachment,
        totalRevenue: providedRevenue,
        totalExpenses: providedExpenses,
        masandTransferAmount,
        netAmount: providedNetAmount
      } = req.body;

      // Get user info for logging
      const { userId } = getUserFromCookies(req);

      let totalRevenue: number;
      let totalExpenses: number;
      let netAmount: number;

      const hasManualTotals =
        providedRevenue !== undefined && providedExpenses !== undefined;

      if (hasManualTotals) {
        totalRevenue = Number(providedRevenue) || 0;
        totalExpenses = Number(providedExpenses) || 0;
        netAmount =
          providedNetAmount !== undefined
            ? Number(providedNetAmount) || 0
            : totalRevenue - totalExpenses;
      } else {
        // Recalculate totals from entries instead of using provided values
        const entries = await prisma.clientAccountEntry.findMany({
          where: { statementId: Number(id) }
        });
        totalRevenue = entries.reduce((sum, entry) => sum + Number(entry.credit), 0);
        totalExpenses = entries.reduce((sum, entry) => sum + Number(entry.debit), 0);
        netAmount = totalRevenue - totalExpenses;
      }

      const updateData: any = {
        contractNumber,
        officeName,
        totalRevenue,
        totalExpenses,
        masandTransferAmount: masandTransferAmount !== undefined ? Number(masandTransferAmount) : undefined,
        netAmount,
        contractStatus,
        notes
      };

      if (attachment !== undefined) {
        updateData.attachment = attachment;
      }

      const statement = await prisma.clientAccountStatement.update({
        where: {
          id: Number(id)
        },
        data: updateData,
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

      // Emit event for logging
      // if (userId) {
      //   eventBus.emit('ACTION', {
      //     type: `تحديث حساب عميل - رقم العقد: ${contractNumber}`,
      //     userId: userId,
      //   });
      // }

      res.status(200).json(statement);
    } catch (error) {
      console.error('Error updating client account statement:', error);
      res.status(500).json({ error: 'Failed to update client account statement' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'DELETE') {
    try {
      // Get user info for logging
      const { userId } = getUserFromCookies(req);

      // Get statement info before deletion for logging
      const statementToDelete = await prisma.clientAccountStatement.findUnique({
        where: { id: Number(id) },
        select: { contractNumber: true, client: { select: { fullname: true } } }
      });

      await prisma.clientAccountStatement.delete({
        where: {
          id: Number(id)
        }
      });

      // Emit event for logging
      if (userId && statementToDelete) {
        eventBus.emit('ACTION', {
          type: `حذف حساب عميل - العميل: ${statementToDelete.client?.fullname} - رقم العقد: ${statementToDelete.contractNumber}`,
          userId: userId,
        });
      }

      res.status(200).json({ message: 'Client account statement deleted successfully' });
    } catch (error) {
      console.error('Error deleting client account statement:', error);
      res.status(500).json({ error: 'Failed to delete client account statement' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

