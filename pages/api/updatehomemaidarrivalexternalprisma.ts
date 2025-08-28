import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
import jwt from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  function excludeEmptyFields(obj) {
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
      DeparatureFromSaudiDate,
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
      DeparatureFromSaudiCity,
      
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
    const validDeparatureFromSaudiDate = DeparatureFromSaudiDate
      ? new Date(DeparatureFromSaudiDate).toISOString()
      : null;
    const validfinalDestinationDate = finalDestinationDate
      ? new Date(finalDestinationDate).toISOString()
      : null;

    const ss = {
      finaldestination,
      deparatureTime,
      finalDestinationTime,
      finalDestinationDate: validfinalDestinationDate,
      DeparatureFromSaudiDate: validDeparatureFromSaudiDate,
      KingdomentryDate: validKingdomEntryDate,
      HomemaIdnumber,
      DeliveryDate: validDeliveryDate,
      notes: Notes,
      DeparatureFromSaudiCity,
      ticketFile,
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
