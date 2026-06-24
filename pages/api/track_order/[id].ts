import '../../../lib/loggers'; // استدعاء loggers.ts في بداية التطبيق


import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { jwtDecode } from 'jwt-decode';
import eventBus from 'lib/eventBus';
import prisma from 'lib/prisma';
import { getPageTitleArabic } from '../../../lib/pageTitleHelper';

/** تحليل YYYY-MM-DD كتاريخ تقويمي محلي والتحقق أنه ليس بعد اليوم (محلي الخادم). */
function parseContractDateNotFuture(dateValue: string): { ok: true; date: Date } | { ok: false; error: string } {
  const dateStr = typeof dateValue === 'string' ? dateValue.trim() : String(dateValue ?? '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!m) {
    return { ok: false, error: 'صيغة تاريخ العقد غير صالحة' };
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dateObj = new Date(y, mo, d);
  if (dateObj.getFullYear() !== y || dateObj.getMonth() !== mo || dateObj.getDate() !== d) {
    return { ok: false, error: 'تاريخ العقد غير صالح' };
  }
  const t = new Date();
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  if (dateObj.getTime() > today.getTime()) {
    return { ok: false, error: 'تاريخ العقد يجب أن يكون اليوم أو تاريخاً سابقاً، ولا يُقبل تاريخ مستقبلي' };
  }
  return { ok: true, date: dateObj };
}

function toLocalYmd(d: Date | string | null | undefined): string | null {
  if (d == null) return null;
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return null;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

function convert12hTo24h(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const cleanStr = timeStr.trim().toUpperCase();
  
  // Detect PM if string contains 'PM' or 'م'
  const isPm = cleanStr.includes('PM') || cleanStr.includes('م');
  const isAm = cleanStr.includes('AM') || cleanStr.includes('ص');
  
  // Extract hours and minutes
  const match = /(\d{1,2}):(\d{2})/.exec(cleanStr);
  if (!match) return cleanStr;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  
  if (isPm && hours < 12) hours += 12;
  if (isAm && hours === 12) hours = 0;
  
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}


function isStoredContractDateAfterToday(d: Date | string | null | undefined): boolean {
  const ymd = toLocalYmd(d);
  if (!ymd) return false;
  const t = new Date();
  const todayYmd = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  return ymd > todayYmd;
}

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
        details: pageTitle || null, // اسم الصفحة من العنوان
      } as any, // cast لحين إعادة توليد أنواع Prisma بعد إضافة الحقل
    });
    console.log('✅ تم حفظ السجل في systemUserLogs:', actionText);
  } catch (error) {
    console.error('❌ خطأ في حفظ السجل:', error);
  }
}

