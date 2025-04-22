import prisma from "./globalprisma";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method === "POST") {
    console.log(req.body);

    const { reason, idnumber, date, time } = req.body;
    const object = {};
    function excludeEmptyFields(obj) {
      return Object.fromEntries(
        Object.entries(obj).filter(([key, value]) => {
          return (
            value !== null &&
            value !== undefined &&
            value !== "" &&
            !(Array.isArray(value) && value.length === 0)
          );
        })
      );
    }

    const newSession = await prisma.session.create({
      include: { user: true },
      data: {
        idnumber,
        reason,
        date,
        time,
      },
    });

    try {
      const token = req.cookies?.authToken;
      let userId: string | null = null;

      if (token) {
        const decoded: any = jwt.verify(token, "rawaesecret");
        userId = decoded?.username;
      }

      const notification = await prisma.notifications.create({
        data: {
          title: `تم تحديد موعد جلسة`,
          message: `تم تحديد موعد جلسة جديدة رقم ${newSession.id} للعاملة ${newSession.user?.Name} `,
          userId: req.body.employee || "لا يوجد بيان",
          isRead: false,
        },
      });
    } catch (error) {
      console.error(error);
    }

    return res.status(201).json({ newSession });
  } else if (req.method === "GET") {
    const {
      Name,
      age,
      Passportnumber,
      id,
      Nationality,
      page,
      sortKey,
      reason,
      sortDirection,
    } = req.query;

    const pageSize = 10;
    const pageNumber = parseInt(page, 10) || 1;

    // Build the filter object dynamically based on query parameters
    const filters = {
      reason: { contains: reason || "" },
      // Passportnumber: { contains: Passportnumber || "" },
      // ...(id && { id: { equals: Number(id) } }),
    };

    try {
      const session = await prisma.session.findMany({
        include: { user: true },
        where: {
          ...filters,
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      });

      if (!session) {
        return res.status(404).json({ error: "session not found" });
      }

      // ✅ استخراج التوكن من الكوكي
      // console.log("s", req.cookies);
      // const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};

      return res.status(200).json({ session });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error fetching housing" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
