import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
import jwt from "jsonwebtoken";

// import {getPrismaClient} from "../../utils/prisma";
// prisma

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  function excludeEmptyFields(obj: any) {
    return Object.fromEntries(
      Object.entries(obj).filter(([key, value]) => {
        return (
          value !== null &&
          value !== undefined &&
          value !== "" &&
          !(Array.isArray(value) && value.length === 0)
        );
      })
    );
  }

  // Check for the correct HTTP method
  if (req.method === "GET") {
    const originalObject = {
      name: "John",
      age: 30,
      email: null,
      phone: undefined,
      address: "123 Main St",
    };

    const obj = excludeEmptyFields(originalObject);
    console.log(obj); // Here, you can perform further operations (like calling Prisma)
  }

  try {
    const {
      finaldestination,
      deparatureTime,
      KingdomentryDate,
      HomemaIdnumber,
      Notes,
      id,
      ArrivalCity,
      ticketFile,
      deparatureDate,
      externalmusanadcontractfile,
      receivingFile,
      externalOfficeFile,
      approvalPayment,
      additionalfiles,
      DateOfApplication,
      MusanadDuration,
      externalOfficeStatus,
      ExternalDateLinking,
      ExternalOFficeApproval,
      ExternalStatusByoffice,
      AgencyDate,
      finalDestinationTime,
      profileStatus,
      Orderid,
      EmbassySealing,
      BookinDate,internalReason,
      bookingstatus,
      DeliveryFile,
      DeliveryDate,
      externalmusanedContract,
      GuaranteeDurationEnd,
      // الحقول الجديدة للمغادرة الداخلية
      internaldeparatureCity,
      internaldeparatureDate,
      internaldeparatureTime,
      internalArrivalCity,
      internalArrivalCityDate,
      internalArrivalCityTime,
      internalTicketFile,
      deliveryOfficer,
    } = req.body;

    console.log(req.body); // Log the request body for debugging

    // Check and handle AgencyDate if empty or invalid
    const validAgencyDate = AgencyDate
      ? new Date(AgencyDate).toISOString()
      : null;
    const validEmbassySealing = EmbassySealing
      ? new Date(EmbassySealing).toISOString()
      : null;

    const validexternalmusanedContract = externalmusanedContract
      ? new Date(externalmusanedContract).toISOString()
      : null;

    const VALIDExternalOFficeApproval = ExternalOFficeApproval
      ? new Date(ExternalOFficeApproval).toISOString()
      : null;
    const validExternalDateLinking = ExternalDateLinking
      ? new Date(ExternalDateLinking).toISOString()
      : null;

    const validGuaranteeDurationEnd = GuaranteeDurationEnd
      ? new Date(GuaranteeDurationEnd).toISOString()
      : null;
    const validBookinDate = BookinDate
      ? new Date(BookinDate).toISOString()
      : null;

    const validKingdomEntryDate = KingdomentryDate
      ? new Date(KingdomentryDate).toISOString()
      : null;
    const validDeliveryDate = DeliveryDate
      ? new Date(DeliveryDate).toISOString()
      : null;
    const validDeparatureDate = deparatureDate
      ? new Date(deparatureDate).toISOString()
      : null;
    const validInternalArrivalCityDate = internalArrivalCityDate
      ? new Date(internalArrivalCityDate).toISOString()
      : null;

    // معالجة التواريخ الجديدة للمغادرة الداخلية
    const validInternalDeparatureDate = internaldeparatureDate
      ? new Date(internaldeparatureDate).toISOString()
      : null;
console.log(internalReason)

    const ss = {
      finaldestination,
      internaldeparatureTime,
      internalArrivalCityTime,
      internaldeparatureDate: validInternalDeparatureDate,
      KingdomentryDate: validKingdomEntryDate,
      HomemaIdnumber,
      DeliveryDate: validDeliveryDate,
      notes:Notes,
      ticketFile,
      externalOfficeStatus,
      externalmusanadcontractfile,
      additionalfiles,
      internalReason,
      externalmusanedContract: validexternalmusanedContract,
      MusanadDuration,
      ExternalDateLinking: validExternalDateLinking,
      ExternalOFficeApproval: VALIDExternalOFficeApproval,
      AgencyDate: validAgencyDate,
      EmbassySealing: validEmbassySealing,
      BookinDate: validBookinDate,
      GuaranteeDurationEnd: validGuaranteeDurationEnd,
      // الحقول الجديدة للمغادرة الداخلية
      internaldeparatureCity,
      internalArrivalCityDate:validInternalArrivalCityDate,
      internalArrivalCity,
      internalTicketFile,
      deliveryOfficer,
    };

    // Apply `excludeEmptyFields` to filter out empty fields from the object
    const dataToUpdate = excludeEmptyFields(ss);
console.log("dataToUpdate",req.body.internalTicketFile)
    await prisma.neworder.update({
      where: { id: Orderid },
      data: { bookingstatus },
    });


    console.log("Data to update:", {id,Orderid}); // Log the final data to be updated
    const createarrivallist = await prisma.arrivallist.update({
      include: { Order: { include: { HomeMaid: true } } },
      where: { id :id},
      data: dataToUpdate,
    });

    // إخراج العاملة من السكن تلقائيا بموعد الرحلة
    if (createarrivallist.Order?.HomemaidId && validInternalDeparatureDate) {
      const now = new Date();
      const saudiTimeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Riyadh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const parts = saudiTimeFormatter.formatToParts(now);
      const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
      const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
      const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
      
      const today = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const depDate = new Date(validInternalDeparatureDate);
      depDate.setHours(0, 0, 0, 0);

      // إخراج العاملة من السكن فقط إذا كان تاريخ المغادرة اليوم أو في الماضي
      if (depDate <= today) {
        const activeHousing = await prisma.housedworker.findFirst({
          where: {
            homeMaid_id: createarrivallist.Order.HomemaidId,
            isActive: true
          }
        });

        if (activeHousing) {
          await prisma.housedworker.update({
            where: { id: activeHousing.id },
            data: {
              isActive: false,
              deparatureReason: createarrivallist.internalReason || 'مغادرة داخلية',
              deparatureHousingDate: new Date(validInternalDeparatureDate).toISOString(),
              checkIns: {
                updateMany: {
                  where: { isActive: true },
                  data: { isActive: false }
                }
              }
            }
          });
        }
      }
    }

    try {
      const token = req.cookies?.authToken;
      let userId: string | null = null;
      let decodedToken: any = null;

      if (token) {
        decodedToken = jwt.verify(token, "rawaesecret");
        userId = decodedToken?.username;
      }
      
      const referer = req.headers.referer || '/admin/deparatures'
      
      if (decodedToken) {
        try {
          // Import eventBus dynamically or use it if already imported
          const eventBus = require('lib/eventBus').default;
          eventBus.emit('ACTION', {
            type: `تعديل بيانات المغادرة الداخلية للعاملة ${createarrivallist.Order?.HomeMaid?.Name || ''} - طلب رقم ${createarrivallist.OrderId}`,
            beneficiary: "homemaid",
            pageRoute: referer,
            actionType: "create",
            BeneficiaryId: createarrivallist.id || null,
            userId: Number(decodedToken.id),
          });
        } catch(e) {
          console.error("Error emitting internal departure event:", e);
        }
      }

      const arabicRegionMap: { [key: string]: string } = {
        'Riyadh': 'الرياض', 'Al-Kharj': 'الخرج', 'Ad Diriyah': 'الدرعية', 'Al Majma\'ah': 'المجمعة', 'Al Zulfi': 'الزلفي',
        'Ad Dawadimi': 'الدوادمي', 'Wadi Ad Dawasir': 'وادي الدواسر', 'Afif': 'عفيف', 'Al Quway\'iyah': 'القويعية',
        'Shaqra': 'شقراء', 'Hotat Bani Tamim': 'حوطة بني تميم', 'Makkah': 'مكة المكرمة', 'Jeddah': 'جدة', 'Taif': 'الطائف',
        'Rabigh': 'رابغ', 'Al Qunfudhah': 'القنفذة', 'Al Lith': 'الليث', 'Khulais': 'خليص', 'Ranyah': 'رنية', 'Turabah': 'تربة',
        'Madinah': 'المدينة المنورة', 'Yanbu': 'ينبع', 'Al Ula': 'العلا', 'Badr': 'بدر', 'Al Hinakiyah': 'الحناكية',
        'Mahd Al Dhahab': 'مهد الذهب', 'Dammam': 'الدمام', 'Al Khobar': 'الخبر', 'Dhahran': 'الظهران', 'Al Ahsa': 'الأحساء',
        'Al Hufuf': 'الهفوف', 'Al Mubarraz': 'المبرز', 'Jubail': 'الجبيل', 'Hafr Al Batin': 'حفر الباطن', 'Al Khafji': 'الخفجي',
        'Ras Tanura': 'رأس تنورة', 'Qatif': 'القطيف', 'Abqaiq': 'بقيق', 'Nairiyah': 'النعيرية', 'Qaryat Al Ulya': 'قرية العليا',
        'Buraydah': 'بريدة', 'Unaizah': 'عنيزة', 'Ar Rass': 'الرس', 'Al Bukayriyah': 'البكيرية', 'Al Badaye': 'البدائع',
        'Al Mithnab': 'المذنب', 'Riyad Al Khabra': 'رياض الخبراء', 'Abha': 'أبها', 'Khamis Mushait': 'خميس مشيط',
        'Bisha': 'بيشة', 'Mahayil': 'محايل عسير', 'Al Namas': 'النماص', 'Tanomah': 'تنومة', 'Ahad Rafidah': 'أحد رفيدة',
        'Sarat Abidah': 'سراة عبيدة', 'Balqarn': 'بلقرن', 'Tabuk': 'تبوك', 'Duba': 'ضباء', 'Al Wajh': 'الوجه',
        'Umluj': 'أملج', 'Tayma': 'تيماء', 'Haqi': 'حقل', 'Hail': 'حائل', 'Baqa': 'بقعاء', 'Al Ghazalah': 'الغزالة',
        'Arar': 'عرعر', 'Rafha': 'رفحاء', 'Turaif': 'طريف', 'Jazan': 'جازان', 'Sabya': 'صبيا', 'Abu Arish': 'أبو عريش',
        'Samtah': 'صامطة', 'Baish': 'بيش', 'Ad Darb': 'الدرب', 'Al Aridah': 'العارضة', 'Fifa': 'فيفاء', 'Najran': 'نجران',
        'Sharurah': 'شرورة', 'Hubuna': 'حبونا', 'Al Baha': 'الباحة', 'Baljurashi': 'بلجرشي', 'Al Mandq': 'المندق',
        'Al Makhwah': 'المخواة', 'Qilwah': 'قلوة', 'Sakaka': 'سكاكا', 'Dumat Al Jandal': 'دومة الجندل', 'Al Qurayyat': 'القريات',
        'Tabarjal': 'طبرجل'
      };

      const fromCity = createarrivallist.internaldeparatureCity ? (arabicRegionMap[createarrivallist.internaldeparatureCity] || createarrivallist.internaldeparatureCity) : '';
      const toCity = createarrivallist.internalArrivalCity ? (arabicRegionMap[createarrivallist.internalArrivalCity] || createarrivallist.internalArrivalCity) : '';
      const depDate = createarrivallist.internaldeparatureDate ? new Date(createarrivallist.internaldeparatureDate).toISOString().split('T')[0] : '';
      const reason = createarrivallist.internalReason || '';
      
      const detailsArray = [];
      if (fromCity) detailsArray.push(`من: ${fromCity}`);
      if (toCity) detailsArray.push(`إلى: ${toCity}`);
      if (depDate) detailsArray.push(`تاريخ المغادرة: ${depDate}`);
      if (reason) detailsArray.push(`السبب: ${reason}`);
      
      const detailsStr = detailsArray.length > 0 ? detailsArray.join(' | ') : undefined;

      await prisma.logs.create({
        data: {
          Status: `تم تسجيل مغادرة داخلية للعاملة ${createarrivallist.Order?.HomeMaid?.Name || ''} بنجاح`,
          Details: detailsStr,
          homemaidId: createarrivallist.Order?.HomemaidId,
          userId: userId,
        },
      });
    } catch (error) {
      console.error("Error updatin logs:", error);
    }

    res.status(200).json(createarrivallist);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
}