// دالة مساعدة لحفظ التعديلات في سجل أنشطة العاملة (logs)
async function logToHomemaidLogs(
  userId: string,
  homemaidId: number,
  status: string,
  details?: string,
  reason?: string
) {
  try {
    await prisma.logs.create({
      data: {
        userId,
        homemaidId,
        Status: status,
        Details: details,
        reason: reason,
      },
    });
    console.log('✅ تم حفظ السجل في logs (العاملة):', status);
  } catch (error) {
    console.error('❌ خطأ في حفظ السجل في logs:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
console.log(id)
  if (req.method === 'GET') {
    try {
      
      const order = await prisma.neworder.findUnique({
        where: { id: Number(id) },
        include: {
          client: {
            select: {
              id: true,
              nationalId:true,
              fullname: true,
              phonenumber: true,
              email: true,
            },
          },
          HomeMaid: {
            select: {
              office:{select:{Country:true}},id:true,
              Name: true,
              Passportnumber: true,
              Religion:true,
              Nationalitycopy: true,
              officeName: true,
            },
          },
          cancelledOrders: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { ReasonOfCancellation: true },
          },
          arrivals: {
            select: {
              DateOfApplication: true,
              travelPermit: true,
              externalOfficeStatus: true,
              medicalCheckFile: true,
              medicalCheckDate: true,
              approvalPayment: true,
              EmbassySealing: true,
              visaNumber: true,
              visaIssuanceDate: true,
              VisaFile: true,
              DeliveryDate: true,
              ticketFile: true,
              foreignLaborApproval: true,
              foreignLaborApprovalDate: true,
              additionalfiles: true,
              InternalmusanedContract: true,
              externalmusanedContract: true,
              office: true,
              deparatureCityCountry: true,
              deparatureCityCountryDate: true,
              deparatureCityCountryTime: true,
              arrivalSaudiAirport: true,
              KingdomentryDate: true,
              KingdomentryTime: true,
              receiptMethod: true,
              customTimelineStages: true,
              ExternalDateLinking: true,
              deliveryOfficer: true,
            } as any,
          },
          DeliveryDetails: {
            orderBy: {
              id: 'desc',
            },
            take: 1,
          },
          visa: {
            select: {
              id: true,
              visaNumber: true,
            },
          },
          clientAccountStatement: {
            select: { id: true },
            take: 1,
          },
          rejectedOrders: {
            include: {
              HomeMaid: {
                select: {
                  id: true,
                  Name: true,
                  Passportnumber: true,
                  Religion: true,
                  Nationalitycopy: true,
                  officeName: true,
                  office: { select: { Country: true } },
                },
              },
            },
          },
          cancelledOrders: {
            include: {
              HomeMaid: {
                select: {
                  id: true,
                  Name: true,
                  Passportnumber: true,
                  Religion: true,
                  Nationalitycopy: true,
                  officeName: true,
                  office: { select: { Country: true } },
                },
              },
            },
          },
          tickets_details: {
            orderBy: { id: 'desc' },
          },
        },
      });
      
      if (!order ) {
        return res.status(404).json({ error: 'الطلب غير موجود' });
      }

      const rawOrder: any[] = await prisma.$queryRawUnsafe(
        `SELECT Total, paid FROM neworder WHERE id = ?`,
        order.id
      );
      if (rawOrder && rawOrder[0]) {
        order.Total = rawOrder[0].Total != null ? Number(rawOrder[0].Total) : order.Total;
        order.paid = rawOrder[0].paid != null ? Number(rawOrder[0].paid) : order.paid;
      }
      // التحقق من bookingStatus وإنشاء arrival إذا لزم الأمر
      const excludedStatuses = ['new_order', 'neworder', 'cancelled', 'rejected', 'new_orders'];
      const currentStatus = order.bookingstatus?.toLowerCase() || '';
      
      if (!excludedStatuses.includes(currentStatus)) {
        // إذا كانت الحالة ليست في القائمة المستثناة، تحقق من وجود arrival
        const hasArrival = order.arrivals && order.arrivals.length > 0;
        
        if (!hasArrival) {
          // إنشاء arrival في الخلفية (بدون تعطيل الرد)
          setImmediate(async () => {
            try {
              await prisma.arrivallist.create({
                data: {
                  Order: { connect: { id: Number(id) } },
                },
              });
              console.log(`✅ تم إنشاء arrival تلقائياً للطلب ${id}`);
            } catch (error) {
              console.error(`❌ خطأ في إنشاء arrival للطلب ${id}:`, error);
            }
          });
        }
      }



      // مصدر بيانات العاملة: من الربط المباشر، أو من cancelledOrders/rejectedOrders عند فك الربط
      const isCancelled = ['cancelled', 'عقد ملغي'].includes(order.bookingstatus || '');
      const isRejected = ['rejected', 'طلب مرفوض'].includes(order.bookingstatus || '');
      const homemaidSource =
        order.HomeMaid ||
        (isCancelled ? (order as any).cancelledOrders?.[0]?.HomeMaid : null) ||
        (isRejected ? (order as any).rejectedOrders?.[0]?.HomeMaid : null);

      const orderData = {
        orderId: order.id,
        bookingStatus: order.bookingstatus,
        clientInfo: {
          id: order.client?.id.toString() || 'N/A',
          name: order.client?.fullname || 'N/A',
          phone: order.client?.phonenumber || 'N/A',
          email: order.client?.email || 'N/A',
        },
        homemaidInfo: {
          id: homemaidSource?.id?.toString() || 'N/A',
          name: homemaidSource?.Name || 'N/A',
          religion: homemaidSource?.Religion || 'N/A',
          passportNumber: homemaidSource?.Passportnumber || 'N/A',
          nationality: homemaidSource?.office?.Country || 'N/A',
          externalOffice: homemaidSource?.officeName || 'N/A',
        },
        applicationInfo: {
          applicationDate: order.createdAt?.toISOString().split('T')[0] || 'N/A',
          applicationTime: order.createdAt 
            ? new Date(order.createdAt.getTime() + (3 * 60 * 60 * 1000)).toISOString().split('T')[1]?.split('.')[0] || 'N/A'
            : 'N/A',
        },
        orderFiles: {
          orderDocument: order.orderDocument || null,
          contract: order.contract || null,
        },
        officeLinkInfo: {
          nationalId: order.client?.nationalId|| 'N/A',
          visaNumber: order.visa?.visaNumber || order.arrivals[0]?.visaNumber || 'N/A',
          internalMusanedContract: order.arrivals[0]?.InternalmusanedContract || 'N/A',
          musanedDate: order.arrivals[0]?.DateOfApplication ? (order.arrivals[0].DateOfApplication as Date).toISOString().split('T')[0] : 'N/A',
        },
        officeLinkApproval: {
          approved: !!order.arrivals[0]?.ExternalDateLinking,
        },
        externalOfficeInfo: {
          officeName: homemaidSource?.officeName || 'N/A',
          country: homemaidSource?.office?.Country || 'N/A',
          externalMusanedContract: order.arrivals[0]?.externalmusanedContract || 'N/A',
        },
        externalOfficeApproval: {
          approved: order.arrivals[0]?.externalOfficeStatus === 'approved',
        },
        medicalCheck: {
          passed: !!order.arrivals[0]?.medicalCheckDate,
          date: order.arrivals[0]?.medicalCheckDate
            ? (order.arrivals[0].medicalCheckDate as Date).toISOString()
            : null,
        },
        medicalFile: order.arrivals[0]?.medicalCheckFile || null,
        foreignLaborApproval: {
          approved: !!order.arrivals[0]?.foreignLaborApprovalDate,
        },
        agencyPayment: {
          paid: !!order.arrivals[0]?.approvalPayment,
        },
        saudiEmbassyApproval: {
          approved: !!order.arrivals[0]?.EmbassySealing,
        },
        visaIssuance: {
          issued: !!order.arrivals[0]?.visaIssuanceDate,
          visaFile: order.arrivals[0]?.VisaFile || null,
        },
        travelPermit: {
          issued: !!order.arrivals[0]?.travelPermit,
        },
        destinations: {
          departureCity: order.arrivals[0]?.deparatureCityCountry || 'N/A',
          arrivalCity: order.arrivals[0]?.arrivalSaudiAirport || 'N/A',
          arrivalSaudiAirport: order.arrivals[0]?.arrivalSaudiAirport || 'N/A',
          departureDateTime: order.arrivals[0]?.deparatureCityCountryDate
            ? `${(order.arrivals[0].deparatureCityCountryDate as Date).toISOString().split('T')[0]} ${convert12hTo24h(order.arrivals[0].deparatureCityCountryTime || '')}`.trim()
            : 'N/A',
          arrivalDateTime: order.arrivals[0]?.KingdomentryDate
            ? `${(order.arrivals[0].KingdomentryDate as Date).toISOString().split('T')[0]} ${convert12hTo24h(order.arrivals[0].KingdomentryTime || '')}`.trim()
            : 'N/A',
          deliveryOfficer: order.arrivals[0]?.deliveryOfficer || null,
        },
        receipt: {
          received: !!order.arrivals[0]?.DeliveryDate, // Fixed condition
          method: order.arrivals[0]?.receiptMethod || null,
        },
        ticketUpload: {
          files: order.arrivals[0]?.ticketFile || null,
        },
        nationality: homemaidSource?.office?.Country || 'N/A',
        documentUpload: {
          files: order.arrivals[0]?.additionalfiles || null,
        },
        deliveryDetails: order.DeliveryDetails && order.DeliveryDetails.length > 0 ? {
          deliveryDate: order.DeliveryDetails[0].deliveryDate 
            ? (order.DeliveryDetails[0].deliveryDate as Date).toISOString().split('T')[0] 
            : undefined,
          deliveryTime: order.DeliveryDetails[0].deliveryTime || undefined,
          deliveryFile: order.DeliveryDetails[0].deliveryFile || null,
          deliveryNotes: order.DeliveryDetails[0].deliveryNotes || undefined,
          cost: order.DeliveryDetails[0].cost ? order.DeliveryDetails[0].cost.toString() : undefined,
        } : undefined,
        customTimelineStages: order.arrivals[0]?.customTimelineStages || {},
        accountingStatementId: (order as any).clientAccountStatement?.[0]?.id ?? null,
        totalAmount: order.Total ?? null,
        paidAmount: order.paid ?? null,
        reasonOfRejection: (order as any).rejectedOrders?.[0]?.ReasonOfRejection ?? order.ReasonOfRejection ?? null,
        reasonOfCancellation: (order as any).cancelledOrders?.[0]?.ReasonOfCancellation ?? order.ReasonOfCancellation ?? null,
        cancelledOrderNationality: (order as any).cancelledOrders?.[0]?.HomeMaid?.office?.Country ?? null,
        ticketsDetails: ((order as any).tickets_details || []).map((t: any) => ({
          id: t.id,
          order_id: t.order_id,
          reference_id: t.reference_id ?? null,
          airlines: t.airlines ?? null,
          flight_number: t.flight_number ?? null,
          departure_date: t.departure_date
            ? (t.departure_date instanceof Date ? t.departure_date : new Date(t.departure_date)).toISOString().split('T')[0]
            : null,
          departure_time: t.departure_time ?? null,
          arrival_date: t.arrival_date
            ? (t.arrival_date instanceof Date ? t.arrival_date : new Date(t.arrival_date)).toISOString().split('T')[0]
            : null,
          arrival_time: t.arrival_time ?? null,
          departure_airport: t.departure_airport ?? null,
          arrival_airport: t.arrival_airport ?? null,
          ticketFile: t.ticketFile ?? null,
          createdAt: t.createdAt
            ? (t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt)).toISOString()
            : null,
        })),
      };
const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }
    console.log(cookies.authToken)
    const token = jwtDecode(cookies.authToken) as any;

    eventBus.emit('ACTION', {
         type: "عرض صفحة تتبع طلب " + order.id,
    beneficiary: "order",
    pageRoute: req.headers.referer || '/admin/track_order',
    actionType: "view",
    userId: Number((token as any).id),
    BeneficiaryId: Number(id),
      });
      console.log('Emitted ACTION event for order:', order.id);
      return res.status(200).json(orderData);  
    } catch (error) {
      console.error('Error fetching order:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
    // الحصول على معلومات المستخدم من التوكن
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach(cookie => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }
    const token = cookies.authToken ? jwtDecode(cookies.authToken) as any : null;
    const userId = token?.id || 0;
    const pageRoute = req.headers.referer || '/admin/track_order';

    try {
      const { field, value, section, updatedData, customStageMeta } = req.body;
      console.log('⏰ الوقت:', new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' }));
      console.log('🆔 رقم الطلب:', id);
      console.log('👤 المستخدم:', userId);
      console.log('📋 محتوى الطلب:', { field, value, section, updatedData });

      const order = await prisma.neworder.findUnique({
        where: { id: Number(id) },
        include: { 
          arrivals: true,
          client: true,
          HomeMaid: true,
          visa: true,
        },
      });

      if (order) {
        const rawOrder: any[] = await prisma.$queryRawUnsafe(
          `SELECT Total, paid FROM neworder WHERE id = ?`,
          order.id
        );
        if (rawOrder && rawOrder[0]) {
          order.Total = rawOrder[0].Total != null ? Number(rawOrder[0].Total) : order.Total;
          order.paid = rawOrder[0].paid != null ? Number(rawOrder[0].paid) : order.paid;
        }
      }

      if(order?.bookingstatus ==="new_order"){
  return res.status(404).json({ error: 'لا يمكن تعديل الطلب الا بعد قبوله من صفحة الطلبات الجديدة' });
  }  
        
      if (!order || !order.arrivals || order.arrivals.length === 0) {
        return res.status(404).json({ error: 'بيانات الوصول غير متاحة .. يرجى التأكيد من حالة الطلب' });
      }

      if (section === 'medicalCheckFailed') {
        const oldArrival = order.arrivals[0];

        // 1. Cancel old order & unlink maid
        await prisma.neworder.update({
          where: { id: Number(id) },
          data: {
            bookingstatus: 'cancelled',
            clientBookingStatus: 'cancelled',
            ReasonOfCancellation: 'لم تجتز العاملة الفحص الطبي',
            HomemaidId: null, // فك ارتباط العاملة بالطلب القديم
          }
        });

        // Add to cancelledOrders
        if (order.HomemaidId) {
          await prisma.cancelledOrders.create({
            data: {
              order_id: Number(id),
              HomeMaidId: order.HomemaidId,
            }
          });

          // Update old maid profile
          const oldMaid = await prisma.homemaid.findUnique({ where: { id: order.HomemaidId } });
          const newNotes = oldMaid?.notes ? `${oldMaid.notes} | تم إلغاء الطلب رقم ${id} بسبب عدم اجتياز الفحص الطبي` : `تم إلغاء الطلب رقم ${id} بسبب عدم اجتياز الفحص الطبي`;
          await prisma.homemaid.update({
            where: { id: order.HomemaidId },
            data: {
              notes: newNotes,
              isApproved: false, // تختفي من الموقع
              bookingstatus: 'غير لائقة طبيا', // تحويل حالتها لـ غير لائقة طبياً
            }
          });
        }

        // Log in system
        if (token) {
          await prisma.systemUserLogs.create({
            data: {
              userId: Number(userId),
              action: 'cancelled_medical_failed',
              details: `تم إلغاء الطلب ${id} بسبب عدم اجتياز الفحص الطبي وإحلال طلب جديد`,
            }
          });
        }

        // 2. Create new order
        const newOrder = await prisma.neworder.create({
          data: {
            ClientName: order.ClientName,
            PhoneNumber: order.PhoneNumber,
            clientID: order.clientID,
            HomemaidId: null, // No maid yet
            isAvailable: true,
            orderDocument: order.orderDocument as any,
            contract: order.contract,
            bookingstatus: 'pending_external_office',
            clientBookingStatus: 'pending_external_office',
            typeOfContract: order.typeOfContract,
            Nationality: order.Nationality,
            Religion: order.Religion,
            Passportnumber: null,
            nationalId: order.nationalId,
            clientphonenumber: order.clientphonenumber,
            ExperienceYears: order.ExperienceYears,
            maritalstatus: null,
            Experience: null,
            dateofbirth: null,
            age: null,
            PaymentMethod: order.PaymentMethod,
            Total: order.Total,
            paid: order.paid,
            visaId: order.visaId,
            ages: null,
          }
        });

        // 3. Create arrival list for new order
        await prisma.arrivallist.create({
          data: {
            OrderId: newOrder.id,
            SponsorName: oldArrival.SponsorName,
            SponsorIdnumber: oldArrival.SponsorIdnumber,
            nationalidNumber: oldArrival.nationalidNumber,
            VisaFile: oldArrival.VisaFile,
            visaNumber: oldArrival.visaNumber,
            InternalmusanedContract: oldArrival.InternalmusanedContract,
            DateOfApplication: oldArrival.DateOfApplication,
            externalmusanedContract: oldArrival.externalmusanedContract,
            ExternalDateLinking: oldArrival.ExternalDateLinking,
          }
        });

        // 4. Move financials
        await prisma.clientAccountStatement.updateMany({
          where: { orderId: Number(id) },
          data: { orderId: newOrder.id, contractNumber: `ORD-${newOrder.id}` }
        });

        try {
          // transactions might be misspelled as 'transactios' or 'transactions' in schema, checking Prisma type:
          await (prisma as any).transactions?.updateMany({
            where: { order_id: Number(id) },
            data: { order_id: newOrder.id }
          });
        } catch (e) {}

        return res.status(200).json({ success: true, newOrderId: newOrder.id });
      }

      if (section === 'assign_maid') {
        const { homemaidId } = updatedData;
        if (!homemaidId) return res.status(400).json({ error: 'عاملة غير محددة' });

        const homemaid = await prisma.homemaid.findUnique({ where: { id: Number(homemaidId) } });
        if (!homemaid) return res.status(404).json({ error: 'العاملة غير موجودة' });

        // Reactivate if medically unfit
        let wasUnfit = false;
        if (homemaid.bookingstatus === 'غير لائقة طبيا' || homemaid.bookingstatus === 'غير لائقة طبياً') {
          wasUnfit = true;
          await prisma.homemaid.update({
            where: { id: homemaid.id },
            data: {
              bookingstatus: '',
              isApproved: true,
            }
          });
          
          const username = token?.username || 'system';
          await logToHomemaidLogs(
            username,
            homemaid.id,
            'إعادة تنشيط تلقائي',
            `تمت إعادة تنشيط العاملة تلقائياً عند ربطها بالطلب رقم ${id} بعد فشل فحصها الطبي السابق`,
            `تخصيص كبديل`
          );
        }

        // Link maid to order
        await prisma.neworder.update({
          where: { id: Number(id) },
          data: {
            HomemaidId: homemaid.id,
            HomemaidIdCopy: homemaid.id,
          }
        });

        // Update arrival list with maid data
        await prisma.arrivallist.updateMany({
          where: { OrderId: Number(id) },
          data: {
            HomemaIdnumber: homemaid.id,
            HomemaidName: homemaid.Name,
            PassportNumber: homemaid.Passportnumber,
            externalmusanedContract: null,
            ExternalDateLinking: null,
          }
        });

        // Mark maid as unavailable
        const newNotes = homemaid.notes ? `${homemaid.notes} | تم تخصيص العاملة كبديل في الطلب رقم ${id}` : `تم تخصيص العاملة كبديل في الطلب رقم ${id}`;
        await prisma.homemaid.update({
          where: { id: homemaid.id },
          data: { notes: newNotes }
        });

        // Log in system
        if (token) {
          await prisma.systemUserLogs.create({
            data: {
              userId: Number(userId),
              action: 'assign_replacement_maid',
              details: `تم اختيار العاملة البديلة #${homemaid.id} للطلب رقم ${id}`,
            }
          });
        }

        return res.status(200).json({ success: true });
      }

      // Handle existing status updates
      if (field) {
        const validFields = [
          'officeLinkApproval',
          'externalOfficeApproval',
          'medicalCheck',
          'foreignLaborApproval',
          'agencyPayment',
          'saudiEmbassyApproval',
          'visaIssuance',
          'travelPermit',
          'receipt',
          'destinations',
          'bookingStatus',
        ];

        // إذا كان الحقل غير موجود في validFields، قد يكون حقل مخصص
        if (!validFields.includes(field)) {
          console.log('🔧 تعديل حقل مخصص:', field);
          
          // معالجة الحقول المخصصة - تخزينها في customTimelineStages
          const arrival = await prisma.arrivallist.findFirst({
            where: { OrderId: Number(id) },
          });
          if (!arrival) {
            return res.status(404).json({ error: 'بيانات الوصول غير متاحة .. يرجى التأكيد من حالة الطلب' });
          }

          // جلب البيانات الحالية
          const currentStages = (arrival.customTimelineStages as any) || {};
          const oldValue = currentStages[field]?.completed || false;

          const incomingMeta =
            customStageMeta && typeof customStageMeta === 'object' ? customStageMeta : {};

          // تحديث حالة المرحلة المخصصة (مع دعم إجابة سؤال / رابط ملف من التايم لاين المخصص)
          if (!value) {
            currentStages[field] = {
              completed: false,
              date: null,
            };
          } else {
            const entry: Record<string, unknown> = {
              completed: true,
              date: new Date(),
            };
            if (incomingMeta.answer !== undefined) {
              entry.answer = incomingMeta.answer;
            }
            if (incomingMeta.fileUrl !== undefined) {
              entry.fileUrl = incomingMeta.fileUrl;
            }
            currentStages[field] = entry;
          }

          // حفظ البيانات المحدثة
          await prisma.arrivallist.updateMany({
            where: { OrderId: Number(id) },
            data: {
              customTimelineStages: currentStages,
            },
          });

          // حفظ في systemUserLogs
          await logToSystemLogs(
            userId,
            'update',
            `تعديل حقل مخصص "${field}" في الطلب ${id} من "${oldValue ? 'مكتمل' : 'غير مكتمل'}" إلى "${value ? 'مكتمل' : 'غير مكتمل'}"`,
            'order',
            Number(id),
            pageRoute
          );

          // حفظ في سجل أنشطة العاملة
          if (order.HomemaidId) {
            const username = token?.username || 'system';
            await logToHomemaidLogs(
              username,
              order.HomemaidId,
              'تعديل حقل مخصص في الطلب',
              `تم تعديل حقل "${field}" في الطلب ${id} من "${oldValue ? 'مكتمل' : 'غير مكتمل'}" إلى "${value ? 'مكتمل' : 'غير مكتمل'}"`,
              `تعديل في صفحة تتبع الطلب`
            );
          }

          console.log('✅ تم تحديث الحقل المخصص وحفظه في السجلات');
          return res.status(200).json({ message: 'Custom field updated successfully' });
        }

        const updateData: any = {};
        const arrivalUpdate: any = {};
        let logMessage = '';

        switch (field) {
          case 'officeLinkApproval':
            if (value) {
              const contractDate = order.arrivals[0]?.DateOfApplication;
              if (!contractDate) {
                return res.status(400).json({ error: 'تاريخ العقد مطلوب قبل تأكيد الموافقة' });
              }
              if (isStoredContractDateAfterToday(contractDate as Date)) {
                return res.status(400).json({
                  error: 'تاريخ العقد يجب أن يكون اليوم أو تاريخاً سابقاً، ولا يُقبل تاريخ مستقبلي',
                });
              }
            }
            const oldOfficeLink = order.arrivals[0]?.ExternalDateLinking ? 'مكتمل' : 'غير مكتمل';
            if (value) {
              arrivalUpdate.ExternalDateLinking = new Date();
              updateData.bookingstatus = 'office_link_approved';
            } else {
              arrivalUpdate.ExternalDateLinking = null;
              arrivalUpdate.InternalmusanedContract = null;
              arrivalUpdate.DateOfApplication = null;
              updateData.bookingstatus = 'new_order';
            }
            logMessage = `تعديل موافقة الربط مع إدارة المكاتب في الطلب ${id} من "${oldOfficeLink}" إلى "${value ? 'مكتمل' : 'غير مكتمل'}"`;
            break;
          case 'externalOfficeApproval':
            const oldExtStatus = order.arrivals[0]?.externalOfficeStatus;
            arrivalUpdate.externalOfficeStatus = value ? 'approved' : 'pending';
            arrivalUpdate.ExternalOFficeApproval = value ? new Date() : null;
            updateData.bookingstatus = value ? 'external_office_approved' : 'pending_external_office';
            logMessage = `تعديل موافقة المكتب الخارجي في الطلب ${id} من "${oldExtStatus}" إلى "${value ? 'approved' : 'pending'}"`;
            break;
          case 'medicalCheck':
            const oldMedical = order.arrivals[0]?.medicalCheckDate ? 'مكتمل' : 'غير مكتمل';
            arrivalUpdate.medicalCheckFile = value ? undefined : null;
            arrivalUpdate.medicalCheckDate = value ? new Date() : null;
            updateData.bookingstatus = value ? 'medical_check_passed' : 'pending_medical_check';
            logMessage = `تعديل الفحص الطبي في الطلب ${id} من "${oldMedical}" إلى "${value ? 'مكتمل' : 'غير مكتمل'}"`;
            break;
          case 'foreignLaborApproval':
            const oldLabor = order.arrivals[0]?.foreignLaborApprovalDate ? 'مكتمل' : 'غير مكتمل';
            arrivalUpdate.foreignLaborApproval = value ? true : false;
            arrivalUpdate.foreignLaborApprovalDate = value ? new Date() : null;
            updateData.bookingstatus = value ? 'foreign_labor_approved' : 'pending_foreign_labor';
            logMessage = `تعديل موافقة العمالة الأجنبية في الطلب ${id} من "${oldLabor}" إلى "${value ? 'مكتمل' : 'غير مكتمل'}"`;
            break;
          case 'agencyPayment':
            const oldPayment = order.arrivals[0]?.approvalPayment || 'غير مدفوع';
            arrivalUpdate.approvalPayment = value ? 'paid' : null;
            updateData.bookingstatus = value ? 'agency_paid' : 'pending_agency_payment';
            logMessage = `تعديل دفع الوكالة في الطلب ${id} من "${oldPayment}" إلى "${value ? 'paid' : 'غير مدفوع'}"`;
            break;
          case 'saudiEmbassyApproval':
            const oldEmbassy = order.arrivals[0]?.EmbassySealing ? 'مكتمل' : 'غير مكتمل';
            arrivalUpdate.EmbassySealing = value ? new Date() : null;
            updateData.bookingstatus = value ? 'embassy_approved' : 'pending_embassy';
            logMessage = `تعديل موافقة السفارة السعودية في الطلب ${id} من "${oldEmbassy}" إلى "${value ? 'مكتمل' : 'غير مكتمل'}"`;
            break;
          case 'visaIssuance':
            const oldVisa = order.arrivals[0]?.visaIssuanceDate ? 'مكتمل' : 'غير مكتمل';
            arrivalUpdate.visaIssuanceDate = value ? new Date() : null;
            updateData.bookingstatus = value ? 'visa_issued' : 'pending_visa';
            logMessage = `تعديل إصدار التأشيرة في الطلب ${id} من "${oldVisa}" إلى "${value ? 'مكتمل' : 'غير مكتمل'}"`;
            break;
          case 'travelPermit':
            const oldPermit = order.arrivals[0]?.travelPermit || 'غير صادر';
            arrivalUpdate.travelPermit = value ? 'issued' : null;
            arrivalUpdate.travelPermitDate = value ? new Date() : null;
            updateData.bookingstatus = value ? 'travel_permit_issued' : 'pending_travel_permit';
            logMessage = `تعديل تصريح السفر في الطلب ${id} من "${oldPermit}" إلى "${value ? 'issued' : 'غير صادر'}"`;
            break;
          case 'receipt':
            const oldReceipt = order.arrivals[0]?.DeliveryDate ? 'مستلم' : 'غير مستلم';
            arrivalUpdate.DeliveryDate = value ? new Date() : null;
            updateData.bookingstatus = value ? 'received' : 'pending_receipt';
            logMessage = `تعديل الاستلام في الطلب ${id} من "${oldReceipt}" إلى "${value ? 'مستلم' : 'غير مستلم'}"`;
            // إضافة طريقة الاستلام إذا تم تمريرها
            if (section === 'receipt' && updatedData && updatedData.method) {
              arrivalUpdate.receiptMethod = updatedData.method;
              logMessage += ` - طريقة الاستلام: ${updatedData.method}`;
            }
            break;
          case 'bookingStatus':
            const oldBooking = order.bookingstatus;
            if (value === 'cancelled') {
              updateData.bookingstatus = 'cancelled';
              arrivalUpdate.externalOfficeStatus = 'cancelled';
              // حفظ سبب الإلغاء إذا تم إرساله
              if (req.body.cancellationReason) {
                updateData.ReasonOfCancellation = req.body.cancellationReason;
                logMessage = `تعديل حالة الحجز في الطلب ${id} من "${oldBooking}" إلى "cancelled" - سبب الإلغاء: ${req.body.cancellationReason}`;
              } else {
                logMessage = `تعديل حالة الحجز في الطلب ${id} من "${oldBooking}" إلى "cancelled"`;
              }
            } else {
              return res.status(400).json({ error: 'Invalid bookingStatus value' });
            }
            break;
          case 'destinations':
            const oldDestinations = order.arrivals[0]?.deparatureCityCountry ? 'مكتمل' : 'غير مكتمل';
            
            // عند التراجع (value = false)، نقوم بمسح البيانات
            if (!value) {
                arrivalUpdate.deparatureCityCountry = null;
                arrivalUpdate.deparatureCityCountryDate = null;
                arrivalUpdate.deparatureCityCountryTime = null;
                arrivalUpdate.arrivalSaudiAirport = null;
                arrivalUpdate.KingdomentryDate = null;
                arrivalUpdate.KingdomentryTime = null; // Also clear arrival time
                arrivalUpdate.ticketFile = null;
                
                // Revert booking status to travel_permit_issued
                updateData.bookingstatus = 'travel_permit_issued';

                logMessage = `تراجع عن الوجهات في الطلب ${id} - تم حذف بيانات المغادرة والوصول والعودة لحالة travel_permit_issued`;
            }
            break;
        }

        console.log('💾 حفظ التعديلات...');
        if (updateData.bookingstatus) {
          if (updateData.bookingstatus === 'medical_check_passed') {
            updateData.clientBookingStatus = 'pending_foreign_labor';
          } else if (
            updateData.bookingstatus === 'foreign_labor_approved' ||
            updateData.bookingstatus === 'pending_agency_payment' ||
            updateData.bookingstatus === 'agency_paid' ||
            updateData.bookingstatus === 'pending_embassy'
          ) {
            updateData.clientBookingStatus = 'pending_embassy';
          } else if (updateData.bookingstatus === 'embassy_approved') {
            updateData.clientBookingStatus = 'pending_visa';
          } else if (updateData.bookingstatus === 'visa_issued') {
            updateData.clientBookingStatus = 'pending_travel_permit';
          } else if (updateData.bookingstatus === 'travel_permit_issued') {
            updateData.clientBookingStatus = 'pending_tickets';
          } else if (updateData.bookingstatus === 'pending_receipt') {
            updateData.clientBookingStatus = 'pending_arrival';
          } else if (updateData.bookingstatus === 'office_link_approved') {
            updateData.clientBookingStatus = 'pending_external_office';
          } else {
            updateData.clientBookingStatus = updateData.bookingstatus;
          }
        }
        const [updatedOrder, updatedArrivals] = await prisma.$transaction([
          prisma.neworder.update({
            where: { id: Number(id) },
            data: updateData,
          }),
          prisma.arrivallist.updateMany({
            where: { OrderId: Number(id) },
            data: arrivalUpdate,
          }),
        ]);

        console.log('✅ تم حفظ التعديلات بنجاح');

        // حفظ في systemUserLogs
        await logToSystemLogs(
          userId,
          'update',
          logMessage,
          'order',
          Number(id),
          pageRoute
        );

        // حفظ في سجل أنشطة العاملة
        if (order.HomemaidId) {
          const username = token?.username || 'system';
          await logToHomemaidLogs(
            username,
            order.HomemaidId,
            'تعديل حالة في الطلب',
            logMessage,
            `تعديل حقل: ${field}`
          );
        }

        eventBus.emit('ACTION', {
            type: 'تعديل صفحة تتبع طلب ' + order.id,
            beneficiary: "order",
            pageRoute: pageRoute,
            actionType: "update",
            userId: userId,
            BeneficiaryId: Number(id),
          });

        console.log('========== نهاية تعديل طلب ==========\n');
        return res.status(200).json({ message: 'Status updated successfully' });
      }

      // Handle editable section updates
      if (section && updatedData) {
        console.log('📝 تعديل قسم:', section);
        const updateData: any = {};
        const arrivalUpdate: any = {};
        const changes: string[] = [];


        switch (section) {
          case 'orderFiles': {
            console.log('📎 تعديل ملفات الطلب');
            // Update attachments stored directly on neworder
            if (Object.prototype.hasOwnProperty.call(updatedData, 'orderDocument')) {
              const raw = updatedData.orderDocument;
              const normalized =
                raw === null || raw === undefined
                  ? null
                  : typeof raw === 'string'
                    ? (raw.trim() ? raw.trim() : null)
                    : String(raw);
              const oldDoc = order.orderDocument;
              updateData.orderDocument = normalized;
              changes.push(`وثيقة الطلب: من "${oldDoc || 'فارغ'}" إلى "${normalized || 'فارغ'}"`);
            }

            if (Object.prototype.hasOwnProperty.call(updatedData, 'contract')) {
              const raw = updatedData.contract;
              const normalized =
                raw === null || raw === undefined
                  ? null
                  : typeof raw === 'string'
                    ? (raw.trim() ? raw.trim() : null)
                    : String(raw);
              const oldContract = order.contract;
              updateData.contract = normalized;
              changes.push(`العقد: من "${oldContract || 'فارغ'}" إلى "${normalized || 'فارغ'}"`);
            }
            break;
          }
          case 'medical':
            console.log('🏥 تعديل ملف الفحص الطبي');
            if (updatedData.medicalCheckFile) {
              const oldFile = order.arrivals[0]?.medicalCheckFile;
              arrivalUpdate.medicalCheckFile = updatedData.medicalCheckFile;
              changes.push(`ملف الفحص الطبي: تم التحديث`);
            }
            break;
          case 'visaIssuance':
              console.log('🛂 تعديل ملف التأشيرة');
              if (Object.prototype.hasOwnProperty.call(updatedData, 'visaFile')) {
                arrivalUpdate.VisaFile = updatedData.visaFile;
                changes.push(`ملف التأشيرة: تم التحديث`);
              }
              break;
          case 'homemaidInfo':
            console.log('👩‍🦰 تعديل معلومات العاملة المنزلية');
            // if (!order.HomemaidId) {
            //   return res.status(400).json({ error: 'No Homemaid associated with this order' });
            // }
            console.log('👩‍🦰 تعديل معلومات العاملة المنزلية', updatedData['id']);
            
            // التحقق من أن العاملة ليست محجوزة في طلب نشط آخر
            const activeOrder = await prisma.neworder.findFirst({
              where: {
                HomemaidId: Number(updatedData['id']),
                bookingstatus: {
                  notIn: ['cancelled', 'rejected']
                },
                id: { not: Number(id) } // استثناء الطلب الحالي
              }
            });

            // إذا وُجدت العاملة في طلب نشط آخر، لا يمكن استخدامها
            if (activeOrder) {
              return res.status(400).json({ error: 'العاملة محجوزة في طلب آخر نشط' });
            }

            const oldHomemaidId = order.HomemaidId;
            const newHomemaidId = updatedData['id'] ? Number(updatedData['id']) : order.HomemaidId;
            
            // Reactivate if medically unfit
            if (newHomemaidId) {
              const homemaidObj = await prisma.homemaid.findUnique({ where: { id: Number(newHomemaidId) } });
              if (homemaidObj && (homemaidObj.bookingstatus === 'غير لائقة طبيا' || homemaidObj.bookingstatus === 'غير لائقة طبياً')) {
                await prisma.homemaid.update({
                  where: { id: homemaidObj.id },
                  data: {
                    bookingstatus: '',
                    isApproved: true,
                  }
                });
                const username = token?.username || 'system';
                await logToHomemaidLogs(
                  username,
                  homemaidObj.id,
                  'إعادة تنشيط تلقائي',
                  `تمت إعادة تنشيط العاملة تلقائياً عند ربطها بالطلب رقم ${id} بعد فشل فحصها الطبي السابق`,
                  `تغيير العاملة في صفحة تتبع الطلب`
                );
              }
            }

            // إذا كانت العاملة في طلب ملغي/مرفوض، نحررها أولاً
            const cancelledOrRejectedOrder = await prisma.neworder.findFirst({
              where: {
                HomemaidId: Number(updatedData['id']),
                bookingstatus: {
                  in: ['cancelled', 'rejected']
                },
                id: { not: Number(id) } // استثناء الطلب الحالي
              }
            });

            let updatedHomemaid;
            
            if (cancelledOrRejectedOrder) {
              // تحرير العاملة من الطلب الملغي/المرفوض وإضافتها للطلب الحالي في transaction واحدة
              console.log(`🔓 تحرير العاملة ${newHomemaidId} من الطلب ${cancelledOrRejectedOrder.id} (${cancelledOrRejectedOrder.bookingstatus})`);
              
              const result = await prisma.$transaction(async (tx) => {
                // حفظ العاملة القديمة في HomemaidIdCopy للطلب الملغي/المرفوض وحذف HomemaidId
                await tx.neworder.update({
                  where: { id: cancelledOrRejectedOrder.id },
                  data: {
                    HomemaidIdCopy: cancelledOrRejectedOrder.HomemaidId,
                    HomemaidId: null, // تحرير العاملة
                  }
                });
                
                // تحديث الطلب الحالي ليأخذ العاملة الجديدة
                const updated = await tx.neworder.update({
                  include: { HomeMaid: true },
                  where: { id: Number(id) },
                  data: {
                    HomemaidIdCopy: newHomemaidId,
                    HomemaidId: newHomemaidId,
                  },
                });

                // مسح رقم عقد التوثيق للمكتب الخارجي عند تغيير العاملة
                await tx.arrivallist.updateMany({
                  where: { OrderId: Number(id) },
                  data: {
                    externalmusanedContract: null,
                    ExternalDateLinking: null,
                  }
                });
                
                return updated;
              });
              
              updatedHomemaid = result;
              console.log(`✅ تم تحرير العاملة وإضافتها للطلب الحالي بنجاح`);
            } else {
              // لا يوجد تضارب، تحديث عادي
              updatedHomemaid = await prisma.neworder.update({
                include: { HomeMaid: true },
                where: { id: Number(id) },
                data: {
                  HomemaidIdCopy: newHomemaidId,
                  HomemaidId: newHomemaidId,
                },
              });

              // مسح رقم عقد التوثيق للمكتب الخارجي عند تغيير العاملة
              await prisma.arrivallist.updateMany({
                where: { OrderId: Number(id) },
                data: {
                  externalmusanedContract: null,
                  ExternalDateLinking: null,
                }
              });
            }
            
            changes.push(`العاملة المنزلية: من معرف ${oldHomemaidId} إلى معرف ${newHomemaidId} (${updatedHomemaid.HomeMaid?.Name})`);
            
            // حفظ في سجل أنشطة العاملة القديمة
            if (oldHomemaidId) {
              const username = token?.username || 'system';
              await logToHomemaidLogs(
                username,
                oldHomemaidId,
                'إزالة من الطلب',
                `تم إزالة العاملة من الطلب ${id} واستبدالها بعاملة أخرى (معرف: ${newHomemaidId})`,
                `تغيير العاملة في صفحة تتبع الطلب`
              );
            }
            
            // حفظ في سجل أنشطة العاملة الجديدة
            if (newHomemaidId && newHomemaidId !== oldHomemaidId) {
              const username = token?.username || 'system';
              await logToHomemaidLogs(
                username,
                newHomemaidId,
                'إضافة إلى الطلب',
                `تم إضافة العاملة إلى الطلب ${id} (${updatedHomemaid.HomeMaid?.Name})`,
                `تغيير العاملة في صفحة تتبع الطلب`
              );
            }
            break;

          case 'officeLinkInfo':
            console.log('🔗 تعديل معلومات ربط المكتب');
            if (updatedData['هوية العميل']) {
              const oldNationalId = order.client?.nationalId;

              //اتاكد ان الNATIONALI iD  مش متسجل مسبقا

              // const find = await prisma.client.findFirst({where:{nationalId:updatedData['هوية العميل']}})
              // if(find){
              //   return res.status(404).json({ error: 'هوية العميل متسجلة مسبقا' });
              // }
              const newNationalId = updatedData['هوية العميل'].trim();
              
              // تحديث هوية العميل في جدول client
              if (order.clientID) {
                await prisma.client.update({
                  where: { id: order.clientID },
                  data: { nationalId: newNationalId },
                });
              }
              
              changes.push(`هوية العميل: من "${oldNationalId || 'فارغ'}" إلى "${newNationalId}"`);
            }
            if (updatedData['رقم التأشيرة']) {
              const visaRaw = updatedData['رقم التأشيرة'];
              const visa = typeof visaRaw === 'string' ? visaRaw.trim() : String(visaRaw ?? '').trim();
              const oldVisa = order.visa?.visaNumber || order.arrivals[0]?.visaNumber;

              // Normalize display placeholder
              if (!visa || visa === 'N/A') {
                arrivalUpdate.visaNumber = null;
                changes.push(`رقم التأشيرة: من "${oldVisa || 'فارغ'}" إلى "فارغ"`);
              } else {
                if (!/^\d+$/.test(visa)) {
                  return res.status(400).json({ error: 'رقم التأشيرة يجب أن يحتوي على أرقام فقط' });
                }
                if (!visa.startsWith('190')) {
                  return res.status(400).json({ error: 'رقم التأشيرة يجب أن يبدأ بـ 190' });
                }
                if (visa.length !== 10) {
                  return res.status(400).json({ error: 'رقم التأشيرة يجب أن يكون 10 أرقام' });
                }
                arrivalUpdate.visaNumber = visa;
                changes.push(`رقم التأشيرة: من "${oldVisa || 'فارغ'}" إلى "${visa}"`);
              }
            }
            if (Object.prototype.hasOwnProperty.call(updatedData, 'رقم عقد إدارة المكاتب')) {
              const oldContract = order.arrivals[0]?.InternalmusanedContract;
              const contractRaw = updatedData['رقم عقد إدارة المكاتب'];
              const contract = typeof contractRaw === 'string' ? contractRaw.trim() : String(contractRaw ?? '').trim();

              // Normalize display placeholder
              if (!contract || contract === 'N/A' || contract === '') {
                arrivalUpdate.InternalmusanedContract = null;
                changes.push(`رقم عقد إدارة المكاتب: من "${oldContract || 'فارغ'}" إلى "فارغ"`);
              } else {
                // Validate contract number format
                if (!/^\d+$/.test(contract)) {
                  return res.status(400).json({ error: 'رقم العقد يجب أن يحتوي على أرقام فقط' });
                }
                /*
                if (!contract.startsWith('20')) {
                  return res.status(400).json({ error: 'رقم العقد يجب أن يبدأ بـ 20' });
                }
                if (contract.length !== 10) {
                  return res.status(400).json({ error: 'رقم العقد يجب أن يكون 10 أرقام' });
                }
                */
                arrivalUpdate.InternalmusanedContract = contract;
                changes.push(`رقم عقد إدارة المكاتب: من "${oldContract || 'فارغ'}" إلى "${contract}"`);
              }
            }
            if (updatedData['تاريخ العقد']) {
              const oldDate = order.arrivals[0]?.DateOfApplication;
              const dateValue = updatedData['تاريخ العقد'];
              const parsed = parseContractDateNotFuture(dateValue);
              if (!parsed.ok) {
                return res.status(400).json({ error: parsed.error });
              }
              arrivalUpdate.DateOfApplication = parsed.date;
              changes.push(`تاريخ العقد: من "${oldDate || 'فارغ'}" إلى "${dateValue}"`);
            }
            
            // الموافقة التلقائية عند وجود رقم عقد إدارة المكاتب (بعد جميع التحديثات)
            const finalContractNumber = arrivalUpdate.InternalmusanedContract || order.arrivals[0]?.InternalmusanedContract;
            if (finalContractNumber && typeof finalContractNumber === 'string') {
              const contractValue = finalContractNumber.trim();
              if (contractValue && contractValue !== 'N/A' && contractValue !== '' && contractValue !== 'null') {
                // التحقق من أن الموافقة لم تتم بعد
                if (!order.arrivals[0]?.ExternalDateLinking && !arrivalUpdate.ExternalDateLinking) {
                  arrivalUpdate.ExternalDateLinking = new Date();
                  updateData.bookingstatus = 'office_link_approved';
                  changes.push('تم تأكيد الموافقة تلقائياً بسبب وجود رقم عقد إدارة المكاتب');
                  console.log('✅ تم تأكيد الموافقة تلقائياً بسبب وجود رقم عقد إدارة المكاتب');
                }
              }
            }
            break;
          case 'externalOfficeInfo':
            console.log('🏢 تعديل معلومات المكتب الخارجي');
            if (updatedData['اسم المكتب الخارجي']) {
              const oldOfficeName = order.HomeMaid?.officeName;
              await prisma.homemaid.update({
                where: { id: order.HomemaidId || 0 },
                data: { officeName: updatedData['اسم المكتب الخارجي'] },
              });
              changes.push(`اسم المكتب الخارجي: من "${oldOfficeName || 'فارغ'}" إلى "${updatedData['اسم المكتب الخارجي']}"`);
            }
            if (updatedData['دولة المكتب الخارجي']) {
              const oldOffice = order.arrivals[0]?.office;
              arrivalUpdate.office = updatedData['دولة المكتب الخارجي'];
              changes.push(`دولة المكتب الخارجي: من "${oldOffice || 'فارغ'}" إلى "${updatedData['دولة المكتب الخارجي']}"`);
            }
            if (Object.prototype.hasOwnProperty.call(updatedData, 'رقم عقد مساند التوثيق')) {
              const oldExtContract = order.arrivals[0]?.externalmusanedContract;
              const contractRaw = updatedData['رقم عقد مساند التوثيق'];
              const contract = typeof contractRaw === 'string' ? contractRaw.trim() : String(contractRaw ?? '').trim();

              if (!contract || contract === 'N/A' || contract === '') {
                 arrivalUpdate.externalmusanedContract = null;
                 changes.push(`رقم عقد مساند التوثيق: من "${oldExtContract || 'فارغ'}" إلى "فارغ"`);
              } else {
                 if (!/^\d+$/.test(contract)) {
                    return res.status(400).json({ error: 'رقم عقد مساند التوثيق يجب أن يحتوي على أرقام فقط' });
                 }
                 if (!contract.startsWith('20')) {
                    return res.status(400).json({ error: 'رقم عقد مساند التوثيق يجب أن يبدأ بـ 20' });
                 }
                 if (contract.length !== 10) {
                    return res.status(400).json({ error: 'رقم عقد مساند التوثيق يجب أن يكون 10 أرقام' });
                 }
                 arrivalUpdate.externalmusanedContract = contract;
                 changes.push(`رقم عقد مساند التوثيق: من "${oldExtContract || 'فارغ'}" إلى "${contract}"`);
              }
            }
            break;
          case 'destinations':
            console.log('✈️ تعديل معلومات الوجهات');
            if (updatedData['ticketFile']) {
              arrivalUpdate.ticketFile = updatedData['ticketFile'];
              changes.push('ملف التذكرة: تم التحديث');
            }
            if (updatedData['deliveryOfficer'] !== undefined) {
              arrivalUpdate.deliveryOfficer = updatedData['deliveryOfficer'];
              changes.push('مسؤول التوصيل: تم التحديث');
            }
            if (updatedData['مدينة المغادرة']) {
              const oldDep = order.arrivals[0]?.deparatureCityCountry;
              arrivalUpdate.deparatureCityCountry = updatedData['مدينة المغادرة'];
              changes.push(`مدينة المغادرة: من "${oldDep || 'فارغ'}" إلى "${updatedData['مدينة المغادرة']}"`);
            }
            if (updatedData['مدينة الوصول']) {
              const oldArr = order.arrivals[0]?.arrivalSaudiAirport;
              arrivalUpdate.arrivalSaudiAirport = updatedData['مدينة الوصول'];
              changes.push(`مدينة الوصول: من "${oldArr || 'فارغ'}" إلى "${updatedData['مدينة الوصول']}"`);
            }
            if (updatedData['مطار الوصول السعودي']) {
              const oldAirport = order.arrivals[0]?.arrivalSaudiAirport;
              arrivalUpdate.arrivalSaudiAirport = updatedData['مطار الوصول السعودي'];
              changes.push(`مطار الوصول السعودي: من "${oldAirport || 'فارغ'}" إلى "${updatedData['مطار الوصول السعودي']}"`);
            }
            if (updatedData['تاريخ ووقت المغادرة_date'] !== undefined || updatedData['تاريخ ووقت المغادرة_time'] !== undefined) {
              if (updatedData['تاريخ ووقت المغادرة_date']) {
                arrivalUpdate.deparatureCityCountryDate = new Date(updatedData['تاريخ ووقت المغادرة_date']);
              } else if (updatedData['تاريخ ووقت المغادرة_date'] === '') {
                arrivalUpdate.deparatureCityCountryDate = null;
              }
              if (updatedData['تاريخ ووقت المغادرة_time'] !== undefined) {
                arrivalUpdate.deparatureCityCountryTime = updatedData['تاريخ ووقت المغادرة_time'] || null;
              }
              const oldDepDate = order.arrivals[0]?.deparatureCityCountryDate 
                ? (order.arrivals[0].deparatureCityCountryDate as Date).toISOString().split('T')[0] 
                : 'فارغ';
              const oldDepTime = order.arrivals[0]?.deparatureCityCountryTime || 'فارغ';
              const newDepDate = updatedData['تاريخ ووقت المغادرة_date'] !== undefined ? (updatedData['تاريخ ووقت المغادرة_date'] || 'فارغ') : oldDepDate;
              const newDepTime = updatedData['تاريخ ووقت المغادرة_time'] !== undefined ? (updatedData['تاريخ ووقت المغادرة_time'] || 'فارغ') : oldDepTime;
              changes.push(`تاريخ ووقت المغادرة: من "${oldDepDate} ${oldDepTime}" إلى "${newDepDate} ${newDepTime}"`);
            }
            if (updatedData['تاريخ ووقت الوصول_date'] !== undefined || updatedData['تاريخ ووقت الوصول_time'] !== undefined) {
              if (updatedData['تاريخ ووقت الوصول_date']) {
                arrivalUpdate.KingdomentryDate = new Date(updatedData['تاريخ ووقت الوصول_date']);
              } else if (updatedData['تاريخ ووقت الوصول_date'] === '') {
                arrivalUpdate.KingdomentryDate = null;
              }
              if (updatedData['تاريخ ووقت الوصول_time'] !== undefined) {
                arrivalUpdate.KingdomentryTime = updatedData['تاريخ ووقت الوصول_time'] || null;
              }
              const oldArrDate = order.arrivals[0]?.KingdomentryDate 
                ? (order.arrivals[0].KingdomentryDate as Date).toISOString().split('T')[0] 
                : 'فارغ';
              const oldArrTime = order.arrivals[0]?.KingdomentryTime || 'فارغ';
              const newArrDate = updatedData['تاريخ ووقت الوصول_date'] !== undefined ? (updatedData['تاريخ ووقت الوصول_date'] || 'فارغ') : oldArrDate;
              const newArrTime = updatedData['تاريخ ووقت الوصول_time'] !== undefined ? (updatedData['تاريخ ووقت الوصول_time'] || 'فارغ') : oldArrTime;
              changes.push(`تاريخ ووقت الوصول: من "${oldArrDate} ${oldArrTime}" إلى "${newArrDate} ${newArrTime}"`);
            }

            // المنع التام أن يكون تاريخ ووقت الوصول قبل تاريخ ووقت المغادرة
            const finalDepDate = arrivalUpdate.deparatureCityCountryDate !== undefined ? arrivalUpdate.deparatureCityCountryDate : order.arrivals[0]?.deparatureCityCountryDate;
            const finalDepTime = arrivalUpdate.deparatureCityCountryTime !== undefined ? arrivalUpdate.deparatureCityCountryTime : order.arrivals[0]?.deparatureCityCountryTime;
            const finalArrDate = arrivalUpdate.KingdomentryDate !== undefined ? arrivalUpdate.KingdomentryDate : order.arrivals[0]?.KingdomentryDate;
            const finalArrTime = arrivalUpdate.KingdomentryTime !== undefined ? arrivalUpdate.KingdomentryTime : order.arrivals[0]?.KingdomentryTime;

            if (finalDepDate && finalArrDate) {
              const depDateStr = finalDepDate instanceof Date ? finalDepDate.toISOString().split('T')[0] : new Date(finalDepDate).toISOString().split('T')[0];
              const arrDateStr = finalArrDate instanceof Date ? finalArrDate.toISOString().split('T')[0] : new Date(finalArrDate).toISOString().split('T')[0];
              const depDateTime = new Date(`${depDateStr}T${convert12hTo24h(finalDepTime || '00:00')}`);
              const arrDateTime = new Date(`${arrDateStr}T${convert12hTo24h(finalArrTime || '00:00')}`);
              
              if (!isNaN(depDateTime.getTime()) && !isNaN(arrDateTime.getTime())) {
                if (arrDateTime < depDateTime) {
                  return res.status(400).json({ error: 'تاريخ ووقت الوصول لا يمكن أن يسبق تاريخ ووقت المغادرة' });
                }
              }
            }

            // تحديث حالة الحجز للمسار الزمني
            if (finalDepDate && finalArrDate) {
              updateData.bookingstatus = 'destinations_set';
            }
            break;
          case 'documentUpload':
            console.log('📄 تعديل رفع المستندات');
            if (updatedData.hasOwnProperty('files')) {
              arrivalUpdate.additionalfiles = updatedData.files;
              changes.push('الملفات الإضافية: تم التحديث');
            }
            break;
          case 'receipt':
            console.log('📦 تعديل طريقة الاستلام');
            if (updatedData.method) {
              const oldMethod = order.arrivals[0]?.receiptMethod;
              arrivalUpdate.receiptMethod = updatedData.method;
              changes.push(`طريقة الاستلام: من "${oldMethod || 'فارغ'}" إلى "${updatedData.method}"`);
            }
            break;
          case 'deliveryDetails':
            console.log('🚚 تعديل تفاصيل التوصيل');
            // Handle deliveryDetails - create or update DeliveryDetails record
            const deliveryData: any = {};
            
            if (updatedData.deliveryDate) {
              deliveryData.deliveryDate = new Date(updatedData.deliveryDate);
              changes.push(`تاريخ التوصيل: ${updatedData.deliveryDate}`);
            }
            if (updatedData.deliveryTime) {
              deliveryData.deliveryTime = updatedData.deliveryTime;
              changes.push(`وقت التوصيل: ${updatedData.deliveryTime}`);
            }
            if (updatedData.deliveryFile !== undefined) {
              deliveryData.deliveryFile = updatedData.deliveryFile;
              changes.push('ملف التوصيل: تم التحديث');
              if (updatedData.deliveryFile) {
                updateData.bookingstatus = 'delivered';
                updateData.clientBookingStatus = 'received';
              }
            }
            if (updatedData.deliveryNotes !== undefined) {
              deliveryData.deliveryNotes = updatedData.deliveryNotes;
              changes.push(`ملاحظات التوصيل: ${updatedData.deliveryNotes || 'فارغ'}`);
            }
            if (updatedData.cost !== undefined && updatedData.cost !== '') {
              deliveryData.cost = parseFloat(updatedData.cost.toString());
              changes.push(`تكلفة التوصيل: ${updatedData.cost}`);
            }
            
            // Check if DeliveryDetails exists for this order
            const existingDeliveryDetails = await prisma.deliveryDetails.findFirst({
              where: { newOrderId: Number(id) },
              orderBy: { id: 'desc' },
            });

            if (existingDeliveryDetails) {
              // Update existing record
              await prisma.deliveryDetails.update({
                where: { id: existingDeliveryDetails.id },
                data: deliveryData,
              });
            } else {
              // Create new record
              await prisma.deliveryDetails.create({
                data: {
                  ...deliveryData,
                  newOrderId: Number(id),
                },
              });
            }
            break;
          case 'clientInfo':
            console.log('👤 تعديل معلومات العميل');
            // Handle client info updates (email, name, phone)
            if (!order.clientID) {
              return res.status(400).json({ error: 'No client associated with this order' });
            }
            
            const clientUpdateData: any = {};
            if (updatedData['البريد الإلكتروني']) {
              const oldEmail = order.client?.email;
              clientUpdateData.email = updatedData['البريد الإلكتروني'];
              changes.push(`البريد الإلكتروني: من "${oldEmail || 'فارغ'}" إلى "${updatedData['البريد الإلكتروني']}"`);
            }
            if (updatedData['اسم العميل']) {
              const oldName = order.client?.fullname;
              clientUpdateData.fullname = updatedData['اسم العميل'];
              changes.push(`اسم العميل: من "${oldName || 'فارغ'}" إلى "${updatedData['اسم العميل']}"`);
            }
            if (updatedData['رقم الهاتف']) {
              const oldPhone = order.client?.phonenumber;
              clientUpdateData.phonenumber = updatedData['رقم الهاتف'];
              changes.push(`رقم الهاتف: من "${oldPhone || 'فارغ'}" إلى "${updatedData['رقم الهاتف']}"`);
            }
            
            if (Object.keys(clientUpdateData).length > 0) {
              await prisma.client.update({
                where: { id: order.clientID },
                data: clientUpdateData,
              });
            }
            break;
          default:
            return res.status(400).json({ error: 'Invalid section' });
        }

        console.log('💾 حفظ التعديلات في القسم المفتوح...');
        if (updateData.bookingstatus) {
          updateData.clientBookingStatus = updateData.bookingstatus === 'office_link_approved' ? 'pending_external_office' : updateData.bookingstatus;
        }
        const [updatedOrder, updatedArrivals] = await prisma.$transaction([
          prisma.neworder.update({
            where: { id: Number(id) },
            data: updateData,
          }),
          prisma.arrivallist.updateMany({
            where: { OrderId: Number(id) },
            data: arrivalUpdate,
          }),
        ]);

        console.log('✅ تم حفظ التعديلات بنجاح');

        // حفظ في systemUserLogs
        if (changes.length > 0) {
          const sectionDisplayName = section === 'destinations' ? 'الوجهات' : section;
          const changesSummary = changes.join(' | ');
          await logToSystemLogs(
            userId,
            'update',
            `تعديل قسم "${sectionDisplayName}" في الطلب ${id}: ${changesSummary}`,
            'order',
            Number(id),
            pageRoute
          );

          // حفظ في سجل أنشطة العاملة
          if (order.HomemaidId) {
            const username = token?.username || 'system';
            await logToHomemaidLogs(
              username,
              order.HomemaidId,
              `تعديل قسم ${sectionDisplayName}`,
              `تم تعديل قسم "${sectionDisplayName}" في الطلب ${id}: ${changesSummary}`,
              `تعديل في صفحة تتبع الطلب`
            );
          }
        }

        eventBus.emit('ACTION', {
          type: "تعديل طلب " + updatedOrder.id,
          beneficiary: "order",
          pageRoute: pageRoute,
          actionType: "update",
          userId: userId,
          BeneficiaryId: Number(id),
        });

        console.log('========== نهاية تعديل طلب ==========\n');
        return res.status(200).json({ message: 'Section updated successfully' });
      }

      return res.status(400).json({ error: 'Invalid request' });
    } catch (error: any) {
      console.error('Error updating order:', error);
  if(error?.message?.includes('Invalid value for argument `KingdomentryDate`') || error?.message?.includes('Invalid value for argument `DateOfApplication`')){
    return res.status(400).json({ error: 'لا يمكن اضافة تاريخ مغادرة دون تاريخ وصول' });
  }
      // Check if it's a Prisma validation error for DateOfApplication
     
      if (error?.message?.includes('DateOfApplication') || 
          error?.message?.includes('Invalid value for argument') ||
          error?.message?.includes('Provided Date object is invalid')) {
            console.log("error",error?.message);
        return res.status(400).json({ error: 'تاريخ العقد مطلوب' });
      }
      
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}