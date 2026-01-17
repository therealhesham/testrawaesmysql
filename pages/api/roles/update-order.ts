import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const { roles } = req.body;

    if (!Array.isArray(roles)) {
      return res.status(400).json({ error: 'roles must be an array' });
    }

    // تحديث ترتيب جميع الأدوار
    const updatePromises = roles.map((role: { id: number; order: number }) =>
      prisma.role.update({
        where: { id: role.id },
        data: { order: role.order },
      })
    );

    await Promise.all(updatePromises);

    res.status(200).json({ success: true, message: 'تم تحديث ترتيب الأدوار بنجاح' });
  } catch (error) {
    console.error('Error updating roles order:', error);
    res.status(500).json({ error: 'Failed to update roles order' });
  } finally {
    await prisma.$disconnect();
  }
}

