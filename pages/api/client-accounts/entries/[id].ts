import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const entry = await prisma.clientAccountEntry.findUnique({
        where: {
          id: Number(id)
        },
        include: {
          statement: {
            include: {
              client: {
                select: {
                  id: true,
                  fullname: true
                }
              }
            }
          }
        }
      });

      if (!entry) {
        return res.status(404).json({ error: 'Client account entry not found' });
      }

      res.status(200).json(entry);
    } catch (error) {
      console.error('Error fetching client account entry:', error);
      res.status(500).json({ error: 'Failed to fetch client account entry' });
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        date,
        description,
        debit,
        credit,
        balance,
        entryType
      } = req.body;

      const entry = await prisma.clientAccountEntry.update({
        where: {
          id: Number(id)
        },
        data: {
          date: new Date(date),
          description,
          debit: Number(debit),
          credit: Number(credit),
          balance: Number(balance),
          entryType
        },
        include: {
          statement: {
            include: {
              client: {
                select: {
                  id: true,
                  fullname: true
                }
              }
            }
          }
        }
      });

      res.status(200).json(entry);
    } catch (error) {
      console.error('Error updating client account entry:', error);
      res.status(500).json({ error: 'Failed to update client account entry' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.clientAccountEntry.delete({
        where: {
          id: Number(id)
        }
      });

      res.status(200).json({ message: 'Client account entry deleted successfully' });
    } catch (error) {
      console.error('Error deleting client account entry:', error);
      res.status(500).json({ error: 'Failed to delete client account entry' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

