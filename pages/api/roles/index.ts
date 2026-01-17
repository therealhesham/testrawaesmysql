import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const roles = await prisma.role.findMany({
          orderBy: [
            { order: 'asc' },
            { id: 'asc' }, // في حالة عدم وجود order، نرتب حسب id
          ],
        });
        res.status(200).json(roles);
      } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Failed to fetch roles' });
      } finally {
        await prisma.$disconnect();
      }
      break;

    case 'POST':
      try {
        const { name, permissions } = req.body;
        
        // جلب آخر order من الأدوار الموجودة
        const lastRole = await prisma.role.findFirst({
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        
        // حساب order الجديد (آخر order + 1، أو 1 إذا لم يكن هناك أدوار)
        const newOrder = lastRole?.order ? lastRole.order + 1 : 1;
        
        const role = await prisma.role.create({
          data: {
            name,
            permissions,
            order: newOrder,
            createdAt: new Date(),
          },
        });
        res.status(201).json(role);
      } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Failed to create role' });
      } finally {
        await prisma.$disconnect();
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}