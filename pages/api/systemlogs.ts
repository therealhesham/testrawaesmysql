import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle DELETE request - Delete logs by date range
  if (req.method === 'DELETE') {
    try {
      const { dateFrom, dateTo } = req.body;

      // Validate date range
      if (!dateFrom || !dateTo) {
        return res.status(400).json({ 
          error: 'يجب تحديد تاريخ البداية وتاريخ النهاية',
          message: 'Date range is required'
        });
      }

      // Parse dates
      const fromDate = new Date(dateFrom as string);
      fromDate.setHours(0, 0, 0, 0);
      
      const toDate = new Date(dateTo as string);
      toDate.setHours(23, 59, 59, 999);

      // Validate date range
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ 
          error: 'تواريخ غير صحيحة',
          message: 'Invalid date format'
        });
      }

      if (fromDate > toDate) {
        return res.status(400).json({ 
          error: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية',
          message: 'Start date must be before end date'
        });
      }

      // Count logs to be deleted
      const countToDelete = await prisma.systemUserLogs.count({
        where: {
          createdAt: {
            gte: fromDate,
            lte: toDate,
          }
        }
      });

      if (countToDelete === 0) {
        return res.status(404).json({ 
          error: 'لا توجد سجلات في النطاق الزمني المحدد',
          message: 'No logs found in the specified date range',
          deletedCount: 0
        });
      }

      // Delete logs in the date range
      const deleteResult = await prisma.systemUserLogs.deleteMany({
        where: {
          createdAt: {
            gte: fromDate,
            lte: toDate,
          }
        }
      });

      return res.status(200).json({ 
        success: true,
        message: `تم حذف ${deleteResult.count} سجل بنجاح`,
        deletedCount: deleteResult.count
      });
    } catch (error) {
      console.error('Error deleting system logs:', error);
      return res.status(500).json({ 
        error: 'حدث خطأ أثناء حذف السجلات',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Handle GET request - Fetch logs
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { searchTerm, pageSize = '10', action, page = '1', dateFrom, dateTo, userId } = req.query;
    
    // Validate inputs
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(10000, Math.max(1, parseInt(pageSize as string) || 10));
    const skip = (pageNum - 1) * pageSizeNum;

    // Build base filters (without action type) for stats calculation
    const baseFilters: any[] = [];

    // Add user filter
    if (userId) {
      baseFilters.push({
        user: {
          id: parseInt(userId as string) || undefined,
        },
      });
    }

    // Add search term filters (only if userId is not specified, to avoid conflicts)
    if (searchTerm && !userId) {
      baseFilters.push({
        OR: [
          { action: { contains: searchTerm as string } },
          { user: { username: { contains: searchTerm as string } } },
        ],
      });
    } else if (searchTerm && userId) {
      // If userId is specified, only search in action
      baseFilters.push({
        action: { contains: searchTerm as string },
      });
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
      baseFilters.push({ createdAt: dateFilter });
    }

    // Base where clause (without action type filter)
    const baseWhere = baseFilters.length === 0 ? {} : baseFilters.length === 1 ? baseFilters[0] : { AND: baseFilters };

    // Build full where clause (with action type filter for main query)
    const fullFilters = [...baseFilters];
    if (action) {
      fullFilters.push({ actionType: action as string });
    }
    const where = fullFilters.length === 0 ? {} : fullFilters.length === 1 ? fullFilters[0] : { AND: fullFilters };

    // Get today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch logs, counts, and stats in parallel
    const [logs, totalCount, viewCount, createCount, updateCount, deleteCount, todayCount] = await Promise.all([
      // Main logs query with pagination
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
      // Total count with filters
      prisma.systemUserLogs.count({ where }),
      // View count (using base filters, not action filter)
      prisma.systemUserLogs.count({ 
        where: { 
          ...baseWhere,
          actionType: 'view' 
        } 
      }),
      // Create count
      prisma.systemUserLogs.count({ 
        where: { 
          ...baseWhere,
          actionType: 'create' 
        } 
      }),
      // Update count
      prisma.systemUserLogs.count({ 
        where: { 
          ...baseWhere,
          actionType: 'update' 
        } 
      }),
      // Delete count
      prisma.systemUserLogs.count({ 
        where: { 
          ...baseWhere,
          actionType: 'delete' 
        } 
      }),
      // Today's count
      prisma.systemUserLogs.count({ 
        where: { 
          ...baseWhere,
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          }
        } 
      }),
    ]);

    // Calculate total (all action types combined, with base filters)
    const allTotal = viewCount + createCount + updateCount + deleteCount;

    return res.status(200).json({ 
      logs, 
      totalCount, 
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(totalCount / pageSizeNum),
      stats: {
        total: allTotal || totalCount,
        today: todayCount,
        views: viewCount,
        creates: createCount,
        updates: updateCount,
        deletes: deleteCount,
      }
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    return res.status(500).json({ 
      error: 'Error fetching logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
