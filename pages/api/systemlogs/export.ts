import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../globalprisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { searchTerm, action, batchSize = '1000', cursor, userId, dateFrom, dateTo } = req.query;
    
    // Build where clause
    const filters: any[] = [];

    // Add user filter
    if (userId) {
      filters.push({
        user: {
          id: parseInt(userId as string) || undefined,
        },
      });
    }

    // Add search term filters (only if userId is not specified, to avoid conflicts)
    if (searchTerm && !userId) {
      filters.push({
        OR: [
          { action: { contains: searchTerm as string, mode: 'insensitive' } },
          { user: { username: { contains: searchTerm as string, mode: 'insensitive' } } },
        ],
      });
    } else if (searchTerm && userId) {
      // If userId is specified, only search in action
      filters.push({
        action: { contains: searchTerm as string, mode: 'insensitive' },
      });
    }

    // Add action type filter
    if (action) {
      filters.push({ actionType: action as string });
    }

    // Add date range filters
    if (dateFrom || dateTo) {
      const dateFilter: any = {};
      if (dateFrom) {
        const fromDate = new Date(dateFrom as string);
        fromDate.setHours(0, 0, 0, 0);
        dateFilter.gte = fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo as string);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.lte = toDate;
      }
      filters.push({ createdAt: dateFilter });
    }

    // Combine filters with AND
    const where = filters.length === 0 ? {} : filters.length === 1 ? filters[0] : { AND: filters };

    // Add cursor for pagination
    if (cursor) {
      const cursorValue = typeof cursor === 'string' ? (isNaN(Number(cursor)) ? cursor : Number(cursor)) : cursor;
      where = {
        ...where,
        id: {
          lt: cursorValue,
        },
      };
    }

    const batchSizeNum = Math.min(1000, Math.max(100, parseInt(batchSize as string) || 1000));

    // Fetch logs with cursor-based pagination
    const logs = await prisma.systemUserLogs.findMany({
      where,
      orderBy: {
        id: 'desc', // Use id for cursor-based pagination
      },
      take: batchSizeNum,
      include: { 
        user: {
          select: {
            username: true,
            email: true,
          }
        } 
      },
    });

    // Get the last id for next cursor
    const lastId = logs.length > 0 ? logs[logs.length - 1].id : null;
    const hasMore = logs.length === batchSizeNum;

    return res.status(200).json({ 
      logs, 
      cursor: lastId,
      hasMore,
      batchSize: logs.length,
    });
  } catch (error) {
    console.error('Error fetching system logs for export:', error);
    return res.status(500).json({ 
      error: 'Error fetching logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

