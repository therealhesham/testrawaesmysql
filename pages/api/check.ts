import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { month, year } = req.body;

  if (!month || !year) {
    return res.status(400).json({ error: 'Month and year are required' });
  }

  try {
    console.log(month)
    const cashRecord = await prisma.cash.findFirst({
      where: { Month: month.toString(), Year: year },
    });

    return res.status(200).json({ amount: cashRecord ? cashRecord.amount : 0 });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
