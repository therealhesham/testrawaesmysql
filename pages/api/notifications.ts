import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import prisma from "./globalprisma";
import cookie from "cookie";
import Cookies from "js-cookie";

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

    // ✅ POST: إنشاء إشعار
    if (req.method === "POST") {
      const { message } = req.body;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const notification = await prisma.notifications.create({
        data: {
          message,
          userId: userId || undefined,
        },
      });

      return res.status(201).json(notification);
    }

    // ✅ GET: جلب الإشعارات غير المقروءة فقط
    if (req.method === "GET") {
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const notifications = await prisma.notifications.findMany({
        where: {
          isRead: false,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json(notifications);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("Error in notifications API:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
