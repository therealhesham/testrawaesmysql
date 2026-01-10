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
      console.log(id)
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

      // التحقق من حالة الطلب مباشرة من neworder أولاً
      const order = await prisma.neworder.findUnique({
        where: { id: orderId },
        select: { bookingstatus: true }
      });

      if (!order) {
        return res.status(404).json({
          error: "Order not found",
          message: "الطلب غير موجود"
        });
      }

      // التحقق من حالة الطلب
      if (order.bookingstatus) {
        const invalidStatuses = ['cancelled', 'rejected', 'new_order', 'new_orders'];
        const orderStatus = order.bookingstatus.toLowerCase();
        
        if (invalidStatuses.includes(orderStatus)) {
          let reason = '';
          if (orderStatus === 'cancelled') {
            reason = 'لا يمكن إنشاء مغادرة خارجية لطلب ملغي';
          } else if (orderStatus === 'rejected') {
            reason = 'لا يمكن إنشاء مغادرة خارجية لطلب مرفوض';
          } else if (orderStatus === 'new_order' || orderStatus === 'new_orders') {
            reason = 'لا يمكن إنشاء مغادرة خارجية لطلب جديد لم يتم الموافقة عليه';
          }
          
          return res.status(400).json({
            error: "Invalid order status for external departure",
            message: reason
          });
        }
      }

      const data = await prisma.arrivallist.findFirst({
        where: { 
          Order: {id: orderId}
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
            select: {
              id: true,
              bookingstatus: true,
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
// console.log(data);
      
      res.status(200).json(data);
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