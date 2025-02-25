import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Perform the update operation
    const updatedTransaction = await prisma.transactions.update({
      where: {
        transaction_id: req.body.id,
      },
      data: {
        amount: req.body.amount,
        transaction_type: req.body.transaction_type,
        Details: req.body.details,
      },
    });

    // Send the updated transaction back in the response
    res.status(200).json(updatedTransaction);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
}
