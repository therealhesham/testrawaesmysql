import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
import {
  endOfMonth,
  startOfMonth,
  differenceInDays,
  startOfDay,
  endOfDay,
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
} from "date-fns";

function getDate(date: Date): string {
  const currentDate = new Date(date);
  const form = currentDate.toISOString().split("T")[0];
  console.log(currentDate);
  return form;
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    if (request.method === "GET") {
      const { transaction_type } = request.query;

      // Handle daily check-in creation
      const today = new Date();
      const startOfDayS = startOfDay(today);
      const endOfDayS = endOfDay(today);
      const td = format(today, "yyyy-MM-dd");

      // Fetch all active housed workers
      const activeHousedWorkers = await prisma.housedworker.findMany({
        where: {
          isActive: true,
        },
      });

      // Create check-in records for all active workers if they don't exist
      for (const worker of activeHousedWorkers) {
        const existingCheckIn = await prisma.checkIn.findFirst({
          where: {
            housedWorkerId: worker.id,
            CheckDate: {
              gte: startOfDayS.toISOString(),
              lte: endOfDayS.toISOString(),
            },
          },
        });

        if (!existingCheckIn) {
          await prisma.checkIn.create({
            data: {
              housedWorkerId: worker.id,
              isActive: true,
              CheckDate: startOfDayS.toISOString(),
            },
          });
        }
      }

      const parsedDate = new Date();
      const month = parsedDate.getMonth() + 1;
      const year = parsedDate.getFullYear();

      // Fetch Cash records based on transaction_type
      let cashRecords = [];
      
      if (transaction_type && transaction_type !== "all") {
        cashRecords = await prisma.cash.findMany({
          where: {
            Month: month.toString(),
            Year: year.toString(),
            transaction_type: transaction_type.toString(),
          },
        });
      } else {
        // If no transaction_type specified, get all cash records for the month
        cashRecords = await prisma.cash.findMany({
          where: {
            Month: month.toString(),
            Year: year.toString(),
          },
        });
      }

      if (!cashRecords || cashRecords.length === 0) {
        return response.status(404).json({
          success: false,
          error: "Cash record not found for the specified criteria",
        });
      }

      // Process each cash record based on its transaction_type
      const results = [];

      for (const cash of cashRecords) {
        const transactionType = cash.transaction_type?.toLowerCase() || "daily";

        if (transactionType === "daily") {
          // Handle daily distribution
          const result = await handleDailyDistribution(
            cash,
            month,
            year,
            startOfDayS,
            endOfDayS,
            today,
            td,
            activeHousedWorkers
          );
          if (result) results.push(result);
        } else if (transactionType === "weekly") {
          // Handle weekly distribution
          const result = await handleWeeklyDistribution(
            cash,
            month,
            year,
            startOfDayS,
            endOfDayS,
            today,
            td,
            activeHousedWorkers
          );
          if (result) results.push(result);
        } else if (transactionType === "monthly") {
          // Handle monthly distribution
          const result = await handleMonthlyDistribution(
            cash,
            month,
            year,
            startOfDayS,
            endOfDayS,
            today,
            td,
            activeHousedWorkers
          );
          if (result) results.push(result);
        }
      }

      if (results.length === 0) {
        return response.status(200).json({
          success: false,
          message: "لم يتم التوزيع - تحقق من الشروط",
        });
      }

      // Create notification
      try {
        const totalWorkers = activeHousedWorkers.length;
        await prisma.notifications.create({
          data: {
            title: `تسجيل اعاشات اتوماتيكيا بتاريخ ${getDate(today)}`,
            message: `تم تسجيل اعاشات لـ${totalWorkers} عاملة`,
            isRead: false,
          },
        });
      } catch (e) {
        console.log(e);
      }

      return response.status(200).json({
        success: true,
        data: results,
      });
    }
  } catch (error) {
    console.error("Error in handler:", error);
    return response
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
}

// Handle daily distribution
async function handleDailyDistribution(
  cash: any,
  month: number,
  year: number,
  startOfDayS: Date,
  endOfDayS: Date,
  today: Date,
  td: string,
  activeHousedWorkers: any[]
) {
  // Check if today already has distribution - if yes, delete it
  const existingDistribution = await prisma.checkIn.findFirst({
    where: {
      CheckDate: {
        gte: startOfDayS.toISOString(),
        lte: endOfDayS.toISOString(),
      },
      DailyCost: {
        not: null,
      },
    },
  });

  if (existingDistribution) {
    // Delete existing distribution for today
    await prisma.checkIn.updateMany({
      where: {
        CheckDate: {
          gte: startOfDayS.toISOString(),
          lte: endOfDayS.toISOString(),
        },
        DailyCost: {
          not: null,
        },
      },
      data: {
        DailyCost: null,
      },
    });
  }

  // Calculate total distributed amount for the month for this cash record
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

  const totalCash = Number(cash.amount);
  const remainingCash = totalCash - totalDistributed;

  if (remainingCash <= 0) {
    return null;
  }

  const todayParsed = startOfDay(today);
  const daysRemaining = differenceInDays(monthEnd, todayParsed) + 1;

  if (daysRemaining <= 0) {
    return null;
  }

  const dailyAmount = remainingCash / daysRemaining;
  const workerCount = activeHousedWorkers.length;

  if (workerCount === 0) {
    return null;
  }

  const costPerWorker = dailyAmount / workerCount;

  await prisma.checkIn.updateMany({
    where: {
      CheckDate: {
        gte: startOfDayS.toISOString(),
        lte: endOfDayS.toISOString(),
      },
      isActive: true,
    },
    data: {
      DailyCost: costPerWorker,
    },
  });

  return {
    transaction_type: "daily",
    workerCount,
    costPerWorker: Math.round(costPerWorker * 100) / 100,
    date: td,
    totalCash,
    totalDistributed,
    remainingCash: Math.round(remainingCash * 100) / 100,
  };
}

