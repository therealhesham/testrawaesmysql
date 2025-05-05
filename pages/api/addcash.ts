import prisma from "./globalprisma";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case "GET":
      try {
        const { month, transaction_type, year, userId } = req.query;
        const where = {};
        if (month) where.Month = parseInt(month);
        if (transaction_type) where.transaction_type = transaction_type;
        if (year) where.Year = year;

        // Fetch cash records
        const cashRecords = await prisma.cash.findMany({
          where,include:{cashLogs:true},
          orderBy: [{ Year: "asc" }, { Month: "asc" }],
        });

        // Calculate spent and remaining costs for each record
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
        const { amount, transaction_type, Month, Year, userId } = req.body;
        const existingCash = await prisma.cash.findFirst({
          where: { Month: Month.toString(), Year: Year, transaction_type },
        });
        if (existingCash) {
          return res.status(400).json({
            error: "يوجد سجل كاش بالفعل لهذا الشهر والسنة",
          });
        }
        const newCash = await prisma.cash.create({
          data: {
            amount: parseFloat(amount),
            transaction_type,
            Month: Month.toString(),
            Year,
          },
        });
try {
         const token = req.cookies?.authToken;
          let userId: string | null = null;
    
          if (token) {
            const decoded: any = jwt.verify(token, "rawaesecret");
            userId = decoded?.username;
          }
    
  // Log the creation action
        await prisma.cashLogs.create({
          data: {
            Status: 'تم اضافة كاش  بتاريخ ' + new Date().toLocaleDateString(),
            userId: userId || null,
            cashID: newCash.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

} catch (error) {
  console.log(error)
}
      
        res.status(201).json(newCash);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "فشل في إنشاء سجل الكاش" });
      }
      break;

    case "PUT":
      try {
        const { id, amount, transaction_type, Month, Year, userId } = req.body;
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
try {
         const token = req.cookies?.authToken;
          let userId: string | null = null;
    
          if (token) {
            const decoded: any = jwt.verify(token, "rawaesecret");
            userId = decoded?.username;
          }
   
        // Log the update action
        await prisma.cashLogs.create({
          data: {
            Status: 'تم تعديل الكاش  بتاريخ ' + new Date().toLocaleDateString(),
            userId: userId || null,
            cashID: updatedCash.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
  
} catch (error) {
  console.log(error)
}

        res.status(200).json(updatedCash);
      } catch (error) {
        res.status(500).json({ error: "Failed to update cash record" });
      }
      break;

    case "DELETE":
      try {
        const { id, userId } = req.query;
        if (!id) {
          return res.status(400).json({ error: "ID is required" });
        }

        // Fetch the cash record to log before deletion
        const cashRecord = await prisma.cash.findUnique({
          where: { id: parseInt(id) },
        });
console.log(cashRecord)
        if (!cashRecord) {
          return res.status(404).json({ error: "Cash record not found" });
        }

        await prisma.cash.delete({
          where: { id: parseInt(id) },
        });
try{
        // Log the deletion action
        const token = req.cookies?.authToken;
         let userId: string | null = null;
   
         if (token) {
           const decoded: any = jwt.verify(token, "rawaesecret");
           userId = decoded?.username;
         }
  
        await prisma.cashLogs.create({
          data: {
            Status: 'تم حذف كاش  بتاريخ ' + new Date().toLocaleDateString(),
            userId: userId || null,
            cashID: parseInt(id),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }catch(e){
console.log(e)

      }
        res.status(204).end();
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete cash record" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).json({ error: `Method ${method} Not Allowed` });
      break;
  }
}