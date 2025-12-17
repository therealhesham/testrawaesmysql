import '../../../lib/loggers'; // استدعاء loggers.ts في بداية التطبيق


import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { jwtDecode } from 'jwt-decode';
import eventBus from 'lib/eventBus';
import prisma from 'lib/prisma';
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
          issued: !!order.arrivals[0]?.visaNumber,
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
         type: "تعديل صفحة تتبع طلب " + order.id,
    beneficiary: "order",
    pageRoute: req.headers.referer,
    actionType: "update",
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
    //   const cookieHeader = req.headers.cookie;
    //   let cookies: { [key: string]: string } = {};
    //   if (cookieHeader) {
    //     cookieHeader.split(";").forEach(cookie => {
    //       const [key, value] = cookie.trim().split("=");
    //       cookies[key] = decodeURIComponent(value);
    //     });
    //   }
    // const token =   jwtDecode(cookies.authToken)
    // console.log(token);
    // const findUser  = await prisma.user.findUnique({where:{id:token.id},include:{role:true}})
    // if(!findUser?.role?.permissions["إدارة الطلبات"]["تعديل"] )return;

    try {
      const { field, value, section, updatedData } = req.body;
      console.log('Request Body:', { field, value, section, updatedData });
      console.log('Receipt update - field:', field, 'value:', value, 'section:', section, 'updatedData:', updatedData);

      const order = await prisma.neworder.findUnique({
        where: { id: Number(id) },
        include: { arrivals: true },
      });

      if (!order || !order.arrivals || order.arrivals.length === 0) {
        return res.status(404).json({ error: 'Order or arrival data not found' });
      }

      // Handle existing status updates
      if (field) {
        const validFields = [
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
          // معالجة الحقول المخصصة - تخزينها في customTimelineStages
          const arrival = await prisma.arrivallist.findFirst({
            where: { OrderId: Number(id) },
          });

          if (!arrival) {
            return res.status(404).json({ error: 'Order or arrival data not found' });
          }

          // جلب البيانات الحالية
          const currentStages = (arrival.customTimelineStages as any) || {};
          
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

          return res.status(200).json({ message: 'Custom field updated successfully' });
        }

        const updateData: any = {};
        const arrivalUpdate: any = {};

        switch (field) {

          case 'externalOfficeApproval':
            arrivalUpdate.externalOfficeStatus = value ? 'approved' : 'pending';
            arrivalUpdate.ExternalOFficeApproval = value ? new Date() : null;
            updateData.bookingstatus = value ? 'external_office_approved' : 'pending_external_office';
            break;
          case 'medicalCheck':
            arrivalUpdate.medicalCheckFile = value ? undefined : null;
            arrivalUpdate.medicalCheckDate = value ? new Date() : null;
            updateData.bookingstatus = value ? 'medical_check_passed' : 'pending_medical_check';
            break;
          case 'foreignLaborApproval':
            arrivalUpdate.foreignLaborApproval = value ? true : false;
            arrivalUpdate.foreignLaborApprovalDate = value ? new Date() : null;
            updateData.bookingstatus = value ? 'foreign_labor_approved' : 'pending_foreign_labor';
            break;
          case 'agencyPayment':
            arrivalUpdate.approvalPayment = value ? 'paid' : null;
            updateData.bookingstatus = value ? 'agency_paid' : 'pending_agency_payment';
            break;
          case 'saudiEmbassyApproval':
            arrivalUpdate.EmbassySealing = value ? new Date() : null;
            updateData.bookingstatus = value ? 'embassy_approved' : 'pending_embassy';
            break;
          case 'visaIssuance':
            // arrivalUpdate.visaNumber = value ? `VISA-${id}-${Date.now()}` : null;
            arrivalUpdate.visaIssuanceDate = value ? new Date() : null;
            updateData.bookingstatus = value ? 'visa_issued' : 'pending_visa';
            break;
          case 'travelPermit':
            arrivalUpdate.travelPermit = value ? 'issued' : null;
            arrivalUpdate.travelPermitDate = value ? new Date() : null;
            updateData.bookingstatus = value ? 'travel_permit_issued' : 'pending_travel_permit';
            break;
          case 'receipt':
            arrivalUpdate.DeliveryDate = value ? new Date() : null;
            updateData.bookingstatus = value ? 'received' : 'pending_receipt';
            // إضافة طريقة الاستلام إذا تم تمريرها
            if (section === 'receipt' && updatedData && updatedData.method) {
              console.log('Setting receiptMethod to:', updatedData.method);
              arrivalUpdate.receiptMethod = updatedData.method;
            }
            break;
          case 'bookingStatus':
            if (value === 'cancelled') {
              updateData.bookingstatus = 'cancelled';
              arrivalUpdate.externalOfficeStatus = 'cancelled';
            } else {
              return res.status(400).json({ error: 'Invalid bookingStatus value' });
            }
            break;
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

        console.log('Updated Order:', updatedOrder);
        console.log('Updated Arrivals:', updatedArrivals);
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
        type: 'تعديل صفحة تتبع طلب ' + order.id,
        beneficiary: "order",
        pageRoute: req.headers.referer,
        actionType: "update",
        userId: Number(token.id),
        BeneficiaryId: Number(id),
      });



        return res.status(200).json({ message: 'Status updated successfully' });
      }

      // Handle editable section updates
      if (section && updatedData) {
        const updateData: any = {};
        const arrivalUpdate: any = {};


        switch (section) {
          case 'orderFiles': {
            // Update attachments stored directly on neworder
            if (Object.prototype.hasOwnProperty.call(updatedData, 'orderDocument')) {
              const raw = updatedData.orderDocument;
              const normalized =
                raw === null || raw === undefined
                  ? null
                  : typeof raw === 'string'
                    ? (raw.trim() ? raw.trim() : null)
                    : String(raw);
              updateData.orderDocument = normalized;
            }

            if (Object.prototype.hasOwnProperty.call(updatedData, 'contract')) {
              const raw = updatedData.contract;
              const normalized =
                raw === null || raw === undefined
                  ? null
                  : typeof raw === 'string'
                    ? (raw.trim() ? raw.trim() : null)
                    : String(raw);
              updateData.contract = normalized;
            }
            break;
          }
          case 'medical':
            if (updatedData.medicalCheckFile) {
              arrivalUpdate.medicalCheckFile = updatedData.medicalCheckFile;
            }
            break;
          case 'homemaidInfo':

          console.log('order.HomemaidId:', order.HomemaidId);
  if (!order.HomemaidId) {
    return res.status(400).json({ error: 'No Homemaid associated with this order' });
  }
const find = await prisma.neworder.findUnique({where:{id:Number(id),HomemaidId:Number(updatedData['id'])}})// عايز يدور في الneworder يشوف الفعاملة دي محجوززة ولا لا
if (find?.HomemaidId){
          return res.status(400).json({ error: 'homemaid is Booked' });

}
await prisma.neworder.update({
      include: { HomeMaid: true },
      where: { id: Number(id) },
      data: {
HomemaidId: updatedData['id'] ? Number(updatedData['id']) : order.HomemaidId,
      },
    });
  break;

          case 'officeLinkInfo':
            if (updatedData['هوية العميل']) {




              updateData.nationalId = updatedData['هوية العميل'];
            }
            if (updatedData['رقم التأشيرة']) {
              const visaRaw = updatedData['رقم التأشيرة'];
              const visa = typeof visaRaw === 'string' ? visaRaw.trim() : String(visaRaw ?? '').trim();

              // Normalize display placeholder
              if (!visa || visa === 'N/A') {
                arrivalUpdate.visaNumber = null;
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
              }
            }
            if (updatedData['رقم عقد إدارة المكاتب']) {
              arrivalUpdate.InternalmusanedContract = updatedData['رقم عقد إدارة المكاتب'];
            }
            if (updatedData['تاريخ العقد']) {
              arrivalUpdate.DateOfApplication = new Date(updatedData['تاريخ العقد']);
            }
            break;
          case 'externalOfficeInfo':
            if (updatedData['اسم المكتب الخارجي']) {
              await prisma.homemaid.update({
                where: { id: order.HomemaidId || 0 },
                data: { officeName: updatedData['اسم المكتب الخارجي'] },
              });
            }
            if (updatedData['دولة المكتب الخارجي']) {
              arrivalUpdate.office = updatedData['دولة المكتب الخارجي'];
            }
            if (updatedData['رقم عقد مساند التوثيق']) {
              arrivalUpdate.externalmusanedContract = updatedData['رقم عقد مساند التوثيق'];
            }
            break;
          case 'destinations':
            if (updatedData['ticketFile']) {
              console.log('ticketFile:', updatedData['ticketFile']);
              arrivalUpdate.ticketFile = updatedData['ticketFile'];
            }
            if (updatedData['مدينة المغادرة']) {
              arrivalUpdate.deparatureCityCountry = updatedData['مدينة المغادرة'];
            }
            if (updatedData['مدينة الوصول']) {
              arrivalUpdate.arrivalSaudiAirport = updatedData['مدينة الوصول'];
            }
            if (updatedData['مطار الوصول السعودي']) {
              arrivalUpdate.arrivalSaudiAirport = updatedData['مطار الوصول السعودي'];
            }
            if (updatedData['تاريخ ووقت المغادرة_date'] || updatedData['تاريخ ووقت المغادرة_time']) {
              console.log('Departure Date:', updatedData['تاريخ ووقت المغادرة_date']);
              arrivalUpdate.deparatureCityCountryDate = updatedData['تاريخ ووقت المغادرة_date']
                ? new Date(updatedData['تاريخ ووقت المغادرة_date'])
                : null;
              arrivalUpdate.deparatureCityCountryTime = updatedData['تاريخ ووقت المغادرة_time'] || null;
            }
            if (updatedData['تاريخ ووقت الوصول_date'] || updatedData['تاريخ ووقت الوصول_time']) {
              arrivalUpdate.KingdomentryDate = updatedData['تاريخ ووقت الوصول_date']
                ? new Date(updatedData['تاريخ ووقت الوصول_date'])
                : null;
              arrivalUpdate.KingdomentryTime = updatedData['تاريخ ووقت الوصول_time'] || null;
            }
            break;
          case 'documentUpload':
            if (updatedData.hasOwnProperty('files')) {
              arrivalUpdate.additionalfiles = updatedData.files;
            }
            break;
          case 'receipt':
            if (updatedData.method) {
              arrivalUpdate.receiptMethod = updatedData.method;
            }
            break;
          case 'deliveryDetails':
            // Handle deliveryDetails - create or update DeliveryDetails record
            const deliveryData: any = {};
            
            if (updatedData.deliveryDate) {
              deliveryData.deliveryDate = new Date(updatedData.deliveryDate);
            }
            if (updatedData.deliveryTime) {
              deliveryData.deliveryTime = updatedData.deliveryTime;
            }
            if (updatedData.deliveryFile !== undefined) {
              deliveryData.deliveryFile = updatedData.deliveryFile;
            }
            if (updatedData.deliveryNotes !== undefined) {
              deliveryData.deliveryNotes = updatedData.deliveryNotes;
            }
            if (updatedData.cost !== undefined && updatedData.cost !== '') {
              deliveryData.cost = parseFloat(updatedData.cost.toString());
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
            // Handle client info updates (email, name, phone)
            if (!order.clientID) {
              return res.status(400).json({ error: 'No client associated with this order' });
            }
            
            const clientUpdateData: any = {};
            if (updatedData['البريد الإلكتروني']) {
              clientUpdateData.email = updatedData['البريد الإلكتروني'];
            }
            if (updatedData['اسم العميل']) {
              clientUpdateData.fullname = updatedData['اسم العميل'];
            }
            if (updatedData['رقم الهاتف']) {
              clientUpdateData.phonenumber = updatedData['رقم الهاتف'];
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
    const referer = req.headers.referer
    eventBus.emit('ACTION', {



 type: "تعديل طلب " + updatedOrder.id,
    beneficiary: "homemaid",
    pageRoute: referer,
    actionType: "view",
    userId: Number((token as any).id),




// action: 'تعديل طلب ' + updatedOrder.id,
BeneficiaryId: Number(id),



        // type: 'تعديل طلب ' + updatedOrder.id,
        // userId: Number(token.id),
        // actionType: 'تعديل',
        // action: 'تعديل طلب ' + updatedOrder.id,
        // beneficiary: 'order',
        // pageRoute: referer,
        // BeneficiaryId: Number(id),
      });   




      
// console.log("event")
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