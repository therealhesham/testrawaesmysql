import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import prisma from "../globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === "PATCH") {
    try {
      // ✅ التحقق من الهوية
      const token = req.cookies?.authToken;
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const decoded: any = jwt.verify(token, "rawaesecret");
      const userId = decoded?.username;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { isRead } = req.body;

      // Validate input
      if (typeof isRead !== "boolean") {
        return res
          .status(400)
          .json({ error: "isRead must be a boolean value" });
      }

      // ✅ التحقق من أن الإشعار موجود وأنه خاص بالمستخدم (ليس عامًا)
      const notification = await prisma.notifications.findUnique({
        where: { id: Number(id) },
      });

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      // ✅ منع تحديث الإشعارات العامة (userId = null)
      if (notification.userId === null) {
        return res.status(403).json({ 
          error: "Cannot mark general notifications as read" 
        });
      }

      // ✅ التحقق من أن الإشعار يخص المستخدم الحالي
      if (notification.userId !== userId) {
        return res.status(403).json({ 
          error: "You can only update your own notifications" 
        });
      }

      // Update notification
      const updatedNotification = await prisma.notifications.update({
        where: { id: Number(id) },
        data: { isRead },
      });

      return res.status(200).json(updatedNotification);
    } catch (error) {
      console.error("Error updating notification:", error);
      return res.status(500).json({ error: "Failed to update notification" });
    }
  } else {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
