import '../../../lib/loggers'; // استدعاء loggers.ts في بداية التطبيق


import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { jwtDecode } from 'jwt-decode';
import eventBus from 'lib/eventBus';
import prisma from 'lib/prisma';
import { getPageTitleArabic } from '../../../lib/pageTitleHelper';

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
            } as any,
          },
          DeliveryDetails: {
            orderBy: {
              id: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!order ) {
        return res.status(404).json({ error: 'Order or arrival data not found' });
      }

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
          name: order.HomeMaid?.Name || 'N/A',
          religion:order.HomeMaid?.Religion || 'N/A',

          passportNumber: order.HomeMaid?.Passportnumber || 'N/A',
          nationality: order.HomeMaid?.office?.Country || 'N/A',
          externalOffice: order.HomeMaid?.officeName || 'N/A',
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
          visaNumber: order.arrivals[0]?.visaNumber || 'N/A',
          internalMusanedContract: order.arrivals[0]?.InternalmusanedContract || 'N/A',
          musanedDate: order.arrivals[0]?.DateOfApplication ? (order.arrivals[0].DateOfApplication as Date).toISOString().split('T')[0] : 'N/A',
        },
        officeLinkApproval: {
          approved: !!order.arrivals[0]?.ExternalDateLinking,
        },
        externalOfficeInfo: {
          officeName: order.HomeMaid?.officeName || 'N/A',
          country: order.HomeMaid?.office?.Country || 'N/A',
          externalMusanedContract: order.arrivals[0]?.externalmusanedContract || 'N/A',
        },
        externalOfficeApproval: {
          approved: order.arrivals[0]?.externalOfficeStatus === 'approved',
        },
        medicalCheck: {
          passed: !!order.arrivals[0]?.medicalCheckDate,
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
        },
        travelPermit: {
          issued: !!order.arrivals[0]?.travelPermit,
        },
        destinations: {
          departureCity: order.arrivals[0]?.deparatureCityCountry || 'N/A',
          arrivalCity: order.arrivals[0]?.arrivalSaudiAirport || 'N/A',
          arrivalSaudiAirport: order.arrivals[0]?.arrivalSaudiAirport || 'N/A',
          departureDateTime: order.arrivals[0]?.deparatureCityCountryDate
            ? `${(order.arrivals[0].deparatureCityCountryDate as Date).toISOString().split('T')[0]} ${order.arrivals[0].deparatureCityCountryTime || ''}`
            : 'N/A',
          arrivalDateTime: order.arrivals[0]?.KingdomentryDate
            ? `${(order.arrivals[0].KingdomentryDate as Date).toISOString().split('T')[0]} ${order.arrivals[0].KingdomentryTime || ''}`
            : 'N/A',
        },
        receipt: {
          received: !!order.arrivals[0]?.DeliveryDate, // Fixed condition
          method: order.arrivals[0]?.receiptMethod || null,
        },
        ticketUpload: {
          files: order.arrivals[0]?.ticketFile || null,
        },
        nationality: order.HomeMaid?.office?.Country || 'N/A',
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
      const { field, value, section, updatedData } = req.body;
      console.log('\n========== بداية تعديل طلب ==========');
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
        },
      });

      if (!order || !order.arrivals || order.arrivals.length === 0) {
        return res.status(404).json({ error: 'Order or arrival data not found' });
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
            return res.status(404).json({ error: 'Order or arrival data not found' });
          }

          // جلب البيانات الحالية
          const currentStages = (arrival.customTimelineStages as any) || {};
          const oldValue = currentStages[field]?.completed || false;
          
          // تحديث حالة المرحلة المخصصة
          currentStages[field] = {
            completed: value,
            date: value ? new Date() : null,
          };

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
            const oldOfficeLink = order.arrivals[0]?.ExternalDateLinking ? 'مكتمل' : 'غير مكتمل';
            arrivalUpdate.ExternalDateLinking = value ? new Date() : null;
            updateData.bookingstatus = value ? 'office_link_approved' : 'pending_office_link';
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
              logMessage = `تعديل حالة الحجز في الطلب ${id} من "${oldBooking}" إلى "cancelled"`;
            } else {
              return res.status(400).json({ error: 'Invalid bookingStatus value' });
            }
            break;
        }

        console.log('💾 حفظ التعديلات...');
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
          case 'homemaidInfo':
            console.log('👩‍🦰 تعديل معلومات العاملة المنزلية');
            if (!order.HomemaidId) {
              return res.status(400).json({ error: 'No Homemaid associated with this order' });
            }
            
            const find = await prisma.neworder.findUnique({where:{id:Number(id),HomemaidId:Number(updatedData['id'])}});
            if (find?.HomemaidId){
              return res.status(400).json({ error: 'homemaid is Booked' });
            }
            
            const oldHomemaidId = order.HomemaidId;
            const newHomemaidId = updatedData['id'] ? Number(updatedData['id']) : order.HomemaidId;
            
            const updatedHomemaid = await prisma.neworder.update({
              include: { HomeMaid: true },
              where: { id: Number(id) },
              data: {
                HomemaidId: newHomemaidId,
              },
            });
            
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
              updateData.nationalId = updatedData['هوية العميل'];
              changes.push(`هوية العميل: من "${oldNationalId || 'فارغ'}" إلى "${updatedData['هوية العميل']}"`);
            }
            if (updatedData['رقم التأشيرة']) {
              const visaRaw = updatedData['رقم التأشيرة'];
              const visa = typeof visaRaw === 'string' ? visaRaw.trim() : String(visaRaw ?? '').trim();
              const oldVisa = order.arrivals[0]?.visaNumber;

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
            if (updatedData['رقم عقد إدارة المكاتب']) {
              const oldContract = order.arrivals[0]?.InternalmusanedContract;
              arrivalUpdate.InternalmusanedContract = updatedData['رقم عقد إدارة المكاتب'];
              changes.push(`رقم عقد إدارة المكاتب: من "${oldContract || 'فارغ'}" إلى "${updatedData['رقم عقد إدارة المكاتب']}"`);
            }
            if (updatedData['تاريخ العقد']) {
              const oldDate = order.arrivals[0]?.DateOfApplication;
              arrivalUpdate.DateOfApplication = new Date(updatedData['تاريخ العقد']);
              changes.push(`تاريخ العقد: من "${oldDate || 'فارغ'}" إلى "${updatedData['تاريخ العقد']}"`);
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
            if (updatedData['رقم عقد مساند التوثيق']) {
              const oldExtContract = order.arrivals[0]?.externalmusanedContract;
              arrivalUpdate.externalmusanedContract = updatedData['رقم عقد مساند التوثيق'];
              changes.push(`رقم عقد مساند التوثيق: من "${oldExtContract || 'فارغ'}" إلى "${updatedData['رقم عقد مساند التوثيق']}"`);
            }
            break;
          case 'destinations':
            console.log('✈️ تعديل معلومات الوجهات');
            if (updatedData['ticketFile']) {
              arrivalUpdate.ticketFile = updatedData['ticketFile'];
              changes.push('ملف التذكرة: تم التحديث');
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
            if (updatedData['تاريخ ووقت المغادرة_date'] || updatedData['تاريخ ووقت المغادرة_time']) {
              arrivalUpdate.deparatureCityCountryDate = updatedData['تاريخ ووقت المغادرة_date']
                ? new Date(updatedData['تاريخ ووقت المغادرة_date'])
                : null;
              arrivalUpdate.deparatureCityCountryTime = updatedData['تاريخ ووقت المغادرة_time'] || null;
              changes.push('تاريخ ووقت المغادرة: تم التحديث');
            }
            if (updatedData['تاريخ ووقت الوصول_date'] || updatedData['تاريخ ووقت الوصول_time']) {
              arrivalUpdate.KingdomentryDate = updatedData['تاريخ ووقت الوصول_date']
                ? new Date(updatedData['تاريخ ووقت الوصول_date'])
                : null;
              arrivalUpdate.KingdomentryTime = updatedData['تاريخ ووقت الوصول_time'] || null;
              changes.push('تاريخ ووقت الوصول: تم التحديث');
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

        console.log('💾 حفظ التعديلات...');
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
          const changesSummary = changes.join(' | ');
          await logToSystemLogs(
            userId,
            'update',
            `تعديل قسم "${section}" في الطلب ${id}: ${changesSummary}`,
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
              `تعديل قسم ${section}`,
              `تم تعديل قسم "${section}" في الطلب ${id}: ${changesSummary}`,
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
    } catch (error) {
      console.error('Error updating order:', error);
      return res.status(500).json({ error:  'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}