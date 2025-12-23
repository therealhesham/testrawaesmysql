import { PrismaClient } from '@prisma/client';
import eventBus from 'lib/eventBus';
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
  const { id } = req.query;
  
  // Handle PUT request - Update inHouseLocation
  if (req.method === 'PUT') {
    try {
      const { location, quantity } = req.body;
      
      // Validate required fields
      if (!location) {
        return res.status(400).json({ error: 'location is required' });
      }

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'Valid location ID is required' });
      }

      // Check if location exists
      const existingLocation = await prisma.inHouseLocation.findUnique({
        where: { id: Number(id) },
        include: {
          housedWorkers: {
            where: {
              deparatureHousingDate: null
            },
            select: {
              id: true,
            }
          }
        }
      });

      if (!existingLocation) {
        return res.status(404).json({ error: 'Location not found' });
      }

      // Validate that new quantity is not less than current occupancy
      const currentOccupancy = existingLocation.housedWorkers.length;
      if (quantity !== undefined && quantity < currentOccupancy) {
        return res.status(400).json({ 
          error: `السعة الجديدة لا يمكن أن تكون أقل من العدد الحالي للمقيمين (${currentOccupancy})` 
        });
      }

      // Update the location
      const updatedLocation = await prisma.inHouseLocation.update({
        where: { id: Number(id) },
        data: {
          location,
          ...(quantity !== undefined && { quantity: Number(quantity) }),
        },
        include: {
          housedWorkers: {
            where: {
              deparatureHousingDate: null
            },
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
          'update',
          `تعديل سكن #${updatedLocation.id}: ${updatedLocation.location} - السعة: ${updatedLocation.quantity}`,
          updatedLocation.location,
          updatedLocation.id,
          '/admin/housedarrivals'
        );
      }

      res.status(200).json({
        id: updatedLocation.id,
        location: updatedLocation.location,
        quantity: updatedLocation.quantity,
        currentOccupancy: updatedLocation.housedWorkers.length,
      });
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ error: 'Error updating location', details: error.message });
    }
  }
  // Handle DELETE request - Delete inHouseLocation
  else if (req.method === 'DELETE') {
    try {
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'Valid location ID is required' });
      }

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

      // Check if location exists and get current occupancy
      const existingLocation = await prisma.inHouseLocation.findUnique({
        where: { id: Number(id) },
        include: {
          housedWorkers: {
            where: {
              deparatureHousingDate: null
            },
            select: {
              id: true,
            }
          }
        }
      });

      if (!existingLocation) {
        return res.status(404).json({ error: 'Location not found' });
      }

      // Check if there are active workers in this location
      const currentOccupancy = existingLocation.housedWorkers.length;
      if (currentOccupancy > 0) {
        return res.status(400).json({ 
          error: `لا يمكن حذف السكن لأنه يحتوي على ${currentOccupancy} عاملة مسكنة. يرجى نقل العاملات أولاً.` 
        });
      }

      // Delete the location
      await prisma.inHouseLocation.delete({
        where: { id: Number(id) }
      });

      // تسجيل الحدث في systemlogs
      if (userId) {
        await logToSystemLogs(
          userId,
          'delete',
          `حذف سكن #${id}: ${existingLocation.location || 'غير محدد'}`,
          existingLocation.location || 'غير محدد',
          Number(id),
          '/admin/housedarrivals'
        );
      }

      res.status(200).json({ message: 'تم حذف السكن بنجاح' });
    } catch (error) {
      console.error('Error deleting location:', error);
      res.status(500).json({ error: 'Error deleting location', details: error.message });
    }
  }
  // Handle unsupported methods
  else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

