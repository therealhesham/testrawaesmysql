import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Handle GET request - Retrieve all inHouseLocations
  if (req.method === 'GET') {
    try {
       // Fetch all locations
        const locations = await prisma.inHouseLocation.findMany({
        select: {
          id: true,
          location: true,
          quantity: true, // Total capacity
          housedWorkers: {
            where: {
              deparatureHousingDate:null
              // isActive: true, // Only count active housed workers
            },
            select: {
              id: true,
            },
          },
        },
      });

      // Map locations to include total capacity and current occupancy
      const result = locations.map((location) => ({
        id: location.id,
        location: location.location,
        quantity: location.quantity, // Total capacity
        currentOccupancy: location.housedWorkers.length, // Number of active housed workers
      }));

console.log(result)
      res.status(200).json(result);
    } catch (error) {
      console.log(error)
      res.status(500).json({ error: 'Error fetching locations', details: error.message });
    }
  }
  // Handle POST request - Create new inHouseLocation
  else if (req.method === 'POST') {
    try {
      const { location ,quantity} = req.body;
      
      // Validate required fields
      if (!location) {
        return res.status(400).json({ error: 'location is required' });
      }

      const newLocation = await prisma.inHouseLocation.create({
        data: {quantity,
          location,
        },
        include: {
          housedWorkers: {
            select: {
              id: true,
            }
          }
        }
      });
      res.status(201).json(newLocation);
    } catch (error) {
      res.status(500).json({ error: 'Error creating location', details: error.message });
    }
  }
  // Handle unsupported methods
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}