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
    // 1. Verify user authentication and authorize admins/owners
    const token = req.cookies?.authToken;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded: any = jwt.verify(token, "rawaesecret");
    const username = decoded?.username;

    if (!username) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Query database to ensure user is admin/owner
    const user = await prisma.user.findFirst({
      where: { username: username },
      include: { role: true },
    });

    const isAdmin = 
      user && 
      (user.role?.name?.includes("مدير") || 
       user.role?.name?.toLowerCase().includes("admin") || 
       user.role?.name?.toLowerCase().includes("owner") || 
       user.role?.name?.toLowerCase().includes("own") || 
       user.roleId === 1 || 
       user.username.toLowerCase().trim() === "mr hesham");

    if (!isAdmin) {
      return res.status(403).json({ error: "ليس لديك صلاحية لتشغيل صيانة قاعدة البيانات" });
    }

    console.log(`--- Starting HIGH-PERFORMANCE SQL Notification Cleanup by: ${username} ---`);

    // 1. Convert placeholder "لا يوجد بيان" to null (1 fast query)
    const laYojadCount = await prisma.$executeRawUnsafe(
      `UPDATE notifications SET userId = NULL WHERE userId = 'لا يوجد بيان'`
    );

    // 2. Process stringified numeric user IDs - Join with User table to match real username (1 fast query)
    const numericFixed = await prisma.$executeRawUnsafe(`
      UPDATE notifications n
      JOIN User u ON CAST(n.userId AS UNSIGNED) = u.id
      SET n.userId = LOWER(TRIM(u.username))
      WHERE n.userId REGEXP '^[0-9]+$'
    `);

    // 3. Delete orphaned notifications where userId is numeric but has no matching User (1 fast query)
    const numericDeleted = await prisma.$executeRawUnsafe(`
      DELETE n FROM notifications n
      LEFT JOIN User u ON CAST(n.userId AS UNSIGNED) = u.id
      WHERE n.userId REGEXP '^[0-9]+$' AND u.id IS NULL
    `);

    // 4. Standardize all non-numeric userIds to lowercase and trimmed in notifications (1 fast query)
    const casingFixedNotif = await prisma.$executeRawUnsafe(`
      UPDATE notifications 
      SET userId = LOWER(TRIM(userId)) 
      WHERE userId IS NOT NULL AND userId NOT REGEXP '^[0-9]+$'
    `);

    // 5. Standardize all userIds to lowercase and trimmed in NotificationRead (1 fast query)
    const casingFixedRead = await prisma.$executeRawUnsafe(`
      UPDATE NotificationRead 
      SET userId = LOWER(TRIM(userId))
    `);

    console.log(`--- Fast SQL Cleanup Finished Successfully ---`);

    return res.status(200).json({
      success: true,
      message: "تم تنظيف وصيانة قاعدة بيانات الإشعارات بنجاح مذهل!",
      details: {
        laYojadFixed: Number(laYojadCount),
        numericFixed: Number(numericFixed),
        numericDeleted: Number(numericDeleted),
        standardizedCount: Number(casingFixedNotif) + Number(casingFixedRead)
      }
    });

  } catch (error) {
    console.error("Error during high-performance database cleanup:", error);
    return res.status(500).json({ error: "فشل في تشغيل صيانة قاعدة البيانات بسبب خطأ داخلي" });
  }
}
