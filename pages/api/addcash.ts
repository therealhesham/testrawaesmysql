import prisma from "./globalprisma";

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case "GET":
      try {
        const { month, transaction_type, year } = req.query;
        const where = {};
        if (month) where.Month = parseInt(month);
        if (transaction_type) where.transaction_type = transaction_type;
        if (year) where.Year = year;

        // جلب سجلات الكاش
        const cashRecords = await prisma.cash.findMany({
          where,
          orderBy: [{ Year: "asc" }, { Month: "asc" }],
        });

        // حساب التكاليف المصروفة والمتبقية لكل سجل
        const result = await Promise.all(
          cashRecords.map(async (cash) => {
            const checkIns = await prisma.checkIn.findMany({
              where: {
                CheckDate: {
                  gte: new Date(`${cash.Year}-${cash.Month}-01`),
                  lt: new Date(
                    new Date(`${cash.Year}-${cash.Month}-01`).setMonth(
                      new Date(`${cash.Year}-${cash.Month}-01`).getMonth() + 1
                    )
                  ),
                },
              },
              select: { DailyCost: true },
            });

            const totalSpent = checkIns.reduce(
              (sum, checkIn) => sum + (Number(checkIn.DailyCost) || 0),
              0
            );

            const remaining = Number(cash.amount) - totalSpent;

            return {
              ...cash,
              spent: totalSpent,
              remaining: remaining >= 0 ? remaining : 0,
            };
          })
        );

        res.status(200).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch cash records" });
      }
      break;

    case "POST":
      try {
        const { amount, transaction_type, Month, Year } = req.body;
        const existingCash = await prisma.cash.findFirst({
          where: { Month:Month.toString(), Year:Year, transaction_type },
        });
        if (existingCash) {
          return res.status(400).json({
            error: "يوجد سجل كاش بالفعل لهذا الشهر والسنة",
          });
        }
        const newCash = await prisma.cash.create({
          data: {
            amount: parseFloat(amount),
            // transaction_type,
            Month:Month.toString( ),
            Year,
          },
        });
        res.status(201).json(newCash);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "فشل في إنشاء سجل الكاش" });
      }
      break;

    case "PUT":
      try {
        const { id, amount, transaction_type, Month, Year } = req.body;
        if (!id) {
          return res.status(400).json({ error: "ID is required" });
        }
        const updatedCash = await prisma.cash.update({
          where: { id: parseInt(id) },
          data: {
            amount: amount ? parseFloat(amount) : undefined,
            transaction_type,
            Month,
            Year,
          },
        });
        res.status(200).json(updatedCash);
      } catch (error) {
        res.status(500).json({ error: "Failed to update cash record" });
      }
      break;

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