// pages/api/reports/governmental.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  
  switch (method) {
    case 'GET':
      try {
        // إحصائيات الحد الأدنى للأجور
        const minimumWageStats = await getMinimumWageStatistics();
        
        // إحصائيات الطلبات الحكومية
        const governmentalOrdersStats = await getGovernmentalOrdersStatistics();
        
        // إحصائيات التصاريح والفحوصات الطبية
        const permitsMedicalStats = await getPermitsMedicalStatistics();
        
        // إحصائيات العاملات حسب الحالة الحكومية
        const workersGovernmentalStats = await getWorkersGovernmentalStatistics();
        
        // إحصائيات الإيرادات الحكومية
        const governmentalRevenueStats = await getGovernmentalRevenueStatistics();

        const governmentalReports = {
          minimumWage: minimumWageStats,
          governmentalOrders: governmentalOrdersStats,
          permitsMedical: permitsMedicalStats,
          workersGovernmental: workersGovernmentalStats,
          governmentalRevenue: governmentalRevenueStats
        };

        res.status(200).json(governmentalReports);
      } catch (error) {
        console.error('Error generating governmental reports:', error);
        res.status(500).json({ 
          message: 'Internal server error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
      break;
      
    case 'POST':
      try {
        const { type, data } = req.body;
        
        switch (type) {
          case 'minimum_wage':
            const minimumWage = await prisma.minimumm.create({
              data: {
                amount: data.amount,
              },
            });
            return res.status(200).json({ minimumWage });
            
          case 'governmental_fee':
            const governmentalFee = await prisma.governmentalFee.create({
              data: {
                feeType: data.feeType,
                amount: data.amount,
                description: data.description,
              },
            });
            return res.status(200).json({ governmentalFee });
            
          default:
            return res.status(400).json({ message: 'Invalid type' });
        }
      } catch (error) {
        console.error("Governmental API error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
      break;
      
    default:
      res.status(405).json({ message: 'Method not allowed' });
      break;
  }
}

// إحصائيات الحد الأدنى للأجور
async function getMinimumWageStatistics() {
  const year = new Date().getFullYear();
  const minimummPerMonths = [];

  // Loop على كل الشهور (من 1 إلى 12)
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

  // إحصائيات إضافية
  const totalMinimumRecords = await prisma.minimumm.count();
  const latestMinimum = await prisma.minimumm.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  return {
    year,
    minimummPerMonths,
    totalRecords: totalMinimumRecords,
    latestMinimum: latestMinimum?.amount || null
  };
}

// إحصائيات الطلبات الحكومية
async function getGovernmentalOrdersStatistics() {
  // الطلبات مع الموافقة على العمل الأجنبي
  const ordersWithForeignLaborApproval = await prisma.neworder.count({
    where: {
      foreignLaborApproval: true
    }
  });

  // الطلبات مع تصريح السفر
  const ordersWithTravelPermit = await prisma.neworder.count({
    where: {
      travelPermit: {
        not: null
      }
    }
  });

  // الطلبات المكتملة حكومياً (كلاهما موجود)
  const completedGovernmentalOrders = await prisma.neworder.count({
    where: {
      foreignLaborApproval: true,
      travelPermit: {
        not: null
      }
    }
  });

  // الطلبات قيد المراجعة الحكومية
  const pendingGovernmentalOrders = await prisma.neworder.count({
    where: {
      OR: [
        { foreignLaborApproval: false },
        { travelPermit: null }
      ]
    }
  });

  // إجمالي الطلبات
  const totalOrders = await prisma.neworder.count();

  return {
    withForeignLaborApproval: ordersWithForeignLaborApproval,
    withTravelPermit: ordersWithTravelPermit,
    completed: completedGovernmentalOrders,
    pending: pendingGovernmentalOrders,
    total: totalOrders
  };
}

// إحصائيات التصاريح والفحوصات الطبية
async function getPermitsMedicalStatistics() {
  // إحصائيات تصاريح السفر
  const travelPermitStats = await prisma.neworder.groupBy({
    by: ['travelPermit'],
    _count: {
      id: true
    }
  });

  // إحصائيات موافقة العمل الأجنبي
  const foreignLaborApprovalStats = await prisma.neworder.groupBy({
    by: ['foreignLaborApproval'],
    _count: {
      id: true
    }
  });

  // إحصائيات الملفات الطبية
  const medicalCheckFileStats = await prisma.neworder.count({
    where: {
      medicalCheckFile: {
        not: null
      }
    }
  });

  return {
    travelPermit: travelPermitStats,
    foreignLaborApproval: foreignLaborApprovalStats,
    medicalCheckFiles: medicalCheckFileStats
  };
}

// إحصائيات العاملات حسب الحالة الحكومية
async function getWorkersGovernmentalStatistics() {
  // العاملات حسب الجنسية والحالة الحكومية
  const workersByNationalityAndStatus = await prisma.homemaid.findMany({
    include: {
      NewOrder: {
        select: {
          travelPermit: true,
          foreignLaborApproval: true,
          medicalCheckFile: true
        }
      }
    }
  });

  // تجميع البيانات
  const nationalityStatusCount: { [key: string]: any } = {};
  
  workersByNationalityAndStatus.forEach(worker => {
    const nationality = worker.Nationalitycopy || 'غير محدد';
    if (!nationalityStatusCount[nationality]) {
      nationalityStatusCount[nationality] = {
        total: 0,
        completed: 0,
        pending: 0
      };
    }
    
    nationalityStatusCount[nationality].total++;
    
    if (worker.NewOrder && worker.NewOrder.length > 0) {
      const order = worker.NewOrder[0]; // أخذ أول طلب
      const isCompleted = order.foreignLaborApproval && order.travelPermit;
      
      if (isCompleted) {
        nationalityStatusCount[nationality].completed++;
      } else {
        nationalityStatusCount[nationality].pending++;
      }
    } else {
      nationalityStatusCount[nationality].pending++;
    }
  });

  return {
    byNationalityAndStatus: nationalityStatusCount
  };
}

// إحصائيات الإيرادات الحكومية
async function getGovernmentalRevenueStatistics() {
  // إحصائيات بسيطة للرسوم الحكومية (بناءً على البيانات المتاحة)
  const totalOrders = await prisma.neworder.count();
  const ordersWithFees = await prisma.neworder.count({
    where: {
      OR: [
        { foreignLaborApproval: true },
        { travelPermit: { not: null } }
      ]
    }
  });

  // إحصائيات حسب الشهر
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  
  const ordersByMonth = await prisma.neworder.findMany({
    where: {
      createdAt: {
        gte: twelveMonthsAgo
      }
    },
    select: {
      createdAt: true,
      foreignLaborApproval: true,
      travelPermit: true
    }
  });

  // تجميع البيانات حسب الشهر
  const monthlyFees: { [key: string]: number } = {};
  ordersByMonth.forEach(order => {
    if (order.createdAt) {
      const month = order.createdAt.toISOString().substring(0, 7);
      if (!monthlyFees[month]) {
        monthlyFees[month] = 0;
      }
      // حساب بسيط للرسوم (مثال: 100 ريال لكل طلب مكتمل)
      if (order.foreignLaborApproval && order.travelPermit) {
        monthlyFees[month] += 100;
      }
    }
  });

  return {
    totalFees: ordersWithFees * 100, // تقدير بسيط
    totalOrders,
    ordersWithFees,
    monthlyFees
  };
}