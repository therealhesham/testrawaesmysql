import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
export default async function handler(req:NextApiRequest, res:NextApiResponse) {
  const { id } = req.query as { id: string };
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
        // console.log(user);
        res.status(200).json(user);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
      }
      break;

    case 'PUT':
      try {
        const { username, phonenumber, idnumber, password, roleId, pictureurl } = req.body;
        console.log(id)
        const userFinder = await prisma.user.findUnique({
          where: { id: parseInt(id) },
        });
        console.log(userFinder?.roleId)
        const user = await prisma.user.update({
          where: { id: parseInt(id) },
          data: {
             username:username ? username : userFinder?.username  ,
            phonenumber:phonenumber ? phonenumber : userFinder?.phonenumber  ,
            pictureurl:pictureurl ? pictureurl : userFinder?.pictureurl  ,
            idnumber:userFinder?.idnumber  ,
            password:password ? await bcrypt.hash(password, 10) : userFinder?.password  ,
            roleId: roleId ? parseInt(roleId) : userFinder?.roleId  ,
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
        console.log(error)
        res.status(500).json({ error: 'Failed to delete user' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}