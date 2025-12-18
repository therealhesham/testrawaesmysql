import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { searchTerm, pageSize = '10', action, page = '1' } = req.query;
    
    // Validate inputs
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(10000, Math.max(1, parseInt(pageSize as string) || 10));
    const skip = (pageNum - 1) * pageSizeNum;

    // Build where clause
    let where: any = {};

    if (searchTerm || action) {
      const filters: any[] = [];

      // Add search term filters
      if (searchTerm) {
        filters.push({
          OR: [
            { action: { contains: searchTerm as string, mode: 'insensitive' } },
            { user: { username: { contains: searchTerm as string, mode: 'insensitive' } } },
          ],
        });
      }

      // Add action type filter
      if (action) {
        filters.push({ actionType: action as string });
      }

      // Combine filters with AND
      where = filters.length === 1 ? filters[0] : { AND: filters };
    }

    // Fetch logs and count in parallel
    const [logs, totalCount] = await Promise.all([
      prisma.systemUserLogs.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSizeNum,
        include: { 
          user: {
            select: {
              username: true,
              email: true,
            }
          } 
        },
      }),
      prisma.systemUserLogs.count({ where }),
    ]);

    return res.status(200).json({ 
      logs, 
      totalCount, 
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(totalCount / pageSizeNum),
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    return res.status(500).json({ 
      error: 'Error fetching logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
