import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const users = await prisma.user.findMany({
          include: { role: true },
        });
        console.log(users)
        res.status(200).json(users);
      } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Failed to fetch users' });
      }
      break;

    case 'POST':
      try {
        const { username, phonenumber, idnumber, password, roleId } = req.body;
        const user = await prisma.user.create({
          data: {
            username,
            phonenumber,
            idnumber,
            password,
            roleId,
            createdAt: new Date(),
          },
        });
        res.status(201).json(user);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}