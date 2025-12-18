import { PrismaClient } from "@prisma/client";
import { jwtDecode } from "jwt-decode";
import eventBus from "lib/eventBus";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ message: "معرف العاملة غير صالح" });
  }

  const homemaidId = parseInt(id as string);

  if (req.method === "DELETE") {
    try {
      // التحقق من صلاحية الحذف
      const cookieHeader = req.headers.cookie;
      let cookies: { [key: string]: string } = {};
      if (cookieHeader) {
        cookieHeader.split(";").forEach((cookie) => {
          const [key, value] = cookie.trim().split("=");
          cookies[key] = decodeURIComponent(value);
        });
      }

      if (!cookies.authToken) {
        return res.status(401).json({ message: "غير مصرح" });
      }

      const token = jwtDecode(cookies.authToken) as any;

      const findUser = await prisma.user.findUnique({
        where: { id: token.id },
        include: { role: true },
      });

      const hasDeletePermission = findUser && findUser.role?.permissions && 
        (findUser.role.permissions as any)["إدارة العاملات"]?.["حذف"];

      if (!hasDeletePermission) {
        return res.status(403).json({ message: "ليس لديك صلاحية لحذف العاملات" });
      }

      // التحقق من وجود العاملة وحذفها
      const homemaid = await prisma.homemaid.findUnique({
        where: { id: homemaidId },
        select: { id: true, Name: true }
      });

      if (!homemaid) {
        return res.status(404).json({ message: "العاملة غير موجودة" });
      }

      await prisma.homemaid.delete({
        where: { id: homemaidId }
      });

      // تسجيل الحدث
      eventBus.emit('ACTION', {
        type: `حذف العاملة #${homemaidId} - ${homemaid.Name}`,
        actionType: 'delete',
        userId: Number(token.id),
      });

      res.status(200).json({ 
        message: "تم حذف العاملة بنجاح",
        deletedHomemaid: {
          id: homemaid.id,
          Name: homemaid.Name
        }
      });
    } catch (error) {
      console.error("Error deleting homemaid:", error);
      res.status(500).json({ message: "خطأ في الخادم الداخلي" });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
