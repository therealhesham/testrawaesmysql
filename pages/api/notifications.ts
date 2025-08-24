import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import prisma from "./globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const token = req.cookies?.authToken;
    let userId: string | null = null;

    if (token) {
      const decoded: any = jwt.verify(token, "rawaesecret");
      userId = decoded?.username;
    }

    // ✅ إنشاء إشعار
    if (req.method === "POST") {
      const { message } = req.body;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      if (!message) return res.status(400).json({ error: "Message is required" });

      const notification = await prisma.notifications.create({
        data: { message, userId },
      });

      return res.status(201).json(notification);
    }

    // ✅ جلب الإشعارات مع Pagination + عدادات
    if (req.method === "GET") {
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { tab = "unread", page = "1", limit = "5" } = req.query;
      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 5;
// userId
      let where: any = {  };
      if (tab === "unread") where.isRead = false;
      if (tab === "read") where.isRead = true;

      const total = await prisma.notifications.count({ where });

      const notifications = await prisma.notifications.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      });

      // ✅ حساب العدادات
      const allCount = await prisma.notifications.count({ where: {  } });
      const readCount = await prisma.notifications.count({ where: {  isRead: true } });
      const unreadCount = await prisma.notifications.count({ where: {  isRead: false } });

      return res.status(200).json({
        data: notifications,
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        counts: { all: allCount, read: readCount, unread: unreadCount }
      });
    }

    // ✅ تعليم الكل كمقروء
    if (req.method === "DELETE") {
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      await prisma.notifications.updateMany({
        where: { userId },
        data: { isRead: true },
      });
      return res.status(204).json({ message: "All notifications cleared" });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("Error in notifications API:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
