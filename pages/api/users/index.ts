import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt";
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { search, role, limit = 10, page = 1 } = req.query;

        // إعداد شرط البحث الديناميكي
        const where = {};

        if (search) {
          where.OR = [
            { username: { contains: search,  } },
            { phonenumber: { contains: search,  } },
            // { idnumber: { contains: search,  } },
          ];
        }

        if (role) {
          where.roleId = Number(role);
        }

        const users = await prisma.user.findMany({
          include: { role: true },
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.user.count({ where });

        res.status(200).json({
          data: users,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        console.log(error);
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
            roleId: Number(roleId),
            createdAt: new Date(),
          },
        });

        res.status(201).json(user);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to create user' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
