import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { id } = req.query;
      
      // التحقق من وجود id
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ 
          error: "Order ID is required",
          message: "رقم الطلب مطلوب"
        });
      }

      const orderId = parseInt(id);
      if (isNaN(orderId)) {
        return res.status(400).json({ 
          error: "Invalid Order ID",
          message: "رقم الطلب غير صحيح"
        });
      }

      console.log("Searching for Order ID:", orderId);

      // استعلام محسن يشمل جميع الحقول المطلوبة
      const data = await prisma.arrivallist.findFirst({
        where: { 
          OrderId: orderId 
        },
        select: {
          id: true,
          guaranteeStatus: true,
          GuaranteeDurationEnd: true,
          Sponsor: true,
          SponsorName: true,
          SponsorIdnumber: true,
          SponsorPhoneNumber: true,
          PassportNumber: true,
          HomemaIdnumber: true,
          HomemaidName: true,
          Notes: true,
          internalReason: true,
          internaldeparatureCity: true,
          internaldeparatureDate: true,
          internaldeparatureTime: true,
          internalArrivalCity: true,
          internalArrivalCityDate: true,
          internalArrivalCityTime: true,
          externaldeparatureCity: true,
          externaldeparatureDate: true,
          externaldeparatureTime: true,
          externalArrivalCity: true,
          externalArrivalCityDate: true,
          externalArrivalCityTime: true,
          externalReason: true,
          KingdomentryDate: true,
          KingdomentryTime: true,
          arrivalSaudiAirport: true,
          deparatureCityCountry: true,
          deparatureCityCountryDate: true,
          deparatureCityCountryTime: true,
          medicalCheckFile: true,
          ticketFile: true,
          deparatureTicketFile: true,
          receivingFile: true,
          approvalPayment: true,
          additionalfiles: true,
          externalmusanadcontractfile: true,
          externalOfficeFile: true,
          DeliveryFile: true,
          OrderId: true,
          Order: {
            include: {
              HomeMaid: {
                include: {
                  office: true
                }
              },
              client: true
            }
          }
        }
      });

      // التحقق من وجود البيانات
      if (!data) {
        return res.status(404).json({ 
          error: "Order not found",
          message: "الطلب غير موجود",
          data: null
        });
      }

      console.log("Found data for Order ID:", orderId);
      
      res.status(200).json({
        data: data,
        success: true,
        message: "تم جلب البيانات بنجاح"
      });
    } catch (error) {
      console.error("Error fetching arrival data:", error);
      res.status(500).json({ 
        error: "Internal Server Error",
        message: "حدث خطأ في الخادم",
        data: null
      });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ 
      error: `Method ${req.method} Not Allowed`,
      message: "طريقة الطلب غير مسموحة"
    });
  }
}