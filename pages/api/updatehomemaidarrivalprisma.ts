import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

// import {getPrismaClient} from "../../utils/prisma";
// prisma

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
      visaNumber,
      finaldestination,
      deparatureTime,
      finalDestinationDate,
      SponsorName,
      InternalmusanedContract,
      SponsorIdnumber,
      SponsorPhoneNumber,
      PassportNumber,
      KingdomentryDate,
      DayDate,
      WorkDuration,
      Cost,
      HomemaIdnumber,
      HomemaidName,
      Notes,
      id,
      ArrivalCity,
      medicalCheckFile,
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
      office,
      KingdomentryTime,
      nationalidNumber,
      finalDestinationTime,
      Orderid,
      EmbassySealing,
      BookinDate,
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
    const validfinalDestinationDate = finalDestinationDate
      ? new Date(finalDestinationDate).toISOString()
      : null;

    console.log(validDeparatureDate);

    console.log(validKingdomEntryDate);
    const ss = {
      finaldestination,
      deparatureTime,
      SponsorName,
      visaNumber,
      finalDestinationTime,
      KingdomentryTime,
      finalDestinationDate: validfinalDestinationDate,
      InternalmusanedContract,
      SponsorIdnumber,
      nationalidNumber,
      deparatureDate: validDeparatureDate,
      SponsorPhoneNumber,
      PassportNumber,
      KingdomentryDate: validKingdomEntryDate,
      DayDate,
      WorkDuration,
      Cost,
      DeliveryFile,
      HomemaIdnumber,
      ExternalStatusByoffice,
      DeliveryDate: validDeliveryDate,
      HomemaidName,
      Notes,
      medicalCheckFile,
      ticketFile,
      receivingFile,
      approvalPayment,
      externalOfficeStatus,
      externalmusanadcontractfile,
      additionalfiles,
      ArrivalCity,
      office,
      externalOfficeFile,
      externalmusanedContract: validexternalmusanedContract,
      MusanadDuration,
      ExternalDateLinking: validExternalDateLinking,
      ExternalOFficeApproval: VALIDExternalOFficeApproval,
      AgencyDate: validAgencyDate,
      EmbassySealing: validEmbassySealing,
      BookinDate: validBookinDate,
      GuaranteeDurationEnd: validGuaranteeDurationEnd,
    };

    // Apply `excludeEmptyFields` to filter out empty fields from the object
    const dataToUpdate = excludeEmptyFields(ss);

    // Prisma update queries
    await prisma.neworder.update({
      where: { id: Orderid },
      data: { bookingstatus },
    });

    const createarrivallist = await prisma.arrivallist.update({
      where: { id },
      data: dataToUpdate,
    });

    res.status(200).json(createarrivallist);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
}
