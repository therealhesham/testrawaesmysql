import { PrismaClient } from '@prisma/client';
import { jwtDecode } from 'jwt-decode';
import { getPageTitleArabic } from 'lib/pageTitleHelper';

const prisma = new PrismaClient();

// Helper function to get user info from cookies
const getUserFromCookies = (req: any) => {
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie: any) => {
      const [key, value] = cookie.trim().split("=");
      cookies[key] = decodeURIComponent(value);
    });
  }
  
  if (cookies.authToken) {
    try {
      const token = jwtDecode(cookies.authToken) as any;
      return { userId: Number(token.id), username: token.username || 'غير محدد' };
    } catch (error) {
      console.error('Error decoding token:', error);
      return { userId: null, username: 'غير محدد' };
    }
  }
  
  return { userId: null, username: 'غير محدد' };
};

// دالة مساعدة لحفظ التعديلات في systemUserLogs
async function logToSystemLogs(
  userId: number,
  actionType: string,
  action: string,
  beneficiary: string,
  beneficiaryId: number,
  pageRoute: string
) {
  try {
    // الحصول على عنوان الصفحة بالعربي
    const pageTitle = getPageTitleArabic(pageRoute);
    
    // إضافة عنوان الصفحة إلى action إذا كان موجوداً
    let actionText = action || '';
    if (pageTitle && actionText) {
      actionText = `${pageTitle} - ${actionText}`;
    } else if (pageTitle) {
      actionText = pageTitle;
    }
    
    await prisma.systemUserLogs.create({
      data: {
        userId,
        actionType,
        action: actionText,
        beneficiary,
        BeneficiaryId: beneficiaryId,
        pageRoute,
        details: pageTitle || null,
      } as any,
    });
    console.log('✅ تم حفظ السجل في systemUserLogs:', actionText);
  } catch (error) {
    console.error('❌ خطأ في حفظ السجل في systemUserLogs:', error);
  }
}

export default async function handler(req, res) {
  // Handle GET request - Retrieve all inHouseLocations
  if (req.method === 'GET') {
    // تسجيل عملية العرض في systemlogs
    const userInfo = getUserFromCookies(req);
    if (userInfo.userId) {
      await logToSystemLogs(
        userInfo.userId,
        'view',
        'عرض قائمة السكن',
        '',
        0,
        '/admin/housedarrivals'
      );
    }

    try {
       // Fetch all locations
        const locations = await prisma.inHouseLocation.findMany({
        select: {
          id: true,
          location: true,
          quantity: true, // Total capacity
          housedWorkers: {
            where: {
              deparatureHousingDate:null
              // isActive: true, // Only count active housed workers
            },
            select: {
              id: true,
            },
          },
        },
      });

      // Map locations to include total capacity and current occupancy
      const result = locations.map((location) => ({
        id: location.id,
        location: location.location,
        quantity: location.quantity, // Total capacity
        currentOccupancy: location.housedWorkers.length, // Number of active housed workers
      }));

console.log(result)
      res.status(200).json(result);
    } catch (error) {
      console.log(error)
      res.status(500).json({ error: 'Error fetching locations', details: error.message });
    }
  }
  // Handle POST request - Create new inHouseLocation
  else if (req.method === 'POST') {
    try {
      const { location ,quantity} = req.body;
      
      // Validate required fields
      if (!location) {
        return res.status(400).json({ error: 'location is required' });
      }

      const newLocation = await prisma.inHouseLocation.create({
        data: {quantity,
          location,
        },
        include: {
          housedWorkers: {
            select: {
              id: true,
            }
          }
        }
      });

      // تسجيل العملية في systemlogs
      const userInfo = getUserFromCookies(req);
      if (userInfo.userId) {
        await logToSystemLogs(
          userInfo.userId,
          'create',
          `إضافة سكن جديد: ${location} - السعة: ${quantity}`,
          location,
          newLocation.id,
          '/admin/housedarrivals'
        );
      }

      res.status(201).json(newLocation);
    } catch (error) {
      res.status(500).json({ error: 'Error creating location', details: error.message });
    }
  }
  // Handle unsupported methods
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}