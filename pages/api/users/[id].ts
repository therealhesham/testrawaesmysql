import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const user = await prisma.user.findUnique({
          where: { id: parseInt(id) },
          include: { role: true },
        });
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
      }
      break;

    case 'PUT':
      try {
        const { username, phonenumber, idnumber, password, roleId } = req.body;
        const user = await prisma.user.update({
          where: { id: parseInt(id) },
          data: {
            username,
            phonenumber,
            idnumber,
            password,
            roleId: roleId ? parseInt(roleId) : null  ,
            updatedAt: new Date(),
          },
        });
        res.status(200).json(user);
      } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Failed to update user' });
      }
      break;

    case 'DELETE':
      try {
        await prisma.user.delete({
          where: { id: parseInt(id) },
        });
        res.status(204).end();
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}