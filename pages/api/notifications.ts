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

      // ✅ جلب الإشعارات الخاصة بالمستخدم والإشعارات العامة
      let where: any = {
        OR: [
          { userId: userId },      // الإشعارات الخاصة بي
          { userId: null }         // الإشعارات العامة
        ]
      };

      // جلب كل الإشعارات (سنقوم بالفلترة لاحقًا بناءً على حالة القراءة الفعلية)
      const allNotificationsForFilter = await prisma.notifications.findMany({
        where,
        include: {
          readByUsers: {
            where: { userId: userId },
            select: { userId: true }
          }
        }
      });

      // فلترة الإشعارات بناءً على التبويب وحالة القراءة الفعلية
      let filteredNotifications = allNotificationsForFilter.filter(notif => {
        const isActuallyRead = notif.userId === null 
          ? (notif.readByUsers && notif.readByUsers.length > 0)
          : notif.isRead === true;
        
        if (tab === "unread") return !isActuallyRead;
        if (tab === "read") return isActuallyRead;
        return true; // tab === "all"
      });

      // ترتيب حسب التاريخ
      filteredNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const total = filteredNotifications.length;

      // تطبيق pagination
      const paginatedNotifications = filteredNotifications.slice(
        (pageNum - 1) * limitNum,
        pageNum * limitNum
      );

      // جلب التفاصيل الكاملة للإشعارات المعروضة
      const notifications = await prisma.notifications.findMany({
        where: {
          id: { in: paginatedNotifications.map(n => n.id) }
        },
        orderBy: { createdAt: "desc" },
        include: {
          task: {
            select: {
              id: true,
              Title: true,
              description: true,
              priority: true,
              taskDeadline: true,
              isCompleted: true,
              completionDate: true,
              completionNotes: true,
              userId: true,
              assignedBy: true,
              user: {
                select: {
                  username: true,
                  id: true
                }
              },
              assignedByUser: {
                select: {
                  username: true,
                  id: true
                }
              }
            }
          },
          // جلب حالة القراءة للإشعارات العامة من جدول NotificationRead
          readByUsers: {
            where: {
              userId: userId
            },
            select: {
              userId: true,
              readAt: true
            }
          }
        }
      });

      // ✅ تحديث حالة isRead للإشعارات العامة بناءً على جدول NotificationRead
      const notificationsWithReadStatus = notifications.map((notif) => {
        // إذا كان الإشعار عامًا (userId = null)، استخدم حالة القراءة من NotificationRead
        if (notif.userId === null) {
          return {
            ...notif,
            isRead: notif.readByUsers && notif.readByUsers.length > 0
          };
        }
        // للإشعارات الخاصة، استخدم حالة isRead العادية
        return notif;
      });

      // ✅ حساب العدادات
      const baseWhere = {
        OR: [
          { userId: userId },
          { userId: null }
        ]
      };
      const allNotifications = await prisma.notifications.findMany({
        where: baseWhere,
        include: {
          readByUsers: {
            where: { userId: userId },
            select: { userId: true }
          }
        }
      });

      // حساب العدادات بناءً على حالة القراءة الفعلية
      const allCount = allNotifications.length;
      const readCount = allNotifications.filter(notif => {
        if (notif.userId === null) {
          // للإشعارات العامة، تحقق من جدول NotificationRead
          return notif.readByUsers && notif.readByUsers.length > 0;
        }
        // للإشعارات الخاصة، استخدم isRead
        return notif.isRead === true;
      }).length;
      const unreadCount = allCount - readCount;

      return res.status(200).json({
        data: notificationsWithReadStatus,
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        counts: { all: allCount, read: readCount, unread: unreadCount }
      });
    }

    // ✅ تعليم الكل كمقروء
    if (req.method === "DELETE") {
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      // 1) تعليم كل الإشعارات الخاصة بالمستخدم كمقروءة
      await prisma.notifications.updateMany({
        where: {
          userId: userId, // فقط الإشعارات الخاصة بالمستخدم
        },
        data: { isRead: true },
      });

      // 2) تعليم كل الإشعارات العامة كمقروءة لهذا المستخدم
      //    من خلال إنشاء سجلات في NotificationRead لكل إشعار عام
      const generalNotifications = await prisma.notifications.findMany({
        where: {
          userId: null,
        },
        select: { id: true },
      });

      if (generalNotifications.length > 0) {
        await prisma.notificationRead.createMany({
          data: generalNotifications.map((notif) => ({
            notificationId: notif.id,
            userId: userId!,
          })),
          skipDuplicates: true, // في حالة وجود سجلات سابقة لنفس المستخدم والإشعار
        });
      }

      return res
        .status(204)
        .json({ message: "All personal and general notifications marked as read for this user" });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("Error in notifications API:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
