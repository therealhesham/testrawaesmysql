import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        res.status(200).json(user);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
      } finally {
        await prisma.$disconnect();
      }
      break;

    case 'PUT':
      try {
        const { 
          username, 
          phonenumber, 
          email, 
          roleId, 
          pictureurl,
          currentPassword, 
          newPassword 
        } = req.body;

        console.log("🔍 Update Request for User ID:", id);

        const userFinder = await prisma.user.findUnique({
          where: { id: parseInt(id) },
        });

        if (!userFinder) {
          return res.status(404).json({ error: 'User not found' });
        }

        let updatedPassword = userFinder.password;

        // منطق تغيير كلمة المرور
        if (newPassword) {
          if (!currentPassword) {
            return res.status(400).json({ error: 'يرجى إدخال كلمة المرور الحالية لتغيير كلمة المرور' });
          }

         

          // 1. محاولة المقارنة كـ Hash (الوضع الطبيعي)
          let isPasswordValid = await bcrypt.compare(currentPassword, userFinder.password);
          // isPasswordValid = true; // 🔴 تجاوز الفحص إجبارياً لإصلاح الهاش الفاسد

          // 2. (إصلاح مؤقت) إذا فشل الهاش، نجرب مقارنة نص عادي (في حال تم إدخال اليوزر يدوياً)
          if (!isPasswordValid && currentPassword === userFinder.password) {
             console.log("⚠️ Warning: Password matched as plain text! Updating to hash now.");
             isPasswordValid = true;
          }

          if (!isPasswordValid) {
            
            return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
          }

          
          updatedPassword = await bcrypt.hash(newPassword, 10);
        }

        const user = await prisma.user.update({
          where: { id: parseInt(id) },
          data: {
            username: username || userFinder.username,
            phonenumber: phonenumber || userFinder.phonenumber,
            pictureurl: pictureurl !== undefined ? pictureurl : userFinder.pictureurl,
            email: email !== undefined ? email : userFinder.email,
            idnumber: userFinder.idnumber,
            password: updatedPassword, // سيتم حفظ الباسورد الجديد المشفر
            roleId: roleId ? parseInt(roleId) : userFinder.roleId,
            updatedAt: new Date(),
          },
        });

        res.status(200).json(user);
      } catch (error) {
        console.error("SERVER ERROR:", error);
        res.status(500).json({ error: 'Failed to update user' });
      } finally {
        await prisma.$disconnect();
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

        const userToDelete = await prisma.user.findUnique({
          where: { id: parseInt(id) },
        });

        await prisma.user.delete({
          where: { id: parseInt(id) },
        });

        // تسجيل الحدث
        if (userToDelete && userId) {
          eventBus.emit('ACTION', {
            type: `حذف مستخدم #${id} - ${userToDelete.username || 'غير محدد'}`,
            actionType: 'delete',
            userId: userId,
          });
        }

        res.status(204).end();
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to delete user' });
      } finally {
        await prisma.$disconnect();
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}