import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
import { startOfWeek, endOfWeek, format, subWeeks } from "date-fns";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const {
        Name,
        Passportnumber,
        page = "1",
        weeks = "4", // عدد الأسابيع الافتراضي (يمكن تمريره كـ query parameter)
      } = req.query;

      const pageSize = 10;
      const pageNumber = parseInt(page as string, 10) || 1;
      const numWeeks = parseInt(weeks as string, 10) || 4;

      // تحديد تاريخ بداية ونهاية الأسابيع
      const today = new Date();
      const weeksData = [];

      // جلب بيانات الحالات لآخر numWeeks أسابيع
      for (let i = 0; i < numWeeks; i++) {
        const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 6 }); // السبت
        const weekEnd = endOfWeek(subWeeks(today, i), { weekStartsOn: 6 }); // الجمعة

        const weeklyStatuses = await prisma.weeklyStatus.findMany({
          where: {
            HomeMaid: {
              Name: { contains: typeof Name === "string" ? Name : "" },
              Passportnumber: {
                contains: typeof Passportnumber === "string" ? Passportnumber : "",
              },
            },
            date: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
          orderBy: { date: "desc" }, // ترتيب حسب التاريخ لجلب آخر حالة
          include: { HomeMaid: true },
          take: pageSize,
          skip: (pageNumber - 1) * pageSize,
        });

        // تجميع الحالات بحيث نأخذ آخر حالة لكل عاملة في الأسبوع
        const uniqueStatuses = new Map();
        weeklyStatuses.forEach((status) => {
          const maidId = status.homeMaid_id;
          if (!uniqueStatuses.has(maidId)) {
            uniqueStatuses.set(maidId, status);
          }
        });

        weeksData.push({
          week: `${format(weekStart, "yyyy-MM-dd")} - ${format(weekEnd, "yyyy-MM-dd")}`,
          statuses: Array.from(uniqueStatuses.values()),
        });
      }

      return res.status(200).json({ weeks: weeksData });
    }

    if (req.method === "POST") {
      const { homeMaid_id, status, date, employee } = req.body;

      if (!status) {
        return res.status(400).json({ error: "حالة العاملة مطلوبة" });
      }

      const newWeeklyStatus = await prisma.weeklyStatus.create({
        data: {
          employee,
          homeMaid_id: req.body.ID,
          status,
          date: date ? new Date(date) : undefined,
        },
      });

      try {
        await prisma.logs.create({
          data: {
            homemaidId: newWeeklyStatus.homeMaid_id,
            Status: `تم تحديث الحالة الى ${status}`,
            userId: employee,
          },
        });
      } catch (error) {
        console.log(error);
      }

      return res.status(201).json(newWeeklyStatus);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("Error in weeklyStatus API:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}