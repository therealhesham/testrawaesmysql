import jwt from "jsonwebtoken";
import prisma from "./globalprisma";


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, month, year, userId } = req.body;

  if (!amount || !month || !year) {
    return res.status(400).json({ error: 'Amount, month, and year are required' });
  }

  try {
    let cashRecord = await prisma.cash.findFirst({
      where: { Month: month.toString(), Year: year },
    });

    let logStatus;
    let cashRecordId;

    if (cashRecord) {
      cashRecord = await prisma.cash.update({
        where: { id: cashRecord.id },
        data: {
          amount: { increment: parseFloat(amount) },
          updatedAt: new Date(),
        },
      });
      logStatus = 'UPDATED';
      cashRecordId = cashRecord.id;
    } else {
      cashRecord = await prisma.cash.create({
        data: {
          amount: parseFloat(amount),
          transaction_type: 'ADD',
          Month: month.toString(),
          Year: year,
        },
      });
      logStatus = 'CREATED';
      cashRecordId = cashRecord.id;
    }
try {
        const token = req.cookies?.authToken;
        let userId: string | null = null;
  
        if (token) {
          const decoded: any = jwt.verify(token, "rawaesecret");
          userId = decoded?.username;
        }
  
  
    // Create a log entry
    await prisma.cashLogs.create({
      data: {
        Status: "تم اضافة كاش  بتاريخ " + new Date().toLocaleDateString(),
        userId: userId || null,
        cashID: cashRecordId,
      },
    });
  
} catch (error) {
console.log(error)  
}

    return res.status(200).json({ message: 'Amount added successfully', cashRecord });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}