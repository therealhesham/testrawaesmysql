import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { jwtDecode } from "jwt-decode";
import { getPageTitleArabic } from "lib/pageTitleHelper";

const prisma = new PrismaClient();

// Helper function to get user info from cookies
const getUserFromCookies = (req: NextApiRequest) => {
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
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
    try{
    await prisma.logs.create({
      data: {
Details:actionText,
reason:"مغادرة السكن",
Status:"مغادرة السكن",
      } 
    });

    }catch(error){
      console.error('❌ خطأ في حفظ السجل في logs:', error);
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // تسجيل عملية العرض في systemlogs
    const userInfo = getUserFromCookies(req);
    if (userInfo.userId) {
      await logToSystemLogs(
        userInfo.userId,
        'view',
        'عرض قائمة العاملات المغادرات',
        '',
        0,
        '/admin/housedarrivals'
      );
    }

    try {
      const { page = 1, sortKey, sortDirection, contractType } = req.query;
      const pageSize = 10;
      const pageNumber = parseInt(page as string, 10) || 1;

      let orderBy: any = { id: "desc" };
      if (sortKey) {
        switch (sortKey) {
          case "Name":
            orderBy = { Order: { Name: sortDirection || "asc" } };
            break;
          case "phone":
            orderBy = { Order: { phone: sortDirection || "asc" } };
            break;
          case "Details":
            orderBy = { Details: sortDirection || "asc" };
            break;
          case "Nationalitycopy":
            orderBy = { Order: { Nationalitycopy: sortDirection || "asc" } };
            break;
          default:
            orderBy = { id: "desc" };
        }
      }

      const filters: any = {
        deparatureHousingDate: { not: null },
      };

      // Add contract type filter if provided
      if (contractType) {
        filters.Order = {
          NewOrder: {
            some: {
              typeOfContract: contractType as string
            }
          }
        };
      }

      const housing = await prisma.housedworker.findMany({
        where: filters,
        include: { 
          Order: {
            include: {
              NewOrder: true
            }
          }
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: orderBy,
      });

      const totalCount = await prisma.housedworker.count({
        where: filters,
      });

      res.status(200).json({ 
        housing,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      });
    } catch (error) {
      console.error("Error fetching departed workers:", error);
      res.status(500).json({ error: "Error fetching departed workers" });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === "PUT") {
    console.log(req.body)
    try {
      // Get worker data before update
      const workerBeforeUpdate = await prisma.housedworker.findUnique({
        where: { id: Number(req.body.homeMaid) },
        include: {
          Order: {
            select: { Name: true }
          }
        }
      });

      // Fetch data 
        await prisma.housedworker.update({
          where: {id: Number(req.body.homeMaid) },
          data: {
            isActive: false,
            deparatureReason:req.body.deparatureReason ,
            deparatureHousingDate: req.body.deparatureHousingDate?new Date(req.body.deparatureHousingDate).toISOString():"",
            checkIns: {
              updateMany: {
                where: { isActive: true }, // Add appropriate conditions here
                data: { isActive: false },
              },
            },
          },
        });

        // تسجيل العملية في systemlogs
        const userInfo = getUserFromCookies(req);
        if (userInfo.userId && workerBeforeUpdate) {
          await logToSystemLogs(
            userInfo.userId,
            'update',
            `تسجيل مغادرة عاملة #${workerBeforeUpdate.homeMaid_id} - ${workerBeforeUpdate.Order?.Name || 'غير محدد'} - السبب: ${req.body.deparatureReason || 'غير محدد'}`,
            workerBeforeUpdate.Order?.Name || 'غير محدد',
            workerBeforeUpdate.homeMaid_id,
            '/admin/housedarrivals'
          );
        }

        res.status(201).json("sss");
      
    } catch (error) {
      console.error("Error updating data:", error);
      res.status(500).json({ error: "Error updating data" });
    } finally {
      // Disconnect Prisma Client regardless of success or failure
      await prisma.$disconnect();
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
