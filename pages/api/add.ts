import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, month, year } = req.body;

  if (!amount || !month || !year) {
    return res.status(400).json({ error: 'Amount, month, and year are required' });
  }

  try {
    let cashRecord = await prisma.cash.findFirst({
      where: { Month: month.toString(), Year: year },
    });

    if (cashRecord) {
      cashRecord = await prisma.cash.update({
        where: { id: cashRecord.id },
        data: {
          amount: { increment: parseFloat(amount) },
          updatedAt: new Date(),
        },
      });
    } else {
      cashRecord = await prisma.cash.create({
        data: {
          amount: parseFloat(amount),
          transaction_type: 'ADD',
          Month: month.toString(),
          Year: year,
        },
      });
    }

    return res.status(200).json({ message: 'Amount added successfully', cashRecord });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
