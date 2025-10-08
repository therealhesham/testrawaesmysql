import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  switch (method) {
    case 'GET':
      try {
        // احصائيات الطلبات - Orders Statistics
        const ordersStats = await getOrdersStatistics();
        
        // احصائيات المدن والمصادر - Cities and Sources Statistics  
        const citiesSourcesStats = await getCitiesSourcesStatistics();
        
        // احصائيات العملاء - Clients with/without receivables
        const clientsReceivablesStats = await getClientsReceivablesStatistics();
        
        // احصائيات المهام - Tasks Statistics
        const tasksStats = await getTasksStatistics();
        
        // احصائيات العاملات حسب الجنسية - Workers by nationality
        const workersNationalityStats = await getWorkersNationalityStatistics();
                                    
        // احصائيات التسكين - Housing Statistics
        const housingStats = await getHousingStatistics();
        
        // احصائيات الاعاشة - Food/Housing Count
        const foodHousingStats = await getFoodHousingStatistics();

        const reports = {
          orders: ordersStats,
          citiesSources: citiesSourcesStats, 
          clientsReceivables: clientsReceivablesStats,
          tasks: tasksStats,
          workersNationality: workersNationalityStats,
          housing: housingStats,
          foodHousing: foodHousingStats
        };

        res.status(200).json(reports);
      } catch (error) {
        console.error('Error generating reports:', error);
        res.status(500).json({ 
          message: 'Internal server error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
      break;
    default:
      res.status(405).json({ message: 'Method not allowed' });
      break;
  }
}

// احصائيات الطلبات
async function getOrdersStatistics() {
  const totalOrders = await prisma.neworder.count();
  
  // حالات الطلبات
  const ordersByStatus = await prisma.neworder.groupBy({
    by: ['bookingstatus'],
    _count: {
      id: true
    }
  });

  // الطلبات حسب الشهر (آخر 6 شهور)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const ordersByMonth = await prisma.neworder.findMany({
    where: {
      createdAt: {
        gte: sixMonthsAgo
      }
    },
    select: {
      createdAt: true,
      bookingstatus: true
    }
  });

  // تجميع البيانات حسب الشهر
  const monthlyStats: { [key: string]: number } = {};
  ordersByMonth.forEach(order => {
    if (order.createdAt) {
      const month = order.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyStats[month]) {
        monthlyStats[month] = 0;
      }
      monthlyStats[month]++;
    }
  });

  return {
    total: totalOrders,
    byStatus: ordersByStatus,
    byMonth: monthlyStats
  };
}

// احصائيات المدن والمصادر
async function getCitiesSourcesStatistics() {
  // العملاء حسب المدينة
  const clientsByCity = await prisma.client.groupBy({
    by: ['city'],
    _count: {
      id: true
    },
    where: {
      city: {
        not: null
      }
    }
  });

  // العملاء حسب المصدر (تم تعطيله مؤقتاً بسبب مشكلة في الـ Schema)
  const clientsBySource: any[] = [];

  return {
    byCity: clientsByCity,
    bySource: clientsBySource
  };
}

// احصائيات العملاء (المستحقات)
async function getClientsReceivablesStatistics() {
  const totalClients = await prisma.client.count();
  
  // العملاء الذين لديهم كشف حساب
  const clientsWithStatements = await prisma.clientAccountStatement.findMany({
    select: {
      clientId: true,
      netAmount: true
    }
  });

  const clientsWithReceivables = clientsWithStatements.filter(stmt => 
    stmt.netAmount && parseFloat(stmt.netAmount.toString()) > 0
  ).length;

  const clientsWithoutReceivables = totalClients - clientsWithReceivables;

  return {
    total: totalClients,
    withReceivables: clientsWithReceivables,
    withoutReceivables: clientsWithoutReceivables
  };
}

// احصائيات المهام
async function getTasksStatistics() {
  const totalTasks = await prisma.tasks.count();
  const completedTasks = await prisma.tasks.count({
    where: { isCompleted: true }
  });
  const incompleteTasks = totalTasks - completedTasks;

  // المهام حسب الأولوية
  const tasksByPriority = await prisma.tasks.groupBy({
    by: ['priority'],
    _count: {
      id: true
    },
    where: {
      priority: {
        not: null
      }
    }
  });

  return {
    total: totalTasks,
    completed: completedTasks,
    incomplete: incompleteTasks,
    byPriority: tasksByPriority
  };
}

// احصائيات العاملات حسب الجنسية
async function getWorkersNationalityStatistics() {
  const workersByNationality = await prisma.homemaid.groupBy({
    by: ['Nationalitycopy'],
    _count: {
      id: true
    },
    where: {
      Nationalitycopy: {
        not: null
      }
    }
  });

  return {
    byNationality: workersByNationality
  };
}

// احصائيات التسكين
async function getHousingStatistics() {
  // العاملات المسكنات حسب الجنسية
  const housedWorkersByNationality = await prisma.housedworker.findMany({
    include: {
      Order: {
        select: {
          Nationalitycopy: true
        }
      }
    },
    where: {
      isActive: true
    }
  });

  const nationalityCount: { [key: string]: number } = {};
  housedWorkersByNationality.forEach(worker => {
    const nationality = worker.Order?.Nationalitycopy;
    if (nationality) {
      nationalityCount[nationality] = (nationalityCount[nationality] || 0) + 1;
    }
  });

  return {
    byNationality: nationalityCount,
    total: housedWorkersByNationality.length
  };
}

// احصائيات الاعاشة والسكن
async function getFoodHousingStatistics() {
  // عدد العاملات في كل موقع سكن
  const workersByLocation = await prisma.inHouseLocation.findMany({
    include: {
      housedWorkers: {
        where: {
          isActive: true
        },
        include: {
          Order: {
            select: {
              Name: true,
              Nationalitycopy: true
            }
          }
        }
      }
    }
  });

  const locationStats = workersByLocation.map(location => ({
    location: location.location,
    capacity: location.quantity,
    currentCount: location.housedWorkers.length,
    available: location.quantity - location.housedWorkers.length,
    workers: location.housedWorkers.map(worker => ({
      name: worker.Order?.Name,
      nationality: worker.Order?.Nationalitycopy
    }))
  }));

  // إحصائيات تسجيل الدخول والوجبات
  const checkInStats = await prisma.checkIn.findMany({
    where: {
      isActive: true,
      CheckDate: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // آخر 30 يوم
      }
    },
    include: {
      HousedWorker: {
        include: {
          Order: {
            select: {
              Name: true,
              Nationalitycopy: true
            }
          }
        }
      }
    }
  });

  return {
    locationStats,
    checkInStats: checkInStats.length,
    totalHousedWorkers: workersByLocation.reduce((sum, loc) => sum + loc.housedWorkers.length, 0)
  };
}

export default handler;