// Handle weekly distribution
async function handleWeeklyDistribution(
  cash: any,
  month: number,
  year: number,
  startOfDayS: Date,
  endOfDayS: Date,
  today: Date,
  td: string,
  activeHousedWorkers: any[]
) {
  // Check cash created_at - if it was created today, distribute today
  const cashCreatedAt = cash.createdAt ? new Date(cash.createdAt) : today;
  const cashCreatedAtDay = startOfDay(cashCreatedAt);
  const todayDay = startOfDay(today);

  // Check if cash was created today
  const isCreatedToday = differenceInDays(todayDay, cashCreatedAtDay) === 0;

  if (!isCreatedToday) {
    // Check the last distribution date - must be at least 7 days ago
    // لو اتوزع امبارح في check in مش هوزع النهاردة لان لازم الفرق 7 ايام
    const oneDayAgo = subDays(todayDay, 1);
    const lastDistribution = await prisma.checkIn.findFirst({
      where: {
        DailyCost: {
          not: null,
        },
        CheckDate: {
          lte: oneDayAgo.toISOString(), // Check distributions before today (yesterday or earlier)
        },
      },
      orderBy: {
        CheckDate: "desc",
      },
      select: {
        CheckDate: true,
      },
    });

    if (lastDistribution && lastDistribution.CheckDate) {
      const lastDistDate = startOfDay(new Date(lastDistribution.CheckDate));
      const daysSinceLastDist = differenceInDays(todayDay, lastDistDate);

      // If distribution was done less than 7 days ago, skip
      // This ensures at least 7 days gap between weekly distributions
      if (daysSinceLastDist < 7) {
        return null;
      }
    }
  }

  // Calculate weekly amount (divide by 4 or remaining weeks in month)
  const monthYear = new Date(`${year}-${month}-01`);
  const monthStart = startOfMonth(monthYear);
  const monthEnd = endOfMonth(monthYear);
  const todayParsed = startOfDay(today);
  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
  const daysRemaining = differenceInDays(monthEnd, todayParsed) + 1;
  const weeksRemaining = Math.ceil(daysRemaining / 7);

  const totalCash = Number(cash.amount);
  const weeklyAmount = totalCash / (weeksRemaining > 0 ? weeksRemaining : 1);

  // Check if already distributed this week
  const weekStart = startOfWeek(todayDay, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(todayDay, { weekStartsOn: 0 });

  const existingWeeklyDistribution = await prisma.checkIn.findFirst({
    where: {
      CheckDate: {
        gte: weekStart.toISOString(),
        lte: weekEnd.toISOString(),
      },
      DailyCost: {
        not: null,
      },
    },
  });

  if (existingWeeklyDistribution && !isCreatedToday) {
    return null;
  }

  const workerCount = activeHousedWorkers.length;
  if (workerCount === 0) {
    return null;
  }

  const costPerWorker = weeklyAmount / workerCount;

  await prisma.checkIn.updateMany({
    where: {
      CheckDate: {
        gte: startOfDayS.toISOString(),
        lte: endOfDayS.toISOString(),
      },
      isActive: true,
    },
    data: {
      DailyCost: costPerWorker,
    },
  });

  return {
    transaction_type: "weekly",
    workerCount,
    costPerWorker: Math.round(costPerWorker * 100) / 100,
    date: td,
    totalCash,
    weeklyAmount: Math.round(weeklyAmount * 100) / 100,
    weeksRemaining,
  };
}

// Handle monthly distribution (using Smart Daily Logic)
async function handleMonthlyDistribution(
  cash: any,
  month: number,
  year: number,
  startOfDayS: Date, // Start of the current day for distribution
  endOfDayS: Date,
  today: Date,
  td: string,
  activeHousedWorkers: any[]
) {
  // Check if today already has distribution - if yes, delete it to recalculate
  const existingDistribution = await prisma.checkIn.findFirst({
    where: {
      CheckDate: {
        gte: startOfDayS.toISOString(),
        lte: endOfDayS.toISOString(),
      },
      DailyCost: {
        not: null,
      },
    },
  });

  if (existingDistribution) {
    // Delete existing distribution for today
    await prisma.checkIn.updateMany({
      where: {
        CheckDate: {
          gte: startOfDayS.toISOString(),
          lte: endOfDayS.toISOString(),
        },
        DailyCost: {
          not: null,
        },
      },
      data: {
        DailyCost: null,
      },
    });
  }

  // Calculate total distributed amount for the month for this cash record
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

  const totalCash = Number(cash.amount);
  const remainingCash = totalCash - totalDistributed;

  if (remainingCash <= 0) {
    return null;
  }

  const todayParsed = startOfDay(today);
  const daysRemaining = differenceInDays(monthEnd, todayParsed) + 1;

  if (daysRemaining <= 0) {
    return null;
  }

  const dailyAmount = remainingCash / daysRemaining;
  const workerCount = activeHousedWorkers.length;

  if (workerCount === 0) {
    return null;
  }

  const costPerWorker = dailyAmount / workerCount;

  await prisma.checkIn.updateMany({
    where: {
      CheckDate: {
        gte: startOfDayS.toISOString(),
        lte: endOfDayS.toISOString(),
      },
      isActive: true,
    },
    data: {
      DailyCost: costPerWorker,
    },
  });

  return {
    transaction_type: "monthly",
    workerCount,
    costPerWorker: Math.round(costPerWorker * 100) / 100,
    date: td,
    totalCash,
    totalDistributed,
    remainingCash: Math.round(remainingCash * 100) / 100,
  };
}
