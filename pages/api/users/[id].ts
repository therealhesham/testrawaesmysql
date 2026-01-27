import prisma from 'pages/api/globalprisma';
import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const { method } = req;
  const userId = parseInt(id);

  // 1. Authentication Check
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie: string) => {
      const [key, value] = cookie.trim().split('=');
      cookies[key] = decodeURIComponent(value);
    });
  }

  if (!cookies.authToken) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً' });
  }

  let currentUser;
  try {
    const token = jwtDecode(cookies.authToken) as any;
    currentUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });
  } catch (error) {
    return res.status(401).json({ error: 'رمز الدخول غير صالح' });
  }

  if (!currentUser) {
    return res.status(401).json({ error: 'المستخدم غير موجود' });
  }

  const userPermissions = currentUser.role?.permissions as any;
  const isOwner = currentUser.role?.name?.toLowerCase() === 'owner';
  const isSelf = currentUser.id === userId;

  switch (method) {
    case 'GET':
      // Allow if: Owner OR Self OR Has 'View' permission
      if (!isOwner && !isSelf && !userPermissions?.['إدارة المستخدمين']?.['عرض']) {
        return res.status(403).json({ error: 'غير مصرح لك بعرض بيانات هذا المستخدم' });
      }

      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
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
        const targetUser = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        const isTargetOwner = targetUser.role?.name?.toLowerCase() === 'owner';

        let canEdit = false;
        if (isOwner) canEdit = true;
        else if (isSelf) canEdit = true;
        else if (userPermissions?.['إدارة المستخدمين']?.['تعديل']) {
          // Can edit others, but NOT owner (unless you are owner, handled above)
          if (!isTargetOwner) canEdit = true;
        }

        if (!canEdit) {
          return res.status(403).json({ error: 'غير مصرح لك بتعديل بيانات هذا المستخدم' });
        }

        const { 
          username, 
          phonenumber, 
          email, 
          roleId, 
          pictureurl,
          currentPassword, 
          newPassword,
          idnumber
        } = req.body;

        console.log("🔍 Update Request for User ID:", id);

        let updatedPassword = targetUser.password;

        // منطق تغيير كلمة المرور
        if (newPassword) {
          // إذا كان المستخدم يعدل نفسه، يجب إدخال كلمة المرور الحالية
          if (isSelf && !isOwner) { // Owner can reset password without current password? Maybe. Assuming stricter for self.
             if (!currentPassword) {
                return res.status(400).json({ error: 'يرجى إدخال كلمة المرور الحالية لتغيير كلمة المرور' });
             }

             let isPasswordValid = await bcrypt.compare(currentPassword, targetUser.password);
             
             // (إصلاح مؤقت) إذا فشل الهاش، نجرب مقارنة نص عادي
             if (!isPasswordValid && currentPassword === targetUser.password) {
                 console.log("⚠️ Warning: Password matched as plain text! Updating to hash now.");
                 isPasswordValid = true;
             }
   
             if (!isPasswordValid) {
               return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
             }
          }
          // If admin resets password for another user, current password is not required.
          
          updatedPassword = await bcrypt.hash(newPassword, 10);
        }

        const user = await prisma.user.update({
          where: { id: userId },
          data: {
            username: username || targetUser.username,
            phonenumber: phonenumber || targetUser.phonenumber,
            pictureurl: pictureurl !== undefined ? pictureurl : targetUser.pictureurl,
            email: email !== undefined ? email : targetUser.email,
            idnumber: idnumber ? parseInt(idnumber) : targetUser.idnumber, // Parse as Int
            password: updatedPassword, 
            roleId: roleId ? parseInt(roleId) : targetUser.roleId,
            updatedAt: new Date(),
          },
        });

        res.status(200).json(user);
      } catch (error) {
        console.error("SERVER ERROR:", error);
        res.status(500).json({ error: 'Failed to update user' });
      }
      break;

    case 'DELETE':
      try {
        const targetUserForDelete = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
        if (!targetUserForDelete) return res.status(404).json({ error: 'User not found' });
        
        const isTargetOwnerDel = targetUserForDelete.role?.name?.toLowerCase() === 'owner';

        let canDelete = false;
        if (isOwner) canDelete = true;
        else if (userPermissions?.['إدارة المستخدمين']?.['حذف']) {
            if (!isTargetOwnerDel) canDelete = true;
        }

        if (!canDelete) {
           return res.status(403).json({ error: 'غير مصرح لك بحذف هذا المستخدم' });
        }

        await prisma.user.delete({
          where: { id: userId },
        });

        // تسجيل الحدث
        eventBus.emit('ACTION', {
          type: `حذف مستخدم #${id} - ${targetUserForDelete.username || 'غير محدد'}`,
          actionType: 'delete',
          userId: currentUser.id,
        });

        res.status(204).end();
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to delete user' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}