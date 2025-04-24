import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    // Get all cash records or filter by query parameters
    case "GET":
      try {
        const { month, transaction_type } = req.query;
        const where = {};
        if (month) where.Month = month;
        if (transaction_type) where.transaction_type = transaction_type;

        const cashRecords = await prisma.cash.findMany({ where });
        res.status(200).json(cashRecords);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch cash records" });
      }
      break;

    // Create a new cash record
    case "POST":
      try {
        const { amount, transaction_type, Month, Year } = req.body;

        // Check if there's already a record for the same month and year
        const existingCash = await prisma.cash.findFirst({
          where: {
            Month,
            Year,
            transaction_type,
          },
        });
        console.log(existingCash);
        if (existingCash) {
          return res.status(400).json({
            error: "يوجد سجل كاش بالفعل لهذا الشهر والسنة",
          });
        }

        const newCash = await prisma.cash.create({
          data: {
            amount: parseFloat(amount),
            transaction_type,
            Month,
            Year,
          },
        });

        res.status(201).json(newCash);
      } catch (error) {
        res.status(500).json({ error: "فشل في إنشاء سجل الكاش" });
      }
      break;

    // Update an existing cash record
    case "PUT":
      try {
        const { id, amount, transaction_type, Month } = req.body;
        if (!id) {
          return res.status(400).json({ error: "ID is required" });
        }
        const updatedCash = await prisma.cash.update({
          where: { id: parseInt(id) },
          data: {
            amount: amount ? parseFloat(amount) : undefined,
            transaction_type,
            Month,
          },
        });
        res.status(200).json(updatedCash);
      } catch (error) {
        res.status(500).json({ error: "Failed to update cash record" });
      }
      break;

    // Delete a cash record
    case "DELETE":
      try {
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: "ID is required" });
        }
        await prisma.cash.delete({
          where: { id: parseInt(id) },
        });
        res.status(204).end();
      } catch (error) {
        res.status(500).json({ error: "Failed to delete cash record" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).json({ error: `Method ${method} Not Allowed` });
      break;
  }
}
