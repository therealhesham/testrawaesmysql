import { jwtDecode } from "jwt-decode";
import prisma from "./globalprisma";
import { getPageTitleArabic } from "lib/pageTitleHelper";
import { processDueScheduledDepartures } from "lib/housingDepartureHelper";

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

export default async function handler(req: any, res: any) {
  if (req.method === "POST") {
    const {
      homeMaidId,
      profileStatus,
      deparatureCity,
      arrivalCity,workerType,
      deparatureDate,
      houseentrydate,
      deliveryDate,
      StartingDate,
      location,isExternal,
      startWoringDate,
      DeparatureTime,
      isHasEntitlements,
      entitlementsCost,
      entitlementReason,
      actionTaken,
      medicalReportFile,
      salaryReceived,
      salaryRemainingAmount,
      hasPhone,
      phoneReason,
      hasIqama,
      iqamaReason,
      hasPassport,
      passportReason,
      hasPersonalItems,
      personalItemsDetails,
      medicalCheckDone,
      visaType,
    } = req.body;

    if (!req.body.reason)
      return res.status(500).json({ error: "سبب التسكين مطلوب" });

    if (!houseentrydate) {
      return res.status(500).json({ error: "تاريخ التسكين مطلوب" });
    }

    if (!homeMaidId) {
      return res.status(400).json({ error: "معرف العاملة مطلوب" });
    }




    const object = {
      houseentrydate: houseentrydate
        ? new Date(houseentrydate).toISOString()
        : null,
      deliverydate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
      startWoringDate:
        profileStatus == "بدأت العمل" ? new Date().toISOString() : null,
      DeparatureFromSaudiCity: deparatureCity,
      ArrivalOutSaudiCity: arrivalCity,
      DeparatureFromSaudiDate: deparatureDate
        ? new Date(deparatureDate).toISOString()
        : null,
      DeparatureFromSaudiTime: DeparatureTime,
    };

    const excludeEmptyFields = (obj: any) => {
      return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => {
          return (
            value !== null &&
            value !== undefined &&
            value !== "" &&
            !(Array.isArray(value) && value.length === 0)
          );
        })
      );
    };

    const newObj = excludeEmptyFields(object);

    try {
      const search = await prisma.housedworker.findFirst({
        where: { homeMaid_id: homeMaidId },
      });

// const count = await prisma.inHouseLocation.findFirst({where:{id:Number(req.body.location)}})
if (req.body.location) {
  const locationId = Number(req.body.location);

  const locationData = await prisma.inHouseLocation.findUnique({
    where: { id: locationId },
    select: { quantity: true },
  });

  if (!locationData) {
    return res.status(400).json({ error: "الموقع المحدد غير موجود" });
  }

  const currentCount = await prisma.housedworker.count({
    where: {
      location_id: locationId,
      deparatureHousingDate: null, // لسه ساكنة
    },
  });

  if (currentCount >= locationData.quantity) {
    return res.status(400).json({
      error: `السكن ممتلئ (${currentCount}/${locationData.quantity})، لا يمكن تسكين عاملة جديدة.`,
    });
  }
}


      if (search) {
        console.log(search);
        return res
          .status(400)
          .json({ error: "سجل التسكين موجود بالفعل، استخدم PUT للتحديث" });
      }

      const createdHousedWorker = await prisma.housedworker.create({
        data: {
          checkIns: {
            create: {
              CheckDate: newObj.houseentrydate
                ? new Date(newObj.houseentrydate as string)
                : new Date(),
            },
          },

          isExternal: workerType === "خارجية" ? true : false,
          location_id: Number(req.body.location),
          employee: req.body.employee,
          Reason: req.body.reason,
          actionTaken: req.body.actionTaken || null,
          medicalReportFile: medicalReportFile || null,
          Details: req.body.details,
          houseentrydate: newObj.houseentrydate
            ? new Date(newObj.houseentrydate as string)
            : null,
          deliveryDate: newObj.deliveryDate
            ? new Date(newObj.deliveryDate as string)
            : null,
          homeMaid_id: homeMaidId,
          deparatureHousingDate: null,
          isHasEntitlements:
            salaryReceived !== undefined ? !Boolean(salaryReceived) : (isHasEntitlements !== undefined ? isHasEntitlements : false),
          entitlementsCost:
            salaryReceived === false && salaryRemainingAmount ? Number(salaryRemainingAmount) : (entitlementsCost ? Number(entitlementsCost) : null),
          entitlementReason: salaryReceived === false ? (entitlementReason || null) : null,
          salaryReceived: salaryReceived !== undefined ? Boolean(salaryReceived) : true,
          salaryRemainingAmount:
            salaryReceived === false && salaryRemainingAmount !== undefined && salaryRemainingAmount !== null && salaryRemainingAmount !== ""
              ? Number(salaryRemainingAmount)
              : null,
          hasPhone: hasPhone !== undefined ? Boolean(hasPhone) : true,
          phoneReason: phoneReason || null,
          hasIqama: hasIqama !== undefined ? Boolean(hasIqama) : true,
          iqamaReason: iqamaReason || null,
          hasPassport: hasPassport !== undefined ? Boolean(hasPassport) : true,
          passportReason: passportReason || null,
          hasPersonalItems: hasPersonalItems !== undefined ? Boolean(hasPersonalItems) : false,
          personalItemsDetails: personalItemsDetails || null,
          medicalCheckDone: medicalCheckDone !== undefined ? Boolean(medicalCheckDone) : false,
          visaType: visaType || 'مدفوعة',
        } as any,
      });

      // حفظ ملاحظة التسكين الأولية
      if (req.body.details || req.body.reason) {
        try {
          const initialNoteText = `[ملاحظة التسكين] سبب التسكين: ${req.body.reason}${req.body.details ? ` | التفاصيل: ${req.body.details}` : ''}${req.body.actionTaken ? ` | الإجراء: ${req.body.actionTaken}` : ''}`;
          await prisma.housedWorkerNotes.create({
            data: {
              notes: initialNoteText,
              housedWorkerId: createdHousedWorker.id,
              employee: req.body.employee || 'غير محدد',
            },
          });
        } catch (noteErr) {
          console.error('Error creating initial housedWorkerNote:', noteErr);
        }
      }

      try{ 
             await prisma.logs.create({
        data: {
          Status: "تسكين",
          // Status: `تم تسكين العاملة منزلية بتاريخ ${new Date().toLocaleDateString()} في سكن ${req.body.location}  - سبب التسكين ${req.body.reason} `,
          userId: req.body.employee,
          homemaidId: homeMaidId,
          Details: `تم تسكين العاملة منزلية بتاريخ ${new Date().toLocaleDateString()} في سكن ${req.body.location}  - سبب التسكين ${req.body.reason} `,
          reason: "تسكين",
        },
      });
    }catch(error){
      console.log(error)
    }
      const homeMaidData = await prisma.homemaid.findUnique({
        where: {
          id: homeMaidId,
        },
      });

      await prisma.notifications.create({
        data: {
          title: `تسكين عاملة  ${homeMaidData?.Name} منزلية`,
          message: `تم تسكين العاملة بنجاح <br/>
              يمكنك فحص المعلومات في قسم التسكين ......  <a href="/admin/housedarrivals" target="_blank" className="text-blue-500">اضغط هنا</a>`,
          // userId: req.body.employee,
          isRead: false,
        },
      });

      // تسجيل العملية في systemlogs
      const userInfo = getUserFromCookies(req);
      if (userInfo.userId) {
        const locationName = req.body.location ? await prisma.inHouseLocation.findUnique({
          where: { id: Number(req.body.location) },
          select: { location: true }
        }).then(loc => loc?.location || 'غير محدد') : 'غير محدد';
        
        await logToSystemLogs(
          userInfo.userId,
          'create',
          `تسكين عاملة #${homeMaidId} - ${homeMaidData?.Name || 'غير محدد'} في سكن: ${locationName}`,
          homeMaidData?.Name || 'غير محدد',
          homeMaidId,
          '/admin/housedarrivals'
        );
      }

      return res.status(200).json({ message: "تم إنشاء التسكين بنجاح" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "خطأ في إنشاء التسكين" });
    }

  } else if (req.method === "PUT") {
    const {
      homeMaidId,
      housedWorkerId,
      employee,
      reason,
      actionTaken,
      medicalReportFile,
      details,
      houseentrydate,
      deliveryDate,
      location_id,
      isHasEntitlements,
      entitlementsCost,
      entitlementReason,
      salaryReceived,
      salaryRemainingAmount,
      hasPhone,
      phoneReason,
      hasIqama,
      iqamaReason,
      hasPassport,
      passportReason,
      hasPersonalItems,
      personalItemsDetails,
      medicalCheckDone,
      visaType,
      maidName,
      maidPhone,
      maidDateOfBirth,
      nationality,
      isRehousing,
    } = req.body;

    const idToUse = homeMaidId ?? housedWorkerId;
    if (!idToUse) {
      return res.status(400).json({ error: "معرف العاملة مطلوب" });
    }

    try {
      let search = await prisma.housedworker.findFirst({
        where: { homeMaid_id: Number(idToUse) },
        include: { Order: true, externalHomedmaid: true },
      });
      if (!search) {
        search = await prisma.housedworker.findFirst({
          where: { id: Number(idToUse), externalHomedmaidId: { not: null } },
          include: { Order: true, externalHomedmaid: true },
        });
      }

      if (!search) {
        return res.status(404).json({ error: "سجل التسكين غير موجود" });
      }

      if (location_id && location_id !== 0) {
        const locationExists = await prisma.inHouseLocation.findUnique({
          where: { id: location_id },
        });

        if (!locationExists) {
          return res.status(400).json({ error: "معرف الموقع غير صحيح" });
        }
      }

      const whereClause = search.homeMaid_id
        ? { homeMaid_id: search.homeMaid_id }
        : { id: search.id };

      const updated = await prisma.housedworker.update({
        where: whereClause,
        data: {
          ...(location_id && location_id !== 0 && { location_id }),
          employee,
          Reason: reason,
          ...(actionTaken !== undefined && { actionTaken: actionTaken || null }),
          ...(medicalReportFile !== undefined && { medicalReportFile: medicalReportFile || null }),
          Details: details,
          houseentrydate: houseentrydate
            ? new Date(houseentrydate).toISOString()
            : search.houseentrydate,
          deliveryDate: deliveryDate
            ? new Date(deliveryDate).toISOString()
            : search.deliveryDate,
          ...(isRehousing && {
            deparatureHousingDate: null,
            isActive: true,
            actionTaken: null,
            deparatureReason: null,
            deportationData: null,
            medicalDepartureData: null,
            transferSponsorshipData: null,
          }),
          isHasEntitlements:
            salaryReceived !== undefined
              ? !Boolean(salaryReceived)
              : (isHasEntitlements !== undefined ? isHasEntitlements : (search as any).isHasEntitlements),
          entitlementsCost:
            salaryReceived !== undefined
              ? (Boolean(salaryReceived) ? null : (salaryRemainingAmount ? Number(salaryRemainingAmount) : null))
              : (entitlementsCost !== undefined ? (entitlementsCost !== null && entitlementsCost !== "" ? Number(entitlementsCost) : null) : (search as any).entitlementsCost),
          entitlementReason:
            salaryReceived !== undefined
              ? (Boolean(salaryReceived) ? null : (entitlementReason || null))
              : (entitlementReason !== undefined ? entitlementReason : (search as any).entitlementReason),
          ...(salaryReceived !== undefined && {
            salaryReceived: Boolean(salaryReceived),
            salaryRemainingAmount: Boolean(salaryReceived)
              ? null
              : (salaryRemainingAmount !== null && salaryRemainingAmount !== "" ? Number(salaryRemainingAmount) : null),
          }),
          ...(hasPhone !== undefined && { hasPhone: Boolean(hasPhone) }),
          ...(phoneReason !== undefined && { phoneReason: phoneReason || null }),
          ...(hasIqama !== undefined && { hasIqama: Boolean(hasIqama) }),
          ...(iqamaReason !== undefined && { iqamaReason: iqamaReason || null }),
          ...(hasPassport !== undefined && { hasPassport: Boolean(hasPassport) }),
          ...(passportReason !== undefined && { passportReason: passportReason || null }),
          ...(hasPersonalItems !== undefined && { hasPersonalItems: Boolean(hasPersonalItems) }),
          ...(personalItemsDetails !== undefined && { personalItemsDetails: personalItemsDetails || null }),
          ...(medicalCheckDone !== undefined && { medicalCheckDone: Boolean(medicalCheckDone) }),
          ...(req.body.expectedStayDuration !== undefined && { expectedStayDuration: req.body.expectedStayDuration || null }),
        },
      });

      if (search.homeMaid_id) {
        const maidData: any = {
          ...(maidName !== undefined && { Name: maidName || null }),
          ...(maidPhone !== undefined && { phone: maidPhone || null }),
          ...(maidDateOfBirth !== undefined && {
            dateofbirth: maidDateOfBirth
              ? new Date(maidDateOfBirth as string)
              : null,
          }),
        };

        if (isRehousing) {
          maidData.bookingstatus = "";
          maidData.isApproved = true;
        }

        await prisma.homemaid.update({
          where: { id: search.homeMaid_id },
          data: maidData,
        });

        if (isRehousing) {
          // Unhide orders and make available
          await prisma.neworder.updateMany({
            where: { HomemaidId: search.homeMaid_id },
            data: {
              isHidden: false,
              isAvailable: true,
            },
          });

          // Reset external departure data in arrivallist
          await prisma.arrivallist.updateMany({
            where: { HomemaIdnumber: search.homeMaid_id },
            data: {
              externaldeparatureDate: null,
              externaldeparatureTime: null,
              externaldeparatureCity: null,
              externalArrivalCity: null,
              externalArrivalCityDate: null,
              externalArrivalCityTime: null,
              externalTicketFile: null,
              externalReason: null,
              deliveryOfficer: null,
            },
          });
        }
      } else if (search.externalHomedmaidId) {
        await prisma.externalHomedmaid.update({
          where: { id: search.externalHomedmaidId },
          data: {
            ...(maidName !== undefined && { name: maidName || null }),
            ...(req.body.maidImage !== undefined && { image: req.body.maidImage || null }),
            ...(req.body.image !== undefined && { image: req.body.image || null }),
            ...(req.body.passportNumber !== undefined && { passportNumber: req.body.passportNumber || null }),
            ...(maidPhone !== undefined && { phone: maidPhone || null }),
            ...(maidDateOfBirth !== undefined && {
              dateofbirth: maidDateOfBirth
                ? new Date(maidDateOfBirth as string)
                : null,
            }),
            ...(nationality !== undefined && { nationality: nationality != null && String(nationality).trim() ? String(nationality).trim() : null }),
          },
        });
      }
      try {
        await prisma.logs.create({
          data: {
            Status: isRehousing ? `إعادة تسكين` : `تم تعديل بيانات التسكين `,
            userId: employee,
            Details: isRehousing
              ? `إعادة تسكين العاملة في السكن بتاريخ ${houseentrydate || ''} وإلغاء المغادرة / إعادة تنشيط الملف`
              : `تم تعديل بيانات التسكين للعاملة المنزلية بتاريخ `,
            homemaidId: search.homeMaid_id,
          } as any,
        });
      } catch (error) {
        console.log(error)
      }
      const userInfo = getUserFromCookies(req);
      if (userInfo.userId) {
        const workerName =
          (maidName !== undefined && String(maidName).trim() !== ''
            ? maidName
            : null) ||
          (search as any).Order?.Name ||
          (search as any).externalHomedmaid?.name ||
          'غير محدد';

        const locationName = location_id ? await prisma.inHouseLocation.findUnique({
          where: { id: Number(location_id) },
          select: { location: true }
        }).then(loc => loc?.location || 'غير محدد') : 'غير محدد';

        await logToSystemLogs(
          userInfo.userId,
          'update',
          `تعديل بيانات تسكين عاملة #${search.id} - ${workerName} في سكن: ${locationName}`,
          workerName,
          search.id,
          '/admin/housedarrivals'
        );
      }

      return res.status(200).json({ message: "تم تحديث التسكين بنجاح", updated });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "خطأ في تحديث التسكين" });
    }

  } else if (req.method === "GET") {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie: any) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    let token: any = null;
    if (cookies.authToken && typeof cookies.authToken === 'string') {
      try {
        token = jwtDecode(cookies.authToken) as any;
      } catch (e) {}
    }
    const findUser = token?.id ? await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    }) : null;

    // تسجيل عملية العرض في systemlogs
    const userInfo = getUserFromCookies(req);
    if (userInfo.userId) {
      await logToSystemLogs(
        userInfo.userId,
        'view',
        'عرض قائمة العاملات المسكنات',
        '',
        0,
        '/admin/housedarrivals'
      );
    }

    try {
      // Auto-execute any scheduled departures whose flight departure time has arrived
      await processDueScheduledDepartures();
    } catch (autoDepErr) {
      console.error('Error running processDueScheduledDepartures:', autoDepErr);
    }

    const {
      Name,
      age,
      reason,
      actionTaken,
      warrantyStatus,
      profession,
      job,
      Nationality,
      nationality,
      Passportnumber,
      id,
      page,
      houseentrydate,
      sortKey,
      sortDirection,
      contractType,
      size,
      location,
    } = req.query;

    const targetProfession = (profession as string) || (job as string) || "";
    const targetNationality = (Nationality as string) || (nationality as string) || "";
    const nationalityParts = targetNationality
      ? Array.from(new Set([targetNationality, ...targetNationality.split(/[-–—/]/).map((s) => s.trim())])).filter(Boolean)
      : [];

    const nationalityOrderCondition = nationalityParts.length > 0
      ? {
          OR: nationalityParts.map((part) => ({
            Nationalitycopy: { contains: part },
          })),
        }
      : undefined;

    const nationalityExternalCondition = nationalityParts.length > 0
      ? {
          OR: nationalityParts.map((part) => ({
            nationality: { contains: part },
          })),
        }
      : undefined;

    const pageSize = parseInt(size as string, 10) || 10;
    const pageNumber = parseInt(page as string, 10) || 1;

    // تضمين العاملات الداخلية (من homemaids) والخارجية (من externalHomedmaid)
    const searchString = (Name as string) || (Passportnumber as string) || "";
    
    // شروط الضمان
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const warrantyOrderCondition: any = warrantyStatus === 'valid'
      ? {
          some: {
            arrivals: {
              some: {
                OR: [
                  { GuaranteeDurationEnd: { gte: now } },
                  { KingdomentryDate: { gte: ninetyDaysAgo } },
                ],
              },
            },
          },
        }
      : warrantyStatus === 'expired'
      ? {
          some: {
            arrivals: {
              some: {
                OR: [
                  { GuaranteeDurationEnd: { lt: now } },
                  { KingdomentryDate: { lt: ninetyDaysAgo } },
                ],
              },
            },
          },
        }
      : undefined;

    const orderFilters: any = searchString || id || contractType || nationalityOrderCondition || targetProfession || warrantyOrderCondition
      ? {
          ...(searchString && {
            OR: [
              { Name: { contains: searchString } },
              { Passportnumber: { contains: searchString } },
              { phone: { contains: searchString } },
              { NewOrder: { some: { ClientName: { contains: searchString } } } },
              { NewOrder: { some: { client: { fullname: { contains: searchString } } } } },
              { NewOrder: { some: { client: { nationalId: { contains: searchString } } } } },
              { NewOrder: { some: { nationalId: { contains: searchString } } } },
              { NewOrder: { some: { clientphonenumber: { contains: searchString } } } },
              { NewOrder: { some: { PhoneNumber: { contains: searchString } } } },
            ]
          }),
          ...(id && { id: { equals: Number(id) } }),
          ...(nationalityOrderCondition && nationalityOrderCondition),
          ...(targetProfession && {
            OR: [
              { profession: { name: { contains: targetProfession } } },
              { job: { contains: targetProfession } },
            ],
          }),
          ...(contractType && {
            NewOrder: {
              some: { typeOfContract: contractType as string },
            },
          }),
          ...(warrantyOrderCondition && {
            NewOrder: warrantyOrderCondition,
          }),
        }
      : undefined;

    const filters: any = {
      ...(location && { location_id: { equals: Number(location) } }),
      ...(houseentrydate && { houseentrydate: { equals: new Date(houseentrydate as string) } }),
      ...(reason && { Reason: { contains: String(reason).trim() } }),
      ...(actionTaken && {
        ...(actionTaken === 'قيد الانتظار'
          ? { OR: [{ actionTaken: 'قيد الانتظار' }, { actionTaken: null }, { actionTaken: '' }] }
          : { actionTaken: { equals: String(actionTaken).trim() } }),
      }),
      deparatureHousingDate: null,
      OR: [
        orderFilters
          ? { homeMaid_id: { not: null }, Order: orderFilters }
          : { homeMaid_id: { not: null } },
        {
          externalHomedmaidId: { not: null },
          ...((contractType || searchString || nationalityExternalCondition) && {
            externalHomedmaid: {
              ...(contractType && { type: contractType as string }),
              ...(nationalityExternalCondition && nationalityExternalCondition),
              ...(searchString && {
                OR: [
                  { name: { contains: searchString } },
                  { passportNumber: { contains: searchString } },
                  { phone: { contains: searchString } },
                  { Client: { fullname: { contains: searchString } } },
                  { Client: { nationalId: { contains: searchString } } },
                  { Client: { phonenumber: { contains: searchString } } },
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
        case "id":
          orderBy = { id: sortDirection || "asc" };
          break;
        case "houseentrydate":
          orderBy = { houseentrydate: sortDirection || "asc" };
          break;
        default:
          orderBy = { id: "desc" };
      }
    }

    try {
      const housing = await prisma.housedworker.findMany({
        where: filters,
        include: {
          Order: {
            include: {
              weeklyStatusId: true,
              logs: true,
              office: true,
              NewOrder: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  id: true,
                  arrivals: { select: { id: true, KingdomentryDate: true, KingdomentryTime: true, GuaranteeDurationEnd: true, InternalmusanedContract: true, externalmusanedContract: true } },
                  typeOfContract: true,
                  ClientName: true,
                  PhoneNumber: true,
                  clientphonenumber: true,
                  nationalId: true,
                  clientID: true,
                  createdAt: true,
                  client: { select: { id: true, fullname: true, nationalId: true, phonenumber: true } },
                },
              },
            },
          },
          externalHomedmaid: {
            include: {
              Client: { select: { id: true, fullname: true, nationalId: true, phonenumber: true } },
            },
          },
          HousedWorkerNotes: true,
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy,
      });
      const totalCount = await prisma.housedworker.count({
        where: filters,
      });

      const sanitizedHousing = housing.map((item: any) => {
        const { deliveryDate, ...rest } = item;
        return rest;
      });

      return res.status(200).json({ housing: sanitizedHousing, totalCount });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "خطأ في جلب بيانات التسكين" });
    }
  } else {
    return res.status(405).json({ error: "الطريقة غير مسموحة" });
  }
}
