import 'lib/loggers'; // استدعاء loggers.ts في بداية التطبيق
import { NextApiRequest, NextApiResponse } from 'next';

import { PrismaClient } from '@prisma/client';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';

const prisma = new PrismaClient();

// Helper function to get user info from cookies
const getUserFromCookies = (req: NextApiRequest) => {
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      cookies[key] = decodeURIComponent(value);
    });
  }
  
  if (cookies.authToken) {
    try {
      const token = jwtDecode(cookies.authToken) as any;
      return { userId: Number(token.id), username: token.username };
    } catch (error) {
      console.error('Error decoding token:', error);
      return { userId: null, username: 'غير محدد' };
    }
  }
  
  return { userId: null, username: 'غير محدد' };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        office, 
        client, 
        fromDate, 
        toDate,
        page = 1,
        limit = 10,
        contractType
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

      // If contractType provided, filter by related order type
      const orderFilter = contractType
        ? { order: { typeOfContract: String(contractType) } }
        : {};

      // Ensure we only query statements with valid clients to avoid null relation errors
      // If a specific clientId is already set, verify it exists, otherwise filter by valid IDs
      const finalWhere: any = {
        ...where,
        ...orderFilter
      };

      // If no specific client filter is set, get valid client IDs and filter by them
      if (!where.clientId) {
        const validClientIds = await prisma.client.findMany({
          select: { id: true }
        }).then(clients => clients.map(c => c.id));
        
        if (validClientIds.length > 0) {
          finalWhere.clientId = { in: validClientIds };
        } else {
          // No valid clients exist, return empty results
          finalWhere.clientId = -1; // This will match nothing
        }
      } else {
        // Verify the specific client exists
        const clientExists = await prisma.client.findUnique({
          where: { id: where.clientId },
          select: { id: true }
        });
        
        if (!clientExists) {
          // Requested client doesn't exist, return empty results
          finalWhere.clientId = -1; // This will match nothing
        }
      }

      // Get client account statements with pagination
      const [statements, total] = await Promise.all([
        prisma.clientAccountStatement.findMany({
          where: finalWhere,
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
        prisma.clientAccountStatement.count({ where: finalWhere })
      ]);

      // Calculate summary totals
      const summary = await prisma.clientAccountStatement.aggregate({
        where: finalWhere,
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
    } finally {
      await prisma.$disconnect();
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

      // Get user info for logging
      const { userId } = getUserFromCookies(req);

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
      
      // Log accounting action
      try {
        await prisma.accountSystemLogs.create({
          data: {
            action: `إنشاء حساب عميل جديد - رقم العقد: ${contractNumber}`,
            actionType: 'create_client_account',
            actionStatus: 'success',
            actionClientId: Number(clientId),
            actionUserId: userId,
            actionAmount: Number(netAmount),
            actionNotes: `إنشاء حساب عميل - الإيرادات: ${totalRevenue}، المصروفات: ${totalExpenses}، الصافي: ${netAmount}${officeName ? ` - المكتب: ${officeName}` : ''}`,
          }
        });
      } catch (error) {
        console.error('Error creating account system log:', error);
      }
    } catch (error) {
      console.error('Error creating client account statement:', error);
      res.status(500).json({ error: 'Failed to create client account statement' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

