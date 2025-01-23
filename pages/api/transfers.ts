import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const {
      client,
      mobilenumber,
      nationalidnumber,
      passportnumber,
      homemaid,
      nationality,
      kingdomentrydate,
      daydate,
      workduration,
      newclientname,
      newclientmobilenumber,
      newclientnationalidnumber,
      newclientcity,
      experimentstart,
      experimentend,
      dealcost,
      paid,
      restofpaid,
      experimentresult,
      accomaditionnumber,
      marketeername,
      notes,
    } = req.body;
    console.log(req.body);
    // Validate the request body (you can improve this with more robust validation)
    if (
      !client ||
      !mobilenumber ||
      !nationalidnumber ||
      !passportnumber ||
      !homemaid ||
      !nationality ||
      !kingdomentrydate ||
      !daydate ||
      !workduration ||
      !newclientname ||
      !newclientmobilenumber ||
      !newclientnationalidnumber ||
      !newclientcity ||
      !experimentstart ||
      !experimentend ||
      !dealcost ||
      !paid ||
      !restofpaid ||
      !experimentresult ||
      !accomaditionnumber ||
      !marketeername ||
      !notes
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }

    try {
      // Create a new transfer record in the database using Prisma
      const newTransfer = await prisma.transfer.create({
        data: {
          client,
          mobilenumber,
          nationalidnumber,
          passportnumber,
          homemaid,
          nationality,
          kingdomentrydate,
          daydate: new Date(daydate), // Ensure it's a Date object
          workduration,
          newclientname,
          newclientmobilenumber,
          newclientnationalidnumber,
          newclientcity,
          experimentstart,
          experimentend,
          dealcost,
          paid,
          restofpaid,
          experimentresult,
          accomaditionnumber,
          marketeername,
          notes,
        },
      });

      // Return the newly created transfer record
      return res.status(201).json(newTransfer);
    } catch (error) {
      console.error("Error creating transfer:", error);
      return res.status(500).json({ error: "Failed to create transfer" });
    } finally {
      // Ensure Prisma disconnects after handling the request
      await prisma.$disconnect();
    }
  } else {
    // Handle unsupported HTTP methods
    return res.status(405).json({ error: "Method not allowed" });
  }
}
