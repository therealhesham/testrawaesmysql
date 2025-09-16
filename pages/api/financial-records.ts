import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        search, 
        transferDate, 
        orderDate, 
        page = '1', 
        limit = '10' 
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause for filtering
      const where: any = {};

      if (search) {
        where.OR = [
          { clientName: { contains: search as string } },
          { transferNumber: { contains: search as string } },
          { nationality: { contains: search as string } },
          { workerName: { contains: search as string } }
        ];
      }

      if (transferDate) {
        where.transferDate = {
          gte: new Date(transferDate as string),
          lt: new Date(new Date(transferDate as string).getTime() + 24 * 60 * 60 * 1000)
        };
      }

      if (orderDate) {
        where.orderDate = {
          gte: new Date(orderDate as string),
          lt: new Date(new Date(orderDate as string).getTime() + 24 * 60 * 60 * 1000)
        };
      }

      // Fetch records from database with relations
      const [records, total] = await Promise.all([
        prisma.musanadFinancialRecord.findMany({
          where,
          include: {
            client: {
              select: {
                id: true,
                fullname: true,
                phonenumber: true
              }
            },
            office: {
              select: {
                id: true,
                office: true,
                Country: true
              }
            },
            order: {
              select: {
                id: true,
                ClientName: true,
                PhoneNumber: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limitNum
        }),
        prisma.musanadFinancialRecord.count({ where })
      ]);

      // Transform records to match the expected format
      const transformedRecords = records.map(record => ({
        id: record.id.toString(),
        clientName: record.clientName,
        officeName: record.officeName,
        nationality: record.nationality,
        orderDate: record.orderDate.toISOString().split('T')[0],
        transferNumber: record.transferNumber,
        transferDate: record.transferDate.toISOString().split('T')[0],
        revenue: parseFloat(record.revenue.toString()),
        expenses: parseFloat(record.expenses.toString()),
        net: parseFloat(record.netAmount.toString()),
        status: record.status,
        // Additional fields from relations
        clientId: record.clientId,
        officeId: record.officeId,
        orderId: record.orderId,
        workerName: record.workerName,
        notes: record.notes,
        createdBy: record.createdBy,
        updatedBy: record.updatedBy
      }));

      return res.status(200).json({
        records: transformedRecords,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      });

    } catch (error) {
      console.error('Error fetching financial records:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const {
        clientId,
        clientName,
        officeId,
        officeName,
        orderId,
        orderNumber,
        nationality,
        workerName,
        orderDate,
        transferDate,
        transferNumber,
        revenue,
        expenses,
        netAmount,
        status,
        notes,
        createdBy
      } = req.body;

      // Validate required fields
      if (!clientName || !officeName || !nationality || !transferNumber || !orderDate || !transferDate) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Create new financial record
      const newRecord = await prisma.musanadFinancialRecord.create({
        data: {
          clientId: clientId ? parseInt(clientId) : null,
          clientName,
          officeId: officeId ? parseInt(officeId) : null,
          officeName,
          orderId: orderId ? parseInt(orderId) : null,
          orderNumber,
          nationality,
          workerName,
          orderDate: new Date(orderDate),
          transferDate: new Date(transferDate),
          transferNumber,
          revenue: parseFloat(revenue) || 0,
          expenses: parseFloat(expenses) || 0,
          netAmount: parseFloat(netAmount) || 0,
          status: status || 'مكتمل',
          notes,
          createdBy
        },
        include: {
          client: {
            select: {
              id: true,
              fullname: true,
              phonenumber: true
            }
          },
          office: {
            select: {
              id: true,
              office: true,
              Country: true
            }
          },
          order: {
            select: {
              id: true,
              ClientName: true,
              PhoneNumber: true
            }
          }
        }
      });

      // Transform the response
      const transformedRecord = {
        id: newRecord.id.toString(),
        clientName: newRecord.clientName,
        officeName: newRecord.officeName,
        nationality: newRecord.nationality,
        orderDate: newRecord.orderDate.toISOString().split('T')[0],
        transferNumber: newRecord.transferNumber,
        transferDate: newRecord.transferDate.toISOString().split('T')[0],
        revenue: parseFloat(newRecord.revenue.toString()),
        expenses: parseFloat(newRecord.expenses.toString()),
        net: parseFloat(newRecord.netAmount.toString()),
        status: newRecord.status
      };

      return res.status(201).json({
        message: 'Financial record created successfully',
        record: transformedRecord
      });

    } catch (error) {
      console.error('Error creating financial record:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  else if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({ message: 'Record ID is required' });
      }

      // Remove fields that shouldn't be updated directly
      const { id: _, createdAt, ...allowedUpdates } = updateData;

      // Convert date strings to Date objects if present
      if (allowedUpdates.orderDate) {
        allowedUpdates.orderDate = new Date(allowedUpdates.orderDate);
      }
      if (allowedUpdates.transferDate) {
        allowedUpdates.transferDate = new Date(allowedUpdates.transferDate);
      }

      // Convert numeric fields
      if (allowedUpdates.revenue) {
        allowedUpdates.revenue = parseFloat(allowedUpdates.revenue);
      }
      if (allowedUpdates.expenses) {
        allowedUpdates.expenses = parseFloat(allowedUpdates.expenses);
      }
      if (allowedUpdates.netAmount) {
        allowedUpdates.netAmount = parseFloat(allowedUpdates.netAmount);
      }

      const updatedRecord = await prisma.musanadFinancialRecord.update({
        where: { id: parseInt(id as string) },
        data: allowedUpdates,
        include: {
          client: {
            select: {
              id: true,
              fullname: true,
              phonenumber: true
            }
          },
          office: {
            select: {
              id: true,
              office: true,
              Country: true
            }
          },
          order: {
            select: {
              id: true,
              ClientName: true,
              PhoneNumber: true
            }
          }
        }
      });

      // Transform the response
      const transformedRecord = {
        id: updatedRecord.id.toString(),
        clientName: updatedRecord.clientName,
        officeName: updatedRecord.officeName,
        nationality: updatedRecord.nationality,
        orderDate: updatedRecord.orderDate.toISOString().split('T')[0],
        transferNumber: updatedRecord.transferNumber,
        transferDate: updatedRecord.transferDate.toISOString().split('T')[0],
        revenue: parseFloat(updatedRecord.revenue.toString()),
        expenses: parseFloat(updatedRecord.expenses.toString()),
        net: parseFloat(updatedRecord.netAmount.toString()),
        status: updatedRecord.status
      };

      return res.status(200).json({
        message: 'Financial record updated successfully',
        record: transformedRecord
      });

    } catch (error) {
      console.error('Error updating financial record:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ message: 'Record ID is required' });
      }

      await prisma.musanadFinancialRecord.delete({
        where: { id: parseInt(id as string) }
      });

      return res.status(200).json({
        message: 'Financial record deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting financial record:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
