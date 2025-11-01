import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;
  
  // Handle PUT request - Update inHouseLocation
  if (req.method === 'PUT') {
    try {
      const { location, quantity } = req.body;
      
      // Validate required fields
      if (!location) {
        return res.status(400).json({ error: 'location is required' });
      }

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'Valid location ID is required' });
      }

      // Check if location exists
      const existingLocation = await prisma.inHouseLocation.findUnique({
        where: { id: Number(id) },
        include: {
          housedWorkers: {
            where: {
              deparatureHousingDate: null
            },
            select: {
              id: true,
            }
          }
        }
      });

      if (!existingLocation) {
        return res.status(404).json({ error: 'Location not found' });
      }

      // Validate that new quantity is not less than current occupancy
      const currentOccupancy = existingLocation.housedWorkers.length;
      if (quantity !== undefined && quantity < currentOccupancy) {
        return res.status(400).json({ 
          error: `السعة الجديدة لا يمكن أن تكون أقل من العدد الحالي للمقيمين (${currentOccupancy})` 
        });
      }

      // Update the location
      const updatedLocation = await prisma.inHouseLocation.update({
        where: { id: Number(id) },
        data: {
          location,
          ...(quantity !== undefined && { quantity: Number(quantity) }),
        },
        include: {
          housedWorkers: {
            where: {
              deparatureHousingDate: null
            },
            select: {
              id: true,
            }
          }
        }
      });

      res.status(200).json({
        id: updatedLocation.id,
        location: updatedLocation.location,
        quantity: updatedLocation.quantity,
        currentOccupancy: updatedLocation.housedWorkers.length,
      });
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ error: 'Error updating location', details: error.message });
    }
  }
  // Handle unsupported methods
  else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

