import prisma from "./globalprisma";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { reason, idnumber, date, time, result } = req.body;
    try {
      console.log(req.body)
      // Check if a session exists with the same idnumber and date
      const existingSession = await prisma.session.findFirst({
        where: {
          idnumber: parseInt(idnumber),
          date: new Date(date).toISOString(),
        },
      });

      let newSession;
      if (existingSession) {
        // Update existing session if it has a result
        newSession = await prisma.session.update({
          where: { id: existingSession.id },
          data: {
            reason,
            date: new Date(date).toISOString(),
            time: time || "00:00",
            result,
            // updatedAt: new Date(),
          },
          include: { user: true },
        });
      } else {
        // Create a new session if none exists or no result
        newSession = await prisma.session.create({
          data: {
            idnumber: parseInt(idnumber),
            reason,
            date: new Date(date).toISOString(),
            time: time || "00:00",
            result,
          },
          include: { user: true },
        });
      }

      // Create a notification
      const token = req.cookies?.authToken;
      let userId: string | null = null;
      if (token) {
        const decoded: any = jwt.verify(token, "rawaesecret");
        userId = decoded?.username;
      }

      const notification = await prisma.notifications.create({
        data: {
          title: `تم ${existingSession?.result ? "تحديث" : "تحديد موعد"} جلسة`,
          message: `تم ${existingSession?.result ? "تحديث" : "تحديد موعد"} جلسة ${newSession.id} للعاملة ${newSession.user?.Name || "غير معروف"}`,
          userId: userId || "لا يوجد بيان",
          isRead: false,
        },
      });

      return res.status(201).json({ newSession });
    } catch (error) {
      console.error("Error processing session:", error);
      return res.status(500).json({ error: "Error processing session" });
    }
  } else if (req.method === "GET") {
    const { reason, page, sortKey, sortDirection, date } = req.query;
    const pageSize = 10;
    const pageNumber = parseInt(page, 10) || 1;

    const filters: any = {
      OR: [
        { reason: { contains: reason || ""} },
        { user: { Name: { contains: reason || ""} } },
      ],
    };

    if (date) {
      filters.date = { equals: new Date(date).toISOString() };
    }

    try {
      const sessions = await prisma.session.findMany({
        include: { user: true },
        where: filters,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: sortKey ? { [sortKey]: sortDirection || "asc" } : { id: "asc" },
      });

      const totalResults = await prisma.session.count({ where: filters });

      if (!sessions || sessions.length === 0) {
        return res.status(404).json({ error: "No sessions found" });
      }

      return res.status(200).json({ sessions, totalResults });
    } catch (error) {
      console.error("Error fetching sessions:", error);
      return res.status(500).json({ error: "Error fetching sessions" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}