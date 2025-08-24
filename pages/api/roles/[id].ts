import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const role = await prisma.role.findUnique({
          where: { id: parseInt(id) },
        });
        if (!role) {
          return res.status(404).json({ error: 'Role not found' });
        }
        res.status(200).json(role);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch role' });
      }
      break;

    case 'PUT':
      try {
        const { name, permissions } = req.body;
        const role = await prisma.role.update({
          where: { id: parseInt(id) },
          data: {
            name,
            permissions,
            updatedAt: new Date(),
          },
        });
        res.status(200).json(role);
      } catch (error) {
        res.status(500).json({ error: 'Failed to update role' });
      }
      break;

    case 'DELETE':
      try {
        await prisma.role.delete({
          where: { id: parseInt(id) },
        });
        res.status(204).end();
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete role' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}