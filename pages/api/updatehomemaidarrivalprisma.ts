import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
import jwt from "jsonwebtoken";

// import {getPrismaClient} from "../../utils/prisma";
// prisma

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
      KingdomentryDate,
      HomemaIdnumber,
      Notes,
      id,
      ArrivalCity,
      ticketFile,
      deparatureDate,
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
      BookinDate,internalReason,
      bookingstatus,
      DeliveryFile,
      DeliveryDate,
      externalmusanedContract,
      GuaranteeDurationEnd,
      // الحقول الجديدة للمغادرة الداخلية
      internaldeparatureCity,
      internaldeparatureDate,
      internaldeparatureTime,
      internalArrivalCity,
      internalArrivalCityDate,
      internalArrivalCityTime,
      internalTicketFile,
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
    const validBookinDate = BookinDate
      ? new Date(BookinDate).toISOString()
      : null;

    const validKingdomEntryDate = KingdomentryDate
      ? new Date(KingdomentryDate).toISOString()
      : null;
    const validDeliveryDate = DeliveryDate
      ? new Date(DeliveryDate).toISOString()
      : null;
    const validDeparatureDate = deparatureDate
      ? new Date(deparatureDate).toISOString()
      : null;
    const validInternalArrivalCityDate = internalArrivalCityDate
      ? new Date(internalArrivalCityDate).toISOString()
      : null;

    // معالجة التواريخ الجديدة للمغادرة الداخلية
    const validInternalDeparatureDate = internaldeparatureDate
      ? new Date(internaldeparatureDate).toISOString()
      : null;
console.log(internalReason)

    const ss = {
      finaldestination,
      internaldeparatureTime,
      internalArrivalCityTime,
      internaldeparatureDate: validInternalDeparatureDate,
      KingdomentryDate: validKingdomEntryDate,
      HomemaIdnumber,
      DeliveryDate: validDeliveryDate,
      notes:Notes,
      ticketFile,
      externalOfficeStatus,
      externalmusanadcontractfile,
      additionalfiles,
      internalReason,
      externalmusanedContract: validexternalmusanedContract,
      MusanadDuration,
      ExternalDateLinking: validExternalDateLinking,
      ExternalOFficeApproval: VALIDExternalOFficeApproval,
      AgencyDate: validAgencyDate,
      EmbassySealing: validEmbassySealing,
      BookinDate: validBookinDate,
      GuaranteeDurationEnd: validGuaranteeDurationEnd,
      // الحقول الجديدة للمغادرة الداخلية
      internaldeparatureCity,
      internalArrivalCityDate:validInternalArrivalCityDate,
      internalArrivalCity,
      internalTicketFile,
    };

    // Apply `excludeEmptyFields` to filter out empty fields from the object
    const dataToUpdate = excludeEmptyFields(ss);
console.log("dataToUpdate",req.body.internalTicketFile)
    await prisma.neworder.update({
      where: { id: Orderid },
      data: { bookingstatus },
    });


    console.log("Data to update:", {id,Orderid}); // Log the final data to be updated
    const createarrivallist = await prisma.arrivallist.update({
      include: { Order: { include: { HomeMaid: true } } },
      where: { id :id},
      data: dataToUpdate,
    });

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
