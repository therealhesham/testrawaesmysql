import { NextApiRequest, NextApiResponse } from 'next';
import prisma from './globalprisma';

// نفس النص المستخدم في save-pdf-data عند إنشاء السجل
const AI_ADD_STATUS = 'إضافة عاملة جديدة بخاصية  الـAI';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { page = '1', pageSize = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const size = Math.min(100, Math.max(1, parseInt(pageSize as string)));
    const skip = (pageNum - 1) * size;

    const [logs, totalCount, allForStats] = await Promise.all([
      prisma.logs.findMany({
        where: { Status: AI_ADD_STATUS },
        orderBy: { createdAt: 'desc' },
        skip,
        take: size,
        include: { user: true },
      }),
      prisma.logs.count({ where: { Status: AI_ADD_STATUS } }),
      prisma.logs.findMany({
        where: { Status: AI_ADD_STATUS },
        select: { userId: true, createdAt: true },
      }),
    ]);

    // إحصائيات حسب المستخدم (من رفع أكثر)
    const byUser: Record<string, number> = {};
    allForStats.forEach((log) => {
      const uid = log.userId ?? 'غير محدد';
      byUser[uid] = (byUser[uid] || 0) + 1;
    });
    const topUsers = Object.entries(byUser)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // إحصائيات حسب التاريخ (أكثر أيام تم فيها الرفع)
    const byDate: Record<string, number> = {};
    allForStats.forEach((log) => {
      if (log.createdAt) {
        const d = new Date(log.createdAt);
        const key = d.toISOString().slice(0, 10);
        byDate[key] = (byDate[key] || 0) + 1;
      }
    });
    const topDates = Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // إحصائيات حسب الساعة (أكثر أوقات الرفع)
    const byHour: Record<number, number> = {};
    for (let h = 0; h < 24; h++) byHour[h] = 0;
    allForStats.forEach((log) => {
      if (log.createdAt) {
        const h = new Date(log.createdAt).getHours();
        byHour[h]++;
      }
    });
    const topHours = Object.entries(byHour)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const serializedLogs = logs.map((log) => ({
      id: log.id,
      Status: log.Status,
      createdAt: log.createdAt?.toISOString() ?? null,
      updatedAt: log.updatedAt?.toISOString() ?? null,
      Details: log.Details,
      reason: log.reason,
      userId: log.userId,
      homemaidId: log.homemaidId,
      user: log.user ? { username: log.user.username } : null,
    }));

    return res.status(200).json({
      logs: serializedLogs,
      totalCount,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(totalCount / size),
      statistics: {
        total: totalCount,
        topUsers,
        topDates,
        topHours,
      },
    });
  } catch (error) {
    console.error('Error in performance-ai-logs:', error);
    return res.status(500).json({ error: 'Error fetching AI logs' });
  }
}
