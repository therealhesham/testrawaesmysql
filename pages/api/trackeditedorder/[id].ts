import '../../../lib/loggers'; // استدعاء loggers.ts في بداية التطبيق


import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { jwtDecode } from 'jwt-decode';
import eventBus from 'lib/eventBus';
const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const order = await prisma.neworder.findUnique({
        where: { id: Number(id) },
        include: {
          client: {
            select: {
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
              approvalPayment: true,
              EmbassySealing: true,
              visaNumber: true,
              DeliveryDate: true,
              DeparatureFromSaudiCity: true,
              ticketFile: true,
              ArrivalOutSaudiCity: true,
              foreignLaborApproval: true,
              foreignLaborApprovalDate: true,
              DeparatureFromSaudiDate: true,
              DeparatureFromSaudiTime: true,
              finalDestinationDate: true,
              finalDestinationTime: true,
              additionalfiles: true,
              InternalmusanedContract: true,
              externalmusanedContract: true,
              office: true,
            },
          },
        },
      });

      return res.status(200).json(order);
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

        if (!validFields.includes(field)) {
          return res.status(400).json({ error: 'Invalid field' });
        }

        const updateData: any = {};
        const arrivalUpdate: any = {};

        switch (field) {

          case 'externalOfficeApproval':
            arrivalUpdate.externalOfficeStatus = value ? 'approved' : 'pending';
            updateData.bookingstatus = value ? 'external_office_approved' : 'pending_external_office';
            break;
          case 'medicalCheck':
            arrivalUpdate.medicalCheckFile = value ? 'passed' : null;
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
            arrivalUpdate.visaNumber = value ? `VISA-${id}-${Date.now()}` : null;
            updateData.bookingstatus = value ? 'visa_issued' : 'pending_visa';
            break;
          case 'travelPermit':
            arrivalUpdate.travelPermit = value ? 'issued' : null;
            updateData.bookingstatus = value ? 'travel_permit_issued' : 'pending_travel_permit';
            break;
          case 'receipt':
            arrivalUpdate.DeliveryDate = value ? new Date() : null;
            updateData.bookingstatus = value ? 'received' : 'pending_receipt';
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

        return res.status(200).json({ message: 'Status updated successfully' });
      }

      // Handle editable section updates
      if (section && updatedData) {
        const updateData: any = {};
        const arrivalUpdate: any = {};

        // Validate date and time formats]
        if (updatedData['تاريخ ووقت المغادرة_date'] && !/^\d{4}-\d{2}-\d{2}$/.test(updatedData['تاريخ ووقت المغادرة_date'])) {
          return res.status(400).json({ error: 'Invalid departure date format' });
        }
        if (updatedData['تاريخ ووقت المغادرة_time'] && !/^\d{2}:\d{2}:\d{2}$/.test(updatedData['تاريخ ووقت المغادرة_time'])) {
          return res.status(400).json({ error: 'Invalid departure time format' });
        }
        if (updatedData['تاريخ ووقت الوصول_date'] && !/^\d{4}-\d{2}-\d{2}$/.test(updatedData['تاريخ ووقت الوصول_date'])) {
          return res.status(400).json({ error: 'Invalid arrival date format' });
        }
        if (updatedData['تاريخ ووقت الوصول_time'] && !/^\d{2}:\d{2}:\d{2}$/.test(updatedData['تاريخ ووقت الوصول_time'])) {
          return res.status(400).json({ error: 'Invalid arrival time format' });
        }

        switch (section) {
          case 'homemaidInfo':
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
              arrivalUpdate.visaNumber = updatedData['رقم التأشيرة'];
            }
            if (updatedData['رقم عقد إدارة المكاتب']) {
              arrivalUpdate.InternalmusanedContract = updatedData['رقم عقد إدارة المكاتب'];
            }
            if (updatedData['تاريخ مساند']) {
              arrivalUpdate.DateOfApplication = new Date(updatedData['تاريخ مساند']);
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
              arrivalUpdate.DeparatureFromSaudiCity = updatedData['مدينة المغادرة'];
            }
            if (updatedData['مدينة الوصول']) {
              arrivalUpdate.ArrivalOutSaudiCity = updatedData['مدينة الوصول'];
            }
            if (updatedData['تاريخ ووقت المغادرة_date'] || updatedData['تاريخ ووقت المغادرة_time']) {
              console.log('Departure Date:', updatedData['تاريخ ووقت المغادرة_date']);
              arrivalUpdate.DeparatureFromSaudiDate = updatedData['تاريخ ووقت المغادرة_date']
                ? new Date(updatedData['تاريخ ووقت المغادرة_date'])
                : null;
              arrivalUpdate.DeparatureFromSaudiTime = updatedData['تاريخ ووقت المغادرة_time'] || null;
            }
            if (updatedData['تاريخ ووقت الوصول_date'] || updatedData['تاريخ ووقت الوصول_time']) {
              arrivalUpdate.finalDestinationDate = updatedData['تاريخ ووقت الوصول_date']
                ? new Date(updatedData['تاريخ ووقت الوصول_date'])
                : null;
              arrivalUpdate.finalDestinationTime = updatedData['تاريخ ووقت الوصول_time'] || null;
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
    const token = jwtDecode(cookies.authToken);

    eventBus.emit('ACTION', {
        type: 'تعديل طلب ' + updatedOrder.id,
        userId: Number(token.id),
      });   
// console.log("event")
        return res.status(200).json({ message: 'Section updated successfully' });
      }

      return res.status(400).json({ error: 'Invalid request' });
    } catch (error) {
      console.error('Error updating order:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}