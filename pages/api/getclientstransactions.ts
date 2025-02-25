import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method == "GET") {
      console.log(req.query);
      // دالة لحساب الرصيد المتبقي بناءً على استعلام SQL
      async function calculateRemainingBalanceRaw(
        customerId: number,
        homeMaidId: number
      ) {
        // alert(customerId + "" + homeMaidId);
        const result = await prisma.$queryRaw`
        WITH transaction_with_balance AS (
          SELECT
            t.transaction_id,
            t.order_id,
            t.amount,
            t.Details,
            t.transaction_type,
            t.transaction_date,
            SUM(CASE WHEN transaction_type = 'creditor' THEN amount ELSE 0 END) 
              OVER (PARTITION BY order_id ORDER BY transaction_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_creditor,
            SUM(CASE WHEN transaction_type = 'debtor' THEN amount ELSE 0 END) 
              OVER (PARTITION BY order_id ORDER BY transaction_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_debtor
          FROM transactions t
          WHERE order_id = ${homeMaidId}
        )
        SELECT 
          t.transaction_id,
          t.order_id,
          t.amount,
          t.Details,
          t.transaction_type,
          t.transaction_date,
          t.cumulative_creditor - t.cumulative_debtor AS remaining_balance
        FROM transaction_with_balance t 
        ORDER BY transaction_date;
      `;
        return result;
      }

      // استدعاء الدالة لحساب الرصيد المتبقي للزبون برقم 1
      const transactionsWithBalance = await calculateRemainingBalanceRaw(
        Number(req.query.customerId),
        Number(req.query.homemaidId)
      );
      console.log(transactionsWithBalance);
      // إرجاع النتيجة كـ JSON
      res.status(200).json(transactionsWithBalance);
    } else {
      try {
        const newclause = await prisma.transactions.create({
          data: {
            order_id: Number(req.body.order_id),
            amount: req.body.amount,
            transaction_type: req.body.transaction_type,
            Details: req.body.details,
            transaction_date: new Date(req.body.date).toISOString(),
          },
        });

        res.status(200).json(newclause);
      } catch (e) {
        console.log(e);
      }
    }
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
}
