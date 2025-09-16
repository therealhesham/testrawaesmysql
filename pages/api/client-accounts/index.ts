import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        office, 
        client, 
        fromDate, 
        toDate,
        page = 1,
        limit = 10
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {};
      
      if (office && office !== 'all') {
        where.officeName = office;
      }
      
      if (client && client !== 'all') {
        where.clientId = Number(client);
      }
      
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) {
          where.createdAt.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.createdAt.lte = new Date(toDate as string);
        }
      }

      // Get client account statements with pagination
      const [statements, total] = await Promise.all([
        prisma.clientAccountStatement.findMany({
          where,
          include: {
            client: {
              select: {
                id: true,
                fullname: true,
                phonenumber: true,
                nationalId: true
              }
            },
            entries: {
              orderBy: {
                date: 'desc'
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: Number(limit)
        }),
        prisma.clientAccountStatement.count({ where })
      ]);

      // Calculate summary totals
      const summary = await prisma.clientAccountStatement.aggregate({
        where,
        _sum: {
          totalRevenue: true,
          totalExpenses: true,
          netAmount: true
        }
      });

      // Get unique offices for filter dropdown
      const offices = await prisma.clientAccountStatement.findMany({
        select: {
          officeName: true
        },
        distinct: ['officeName']
      });

      // Get unique clients for filter dropdown
      const clients = await prisma.client.findMany({
        select: {
          id: true,
          fullname: true
        },
        where: {
          accountStatements: {
            some: {}
          }
        }
      });

      res.status(200).json({
        statements,
        summary: {
          totalRevenue: summary._sum.totalRevenue || 0,
          totalExpenses: summary._sum.totalExpenses || 0,
          netAmount: summary._sum.netAmount || 0
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        filters: {
          offices: offices.map(o => o.officeName).filter(Boolean),
          clients
        }
      });

    } catch (error) {
      console.error('Error fetching client accounts:', error);
      res.status(500).json({ error: 'Failed to fetch client accounts' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        clientId,
        contractNumber,
        officeName,
        totalRevenue,
        totalExpenses,
        netAmount,
        contractStatus,
        notes
      } = req.body;

      const statement = await prisma.clientAccountStatement.create({
        data: {
          clientId: Number(clientId),
          contractNumber,
          officeName,
          totalRevenue: Number(totalRevenue),
          totalExpenses: Number(totalExpenses),
          netAmount: Number(netAmount),
          contractStatus,
          notes
        },
        include: {
          client: {
            select: {
              id: true,
              fullname: true,
              phonenumber: true,
              nationalId: true
            }
          }
        }
      });

      res.status(201).json(statement);
    } catch (error) {
      console.error('Error creating client account statement:', error);
      res.status(500).json({ error: 'Failed to create client account statement' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

