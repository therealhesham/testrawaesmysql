import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
import {
  endOfMonth,
  startOfMonth,
  differenceInDays,
  startOfDay,
  endOfDay,
  format,
} from "date-fns";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    if (request.method === "GET") {
      // Handle daily check-in creation
      const today = new Date();
      const startOfDayS = startOfDay(today); // بداية اليوم
      const endOfDayS = endOfDay(today); // نهاية اليوم
      const td = format(today, "yyyy-MM-dd"); // تنسيق التاريخ كـ YYYY-MM-DD

      // Delete existing check-ins for today
      // await prisma.checkIn.deleteMany({
      //   where: {
      //     CheckDate: {
      //       gte: startOfDayS.toISOString(),
      //       lte: endOfDayS.toISOString(),
      //     },
      //     isActive: true,
      //   },
      // });

      // Fetch all active housed workers
      const activeHousedWorkers = await prisma.housedworker.findMany({
        where: {
          isActive: true,
        },
      });

      // Create check-in records for all active workers
      const checkInPromises = activeHousedWorkers.map((worker) =>
        prisma.checkIn.create({
          data: {
            housedWorkerId: worker.id,
            isActive: true,
            CheckDate: startOfDayS.toISOString(), // استخدام تاريخ موحد
          },
        })
      );

      // Execute all check-in creations
      await Promise.all(checkInPromises);

      // Handle daily cost distribution
      const parsedDate = new Date(); // Use current date
      const month = parsedDate.getMonth() + 1; // getMonth() is 0-based
      const year = parsedDate.getFullYear();

      // Fetch Cash record
      const cash = await prisma.cash.findFirst({
        where: { Month: month.toString(), Year: year.toString() },
      });

      if (!cash || !cash.amount || !cash.Month) {
        return response.status(404).json({
          success: false,
          error: "Cash record not found or missing amount/month",
        });
      }

      // Calculate total distributed amount for the month
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

      // Calculate remaining cash
      const totalCash = Number(cash.amount);
      const remainingCash = totalCash - totalDistributed;
      if (remainingCash <= 0) {
        return response.status(400).json({
          success: false,
          error: "لا يوجد رصيد كافٍ متبقي للتوزيع في هذا الشهر",
        });
      }

      // Calculate remaining days in the month
      const todayParsed = startOfDay(parsedDate);
      const daysRemaining = differenceInDays(monthEnd, todayParsed) + 1; // Including today
      if (daysRemaining <= 0) {
        return response.status(400).json({
          success: false,
          error: "لا يمكن التوزيع بعد نهاية الشهر",
        });
      }

      // Calculate daily amount based on remaining cash
      const dailyAmount = remainingCash / daysRemaining;

      // Fetch active check-ins for the specified date
      const checkIns = await prisma.housedworker.findMany({
        where: {
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

      // Calculate cost per worker
      const costPerWorker = dailyAmount / workerCount;

      // Update DailyCost in CheckIn
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
      try {
        await prisma.notifications.create({
          data: {
            title: `تسجيل اعاشات اتوماتيكيا بتاريخ ${new Date(
              today
            ).toISOString()}`,
            message: `تم تسجيل اعاشات  لـ${workerCount}لعاملات  <br/>
`,
            isRead: false,
          },
        });
      } catch (e) {
        console.log(e);
      }
      // Return success response
      return response.status(200).json({
        success: true,
        data: {
          workerCount,
          costPerWorker: Math.round(costPerWorker),
          date: td,
          totalCash,
          totalDistributed,
          remainingCash,
        },
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
