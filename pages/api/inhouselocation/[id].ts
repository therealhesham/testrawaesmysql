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
  // Handle DELETE request - Delete inHouseLocation
  else if (req.method === 'DELETE') {
    try {
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'Valid location ID is required' });
      }

      // Check if location exists and get current occupancy
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

      // Check if there are active workers in this location
      const currentOccupancy = existingLocation.housedWorkers.length;
      if (currentOccupancy > 0) {
        return res.status(400).json({ 
          error: `لا يمكن حذف السكن لأنه يحتوي على ${currentOccupancy} عاملة مسكنة. يرجى نقل العاملات أولاً.` 
        });
      }

      // Delete the location
      await prisma.inHouseLocation.delete({
        where: { id: Number(id) }
      });

      res.status(200).json({ message: 'تم حذف السكن بنجاح' });
    } catch (error) {
      console.error('Error deleting location:', error);
      res.status(500).json({ error: 'Error deleting location', details: error.message });
    }
  }
  // Handle unsupported methods
  else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

