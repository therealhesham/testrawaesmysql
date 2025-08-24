import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // const session = await getServerSession(req, res, authOptions);
    // console.log(session)
    // if (!session || !session.user) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

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
              Name: true,
              Passportnumber: true,
              Nationalitycopy: true,
              officeName: true,
            },
          },
          arrivals: {
            select: {
              DateOfApplication: true,
              externalOfficeStatus: true,
              medicalCheckFile: true,
              approvalPayment: true,
              EmbassySealing: true,
              visaNumber: true,
              DeliveryDate: true,
              DeparatureFromSaudiCity: true,
              ArrivalOutSaudiCity: true,
              DeparatureFromSaudiDate: true,
              DeparatureFromSaudiTime: true,
              finalDestinationDate: true,
              finalDestinationTime: true,
              additionalfiles: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const orderData = {
        orderId: order.id,
        bookingStatus: order.bookingstatus,
        clientInfo: {
          name: order.client?.fullname || 'N/A',
          phone: order.client?.phonenumber || 'N/A',
          email: order.client?.email || 'N/A',
        },
        homemaidInfo: {
          name: order.HomeMaid?.Name || 'N/A',
          passportNumber: order.HomeMaid?.Passportnumber || 'N/A',
          nationality: order.HomeMaid?.Nationalitycopy || 'N/A',
          externalOffice: order.HomeMaid?.officeName || 'N/A',
        },
        applicationInfo: {
          applicationDate: order.arrivals[0]?.DateOfApplication?.toISOString().split('T')[0] || 'N/A',
          applicationTime: order.arrivals[0]?.DateOfApplication?.toISOString().split('T')[1]?.split('.')[0] || 'N/A',
        },
        officeLinkInfo: {
          nationalId: order.nationalId || 'N/A',
          visaNumber: order.arrivals[0]?.visaNumber || 'N/A',
          internalMusanedContract: order.arrivals[0]?.InternalmusanedContract || 'N/A',
          musanedDate: order.arrivals[0]?.DateOfApplication?.toISOString().split('T')[0] || 'N/A',
        },
        externalOfficeInfo: {
          officeName: order.HomeMaid?.officeName || 'N/A',
          country: order.arrivals[0]?.office || 'N/A',
          externalMusanedContract: order.arrivals[0]?.externalmusanedContract || 'N/A',
        },
        externalOfficeApproval: {
          approved: order.arrivals[0]?.externalOfficeStatus === 'approved',
        },
        medicalCheck: {
          passed: !!order.arrivals[0]?.medicalCheckFile,
        },
        foreignLaborApproval: {
          approved: order.arrivals[0]?.externalOfficeStatus === 'approved',
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
          issued: !!order.arrivals[0]?.DeliveryDate,
        },
        destinations: {
          departureCity: order.arrivals[0]?.DeparatureFromSaudiCity || 'N/A',
          arrivalCity: order.arrivals[0]?.ArrivalOutSaudiCity || 'N/A',
          departureDateTime: order.arrivals[0]?.DeparatureFromSaudiDate
            ? `${order.arrivals[0].DeparatureFromSaudiDate.toISOString().split('T')[0]} ${order.arrivals[0].DeparatureFromSaudiTime || ''}`
            : 'N/A',
          arrivalDateTime: order.arrivals[0]?.finalDestinationDate
            ? `${order.arrivals[0].finalDestinationDate.toISOString().split('T')[0]} ${order.arrivals[0].finalDestinationTime || ''}`
            : 'N/A',
        },
        receipt: {
          received: order.arrivals[0]?.externalOfficeStatus === 'delivered',
        },
        documentUpload: {
          files: order.arrivals[0]?.additionalfiles || null,
        },
      };

      return res.status(200).json(orderData);
    } catch (error) {
      console.error('Error fetching order:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
  try {
    const { field, value } = req.body;
    const validFields = [
      'externalOfficeApproval',
      'medicalCheck',
      'foreignLaborApproval',
      'agencyPayment',
      'saudiEmbassyApproval',
      'visaIssuance',
      'travelPermit',
      'receipt',
      'bookingStatus', // إضافة bookingStatus إلى الحقول المسموح بها
    ];

    if (!validFields.includes(field)) {
      return res.status(400).json({ error: 'Invalid field' });
    }

    const order = await prisma.neworder.findUnique({
      where: { id: Number(id) },
      include: { arrivals: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
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
        arrivalUpdate.externalOfficeStatus = value ? 'approved' : 'pending';
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
        arrivalUpdate.DeliveryDate = value ? new Date() : null;
        updateData.bookingstatus = value ? 'travel_permit_issued' : 'pending_travel_permit';
        break;
      case 'receipt':
        arrivalUpdate.externalOfficeStatus = value ? 'delivered' : 'pending';
        updateData.bookingstatus = value ? 'received' : 'pending_receipt';
        break;
      case 'bookingStatus':
        if (value === 'cancelled') {
          updateData.bookingstatus = 'cancelled';
          arrivalUpdate.externalOfficeStatus = 'cancelled'; // تحديث حالة الـ arrivals إذا لزم الأمر
        } else {
          return res.status(400).json({ error: 'Invalid bookingStatus value' });
        }
        break;
    }

    await prisma.$transaction([
      prisma.neworder.update({
        where: { id: Number(id) },
        data: updateData,
      }),
      prisma.arrivallist.updateMany({
        where: { OrderId: Number(id) },
        data: arrivalUpdate,
      }),
      // يمكنك إلغاء تعليق السطر التالي إذا كنت تريد تسجيل الإلغاء في السجلات
      // prisma.logs.create({
      //   data: {
      //     Status: `Updated ${field} to ${value}`,
      //     homemaidId: order.HomemaidId || undefined,
      //     createdAt: new Date(),
      //   },
      // }),
    ]);

    return res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

  return res.status(405).json({ error: 'Method not allowed' });
}