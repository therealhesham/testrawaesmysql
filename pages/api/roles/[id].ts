import { PrismaClient } from '@prisma/client';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';

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
        const cookieHeader = req.headers.cookie;
        
        let userId: number | null = null;

        if (cookieHeader) {
          try {
            const cookies: { [key: string]: string } = {};
            cookieHeader.split(";").forEach((cookie) => {
              const [key, value] = cookie.trim().split("=");
              cookies[key] = decodeURIComponent(value);
            });
            if (cookies.authToken) {
              const token = jwtDecode(cookies.authToken) as any;
              userId = Number(token.id);
            }
          } catch (e) {
            // Ignore token errors
          }
        }
// console.log(userId)
const findeRole = await prisma.user.findFirst({where:{id:Number(userId)},select:{role:true}})
const roleUpdated = await prisma.role.findFirst({where:{id:parseInt(id)}})
console.log(findeRole?.role?.order, roleUpdated?.order)
if(findeRole?.role?.order > roleUpdated?.order || findeRole?.role?.order == roleUpdated?.order) { // افضل ترتيب هو اقل رقم
  return res.status(404).json({ error: 'لا يمكن تحديث رتبة أعلى او رتبتك' });
}
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
        console.log(error)
        res.status(500).json({ error: 'Failed to update role' });
      }
      break;

    case 'DELETE':
      try {
        // Get user info for logging
        const cookieHeader = req.headers.cookie;
        let userId: number | null = null;
        if (cookieHeader) {
          try {
            const cookies: { [key: string]: string } = {};
            cookieHeader.split(";").forEach((cookie) => {
              const [key, value] = cookie.trim().split("=");
              cookies[key] = decodeURIComponent(value);
            });
            if (cookies.authToken) {
              const token = jwtDecode(cookies.authToken) as any;
              userId = Number(token.id);
            }
          } catch (e) {
            // Ignore token errors
          }
        }
const findeRole = await prisma.user.findFirst({where:{id:Number(userId)},select:{role:true}})
if(!(findeRole?.role?.permissions as any)["إدارة الصلاحيات"] || !(findeRole?.role?.permissions as any)["إدارة الصلاحيات"]["حذف"]) {
console.log("ليس لديك صلاحية لحذف الدور")
  return res.status(404).json({ error: 'ليس لديك صلاحية لحذف الدور' });
}

        const role = await prisma.role.findUnique({
          where: { id: parseInt(id) },
        });

        await prisma.role.delete({
          where: { id: parseInt(id) },
        });

        // تسجيل الحدث
        if (role && userId) {
          eventBus.emit('ACTION', {
            type: `حذف دور #${id} - ${role.name || 'غير محدد'}`,
            actionType: 'delete',
            userId: userId,
          });
        }

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