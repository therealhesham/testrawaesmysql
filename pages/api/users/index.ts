
import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt"
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
const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
          data: {
            username,
            phonenumber,
            idnumber: Number(idnumber),
            password: hashedPassword,
            roleId:Number(roleId),
            createdAt: new Date(),
          },
        });
        res.status(201).json(user);
      } catch (error) {
        console.log(error)  
        res.status(500).json({ error: 'Failed to create user' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}