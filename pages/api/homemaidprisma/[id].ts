import { PrismaClient } from "@prisma/client";
import { jwtDecode } from "jwt-decode";
import eventBus from "lib/eventBus";
import { formatSaudiCity } from "lib/cityHelper";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ message: "معرف العاملة غير صالح" });
  }

  const homemaidId = parseInt(id as string);

  if (req.method === "GET") {
    try {
      const homemaid = await prisma.homemaid.findUnique({
        where: { id: homemaidId },
        include: {
          office: true,
          NewOrder: {
            orderBy: { createdAt: "desc" },
            include: {
              client: true,
              arrivals: {
                orderBy: { createdAt: "desc" },
              },
            },
          },
          inHouse: {
            orderBy: { id: "desc" },
            take: 1,
          },
        },
      });

      if (!homemaid) {
        return res.status(404).json({ message: "العاملة غير موجودة" });
      }

      const orderWithArrival = homemaid.NewOrder?.find((o) => o.arrivals?.some((a) => a.KingdomentryDate)) || homemaid.NewOrder?.[0];
      const arrival = orderWithArrival?.arrivals?.find((a) => a.KingdomentryDate) || orderWithArrival?.arrivals?.[0];
      const client = orderWithArrival?.client || homemaid.NewOrder?.[0]?.client;
      const inHouse = homemaid.inHouse?.[0];

      let entryDate = '';
      if (arrival?.KingdomentryDate) {
        entryDate = new Date(arrival.KingdomentryDate).toISOString().split('T')[0];
      } else if (inHouse?.houseentrydate) {
        entryDate = new Date(inHouse.houseentrydate).toISOString().split('T')[0];
      }

      return res.status(200).json({
        homemaid,
        entryDate,
        visaNumber: arrival?.visaNumber || (orderWithArrival as any)?.VisaNumber || '',
        workerResidencyNumber: (homemaid as any).NationalId || (homemaid as any).residencyNumber || '',
        client: client ? {
          id: client.id,
          fullname: client.fullname,
          phonenumber: client.phonenumber,
          nationalId: client.nationalId,
          city: formatSaudiCity(client.city),
        } : null,
      });
    } catch (error) {
      console.error("Error fetching homemaid details:", error);
      return res.status(500).json({ message: "خطأ في جلب بيانات العاملة" });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === "DELETE") {
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
