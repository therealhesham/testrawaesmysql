import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { writeFile } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const formData = req.body;
console.log(req.body)
    // Validate required fields
    const requiredFields = ['customerName', 'phoneNumber', 'workerId', 'contractDuration', 'contractStartDate', 'contractEndDate', 'paymentMethod', 'totalAmount', 'paidAmount'];
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
      const fileBuffer = Buffer.from(await formData.contractFile.arrayBuffer());
      const fileName = `${Date.now()}_${formData.contractFile.name}`;
      const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
      await writeFile(filePath, fileBuffer);
      contractFilePath = `/uploads/${fileName}`;
    }

    // Create new order
    const newOrder = await prisma.neworder.create({
      data: {
        ClientName: formData.customerName,
        PhoneNumber: formData.phoneNumber,
        clientID: client.id,
        HomemaidId: parseInt(formData.workerId) || null,
        typeOfContract: formData.contractDuration,
        bookingstatus: 'pending', // Default status, adjust as needed
        createdAt: new Date(),
        updatedAt: new Date(),
        PaymentMethod: formData.paymentMethod,
        Total: parseInt(formData.totalAmount) || 0,
        Installments: formData.paymentMethod === 'cash' ? 1 : formData.paymentMethod === 'two-installments' ? 2 : 3,
      },
    });

    // Create payment record
    if (formData.paidAmount && parseFloat(formData.paidAmount) > 0) {
      await prisma.payment.create({
        data: {
          orderId: newOrder.id,
          Paid: parseFloat(formData.paidAmount),
        },
      });
    }

    // Create order status
    // await prisma.orderStatus.create({
    //   data: {
    //     orderId: newOrder.id,
    //     status: 'created',
    //     createdAt: new Date(),
    //   },
    // });

    return res.status(200).json({ message: 'Form submitted successfully', orderId: newOrder.id });
  } catch (error) {
    console.error('Error processing form:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
