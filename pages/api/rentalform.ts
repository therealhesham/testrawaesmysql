import '../../lib/loggers'; // استدعاء loggers.ts في بداية التطبيق
import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { writeFile } from 'fs/promises';
import path from 'path';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';

const prisma = new PrismaClient();

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
      return { userId: Number(token.id), username: token.username };
    } catch (error) {
      console.error('Error decoding token:', error);
      return { userId: null, username: 'غير محدد' };
    }
  }
  
  return { userId: null, username: 'غير محدد' };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const formData = req.body;
    
    // Get user info for logging
    const { userId, username } = getUserFromCookies(req);
    
    // Validate required fields
    const requiredFields = ['customerName', 'workerId', 'contractDuration', 'contractStartDate', 'contractEndDate', 'paymentMethod'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        return res.status(400).json({ message: `Missing required field: ${field}` });
      }
    }

    // Find or create client
    let client = await prisma.client.findFirst({
      where: {
        OR: [
          { phonenumber: formData.phoneNumber },
          { fullname: formData.customerName },
        ],
      },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          fullname: formData.customerName,
          phonenumber: formData.phoneNumber,
          city: formData.customerCity || null,
          createdAt: new Date(),
        },
      });
    }

    // Handle file upload (if provided)
    let contractFilePath: string | null = null;
    if (formData.contractFile) {
      // contractFile is already a filePath from DigitalOcean Spaces
      contractFilePath = formData.contractFile;
    }
const checkOrderByHomemaid = await prisma.neworder.findFirst({
  where: {
    HomemaidId: parseInt(formData.workerId) || null,
  },
});
if (checkOrderByHomemaid) {
  return res.status(400).json({ message: 'العاملة محجوزة بالفعل' });
}
    // Create new order
    const newOrder = await prisma.neworder.create({
      data: {
        ClientName: formData.customerName,
        PhoneNumber: formData.phoneNumber,
        clientID: client.id,
        HomemaidId: parseInt(formData.workerId) || null,
        typeOfContract: "rental",
        bookingstatus: 'pending_external_office', // Default status, adjust as needed
        contract: contractFilePath, // Save the contract file path
        createdAt: new Date(),
        updatedAt: new Date(),
        PaymentMethod: formData.paymentMethod,
        Total: formData.totalAmount ? parseInt(formData.totalAmount) : 0,
        Installments: formData.paymentMethod === 'cash' ? 1 : formData.paymentMethod === 'two-installments' ? 2 : 3,
      },
    });

try {
     await prisma.arrivallist.create({
      data: {
        // OrderId:id,
        // SponsorName,
        // HomemaidName,
        // PassportNumber,


        Order: { connect: { id:newOrder.id } },
      },
    });
  
} catch (error) {
console.log(error)
await prisma.neworder.delete({where:{id:newOrder.id}})  
}


    // Create payment record (only if paidAmount is provided and greater than 0)
    if (formData.paidAmount && parseFloat(formData.paidAmount) > 0) {
      await prisma.payment.create({
        data: {
          orderId: newOrder.id,
          Paid: parseFloat(formData.paidAmount),
        },
      });
    }

    // Create client account statement and initial entry
    try {
      // Determine office name from HomeMaid
      const homemaid = await prisma.homemaid.findUnique({
        where: { id: newOrder.HomemaidId as number },
        include: { office: true },
      });
      const officeName = homemaid?.officeName || homemaid?.office?.office || '';

      const totalRevenue = formData.paidAmount ? Number(formData.paidAmount) : 0;

      const statement = await prisma.clientAccountStatement.create({
        data: {
          clientId: Number(client.id),
          contractNumber: `ORD-${newOrder.id}`,
          officeName,
          totalRevenue,
          totalExpenses: 0,
          netAmount: totalRevenue,
          contractStatus: 'new',
          notes: '',
        },
      });

      // Only create entry for paid amount, not remaining amount
      if (totalRevenue > 0) {
        await prisma.clientAccountEntry.create({
          data: {
            statementId: statement.id,
            date: new Date(),
            description: 'دفعة أولى',
            debit: 0,
            credit: totalRevenue,
            balance: totalRevenue,
            entryType: 'payment',
          },
        });
      }
    } catch (e) {
      // Do not block order creation on statement creation failures
      console.error('Failed to create client account statement/entry for rental order', e);
    }

    // Create order status
    // await prisma.orderStatus.create({
    //   data: {
    //     orderId: newOrder.id,
    //     status: 'created',
    //     createdAt: new Date(),
    //   },
    // });

    // Emit event for logging
    if (userId) {
      eventBus.emit('ACTION', {
        type: `إنشاء طلب إيجار جديد رقم ${newOrder.id} - العميل: ${formData.customerName}`,
        userId: userId,
      });
    }

    return res.status(200).json({ message: 'Form submitted successfully', orderId: newOrder.id });
  } catch (error) {
    console.error('Error processing form:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
