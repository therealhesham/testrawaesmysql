import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
import {
  endOfMonth,
  startOfMonth,
  differenceInDays,
  startOfDay,
  endOfDay,
} from "date-fns";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.method !== "POST") {
    return response
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    // 1. Validate input
    const { month, year, checkDate, forceDistribute = false } = request.body;

    if (!month || !year || !checkDate) {
      return response.status(400).json({
        success: false,
        error: "month, year, and checkDate are required",
      });
    }

    // Validate date format
    const parsedDate = new Date(checkDate);
    if (isNaN(parsedDate.getTime())) {
      return response
        .status(400)
        .json({ success: false, error: "Invalid checkDate format" });
    }

    // 2. Check for existing distribution
    if (!forceDistribute) {
      const existingDistribution = await prisma.checkIn.findFirst({
        where: {
          CheckDate: {
            gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
            lte: new Date(parsedDate.setHours(23, 59, 59, 999)),
          },
          DailyCost: {
            not: null,
          },
        },
      });

      if (existingDistribution) {
        return response.status(200).json({
          success: false,
          existingDistribution: true,
          message: "تم التوزيع بالفعل لهذا اليوم. هل تريد الاستكمال؟",
        });
      }
    }

    // 3. Fetch Cash record
    const cash = await prisma.cash.findFirst({
      where: { Month: month, Year: year },
    });

    if (!cash || !cash.amount || !cash.Month) {
      return response.status(404).json({
        success: false,
        error: "Cash record not found or missing amount/month",
      });
    }

    // 4. Calculate total distributed amount for the month
    const monthYear = new Date(`${year}-${month}-01`);
    const monthStart = startOfMonth(monthYear);
    const monthEnd = endOfMonth(monthYear);

    const distributedRecords = await prisma.checkIn.findMany({
      where: {
        CheckDate: {
          gte: monthStart,
          lte: monthEnd,
        },
        DailyCost: {
          not: null,
        },
      },
      select: {
        DailyCost: true,
      },
    });

    const totalDistributed = distributedRecords.reduce(
      (sum, record) => sum + (Number(record.DailyCost) || 0),
      0
    );

    // 5. Calculate remaining cash
    const totalCash = Number(cash.amount);
    const remainingCash = totalCash - totalDistributed;

    if (remainingCash <= 0) {
      return response.status(400).json({
        success: false,
        error: "لا يوجد رصيد كافٍ متبقي للتوزيع في هذا الشهر",
      });
    }

    // 6. Calculate remaining days in the month
    const today = startOfDay(parsedDate);
    const daysRemaining = differenceInDays(monthEnd, today) + 1; // Including today
    if (daysRemaining <= 0) {
      return response.status(400).json({
        success: false,
        error: "لا يمكن التوزيع بعد نهاية الشهر",
      });
    }

    // 7. Calculate daily amount based on remaining cash
    const dailyAmount = remainingCash / daysRemaining;
    // 8. Fetch active check-ins for the specified date
    const checkIns = await prisma.checkIn.findMany({
      where: {
        CheckDate: {
          gte: startOfDay(parsedDate),
          lte: endOfDay(parsedDate),
        },
        isActive: true,
      },
    });

    const workerCount = checkIns.length;
    if (workerCount === 0) {
      return response.status(404).json({
        success: false,
        error: "No active workers found for this date",
      });
    }

    // 9. Calculate cost per worker
    const costPerWorker = dailyAmount / workerCount;

    // 10. Update DailyCost in CheckIn
    await prisma.checkIn.updateMany({
      where: {
        CheckDate: {
          gte: startOfDay(parsedDate),
          lte: endOfDay(parsedDate),
        },
        isActive: true,
      },
      data: {
        DailyCost: Math.round(costPerWorker),
      },
    });

    // 11. Return success response
    return response.status(200).json({
      success: true,
      data: {
        workerCount,
        costPerWorker: Math.round(costPerWorker),
        date: parsedDate.toISOString().split("T")[0],
        totalCash,
        totalDistributed,
        remainingCash,
      },
    });
  } catch (error) {
    console.error("Error calculating DailyCost:", error);
    return response
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
}
