import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log(req.body);

    // await prisma..
    const createAdmin = await prisma.arrivallist.create({
      data: {
        clientname: req.body.ClientName,
        contactnumber: req.body.clientphonenumber,
        cost: req.body.cost,
        homemaidnumber: req.body.PhoneNumber,
        clientnameinenglishlanguage: req.body.ClientName,
        internalmusanedContract: req.body.internalmusanad,
        kingdomentrydate: req.body.kingdomentrydate,
        nationalidnumber: req.body.nationalidnumber,
        notes: req.body.notes,
        passportnumber: req.body.Passportnumber,
        workduration: req.body.workduration,
      },
    });
    res.status(200).send(createAdmin);
  } catch (error) {
    console.log(error);
    res.status(301).send("createAdmin");

    // res.send("error")
  }
}
