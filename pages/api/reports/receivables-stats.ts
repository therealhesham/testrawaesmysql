import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { subDays } from 'date-fns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { period, startDate, endDate, monthSelection } = req.method === 'POST' ? req.body : req.query;
    
    // تحديد نطاق التاريخ
    let dateFilter: { gte?: Date; lte?: Date } = {};
    const now = new Date();

    if (period === 'week') {
      dateFilter.gte = subDays(now, 7);
      dateFilter.lte = now;
    } else if (period === 'month') {
      let targetMonth: Date;
      if (monthSelection === 'previous') {
        targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      } else {
        targetMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      dateFilter.gte = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      dateFilter.lte = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter.gte = new Date(startDate as string);
      dateFilter.lte = new Date(endDate as string);
    } else {
      // السنة الحالية (افتراضي)
      dateFilter.gte = new Date(now.getFullYear(), 0, 1);
      dateFilter.lte = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    // جلب جميع كشوف الحساب في الفترة المحددة
    const whereClause = dateFilter.gte && dateFilter.lte ? {
      createdAt: {
        gte: dateFilter.gte,
        lte: dateFilter.lte,
      }
    } : undefined;

    const clientsWithStatements = await prisma.clientAccountStatement.findMany({
      where: whereClause,
      select: {
        clientId: true,
        netAmount: true
      }
    });

    // حساب العملاء الفريدين الذين لديهم كشف حساب في الفترة
    const uniqueClientsWithStatements = new Set(clientsWithStatements.map(stmt => stmt.clientId));
    const totalClientsWithStatements = uniqueClientsWithStatements.size;

    // حساب العملاء الذين لديهم مستحقات (netAmount > 0)
    // نحسب لكل عميل إجمالي netAmount من جميع كشوف حسابه
    const clientNetAmounts: { [key: number]: number } = {};
    clientsWithStatements.forEach(stmt => {
      const netAmount = stmt.netAmount ? parseFloat(stmt.netAmount.toString()) : 0;
      if (!clientNetAmounts[stmt.clientId]) {
        clientNetAmounts[stmt.clientId] = 0;
      }
      clientNetAmounts[stmt.clientId] += netAmount;
    });

    // العملاء الذين لديهم مستحقات (إجمالي netAmount > 0)
    const clientsWithReceivables = Object.values(clientNetAmounts).filter(amount => amount > 0).length;

    // العملاء الذين ليس لديهم مستحقات (إجمالي netAmount <= 0)
    const clientsWithoutReceivables = totalClientsWithStatements - clientsWithReceivables;

    // جلب إجمالي العملاء (للعرض فقط)
    const totalClients = await prisma.client.count();

    res.status(200).json({
      period: period || 'year',
      dateRange: dateFilter,
      total: totalClientsWithStatements,
      totalAllClients: totalClients,
      withReceivables: clientsWithReceivables,
      withoutReceivables: clientsWithoutReceivables
    });
  } catch (error) {
    console.error('Error fetching receivables stats:', error);
    res.status(500).json({ error: 'فشل جلب إحصائيات المستحقات', details: (error as Error).message });
  }
}

