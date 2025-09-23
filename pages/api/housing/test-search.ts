import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { search } = req.query;

    if (!search || typeof search !== 'string') {
      return res.status(400).json({ message: 'Search term is required' });
    }

    console.log('Searching for:', search);

    // Simple search - just get all homemaids first
    const allHomemaids = await prisma.homemaid.findMany({
      take: 20,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Total homemaids in database: ${allHomemaids.length}`);

    // Now search with filters
    const homemaids = await prisma.homemaid.findMany({
      where: {
        OR: [
          { id: parseInt(search) || undefined },
          { Name: { contains: search, mode: 'insensitive' } },
          { Passportnumber: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${homemaids.length} workers for search: "${search}"`);

    // Format the response
    const formattedHomemaids = homemaids.map(worker => ({
      id: worker.id,
      name: worker.Name,
      nationality: worker.Nationalitycopy,
      passportNumber: worker.Passportnumber,
      phone: worker.phone,
      age: worker.age,
      bookingstatus: worker.bookingstatus
    }));

    res.status(200).json({
      success: true,
      homemaids: formattedHomemaids,
      count: homemaids.length,
      searchTerm: search,
      totalInDB: allHomemaids.length
    });

  } catch (error) {
    console.error('Error in test search:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error in test search',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
