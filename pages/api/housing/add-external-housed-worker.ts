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
    image,
    nationality,
    passportNumber,
    passportStartDate,
    passportEndDate,
    phone,
    type: contractType,
    dateofbirth,
    // Client data (عميل التسكين الخارجي - اختياري)
    clientName,
    clientPhone,
    clientCity,
    // Housing data (بيانات التسكين الإلزامية)
    location,
    houseentrydate,
    expectedStayDuration,
    deliveryDate,
    reason,
    details,
    employee,
  } = req.body;

  // 1. التحقق من الحقول الإلزامية
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "اسم العاملة مطلوب" });
  }

  // الاسم حروف فقط (عربي وإنجليزي ومسافات)
  const nameLettersOnly = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z\s]+$/;
  if (!nameLettersOnly.test(String(name).trim())) {
    return res.status(400).json({ error: "اسم العاملة يجب أن يحتوي على حروف فقط" });
  }

  if (!image || !String(image).trim()) {
    return res.status(400).json({ error: "صورة العاملة مطلوبة" });
  }

  if (!location) {
    return res.status(400).json({ error: "السكن مطلوب" });
  }

  if (!houseentrydate) {
    return res.status(400).json({ error: "تاريخ التسكين مطلوب" });
  }

  if (!expectedStayDuration || !String(expectedStayDuration).trim()) {
    return res.status(400).json({ error: "مدة البقاء المتوقعة مطلوبة" });
  }

  if (!reason || !String(reason).trim()) {
    return res.status(400).json({ error: "سبب التسكين مطلوب" });
  }

  if (!details || !String(details).trim()) {
    return res.status(400).json({ error: "تفاصيل التسكين مطلوبة" });
  }

  // التحقق من الحقول الاختيارية في حال تزويدها
  if (phone && String(phone).trim()) {
    if (!/^[0-9+]+$/.test(String(phone).trim())) {
      return res.status(400).json({ error: "رقم جوال العاملة يقبل أرقام و + فقط" });
    }
  }

  if (clientPhone && String(clientPhone).trim()) {
    if (!/^[0-9+]+$/.test(String(clientPhone).trim())) {
      return res.status(400).json({ error: "رقم جوال العميل يقبل أرقام و + فقط" });
    }
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

    // 1. إيجاد أو إنشاء العميل إذا توفرت بياناته
    let clientId: number | null = null;
    const cleanClientPhone = clientPhone ? String(clientPhone).trim() : '';
    const cleanClientName = clientName ? String(clientName).trim() : '';

    if (cleanClientPhone) {
      let client = await prisma.client.findFirst({
        where: { phonenumber: cleanClientPhone },
      });
      if (!client) {
        client = await prisma.client.create({
          data: {
            fullname: cleanClientName || 'عميل خارجي',
            phonenumber: cleanClientPhone,
            city: clientCity?.trim() || null,
          },
        });
      }
      clientId = client.id;
    } else if (cleanClientName) {
      // إنشاء عميل بالاسم بدون رقم جوال
      const client = await prisma.client.create({
        data: {
          fullname: cleanClientName,
          phonenumber: '',
          city: clientCity?.trim() || null,
        },
      });
      clientId = client.id;
    }

    // 2. إنشاء سجل في externalHomedmaid
    const externalHomemaid = await prisma.externalHomedmaid.create({
      data: {
        name: String(name).trim(),
        image: String(image).trim(),
        nationality: nationality?.trim() || null,
        passportNumber: passportNumber?.trim() || null,
        passportStartDate: passportStartDate || null,
        passportEndDate: passportEndDate || null,
        phone: phone?.trim() || null,
        type: contractType || 'recruitment',
        dateofbirth: dateofbirth ? new Date(dateofbirth) : null,
        clientId: clientId,
      } as any,
    });

    // 3. إنشاء housedworker مربوط بـ externalHomedmaid (بدون محضر استلام)
    const housedWorker = await prisma.housedworker.create({
      data: {
        externalHomedmaid: {
          connect: { id: externalHomemaid.id },
        },
        location: {
          connect: { id: locationId },
        },
        isExternal: true,
        employee: employee || null,
        Reason: reason,
        actionTaken: req.body.actionTaken || null,
        Details: details || null,
        expectedStayDuration: String(expectedStayDuration).trim(),
        houseentrydate: houseentrydate ? new Date(houseentrydate) : new Date(),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        // محضر استلام ومقتنيات العاملة وحالتها (يدعم: نعم=true, لا=false, غير معروف=null)
        salaryReceived: req.body.salaryReceived === true ? true : req.body.salaryReceived === false ? false : null,
        salaryRemainingAmount: req.body.salaryReceived === false && req.body.salaryRemainingAmount ? Number(req.body.salaryRemainingAmount) : null,
        isHasEntitlements: req.body.salaryReceived === false,
        entitlementsCost: req.body.salaryReceived === false && req.body.salaryRemainingAmount ? Number(req.body.salaryRemainingAmount) : null,
        entitlementReason: req.body.salaryReceived === false ? (req.body.entitlementReason?.trim() || null) : null,
        hasPhone: req.body.hasPhone === true ? true : req.body.hasPhone === false ? false : null,
        phoneReason: req.body.hasPhone === false ? (req.body.phoneReason?.trim() || null) : null,
        hasIqama: req.body.hasIqama === true ? true : req.body.hasIqama === false ? false : null,
        iqamaReason: req.body.hasIqama === false ? (req.body.iqamaReason?.trim() || null) : null,
        hasPassport: req.body.hasPassport === true ? true : req.body.hasPassport === false ? false : null,
        passportReason: req.body.hasPassport === false ? (req.body.passportReason?.trim() || null) : null,
        hasPersonalItems: req.body.hasPersonalItems === true ? true : req.body.hasPersonalItems === false ? false : null,
        personalItemsDetails: req.body.hasPersonalItems === true ? (req.body.personalItemsDetails?.trim() || null) : null,
        medicalCheckDone: req.body.medicalCheckDone === true ? true : req.body.medicalCheckDone === false ? false : null,
        visaType: req.body.visaType?.trim() || 'غير معروف',
        checkIns: {
          create: {
            CheckDate: houseentrydate ? new Date(houseentrydate) : new Date(),
          },
        },
      } as any,
    });

    if (reason || details || expectedStayDuration) {
      try {
        const initialNoteText = `[تسكين خارجي طارئ/مؤقت] سبب التسكين: ${reason} | مدة البقاء المتوقعة: ${expectedStayDuration}${details ? ` | التفاصيل: ${details}` : ''}`;
        await prisma.housedWorkerNotes.create({
          data: {
            notes: initialNoteText,
            housedWorkerId: housedWorker.id,
            employee: employee || "غير محدد",
          },
        });
      } catch (noteErr) {
        console.error("Error creating initial note for external worker:", noteErr);
      }
    }

    await prisma.notifications.create({
      data: {
        title: `تسكين خارجي مؤقت: ${externalHomemaid.name}`,
        message: `تم تسكين العاملة الخارجية (${externalHomemaid.name}) بنجاح (مدة متوقعة: ${expectedStayDuration}) <br/>
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
        `تسكين عاملة خارجية (مؤقت) - ${externalHomemaid.name} في سكن: ${locationName} (مدة: ${expectedStayDuration})`,
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
