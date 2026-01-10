import '../../lib/loggers';

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode";
import eventBus from "lib/eventBus";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  function excludeEmptyFields(obj: any) {
    return Object.fromEntries(
      Object.entries(obj).filter(([key, value]) => {
        return (
          value !== null &&
          value !== undefined &&
          value !== "" &&
          !(Array.isArray(value) && value.length === 0)
        );
      })
    );
  }

  // Check for the correct HTTP method
  if (req.method === "GET") {
    const originalObject = {
      name: "John",
      age: 30,
      email: null,
      phone: undefined,
      address: "123 Main St",
    };

    const obj = excludeEmptyFields(originalObject);
    console.log(obj); // Here, you can perform further operations (like calling Prisma)
  }

  try {
    const {
      finaldestination,
      deparatureTime,
      finalDestinationDate,
      KingdomentryDate,
      HomemaIdnumber,
      Notes,
      id,
      ArrivalCity,
      ticketFile,
      externaldeparatureDate,
      externaldeparatureCity,
      externaldeparatureTime,
      externalArrivalCity,
      externalArrivalCityDate,
      externalArrivalCityTime,
      externalReason,
      externalmusanadcontractfile,
      receivingFile,
      externalOfficeFile,
      approvalPayment,
      additionalfiles,
      DateOfApplication,
      MusanadDuration,
      externalOfficeStatus,
      ExternalDateLinking,
      ExternalOFficeApproval,
      ExternalStatusByoffice,
      AgencyDate,
      finalDestinationTime,
      profileStatus,
      Orderid,
      EmbassySealing,
externalTicketFile,      
      // BookinDate,internalReason,
      bookingstatus,
      DeliveryFile,
      DeliveryDate,
      externalmusanedContract,
      GuaranteeDurationEnd,
    } = req.body;

    console.log(req.body); // Log the request body for debugging

    // Check and handle AgencyDate if empty or invalid
    const validAgencyDate = AgencyDate
      ? new Date(AgencyDate).toISOString()
      : null;
    const validEmbassySealing = EmbassySealing
      ? new Date(EmbassySealing).toISOString()
      : null;

    const validexternalmusanedContract = externalmusanedContract
      ? new Date(externalmusanedContract).toISOString()
      : null;

    const VALIDExternalOFficeApproval = ExternalOFficeApproval
      ? new Date(ExternalOFficeApproval).toISOString()
      : null;
    const validExternalDateLinking = ExternalDateLinking
      ? new Date(ExternalDateLinking).toISOString()
      : null;

    const validGuaranteeDurationEnd = GuaranteeDurationEnd
      ? new Date(GuaranteeDurationEnd).toISOString()
      : null;
    // const validBookinDate = BookinDate
    //   ? new Date(BookinDate).toISOString()
    //   : null;

    const validKingdomEntryDate = KingdomentryDate
      ? new Date(KingdomentryDate).toISOString()
      : null;
    const validDeliveryDate = DeliveryDate
      ? new Date(DeliveryDate).toISOString()
      : null;
    const validExternaldeparatureDate = externaldeparatureDate
      ? new Date(externaldeparatureDate).toISOString()
      : null;
    const validExternalArrivalCityDate = externalArrivalCityDate
      ? new Date(externalArrivalCityDate).toISOString()
      : null;
    const validfinalDestinationDate = finalDestinationDate
      ? new Date(finalDestinationDate).toISOString()
      : null;

    const ss = {
      finaldestination,
      deparatureTime,
      finalDestinationTime,
      finalDestinationDate: validfinalDestinationDate,
      externaldeparatureDate: validExternaldeparatureDate,
      externaldeparatureCity,
      externaldeparatureTime,
      externalArrivalCity,
      externalArrivalCityDate: validExternalArrivalCityDate,
      externalArrivalCityTime,
      externalReason,
      KingdomentryDate: validKingdomEntryDate,
      HomemaIdnumber,
      DeliveryDate: validDeliveryDate,
      notes: Notes,
      externalTicketFile,
      externalOfficeStatus,
      externalmusanadcontractfile,
      additionalfiles,
      ArrivalCity,
      externalmusanedContract: validexternalmusanedContract,
      MusanadDuration,
      ExternalDateLinking: validExternalDateLinking,
      ExternalOFficeApproval: VALIDExternalOFficeApproval,
      AgencyDate: validAgencyDate,
      EmbassySealing: validEmbassySealing,
      GuaranteeDurationEnd: validGuaranteeDurationEnd,
    };

    // Apply `excludeEmptyFields` to filter out empty fields from the object
    const dataToUpdate = excludeEmptyFields(ss);

    // Prisma update queries
    // await prisma.neworder.update({
    //   where: { id: Orderid },
    //   data: { bookingstatus },
    // });


    console.log("Data to update:", {id,Orderid}); // Log the final data to be updated
    
    // التحقق من حالة الطلب قبل التحديث
    if (Orderid) {
      const order = await prisma.neworder.findUnique({
        where: { id: Orderid },
        select: { bookingstatus: true }
      });
      
      if (order?.bookingstatus) {
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
    }
    
    const createarrivallist = await prisma.arrivallist.update({
      include: { Order: { include: { HomeMaid: true } } },
      where: { id :id},
      data: dataToUpdate,



    });




try {
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      cookies[key] = decodeURIComponent(value);
    });
  }
  const referer = req.headers.referer || '/admin/arrivals'
  const token = jwtDecode(cookies.authToken);
  eventBus.emit('ACTION', {
    type: "تحديث بيانات المغادرة الخارجية للطلب رقم " + createarrivallist.Order?.id,
    beneficiary: "homemaid",
    pageRoute: referer,
    actionType: "update",
    BeneficiaryId: createarrivallist.Order?.id || null,
    userId: Number((token as any).id),
  });
} catch (error) {
  console.error("Error emitting event:", error);
}











    try {
      const token = req.cookies?.authToken;
      let userId: string | null = null;

      if (token) {
        const decoded: any = jwt.verify(token, "rawaesecret");
        userId = decoded?.username;
      }

      await prisma.logs.create({
        data: {
          Status: `   تم تحديث بيانات الوصول  للطلب رقم ${createarrivallist.Order?.HomeMaid?.Name}  الى  ${createarrivallist.Order?.bookingstatus}  `,
          homemaidId: createarrivallist.Order?.HomemaidId,
          userId: userId,
        },
      });
    } catch (error) {
      console.error("Error updatin logs:", error);
    }

    res.status(200).json(createarrivallist);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
}
