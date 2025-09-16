import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const statement = await prisma.clientAccountStatement.findUnique({
        where: {
          id: Number(id)
        },
        include: {
          client: {
            select: {
              id: true,
              fullname: true,
              phonenumber: true,
              nationalId: true,
              city: true,
              address: true,
              createdAt: true
            }
          },
          entries: {
            orderBy: {
              date: 'desc'
            }
          }
        }
      });

      if (!statement) {
        return res.status(404).json({ error: 'Client account statement not found' });
      }

      res.status(200).json(statement);
    } catch (error) {
      console.error('Error fetching client account statement:', error);
      res.status(500).json({ error: 'Failed to fetch client account statement' });
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        contractNumber,
        officeName,
        totalRevenue,
        totalExpenses,
        netAmount,
        contractStatus,
        notes
      } = req.body;

      const statement = await prisma.clientAccountStatement.update({
        where: {
          id: Number(id)
        },
        data: {
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

      res.status(200).json(statement);
    } catch (error) {
      console.error('Error updating client account statement:', error);
      res.status(500).json({ error: 'Failed to update client account statement' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.clientAccountStatement.delete({
        where: {
          id: Number(id)
        }
      });

      res.status(200).json({ message: 'Client account statement deleted successfully' });
    } catch (error) {
      console.error('Error deleting client account statement:', error);
      res.status(500).json({ error: 'Failed to delete client account statement' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

