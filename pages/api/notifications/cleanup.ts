import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import prisma from "../globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // 1. Verify user authentication and authorize admins
    const token = req.cookies?.authToken;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded: any = jwt.verify(token, "rawaesecret");
    const username = decoded?.username;

    if (!username) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Query database to ensure user is admin
    const user = await prisma.user.findFirst({
      where: { username: username },
      include: { role: true },
    });

    // Authorize only admins (e.g. role named "مدير النظام", "admin", roleId = 1, or main user "mr hesham")
    const isAdmin = 
      user && 
      (user.role?.name?.includes("مدير") || 
       user.role?.name?.toLowerCase().includes("admin") || 
       user.roleId === 1 || 
       user.username.toLowerCase().trim() === "mr hesham");

    if (!isAdmin) {
      return res.status(403).json({ error: "ليس لديك صلاحية لتشغيل صيانة قاعدة البيانات" });
    }

    console.log(`--- Starting Admin Initiated Notification System Database Cleanup by: ${username} ---`);

    // 1. Convert placeholder "لا يوجد بيان" to null
    const laYojadCount = await prisma.notifications.updateMany({
      where: {
        userId: 'لا يوجد بيان',
      },
      data: {
        userId: null,
      },
    });

    // 2. Process stringified numeric user IDs
    const allNotifs = await prisma.notifications.findMany({
      where: {
        userId: { not: null },
      },
    });

    let numericFixed = 0;
    let numericDeleted = 0;
    let standardizedCasing = 0;

    for (const notif of allNotifs) {
      if (!notif.userId) continue;

      const trimmed = notif.userId.trim();
      const isNumeric = /^\d+$/.test(trimmed);

      if (isNumeric) {
        const userIdNum = parseInt(trimmed, 10);
        // Find the user by id or idnumber
        const matchingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: userIdNum },
              { idnumber: userIdNum }
            ]
          }
        });

        if (matchingUser) {
          await prisma.notifications.update({
            where: { id: notif.id },
            data: { userId: matchingUser.username.toLowerCase().trim() },
          });
          numericFixed++;
        } else {
          // Delete orphaned notification
          await prisma.notifications.delete({
            where: { id: notif.id },
          });
          numericDeleted++;
        }
      } else {
        // Standardize casing
        const lowercased = trimmed.toLowerCase();
        if (notif.userId !== lowercased) {
          await prisma.notifications.update({
            where: { id: notif.id },
            data: { userId: lowercased },
          });
          standardizedCasing++;
        }
      }
    }

    // 3. Standardize NotificationRead table userIds
    const allReadRecords = await prisma.notificationRead.findMany();
    let readRecordsStandardized = 0;

    for (const record of allReadRecords) {
      const trimmedLower = record.userId.trim().toLowerCase();
      if (record.userId !== trimmedLower) {
        try {
          await prisma.notificationRead.update({
            where: { id: record.id },
            data: { userId: trimmedLower },
          });
          readRecordsStandardized++;
        } catch (err) {
          console.error(`Failed to standardize NotificationRead id #${record.id}:`, err.message);
        }
      }
    }

    console.log(`--- Cleanup Finished Successfully. Fixed: ${numericFixed}, Deleted: ${numericDeleted}, Standardized: ${standardizedCasing + readRecordsStandardized} ---`);

    return res.status(200).json({
      success: true,
      message: "تم تنظيف وصيانة قاعدة بيانات الإشعارات بنجاح!",
      details: {
        laYojadFixed: laYojadCount.count,
        numericFixed,
        numericDeleted,
        standardizedCount: standardizedCasing + readRecordsStandardized
      }
    });

  } catch (error) {
    console.error("Error during admin database cleanup:", error);
    return res.status(500).json({ error: "فشل في تشغيل صيانة قاعدة البيانات" });
  }
}
