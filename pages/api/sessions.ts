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
        date: new Date(date).toISOString(),
        time: time ? time : "00:00",
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
          userId: userId || "لا يوجد بيان",
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
      page,
      sortKey,
      reason,
      sortDirection,
    } = req.query;

    const pageSize = 10;
    const pageNumber = parseInt(page, 10) || 1;

    // Build the filter object dynamically based on query parameters
    const filters = {
      reason: { contains: reason || "" }, // Case-insensitive search
      // Uncomment and add more filters if needed
      // Passportnumber: { contains: Passportnumber || "" },
      // ...(id && { id: { equals: Number(id) } }),
    };

    try {
      const session = await prisma.session.findMany({
        include: { user: true },
        where: filters,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: sortKey
          ? { [sortKey]: sortDirection || "asc" }
          : { id: "asc" }, // Default sorting by id
      });

      if (!session || session.length === 0) {
        return res.status(404).json({ error: "No sessions found" });
      }

      return res.status(200).json({ session });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error fetching sessions" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
