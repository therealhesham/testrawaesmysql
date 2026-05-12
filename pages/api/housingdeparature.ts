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
    const deparatureReasonFilter =
      typeof req.query.deparatureReason === 'string' ? req.query.deparatureReason.trim() : '';

    const userInfo = getUserFromCookies(req);
    if (userInfo.userId) {
      await logToSystemLogs(
        userInfo.userId,
        'view',
        deparatureReasonFilter
          ? `عرض عاملات غادرن السكن (سبب المغادرة: ${deparatureReasonFilter})`
          : 'عرض قائمة العاملات المغادرات',
        '',
        0,
        deparatureReasonFilter
          ? '/admin/housing_departed_transfer_sponsorship'
          : '/admin/housedarrivals'
      );
    }

    try {
      const { 
        page = 1, 
        sortKey, 
        sortDirection, 
        contractType,
        Name,
        Passportnumber,
        id,
        location,
        houseentrydate,
        reason
      } = req.query;
      const pageSize = 10;
      const pageNumber = parseInt(page as string, 10) || 1;

      // Global search string
      const searchString = (Name as string) || (Passportnumber as string) || "";

      const orderFilters: any = searchString || id || contractType
        ? {
            ...(searchString && {
              OR: [
                { Name: { contains: searchString } },
                { Passportnumber: { contains: searchString } },
                { phone: { contains: searchString } },
                { NewOrder: { some: { ClientName: { contains: searchString } } } },
                { NewOrder: { some: { client: { fullname: { contains: searchString } } } } },
              ]
            }),
            ...(id && { id: { equals: Number(id) } }),
            ...(contractType && {
              NewOrder: {
                some: { typeOfContract: contractType as string },
              },
            }),
          }
        : undefined;

      const filters: any = {
        deparatureHousingDate: { not: null },
        ...(deparatureReasonFilter && { deparatureReason: deparatureReasonFilter }),
        ...(location && { location_id: { equals: Number(location) } }),
        ...(houseentrydate && { houseentrydate: { equals: new Date(houseentrydate as string) } }),
        ...(reason && { deparatureReason: { contains: reason as string } }),
        OR: [
          orderFilters
            ? { homeMaid_id: { not: null }, Order: orderFilters }
            : { homeMaid_id: { not: null } },
          {
            externalHomedmaidId: { not: null },
            ...((contractType || searchString) && {
              externalHomedmaid: {
                ...(contractType && { type: contractType as string }),
                ...(searchString && {
                  OR: [
                    { name: { contains: searchString } },
                    { passportNumber: { contains: searchString } },
                    { phone: { contains: searchString } },
                    { Client: { fullname: { contains: searchString } } },
                  ]
                }),
              },
            }),
          },
        ],
      };

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

      const housing = await prisma.housedworker.findMany({
        where: filters,
        include: {
          Order: {
            include: {
              office: true,
              NewOrder: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  clientID: true,
                  arrivals: { select: { KingdomentryDate: true, KingdomentryTime: true, DeliveryDate: true, GuaranteeDurationEnd: true } },
                  typeOfContract: true,
                  ClientName: true,
                  createdAt: true,
                  client: { select: { id: true, fullname: true } },
                },
              },
            },
          },
          externalHomedmaid: {
            include: {
              Client: { select: { id: true, fullname: true } },
            },
          },
          HousedWorkerNotes: true,
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
      const transferSponsorshipData =
        req.body.deparatureReason === 'نقل الكفالة' && req.body.transferSponsorshipData
          ? req.body.transferSponsorshipData
          : null;

const updateData =        await prisma.housedworker.update({
          where: {id: Number(req.body.homeMaid) },
          data: {
            isActive: false,
            deparatureReason:req.body.deparatureReason ,
            deparatureHousingDate: req.body.deparatureHousingDate?new Date(req.body.deparatureHousingDate).toISOString():"",
            transferSponsorshipData,
            checkIns: {
              updateMany: {
                where: { isActive: true }, // Add appropriate conditions here
                data: { isActive: false },
              },
            },
          } as any,
        });

      // ✅ نقل الكفالة: حفظ بيانات الكفيل الجديد في جدول العملاء (Client)
      // وإنشاء معاملة في جدول transferSponsorShips
      if (
        req.body.deparatureReason === 'نقل الكفالة' &&
        transferSponsorshipData &&
        updateData.homeMaid_id
      ) {
        try {
          const tsd = transferSponsorshipData as any;

          // 1) جلب العميل القديم (الكفيل الحالي) من علاقات housedworker
          const workerWithRelations = await prisma.housedworker.findUnique({
            where: { id: Number(req.body.homeMaid) },
            include: {
              Order: {
                include: {
                  NewOrder: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { clientID: true },
                  },
                },
              },
              externalHomedmaid: { select: { clientId: true } },
            },
          });

          let oldClientId: number | null = null;
          if (workerWithRelations?.externalHomedmaid?.clientId) {
            oldClientId = workerWithRelations.externalHomedmaid.clientId;
          } else if (workerWithRelations?.Order?.NewOrder?.[0]?.clientID) {
            oldClientId = workerWithRelations.Order.NewOrder[0].clientID;
          }

          // 2) إيجاد أو إنشاء الكفيل الجديد في جدول Client
          //    نحاول أولًا المطابقة بالهوية الوطنية ثم برقم الجوال
          let newClient: { id: number } | null = null;

          if (tsd.newSponsorId) {
            newClient = await prisma.client.findFirst({
              where: { nationalId: String(tsd.newSponsorId) },
              select: { id: true },
            });
          }

          if (!newClient && tsd.newSponsorPhone) {
            newClient = await prisma.client.findFirst({
              where: { phonenumber: String(tsd.newSponsorPhone) },
              select: { id: true },
            });
          }

          if (!newClient) {
            try {
              const created = await prisma.client.create({
                data: {
                  fullname: tsd.newSponsorName || null,
                  phonenumber: tsd.newSponsorPhone || null,
                  nationalId: tsd.newSponsorId || null,
                  Source: 'نقل الكفالة',
                } as any,
              });
              newClient = { id: created.id };
            } catch (createErr) {
              // قد يفشل بسبب unique constraint على phonenumber/email — نحاول إعادة المطابقة
              console.error('Client.create failed, retrying lookup:', createErr);
              if (tsd.newSponsorPhone) {
                newClient = await prisma.client.findFirst({
                  where: { phonenumber: String(tsd.newSponsorPhone) },
                  select: { id: true },
                });
              }
            }
          }

          // 3) إنشاء معاملة في transferSponsorShips
          if (newClient && oldClientId) {
            const trialPeriodDescription =
              tsd.trialPeriodType === 'month'
                ? 'شهر'
                : tsd.trialPeriodDays
                  ? `${tsd.trialPeriodDays} يوم`
                  : null;

            const notesPayload = JSON.stringify({
              newSponsorDateOfBirth: tsd.newSponsorDateOfBirth || null,
              financialAbilityAttachment: tsd.financialAbilityAttachment || null,
              bankCertificateAttachment: tsd.bankCertificateAttachment || null,
              medicalCheckValid: tsd.medicalCheckValid || null,
              sponsorHasViolations: tsd.sponsorHasViolations || null,
              sponsorHasWorkers: tsd.sponsorHasWorkers || null,
              sponsorWorkerCount: tsd.sponsorWorkerCount || null,
              amountPaid: tsd.amountPaid || null,
              originalSponsorGuaranteeEndDate:
                tsd.originalSponsorGuaranteeEndDate || null,
              trialDailyCost: tsd.trialDailyCost || null,
            });

            try {
              await prisma.transferSponsorShips.create({
                data: {
                  HomeMaidId: Number(updateData.homeMaid_id),
                  NewClientId: newClient.id,
                  OldClientId: oldClientId,
                  Cost: tsd.trialDailyCost ? Number(tsd.trialDailyCost) : null,
                  Paid: tsd.paidAmount ? Number(tsd.paidAmount) : null,
                  ExperimentDuration: trialPeriodDescription,
                  ExperimentStart: tsd.trialStartDate
                    ? new Date(tsd.trialStartDate)
                    : null,
                  ExperimentEnd: tsd.trialEndDate
                    ? new Date(tsd.trialEndDate)
                    : null,
                  EntryDate: req.body.deparatureHousingDate
                    ? new Date(req.body.deparatureHousingDate)
                    : null,
                  NationalID: tsd.newSponsorId || null,
                  Notes: notesPayload,
                  file:
                    tsd.financialAbilityAttachment ||
                    tsd.bankCertificateAttachment ||
                    null,
                  transferStage: 'في المرحلة التجريبية',
                  TransferingDate: req.body.deparatureHousingDate || null,
                },
              });
            } catch (transferErr) {
              console.error(
                '❌ خطأ في إنشاء معاملة transferSponsorShips:',
                transferErr
              );
              // ملاحظة: إذا كانت قيود @unique لا تزال موجودة على
              // HomeMaidId / NewClientId / OldClientId فلن يسمح بأكثر من معاملة لكل قيمة.
              // راجع SQL في رد المساعد لإسقاط هذه القيود.
            }
          } else {
            console.warn(
              'تعذر إنشاء معاملة نقل الكفالة: بيانات ناقصة',
              { hasNewClient: !!newClient, oldClientId }
            );
          }
        } catch (transferFlowErr) {
          console.error('خطأ في معالجة بيانات نقل الكفالة:', transferFlowErr);
        }
      }


  try {
        const actionText = `تسجيل مغادرة عاملة  - السبب: ${req.body.deparatureReason  || 'غير محدد'} بتاريخ ${req.body.deparatureHousingDate}`;
await prisma.logs.create({
  data: {

    homemaidId:Number(updateData.homeMaid_id),
    Details:actionText,
    reason:"مغادرة السكن",
    Status:"مغادرة السكن",
  } 
});
  } catch (error) {
   console.log(error) 
  }      
    
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
