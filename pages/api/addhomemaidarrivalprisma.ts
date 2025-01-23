import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

    console.log(req.body);

    // await prisma..
    const createarrivallist = await prisma.arrivallist.create({
      data: {
        SponsorName,
        InternalmusanedContract,
        // SponsorIdnumber,
        SponsorPhoneNumber,
        PassportNumber,
        KingdomentryDate: new Date(KingdomentryDate).toISOString(),
        // DayDate,
        WorkDuration,
        Cost,
        HomemaIdnumber,
        HomemaidName,
        Notes,
        ArrivalCity,
        DateOfApplication: new Date(DateOfApplication).toISOString(),
        MusanadDuration,
        ExternalDateLinking: new Date(ExternalDateLinking).toISOString(),
        ExternalOFficeApproval: new Date(ExternalOFficeApproval).toISOString(),
        AgencyDate: new Date(AgencyDate).toISOString(),
        EmbassySealing: new Date(EmbassySealing).toISOString(),
        BookinDate: new Date(BookinDate).toISOString(),
        GuaranteeDurationEnd: new Date(GuaranteeDurationEnd).toISOString(),
      },
    });
    res.status(200).json(createarrivallist);
  } catch (error) {
    console.log(error);
    res.status(301).send("createAdmin");

    // res.send("error")
  }
}
