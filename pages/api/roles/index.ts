import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const roles = await prisma.role.findMany();
        res.status(200).json(roles);
      } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Failed to fetch roles' });
      }
      break;

    case 'POST':
      try {
        const { name, permissions } = req.body;
        const role = await prisma.role.create({
          data: {
            name,
            permissions,
            createdAt: new Date(),
          },
        });
        res.status(201).json(role);
      } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Failed to create role' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}