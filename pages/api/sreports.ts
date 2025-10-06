import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { title, rating, orderId, Discription } = req.body;

      // Validate required fields
      if (!orderId) {
        return res.status(400).json({ error: 'orderId is required' });
      }

      // Create a new report
      const report = await prisma.reports.create({
        data: {
          title: title || null,
          rating: rating || null,
          clientId: parseInt(orderId),
          Discription: Discription || null,
        },
      });

      return res.status(201).json({ message: 'Report created successfully', report });
    } catch (error) {
      console.error('Error creating report:', error);
      return res.status(500).json({ error: 'Failed to create report' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}