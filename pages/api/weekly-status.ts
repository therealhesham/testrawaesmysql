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
    weeks = "4",
  } = req.query;

  const pageSize = 10;
  const pageNumber = parseInt(page as string, 10) || 1;
  const numWeeks = parseInt(weeks as string, 10) || 4;

  const today = new Date();
  const weeksData = [];

  for (let i = 0; i < numWeeks; i++) {
    const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 6 });
    const weekEnd = endOfWeek(subWeeks(today, i), { weekStartsOn: 6 });

    // جلب العاملات من homemaid مع housedworker حيث deparatureHousingDate هو null
    const maids = await prisma.homemaid.findMany({
      where: {
        Name: { contains: typeof Name === "string" ? Name : "" },
        Passportnumber: {
          contains: typeof Passportnumber === "string" ? Passportnumber : "",
        },
        inHouse: {
          some: {
            deparatureHousingDate: null,
          },
        },
      },
      include: {
        inHouse: {
          where: {
            deparatureHousingDate: null,
          },
        },
        weeklyStatusId: {
          where: {
            date: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
          orderBy: { date: "desc" },
          take: 1, // جلب آخر حالة فقط
        },
      },
      // take: pageSize,
      skip: (pageNumber - 1) * pageSize,
    });

    // تحويل البيانات إلى تنسيق مناسب
    const statuses = maids.map((maid) => ({
      id: maid.id.toString(),
      HomeMaid: {
        Name: maid.Name || "",
        Passportnumber: maid.Passportnumber || "",
      },
      status: maid.weeklyStatusId[0]?.status || "غير محدد", // إذا لم يكن هناك حالة
      employee: maid.weeklyStatusId[0]?.employee || "",
      date: maid.weeklyStatusId[0]?.date || new Date(),
      hasNoStatus: !maid.weeklyStatusId.length, // حقل لتحديد إذا كانت بدون حالة
    }));

    weeksData.push({
      week: `${format(weekStart, "yyyy-MM-dd")} - ${format(weekEnd, "yyyy-MM-dd")}`,
      statuses,
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