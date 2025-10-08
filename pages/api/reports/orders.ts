import prisma from "lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // إحصائيات الطلبات الأساسية
    const in_progress = await prisma.neworder.count({
      where: {
        bookingstatus: {
          not: {
            in: ["new_order", "new_orders", "delivered", "in_progress", "received", "cancelled", "rejected"],
          }
        }
      },
    });

    const new_order = await prisma.neworder.count({
      where: {
        bookingstatus: {
          in: ["new_order", "new_orders"],
        }
      },
    });

    const delivered = await prisma.neworder.count({
      where: {
        bookingstatus: {
          in: ["received"],
        }
      },
    });

    const cancelled = await prisma.neworder.count({
      where: {
        bookingstatus: {
          in: ["cancelled"],
        }
      },
    });

    const thisWeekOrders = await prisma.neworder.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        }
      },
    });

    // الطلبات حسب الشهر للسنة الحالية
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const ordersPerMonthsAlongYear = [];
    for (let i = 0; i < 12; i++) {
      ordersPerMonthsAlongYear.push(await prisma.neworder.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), i, 1),
            lt: new Date(new Date().getFullYear(), i + 1, 1),
          }
        },
      }));
    }

    // إحصائيات الحد الأدنى للأجور
    const year = new Date().getFullYear();
    const minimummPerMonths = [];

    for (let month = 1; month <= 12; month++) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 1);

      const minimum = await prisma.minimumm.findFirst({
        where: {
          createdAt: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
      });

      minimummPerMonths.push({
        month,
        minimum: minimum ? minimum.amount : null,
      });
    }

    // إحصائيات الحكومية للطلبات
    const governmentalStats = await getGovernmentalOrderStats();

    res.status(200).json({ 
      in_progress, 
      new_order, 
      delivered, 
      cancelled, 
      thisWeekOrders, 
      minimummPerMonths, 
      ordersPerMonthsAlongYear,
      governmental: governmentalStats
    });
  } catch (error) {
    console.error('Error in orders API:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// إحصائيات الحكومية للطلبات
async function getGovernmentalOrderStats() {
  try {
    // الطلبات حسب الحالة الحكومية
    const ordersWithGovernmentalStatus = await prisma.neworder.findMany({
      select: {
        id: true,
        foreignLaborApproval: true,
        travelPermit: true,
        createdAt: true
      }
    });

    // تجميع الإحصائيات
    const stats = {
      totalOrders: ordersWithGovernmentalStatus.length,
      withForeignLaborApproval: ordersWithGovernmentalStatus.filter(order => order.foreignLaborApproval).length,
      withTravelPermit: ordersWithGovernmentalStatus.filter(order => order.travelPermit).length,
      completedGovernmental: ordersWithGovernmentalStatus.filter(order => 
        order.foreignLaborApproval && order.travelPermit
      ).length,
      pendingGovernmental: ordersWithGovernmentalStatus.filter(order => 
        !order.foreignLaborApproval || !order.travelPermit
      ).length
    };

    // إحصائيات حسب الشهر
    const monthlyGovernmentalStats: { [key: string]: any } = {};
    
    ordersWithGovernmentalStatus.forEach(order => {
      if (order.createdAt) {
        const month = order.createdAt.toISOString().substring(0, 7);
        if (!monthlyGovernmentalStats[month]) {
          monthlyGovernmentalStats[month] = {
            total: 0,
            completed: 0,
            pending: 0
          };
        }
        
        monthlyGovernmentalStats[month].total++;
        
        if (order.foreignLaborApproval && order.travelPermit) {
          monthlyGovernmentalStats[month].completed++;
        } else {
          monthlyGovernmentalStats[month].pending++;
        }
      }
    });

    return {
      ...stats,
      monthlyStats: monthlyGovernmentalStats
    };
  } catch (error) {
    console.error('Error getting governmental stats:', error);
    return {
      totalOrders: 0,
      withForeignLaborApproval: 0,
      withTravelPermit: 0,
      completedGovernmental: 0,
      pendingGovernmental: 0,
      monthlyStats: {}
    };
  }
}







