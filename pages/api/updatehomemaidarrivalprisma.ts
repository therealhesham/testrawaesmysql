import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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
      DateOfApplication,
      MusanadDuration,
      ExternalDateLinking,
      ExternalOFficeApproval,
      AgencyDate,
      EmbassySealing,
      BookinDate,
      GuaranteeDurationEnd,
    } = req.body;

    console.log(req.body); // Log the request body for debugging

    // Apply `excludeNullFields` if you want to ensure null or undefined fields are excluded from the update
    const dataToUpdate = excludeEmptyFields({
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
      ArrivalCity,
      MusanadDuration,
      ExternalDateLinking,
      ExternalOFficeApproval,
      AgencyDate,
      EmbassySealing,
      BookinDate,
      GuaranteeDurationEnd,
    });

    // Prisma update query
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
