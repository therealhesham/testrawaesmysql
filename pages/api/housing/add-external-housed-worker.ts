import { jwtDecode } from "jwt-decode";
import prisma from "../globalprisma";
import { getPageTitleArabic } from "lib/pageTitleHelper";
import type { NextApiRequest, NextApiResponse } from "next";

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

async function logToSystemLogs(
  userId: number,
  actionType: string,
  action: string,
  beneficiary: string,
  beneficiaryId: number,
  pageRoute: string
) {
  try {
    const pageTitle = getPageTitleArabic(pageRoute);
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
  } catch (error) {
    console.error('Error saving to systemUserLogs:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const {
    // External homemaid data (جدول externalHomedmaid)
    name,
    nationality,
    passportNumber,
    passportStartDate,
    passportEndDate,
    phone,
    type: contractType,
    dateofbirth,
    // Housing data
    location,
    houseentrydate,
    deliveryDate,
    reason,
    details,
    employee,
    officeName,
    isHasEntitlements,
  } = req.body;

  if (!reason) {
    return res.status(400).json({ error: "سبب التسكين مطلوب" });
  }
  if (!houseentrydate) {
    return res.status(400).json({ error: "تاريخ التسكين مطلوب" });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "اسم العاملة مطلوب" });
  }
  if (!location) {
    return res.status(400).json({ error: "السكن مطلوب" });
  }
  if (!contractType || !["recruitment", "rental"].includes(contractType)) {
    return res.status(400).json({ error: "نوع العقد مطلوب (استقدام أو تأجير)" });
  }
  if (!nationality || !String(nationality).trim()) {
    return res.status(400).json({ error: "الجنسية مطلوبة" });
  }
  // رقم الجوال: أرقام و + فقط
  if (phone && String(phone).trim()) {
    if (!/^[0-9+]+$/.test(phone.trim())) {
      return res.status(400).json({ error: "رقم الجوال يقبل أرقام و + فقط" });
    }
  }
  // الاسم حروف فقط (عربي وإنجليزي ومسافات)
  const nameLettersOnly = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z\s]+$/;
  if (!nameLettersOnly.test(name.trim())) {
    return res.status(400).json({ error: "الاسم يجب أن يحتوي على حروف فقط" });
  }

  try {
    const locationId = Number(location);
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
        deparatureHousingDate: null,
      },
    });

    if (currentCount >= locationData.quantity) {
      return res.status(400).json({
        error: `السكن ممتلئ (${currentCount}/${locationData.quantity})، لا يمكن تسكين عاملة جديدة.`,
      });
    }

    // 1. إنشاء سجل في externalHomedmaid
    const externalHomemaid = await prisma.externalHomedmaid.create({
      data: {
        name: (name || '').trim(),
        nationality: nationality?.trim() || null,
        passportNumber: passportNumber?.trim() || null,
        passportStartDate: passportStartDate || null,
        passportEndDate: passportEndDate || null,
        phone: phone?.trim() || null,
        type: contractType,
        dateofbirth: dateofbirth ? new Date(dateofbirth) : null,
      },
    });

    // 2. إنشاء housedworker مربوط بـ externalHomedmaid (بدون homeMaid_id)
    const housedWorker = await prisma.housedworker.create({
      data: {
        externalHomedmaidId: externalHomemaid.id,
        isExternal: true,
        homeMaid_id: null,
        location_id: locationId,
        employee: employee || null,
        Reason: reason,
        Details: details || null,
        houseentrydate: houseentrydate ? new Date(houseentrydate).toISOString() : null,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
        deparatureHousingDate: null,
        isHasEntitlements: isHasEntitlements !== undefined ? isHasEntitlements : true,
        checkIns: {
          create: {
            CheckDate: houseentrydate ? new Date(houseentrydate) : new Date(),
          },
        },
      },
    });

    await prisma.notifications.create({
      data: {
        title: `تسكين عاملة خارجية ${externalHomemaid.name}`,
        message: `تم تسكين العاملة الخارجية بنجاح <br/>
            يمكنك فحص المعلومات في قسم التسكين ......  <a href="/admin/housedarrivals" target="_blank" className="text-blue-500">اضغط هنا</a>`,
        isRead: false,
      },
    });

    const userInfo = getUserFromCookies(req);
    if (userInfo.userId) {
      const locationName = await prisma.inHouseLocation.findUnique({
        where: { id: locationId },
        select: { location: true },
      }).then((loc) => loc?.location || "غير محدد");

      await logToSystemLogs(
        userInfo.userId,
        "create",
        `تسكين عاملة خارجية - ${externalHomemaid.name} في سكن: ${locationName}`,
        externalHomemaid.name || "غير محدد",
        housedWorker.id,
        "/admin/housedarrivals"
      );
    }

    return res.status(200).json({
      success: true,
      message: "تم تسكين العاملة الخارجية بنجاح",
      housedWorkerId: housedWorker.id,
      externalHomemaidId: externalHomemaid.id,
    });
  } catch (error: any) {
    console.error("Error adding external housed worker:", error);
    return res.status(500).json({
      error: error?.message || "حدث خطأ أثناء تسكين العاملة الخارجية",
    });
  }
}
