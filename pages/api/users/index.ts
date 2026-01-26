import prisma from 'pages/api/globalprisma';
import bcrypt from "bcrypt";
import { jwtDecode } from 'jwt-decode';

export default async function handler(req: any, res: any) {
  const { method } = req;

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

  switch (method) {
    case 'GET':
      // Check View Permission
      if (!isOwner && !userPermissions?.['إدارة المستخدمين']?.['عرض']) {
        return res.status(403).json({ error: 'ليس لديك صلاحية لعرض المستخدمين' });
      }

      try {
        const { search, role, limit = 10, page = 1 } = req.query;

        // إعداد شرط البحث الديناميكي
        const where: any = {};

        if (search) {
          where.OR = [
            { username: { contains: search } },
            { phonenumber: { contains: search } },
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
      // Check Add Permission
      if (!isOwner && !userPermissions?.['إدارة المستخدمين']?.['إضافة']) {
        return res.status(403).json({ error: 'ليس لديك صلاحية لإضافة مستخدمين' });
      }

      try {
        const { username, phonenumber, idnumber, password, email, roleId, pictureurl } = req.body;
        
        const phoneNumberFind = await prisma.user.findUnique({
          where: {
            phonenumber: phonenumber,
          },
        });
        
        if(phoneNumberFind){
          return res.status(201).json({ error: 'رقم الهاتف مستخدم من قبل' ,type:"phoneNumber"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
          data: {
            username,
            phonenumber,
            idnumber: Number(idnumber),
            password: hashedPassword,
            email: email || null,
            roleId: Number(roleId),
            pictureurl: pictureurl || '',
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
