import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import prisma from "./globalprisma";
import { jwtDecode } from "jwt-decode";
import { getPageTitleArabic } from "lib/pageTitleHelper";
import { parseFlightDateTime, processDueScheduledDepartures } from "lib/housingDepartureHelper";

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
      // Auto-execute any scheduled departures whose flight departure time has arrived
      await processDueScheduledDepartures();

      const { 
        page = 1, 
        pageSize: queryPageSize = 10,
        sortKey, 
        sortDirection, 
        contractType,
        Name,
        Passportnumber,
        id,
        location,
        houseentrydate,
        reason,
        section = 'temporary', // 'temporary' | 'permanent' | 'all'
        departureCategory = 'temp_all',
        nationality,
        fromDate,
        toDate,
        foreignOffice,
        followUpStatus, // 'all' | 'overdue' | 'active'
      } = req.query;
      const pageSize = Math.max(1, parseInt(queryPageSize as string, 10) || 10);
      const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);

      // Global search string
      const searchString = (Name as string) || (Passportnumber as string) || "";

      const orderFilters: any = searchString || id || contractType || foreignOffice || nationality
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
            ...(foreignOffice && {
              officeId: { equals: Number(foreignOffice) },
            }),
            ...(nationality && {
              OR: [
                { Nationalitycopy: { contains: String(nationality).trim() } },
                { office: { Country: { contains: String(nationality).trim() } } },
              ],
            }),
          }
        : undefined;

      // Build robust AND conditions array
      const andConditions: any[] = [
        { deparatureHousingDate: { not: null } },
        {
          OR: [
            orderFilters
              ? { homeMaid_id: { not: null }, Order: orderFilters }
              : { homeMaid_id: { not: null } },
            {
              externalHomedmaidId: { not: null },
              ...((contractType || searchString || nationality) && {
                externalHomedmaid: {
                  ...(contractType && { type: contractType as string }),
                  ...(nationality && { nationality: { contains: String(nationality).trim() } }),
                  ...(searchString && {
                    OR: [
                      { name: { contains: searchString } },
                      { passportNumber: { contains: searchString } },
                      { phone: { contains: searchString } },
                      { Client: { fullname: { contains: searchString } } },
                    ],
                  }),
                },
              }),
            },
          ],
        },
      ];

      if (deparatureReasonFilter) {
        andConditions.push({ deparatureReason: deparatureReasonFilter });
      }
      if (location) {
        andConditions.push({ location_id: { equals: Number(location) } });
      }
      if (houseentrydate) {
        andConditions.push({ houseentrydate: { equals: new Date(houseentrydate as string) } });
      }
      if (reason) {
        andConditions.push({ deparatureReason: { contains: reason as string } });
      }
      if (fromDate || toDate) {
        const dateRangeFilter: any = {};
        if (fromDate) {
          const s = new Date(fromDate as string);
          s.setHours(0, 0, 0, 0);
          dateRangeFilter.gte = s;
        }
        if (toDate) {
          const e = new Date(toDate as string);
          e.setHours(23, 59, 59, 999);
          dateRangeFilter.lte = e;
        }
        andConditions.push({ deparatureHousingDate: dateRangeFilter });
      }

      const filters: any = {
        AND: andConditions,
      };

      // Helper classification predicates
      const isCompletedTransfer = (w: any) => {
        const reason = (w.deparatureReason || '');
        return reason.includes('تم نقل الكفالة');
      };

      const isTrialWorker = (w: any) => {
        return Boolean(w.transferSponsorshipData) && !isCompletedTransfer(w);
      };

      const isMedicalWorker = (w: any) => {
        return Boolean(w.medicalDepartureData) && !w.deportationData && !isCompletedTransfer(w);
      };

      const isTemporaryWorker = (w: any) => isTrialWorker(w) || isMedicalWorker(w);
      const isExternalWorker = (w: any) => Boolean(w.externalHomedmaidId || w.externalHomedmaid);

      // Helper to check if a temporary worker is overdue/late
      const isOverdueTemporaryWorker = (w: any) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isTrialWorker(w)) {
          const tsd = w.transferSponsorshipData;
          if (tsd) {
            const startDateStr = tsd.trialStartDate || w.deparatureHousingDate;
            const days = parseInt(tsd.trialPeriodDays, 10) || 0;
            const endDateStr = tsd.trialEndDate;
            if (startDateStr) {
              const startDay = new Date(startDateStr);
              startDay.setHours(0, 0, 0, 0);
              let endDay: Date;
              if (days > 0) {
                endDay = new Date(startDay);
                endDay.setDate(endDay.getDate() + days);
              } else if (endDateStr) {
                endDay = new Date(endDateStr);
                endDay.setHours(0, 0, 0, 0);
              } else {
                endDay = new Date(startDay);
              }
              return endDay.getTime() < today.getTime();
            }
          }
        }

        if (isMedicalWorker(w)) {
          const med = w.medicalDepartureData;
          if (med?.expectedReturnDate) {
            const returnDay = new Date(med.expectedReturnDate);
            returnDay.setHours(0, 0, 0, 0);
            return returnDay.getTime() < today.getTime();
          }
        }

        return false;
      };

      // Helper function to rank worker priority: 1: Trial Transfer, 2: Medical / Hospital, 3: Completed Transfer, 4: Deportation / Archive
      const getWorkerPriority = (w: any) => {
        if (isTrialWorker(w)) return 1;
        if (isMedicalWorker(w)) return 2;
        if (isCompletedTransfer(w)) return 3;
        return 4;
      };

      // Fetch all departed workers matching base search/location/contract filters
      const allDepartedWorkers = await prisma.housedworker.findMany({
        where: filters,
        include: {
          location: true,
          Order: {
            include: {
              office: true,
              NewOrder: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  id: true,
                  clientID: true,
                  arrivals: { select: { id: true, KingdomentryDate: true, KingdomentryTime: true, GuaranteeDurationEnd: true, InternalmusanedContract: true, externalmusanedContract: true } },
                  typeOfContract: true,
                  ClientName: true,
                  PhoneNumber: true,
                  clientphonenumber: true,
                  nationalId: true,
                  createdAt: true,
                  client: { select: { id: true, fullname: true, nationalId: true, phonenumber: true, city: true } },
                },
              },
            },
          },
          externalHomedmaid: {
            include: {
              Client: { select: { id: true, fullname: true, nationalId: true, phonenumber: true, city: true } },
            },
          },
          HousedWorkerNotes: true,
        },
      });

      // Filter by category
      let filteredWorkers = allDepartedWorkers;

      if (departureCategory === 'temp_all' || (section === 'temporary' && departureCategory === 'all')) {
        filteredWorkers = allDepartedWorkers.filter(isTemporaryWorker);
      } else if (departureCategory === 'trial_transfer') {
        filteredWorkers = allDepartedWorkers.filter(isTrialWorker);
      } else if (departureCategory === 'medical') {
        filteredWorkers = allDepartedWorkers.filter(isMedicalWorker);
      } else if (departureCategory === 'perm_all' || (section === 'permanent' && departureCategory === 'all')) {
        filteredWorkers = allDepartedWorkers.filter((w) => !isTemporaryWorker(w));
      } else if (departureCategory === 'completed_transfer') {
        filteredWorkers = allDepartedWorkers.filter(isCompletedTransfer);
      } else if (departureCategory === 'deportation') {
        filteredWorkers = allDepartedWorkers.filter(
          (w) => !isTemporaryWorker(w) && !isCompletedTransfer(w) && !isExternalWorker(w)
        );
      } else if (departureCategory === 'external') {
        filteredWorkers = allDepartedWorkers.filter(isExternalWorker);
      }

      // Filter by followUpStatus (temporary section specific)
      if (followUpStatus === 'overdue') {
        filteredWorkers = filteredWorkers.filter(isOverdueTemporaryWorker);
      } else if (followUpStatus === 'active') {
        filteredWorkers = filteredWorkers.filter((w) => !isOverdueTemporaryWorker(w));
      }

      // Sorting
      if (!sortKey || sortKey === 'id' || sortKey === 'default') {
        filteredWorkers.sort((a: any, b: any) => {
          const priorityA = getWorkerPriority(a);
          const priorityB = getWorkerPriority(b);
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          const dateA = a.deparatureHousingDate ? new Date(a.deparatureHousingDate).getTime() : 0;
          const dateB = b.deparatureHousingDate ? new Date(b.deparatureHousingDate).getTime() : 0;
          if (dateB !== dateA) {
            return dateB - dateA;
          }
          return b.id - a.id;
        });
      } else {
        filteredWorkers.sort((a: any, b: any) => {
          let valA: any = '';
          let valB: any = '';
          if (sortKey === 'Name') {
            valA = a.Order?.Name || a.externalHomedmaid?.name || '';
            valB = b.Order?.Name || b.externalHomedmaid?.name || '';
          } else if (sortKey === 'phone') {
            valA = a.Order?.phone || a.externalHomedmaid?.phone || '';
            valB = b.Order?.phone || b.externalHomedmaid?.phone || '';
          } else if (sortKey === 'Details') {
            valA = a.Details || '';
            valB = b.Details || '';
          } else if (sortKey === 'Nationalitycopy') {
            valA = a.Order?.Nationalitycopy || a.externalHomedmaid?.nationality || '';
            valB = b.Order?.Nationalitycopy || b.externalHomedmaid?.nationality || '';
          }
          const cmp = String(valA).localeCompare(String(valB), 'ar');
          return sortDirection === 'asc' ? cmp : -cmp;
        });
      }

      const totalCount = filteredWorkers.length;
      const paginatedHousing = filteredWorkers.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

      // Counts calculation across all departed records
      const allCount = allDepartedWorkers.length;
      const trialTransferCount = allDepartedWorkers.filter(isTrialWorker).length;
      const medicalCount = allDepartedWorkers.filter(isMedicalWorker).length;
      const tempTotal = trialTransferCount + medicalCount;
      const completedTransferCount = allDepartedWorkers.filter(isCompletedTransfer).length;
      const externalCount = allDepartedWorkers.filter(isExternalWorker).length;
      const permTotal = Math.max(0, allCount - tempTotal);
      const deportationCount = Math.max(0, permTotal - completedTransferCount - externalCount);

      const sanitizedHousing = paginatedHousing.map((item: any) => {
        const { deliveryDate, ...rest } = item;
        return rest;
      });

      res.status(200).json({ 
        housing: sanitizedHousing,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        counts: {
          all: allCount,
          tempTotal,
          permTotal,
          trial_transfer: trialTransferCount,
          medical: medicalCount,
          completed_transfer: completedTransferCount,
          deportation: deportationCount,
          external: externalCount,
        },
      });
    } catch (error) {
      console.error("Error fetching departed workers:", error);
      res.status(500).json({ error: "Error fetching departed workers" });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === "PUT") {
    console.log(req.body);
    try {
      const {
        homeMaid,
        deparatureType,
        deparatureHousingDate,
        deparatureReason,
        medicalDepartureData,
        deportationData,
        transferSponsorshipData,
      } = req.body;

      const workerIdNum = Number(homeMaid);

      // Get worker data before update
      let workerBeforeUpdate = await prisma.housedworker.findUnique({
        where: { id: workerIdNum },
        include: {
          Order: {
            select: { id: true, Name: true }
          },
          externalHomedmaid: {
            select: { id: true, name: true }
          }
        }
      });

      if (!workerBeforeUpdate) {
        workerBeforeUpdate = await prisma.housedworker.findFirst({
          where: {
            OR: [
              { homeMaid_id: workerIdNum },
              { externalHomedmaidId: workerIdNum },
            ],
          },
          orderBy: { id: 'desc' },
          include: {
            Order: {
              select: { id: true, Name: true }
            },
            externalHomedmaid: {
              select: { id: true, name: true }
            }
          }
        });
      }

      if (!workerBeforeUpdate) {
        return res.status(404).json({ error: "العاملة غير موجودة بالسكن" });
      }

      // 🌟 مسار إتمام نقل الكفالة ونقلها من المغادرة المؤقتة إلى الدائمة
      if (req.body.action === 'complete_transfer_sponsorship' || deparatureType === 'complete_transfer') {
        const completionDate = req.body.completionDate ? new Date(req.body.completionDate).toISOString() : new Date().toISOString();
        const completionNotes = req.body.notes ? String(req.body.notes).trim() : '';

        const existingTsd = (workerBeforeUpdate.transferSponsorshipData as any) || {};
        const updatedTsd = {
          ...existingTsd,
          isCompleted: true,
          completedAt: completionDate,
          completionNotes: completionNotes || undefined,
        };

        await prisma.housedworker.update({
          where: { id: workerBeforeUpdate.id },
          data: {
            deparatureReason: 'تم نقل الكفالة',
            transferSponsorshipData: updatedTsd as any,
          } as any,
        });

        const actualHomeMaidId = workerBeforeUpdate.homeMaid_id;
        if (actualHomeMaidId) {
          // Update homemaid status
          try {
            await prisma.homemaid.update({
              where: { id: actualHomeMaidId },
              data: {
                bookingstatus: 'تم نقل الكفالة',
                isApproved: false,
              },
            });
          } catch (maidErr) {
            console.error('Error updating homemaid on transfer completion:', maidErr);
          }

          // Update transferSponsorShips
          try {
            await prisma.transferSponsorShips.updateMany({
              where: { HomeMaidId: actualHomeMaidId },
              data: {
                transferStage: 'تم نقل الكفالة',
                TransferingDate: completionDate,
              },
            });
          } catch (tsErr) {
            console.error('Error updating transferSponsorShips on completion:', tsErr);
          }
        }

        const userInfo = getUserFromCookies(req);
        const workerName = workerBeforeUpdate.externalHomedmaid?.name || workerBeforeUpdate.Order?.Name || 'عاملة';

        // Add note
        try {
          const noteText = `[إتمام نقل الكفالة بنجاح]\nتم تأكيد نجاح فترة التجربة ونقل كفالة العاملة رسمياً للكفيل الجديد بتاريخ ${completionDate.split('T')[0]}.${completionNotes ? `\nالملاحظات: ${completionNotes}` : ''}`;
          await prisma.housedWorkerNotes.create({
            data: {
              notes: noteText,
              housedWorkerId: workerIdNum,
              employee: userInfo.username || 'غير محدد',
            },
          });
        } catch (noteErr) {
          console.error('Error adding note for transfer completion:', noteErr);
        }

        // Notification
        try {
          await prisma.notifications.create({
            data: {
              title: `إتمام نقل كفالة العاملة: ${workerName}`,
              message: `تم إتمام نقل كفالة العاملة (${workerName}) بنجاح وانتقالها رسمياً للكفيل الجديد.`,
              isRead: false,
            },
          });
        } catch (notifErr) {
          console.error('Error creating notification for transfer completion:', notifErr);
        }

        // Logs
        try {
          await prisma.logs.create({
            data: {
              homemaidId: actualHomeMaidId ? Number(actualHomeMaidId) : undefined,
              Details: `إتمام نقل كفالة العاملة (${workerName}) بنجاح بتاريخ ${completionDate.split('T')[0]}`,
              reason: "نقل الكفالة",
              Status: "تم نقل الكفالة",
            }
          });
        } catch (logErr) {
          console.error('Error creating log:', logErr);
        }

        if (userInfo.userId) {
          await logToSystemLogs(
            userInfo.userId,
            'update',
            `إتمام نقل كفالة عاملة #${workerIdNum} - ${workerName}`,
            workerName,
            workerIdNum,
            '/admin/housing-departures'
          );
        }

        return res.status(200).json({ message: "تم إتمام نقل الكفالة بنجاح ونقل العاملة إلى قسم المغادرات الدائمة" });
      }

      // Determine final departure reason and housing departure date
      let finalReason = deparatureReason || 'مغادرة السكن';
      let finalHousingDate = deparatureHousingDate ? new Date(deparatureHousingDate).toISOString() : new Date().toISOString();

      // 🏢 مسار مغادرة العاملة الخارجية المخصصة
      if (deparatureType === 'external_departure' || req.body.externalDepartureData) {
        const extData = req.body.externalDepartureData || {};
        const departurePhoto = extData.departurePhoto || (req.body as any).departurePhoto;
        const notes = extData.notes || (req.body as any).notes;

        if (!departurePhoto || !String(departurePhoto).trim()) {
          return res.status(400).json({ error: "صورة المغادرة مطلوبة بشكل إجباري للعاملة الخارجية" });
        }
        if (!notes || !String(notes).trim()) {
          return res.status(400).json({ error: "ملاحظات المغادرة مطلوبة بشكل إجباري للعاملة الخارجية" });
        }

        finalReason = deparatureReason || extData.departureReason || 'مغادرة عاملة خارجية';

        const updateData = await prisma.housedworker.update({
          where: { id: workerIdNum },
          data: {
            isActive: false,
            deparatureReason: finalReason,
            deparatureHousingDate: finalHousingDate,
            deportationData: {
              departurePhoto: String(departurePhoto).trim(),
              notes: String(notes).trim(),
              departureType: 'external_departure',
              deparatureHousingDate: finalHousingDate,
            } as any,
            checkIns: {
              updateMany: {
                where: { isActive: true },
                data: { isActive: false },
              },
            },
          } as any,
        });

        // إضافة ملاحظة في سجل الملاحظات
        const userInfo = getUserFromCookies(req);
        try {
          const noteText = `[مغادرة عاملة خارجية]\n${String(notes).trim()}\n[صورة المغادرة]: ${String(departurePhoto).trim()}`;
          await prisma.housedWorkerNotes.create({
            data: {
              notes: noteText,
              housedWorkerId: workerIdNum,
              employee: userInfo.username || 'غير محدد',
            },
          });
        } catch (noteErr) {
          console.error('Error creating note for external departure:', noteErr);
        }

        const workerName = workerBeforeUpdate.externalHomedmaid?.name || workerBeforeUpdate.Order?.Name || 'عاملة خارجية';

        // إضافة إشعار
        try {
          await prisma.notifications.create({
            data: {
              title: `مغادرة عاملة خارجية: ${workerName}`,
              message: `تم تسجيل مغادرة العاملة الخارجية (${workerName}) من السكن بنجاح.<br/>تاريخ المغادرة: ${finalHousingDate.split('T')[0]}<br/>الملاحظات: ${String(notes).trim()}`,
              isRead: false,
            },
          });
        } catch (notifErr) {
          console.error('Error creating notification for external departure:', notifErr);
        }

        // تسجيل في Logs و SystemUserLogs
        try {
          await prisma.logs.create({
            data: {
              Details: `تسجيل مغادرة عاملة خارجية (${workerName}) بتاريخ ${finalHousingDate.split('T')[0]} - الملاحظات: ${String(notes).trim()}`,
              reason: "مغادرة السكن",
              Status: "مغادرة السكن",
            }
          });
        } catch (logErr) {
          console.error('Error creating log:', logErr);
        }

        if (userInfo.userId) {
          await logToSystemLogs(
            userInfo.userId,
            'update',
            `تسجيل مغادرة عاملة خارجية #${workerIdNum} - ${workerName} - ${finalReason}`,
            workerName,
            workerIdNum,
            '/admin/housedarrivals'
          );
        }

        return res.status(200).json({ message: "تم تسجيل مغادرة العاملة الخارجية بنجاح" });
      }

      if (deparatureType === 'medical') {
        finalReason = deparatureReason || (medicalDepartureData?.diagnosis ? `مغادرة مرضية: ${medicalDepartureData.diagnosis}` : 'مغادرة مرضية');
      } else if (deparatureType === 'deportation') {
        finalReason = deparatureReason || (deportationData?.externalReason ? `ترحيل: ${deportationData.externalReason}` : 'ترحيل العاملة');
        if (deportationData?.externaldeparatureDate) {
          finalHousingDate = new Date(deportationData.externaldeparatureDate).toISOString();
        }
      } else if (deparatureType === 'trial_transfer') {
        finalReason = deparatureReason || 'مغادرة لتجربة نقل خدمات';
      } else if (deparatureType === 'final_transfer') {
        finalReason = deparatureReason || 'مغادرة نقل خدمات';
      }

      // Check if scheduled deportation is in the future
      if (deparatureType === 'deportation' && deportationData) {
        const dd = deportationData as any;
        const scheduledFlightDateTime = parseFlightDateTime(
          dd?.externaldeparatureDate,
          dd?.externaldeparatureTime
        );
        const isFutureDeportation = Boolean(
          scheduledFlightDateTime && scheduledFlightDateTime.getTime() > Date.now()
        );

        if (isFutureDeportation) {
          // Worker remains active in housing until flight departure time
          const updateData = await prisma.housedworker.update({
            where: { id: workerIdNum },
            data: {
              isActive: true,
              actionTaken: 'ترحيل',
              deparatureReason: finalReason,
              deparatureHousingDate: null,
              transferSponsorshipData: transferSponsorshipData || null,
              medicalDepartureData: medicalDepartureData || null,
              deportationData: deportationData || null,
            } as any,
          });

          const actualHomeMaidId = updateData.homeMaid_id;

          // Save flight data in arrivallist for tracking & airport delivery
          if (actualHomeMaidId) {
            try {
              const validExtDepDate = dd.externaldeparatureDate ? new Date(dd.externaldeparatureDate) : new Date();
              const validExtArrDate = dd.externalArrivalCityDate ? new Date(dd.externalArrivalCityDate) : null;

              const order = await prisma.neworder.findFirst({
                where: { HomemaidId: actualHomeMaidId },
                orderBy: { id: 'desc' },
                include: { arrivals: true },
              });

              if (order) {
                if (order.arrivals && order.arrivals.length > 0) {
                  await prisma.arrivallist.update({
                    where: { id: order.arrivals[0].id },
                    data: {
                      externaldeparatureCity: dd.externaldeparatureCity || null,
                      externaldeparatureDate: validExtDepDate,
                      externaldeparatureTime: dd.externaldeparatureTime || null,
                      externalArrivalCity: dd.externalArrivalCity || null,
                      externalArrivalCityDate: validExtArrDate,
                      externalArrivalCityTime: dd.externalArrivalCityTime || null,
                      externalTicketFile: dd.externalTicketFile || null,
                      externalReason: dd.externalReason || 'ترحيل العاملة',
                      deliveryOfficer: dd.deliveryOfficer || null,
                      Notes: dd.notes || null,
                    },
                  });
                } else {
                  await prisma.arrivallist.create({
                    data: {
                      OrderId: order.id,
                      HomemaIdnumber: actualHomeMaidId,
                      externaldeparatureCity: dd.externaldeparatureCity || null,
                      externaldeparatureDate: validExtDepDate,
                      externaldeparatureTime: dd.externaldeparatureTime || null,
                      externalArrivalCity: dd.externalArrivalCity || null,
                      externalArrivalCityDate: validExtArrDate,
                      externalArrivalCityTime: dd.externalArrivalCityTime || null,
                      externalTicketFile: dd.externalTicketFile || null,
                      externalReason: dd.externalReason || 'ترحيل العاملة',
                      deliveryOfficer: dd.deliveryOfficer || null,
                      Notes: dd.notes || null,
                    },
                  });
                }
              }
            } catch (deportErr) {
              console.error('Error linking scheduled deportation with arrivallist:', deportErr);
            }
          }

          // Log scheduled departure
          try {
            const timeFormatted = dd.externaldeparatureTime ? ` الساعة ${dd.externaldeparatureTime}` : '';
            const dateFormatted = dd.externaldeparatureDate ? ` بتاريخ ${dd.externaldeparatureDate}` : '';
            await prisma.logs.create({
              data: {
                homemaidId: actualHomeMaidId ? Number(actualHomeMaidId) : undefined,
                Details: `جدولة مغادرة وترحيل العاملة - موعد الرحلة:${dateFormatted}${timeFormatted}`,
                reason: 'جدولة مغادرة السكن',
                Status: 'مجدولة للمغادرة',
              },
            });
          } catch (logErr) {
            console.log(logErr);
          }

          const userInfo = getUserFromCookies(req);
          if (userInfo.userId && workerBeforeUpdate) {
            const wb = workerBeforeUpdate as any;
            const workerName = wb.Order?.Name || wb.externalHomedmaid?.name || 'غير محدد';
            const workerId = wb.Order?.id ?? wb.externalHomedmaid?.id ?? wb.id ?? 0;
            await logToSystemLogs(
              userInfo.userId,
              'update',
              `جدولة مغادرة وترحيل عاملة #${workerId} - ${workerName} (موعد الرحلة: ${dd.externaldeparatureDate || ''} ${dd.externaldeparatureTime || ''})`,
              workerName,
              workerId,
              '/admin/housedarrivals'
            );
          }

          return res.status(200).json({
            message: `تم جدولة مغادرة العاملة بنجاح (موعد الرحلة: ${dd.externaldeparatureTime || ''})، وستغادر السكن تلقائياً عند حلول موعد الرحلة.`,
            scheduled: true,
          });
        }
      }

      // Immediate Departure Execution (for past/current flights, medical, or direct transfers)
      const updateData = await prisma.housedworker.update({
        where: { id: workerIdNum },
        data: {
          isActive: false,
          deparatureReason: finalReason,
          deparatureHousingDate: finalHousingDate,
          transferSponsorshipData: transferSponsorshipData || null,
          medicalDepartureData: medicalDepartureData || null,
          deportationData: deportationData || null,
          checkIns: {
            updateMany: {
              where: { isActive: true },
              data: { isActive: false },
            },
          },
        } as any,
      });

      const actualHomeMaidId = updateData.homeMaid_id;

      // 🩺 مسار المغادرة المرضية
      if (deparatureType === 'medical' && actualHomeMaidId) {
        try {
          await prisma.homemaid.update({
            where: { id: actualHomeMaidId },
            data: {
              bookingstatus: 'مغادرة مرضية',
            },
          });
        } catch (maidErr) {
          console.error('Error updating homemaid status for medical departure:', maidErr);
        }
      }

      // ✈️ مسار ترحيل العاملة (المغادرة الخارجية)
      if (deparatureType === 'deportation' && deportationData && actualHomeMaidId) {
        try {
          const dd = deportationData as any;
          const validExtDepDate = dd.externaldeparatureDate ? new Date(dd.externaldeparatureDate) : new Date();
          const validExtArrDate = dd.externalArrivalCityDate ? new Date(dd.externalArrivalCityDate) : null;

          // 1. إيجاد أو إنشاء سجل المغادرة الخارجية في arrivallist
          const order = await prisma.neworder.findFirst({
            where: { HomemaidId: actualHomeMaidId },
            orderBy: { id: 'desc' },
            include: { arrivals: true },
          });

          if (order) {
            if (order.arrivals && order.arrivals.length > 0) {
              await prisma.arrivallist.update({
                where: { id: order.arrivals[0].id },
                data: {
                  externaldeparatureCity: dd.externaldeparatureCity || null,
                  externaldeparatureDate: validExtDepDate,
                  externaldeparatureTime: dd.externaldeparatureTime || null,
                  externalArrivalCity: dd.externalArrivalCity || null,
                  externalArrivalCityDate: validExtArrDate,
                  externalArrivalCityTime: dd.externalArrivalCityTime || null,
                  externalTicketFile: dd.externalTicketFile || null,
                  externalReason: dd.externalReason || 'ترحيل العاملة',
                  deliveryOfficer: dd.deliveryOfficer || null,
                  Notes: dd.notes || null,
                },
              });
            } else {
              await prisma.arrivallist.create({
                data: {
                  OrderId: order.id,
                  HomemaIdnumber: actualHomeMaidId,
                  externaldeparatureCity: dd.externaldeparatureCity || null,
                  externaldeparatureDate: validExtDepDate,
                  externaldeparatureTime: dd.externaldeparatureTime || null,
                  externalArrivalCity: dd.externalArrivalCity || null,
                  externalArrivalCityDate: validExtArrDate,
                  externalArrivalCityTime: dd.externalArrivalCityTime || null,
                  externalTicketFile: dd.externalTicketFile || null,
                  externalReason: dd.externalReason || 'ترحيل العاملة',
                  deliveryOfficer: dd.deliveryOfficer || null,
                  Notes: dd.notes || null,
                },
              });
            }
          }

          // 2. تحديث حالة العاملة في جدول homemaid إلى "مرحلة" وغير معتمدة
          await prisma.homemaid.update({
            where: { id: actualHomeMaidId },
            data: {
              isApproved: false,
              bookingstatus: 'مغادرة خارجية',
            },
          });

          // 3. إخفاء طلباتها
          await prisma.neworder.updateMany({
            where: { HomemaidId: actualHomeMaidId },
            data: { isHidden: true },
          });
        } catch (deportErr) {
          console.error('Error linking deportation with arrivallist / homemaid:', deportErr);
        }
      }

      // 🔄 مسار تجربة نقل الخدمات / نقل الكفالة
      if (
        (deparatureType === 'trial_transfer' || req.body.deparatureReason === 'نقل الكفالة') &&
        transferSponsorshipData &&
        actualHomeMaidId
      ) {
        try {
          const tsd = transferSponsorshipData as any;

          // 1) جلب العميل القديم (الكفيل الحالي)
          const workerWithRelations = await prisma.housedworker.findUnique({
            where: { id: workerIdNum },
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

          const clientDataToSave: any = {
            fullname: tsd.newSponsorName || null,
            phonenumber: tsd.newSponsorPhone || null,
            nationalId: tsd.newSponsorId || null,
            alternativePhone: tsd.newSponsorAltPhone || null,
            city: tsd.newSponsorCity || null,
            dateofbirth: tsd.newSponsorDateOfBirth ? new Date(tsd.newSponsorDateOfBirth) : null,
            Source: 'تجربة نقل كفالة',
          };

          if (!newClient) {
            try {
              const created = await prisma.client.create({
                data: clientDataToSave,
              });
              newClient = { id: created.id };
            } catch (createErr) {
              console.error('Client.create failed, retrying lookup:', createErr);
              if (tsd.newSponsorPhone) {
                newClient = await prisma.client.findFirst({
                  where: { phonenumber: String(tsd.newSponsorPhone) },
                  select: { id: true },
                });
              }
            }
          } else {
            // تحديث بيانات العميل الموجود
            try {
              await prisma.client.update({
                where: { id: newClient.id },
                data: {
                  fullname: tsd.newSponsorName || undefined,
                  nationalId: tsd.newSponsorId || undefined,
                  alternativePhone: tsd.newSponsorAltPhone || undefined,
                  city: tsd.newSponsorCity || undefined,
                  dateofbirth: tsd.newSponsorDateOfBirth ? new Date(tsd.newSponsorDateOfBirth) : undefined,
                } as any,
              });
            } catch (updateClientErr) {
              console.warn('Could not update existing client data:', updateClientErr);
            }
          }

          // 3) إنشاء أو تحديث معاملة في transferSponsorShips
          if (newClient && oldClientId) {
            const trialPeriodDescription = tsd.trialPeriodDays ? `${tsd.trialPeriodDays} يوم` : 'فترة تجربة';

            const transferPayload: any = {
              HomeMaidId: Number(actualHomeMaidId),
              NewClientId: newClient.id,
              OldClientId: oldClientId,
              Cost: tsd.totalCost ? Number(tsd.totalCost) : null,
              Paid: tsd.paidAmount ? Number(tsd.paidAmount) : null,
              dailyCost: tsd.dailyCost ? Number(tsd.dailyCost) : null,
              remainingCost: tsd.remainingAmount !== undefined && tsd.remainingAmount !== null && tsd.remainingAmount !== ''
                ? Number(tsd.remainingAmount) 
                : (tsd.totalCost ? Math.max(0, Number(tsd.totalCost) - Number(tsd.paidAmount || 0)) : null),
              ExperimentDuration: trialPeriodDescription,
              ExperimentStart: tsd.trialStartDate ? new Date(tsd.trialStartDate) : null,
              ExperimentEnd: tsd.trialEndDate ? new Date(tsd.trialEndDate) : null,
              EntryDate: req.body.deparatureHousingDate ? new Date(req.body.deparatureHousingDate) : new Date(),
              NationalID: (workerWithRelations?.externalHomedmaid as any)?.nationalId || (workerWithRelations?.Order as any)?.NationalId || null,
              Notes: tsd.notes || null,
              file: null,
              salaryCertificateFile: tsd.salaryCertificateFile || null,
              nationalAddressFile: tsd.nationalAddressFile || null,
              paymentReceiptFile: tsd.paymentReceiptFile || null,
              transferStage: 'في المرحلة التجريبية',
              TransferingDate: req.body.deparatureHousingDate || null,
            };

            try {
              const existingTransfer = await prisma.transferSponsorShips.findFirst({
                where: { HomeMaidId: Number(actualHomeMaidId) },
              });

              if (existingTransfer) {
                await prisma.transferSponsorShips.update({
                  where: { id: existingTransfer.id },
                  data: transferPayload,
                });
              } else {
                await prisma.transferSponsorShips.create({
                  data: transferPayload,
                });
              }
            } catch (transferErr) {
              console.error('❌ خطأ في إنشاء/تحديث معاملة transferSponsorShips:', transferErr);
            }
          }

          // 4) تحديث حالة العاملة في جدول homemaid
          try {
            await prisma.homemaid.update({
              where: { id: Number(actualHomeMaidId) },
              data: {
                bookingstatus: 'في المرحلة التجريبية',
              },
            });
          } catch (maidErr) {
            console.error('Error updating homemaid booking status:', maidErr);
          }
        } catch (transferFlowErr) {
          console.error('خطأ في معالجة بيانات نقل الكفالة:', transferFlowErr);
        }
      }

      // 📝 إضافة سجل Logs
      try {
        const actionText = `تسجيل مغادرة عاملة - النوع: ${deparatureType || 'عادي'} - السبب: ${finalReason} بتاريخ ${finalHousingDate}`;
        await prisma.logs.create({
          data: {
            homemaidId: actualHomeMaidId ? Number(actualHomeMaidId) : undefined,
            Details: actionText,
            reason: "مغادرة السكن",
            Status: "مغادرة السكن",
          } 
        });
      } catch (logErr) {
        console.log(logErr);
      }

      // 📝 تسجيل العملية في systemlogs
      const userInfo = getUserFromCookies(req);
      if (userInfo.userId && workerBeforeUpdate) {
        const wb = workerBeforeUpdate as any;
        const workerName = wb.Order?.Name || wb.externalHomedmaid?.name || 'غير محدد';
        const workerId = wb.Order?.id ?? wb.externalHomedmaid?.id ?? wb.id ?? 0;
        await logToSystemLogs(
          userInfo.userId,
          'update',
          `تسجيل مغادرة عاملة #${workerId} - ${workerName} - ${finalReason}`,
          workerName,
          workerId,
          '/admin/housedarrivals'
        );
      }

      return res.status(200).json({ message: "تم تسجيل المغادرة بنجاح" });
    } catch (error) {
      console.error("Error updating data:", error);
      return res.status(500).json({ error: "Error updating data" });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
