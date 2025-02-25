import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      console.log(req.query);

      // Function to calculate remaining balance
      async function calculateRemainingBalanceRaw() {
        const result = await prisma.$queryRaw`
  WITH transaction_with_balance AS (
  SELECT
    t.order_id,
    SUM(CASE WHEN t.transaction_type = 'creditor' THEN t.amount ELSE 0 END) AS cumulative_creditor,
    SUM(CASE WHEN t.transaction_type = 'debtor' THEN t.amount ELSE 0 END) AS cumulative_debtor
  FROM transactions t
  GROUP BY t.order_id  -- Grouping by order_id (or any other column you need)
)
SELECT 
  (SELECT SUM(cumulative_creditor) FROM transaction_with_balance) - 
  (SELECT SUM(cumulative_debtor) FROM transaction_with_balance) AS remaining_balance
FROM transaction_with_balance
LIMIT 1;
    `;
        return result;
      }

      // Call to calculate the remaining balance
      const transactionsWithBalance = await calculateRemainingBalanceRaw();
      console.log(transactionsWithBalance);

      // Return the result as JSON
      res.status(200).json(transactionsWithBalance);
    } else if (req.method === "POST") {
      // Handle POST request for creating a new transaction
      try {
        const { order_id, amount, transaction_type, details } = req.body;

        if (!order_id || !amount || !transaction_type || !details) {
          return res.status(400).json({ message: "Missing required fields" });
        }

        const newTransaction = await prisma.transactions.create({
          data: {
            order_id: Number(order_id),
            amount: amount,
            transaction_type: transaction_type,
            Details: details,
          },
        });

        console.log(newTransaction);
        res.status(201).json(newTransaction);
      } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Error creating transaction" });
      }
    } else {
      res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
}
