import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getTaxDeclarations(req, res);
      case 'POST':
        return await createTaxDeclaration(req, res);
      case 'PUT':
        return await updateTaxDeclaration(req, res);
      case 'DELETE':
        return await deleteTaxDeclaration(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Tax declarations API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function getTaxDeclarations(req: NextApiRequest, res: NextApiResponse) {
  const { year, month, status } = req.query;
  
  const where: any = {};
  if (year) where.year = parseInt(year as string);
  if (month) where.month = parseInt(month as string);
  if (status) where.status = status;

  const declarations = await prisma.taxDeclaration.findMany({
    where,
    include: {
      salesRecords: true,
      purchaseRecords: true,
      vatRecords: true,
    },
    orderBy: [
      { year: 'desc' },
      { month: 'desc' },
    ],
  });

  return res.status(200).json(declarations);
}

async function createTaxDeclaration(req: NextApiRequest, res: NextApiResponse) {
  const {
    period,
    year,
    month,
    status = 'draft',
    taxableSales = 0,
    zeroRateSales = 0,
    adjustments = 0,
    taxValue = 0,
    salesRecords = [],
    purchaseRecords = [],
    vatRecords = [],
    createdBy,
  } = req.body;

  const declaration = await prisma.taxDeclaration.create({
    data: {
      period,
      year,
      month,
      status,
      taxableSales,
      zeroRateSales,
      adjustments,
      taxValue,
      createdBy,
      salesRecords: {
        create: salesRecords,
      },
      purchaseRecords: {
        create: purchaseRecords,
      },
      vatRecords: {
        create: vatRecords,
      },
    },
    include: {
      salesRecords: true,
      purchaseRecords: true,
      vatRecords: true,
    },
  });

  return res.status(201).json(declaration);
}

async function updateTaxDeclaration(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const {
    period,
    year,
    month,
    status,
    taxableSales,
    zeroRateSales,
    adjustments,
    taxValue,
    salesRecords,
    purchaseRecords,
    vatRecords,
    updatedBy,
  } = req.body;

  // First, delete existing records
  await prisma.taxSalesRecord.deleteMany({
    where: { taxDeclarationId: parseInt(id as string) },
  });
  await prisma.taxPurchaseRecord.deleteMany({
    where: { taxDeclarationId: parseInt(id as string) },
  });
  await prisma.taxVATRecord.deleteMany({
    where: { taxDeclarationId: parseInt(id as string) },
  });

  // Update the declaration and recreate records
  const declaration = await prisma.taxDeclaration.update({
    where: { id: parseInt(id as string) },
    data: {
      period,
      year,
      month,
      status,
      taxableSales,
      zeroRateSales,
      adjustments,
      taxValue,
      updatedBy,
      salesRecords: {
        create: salesRecords || [],
      },
      purchaseRecords: {
        create: purchaseRecords || [],
      },
      vatRecords: {
        create: vatRecords || [],
      },
    },
    include: {
      salesRecords: true,
      purchaseRecords: true,
      vatRecords: true,
    },
  });

  return res.status(200).json(declaration);
}

async function deleteTaxDeclaration(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // Get user info for logging
  const cookieHeader = req.headers.cookie;
  let userId: number | null = null;
  if (cookieHeader) {
    try {
      const cookies: { [key: string]: string } = {};
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
      if (cookies.authToken) {
        const token = jwtDecode(cookies.authToken) as any;
        userId = Number(token.id);
      }
    } catch (e) {
      // Ignore token errors
    }
  }

  const declaration = await prisma.taxDeclaration.findUnique({
    where: { id: parseInt(id as string) },
  });

  await prisma.taxDeclaration.delete({
    where: { id: parseInt(id as string) },
  });

  // تسجيل الحدث
  if (declaration && userId) {
    eventBus.emit('ACTION', {
      type: `حذف إقرار ضريبي #${id} - ${declaration.period || declaration.year + '/' + declaration.month || 'غير محدد'}`,
      actionType: 'delete',
      userId: userId,
    });
  }

  return res.status(200).json({ message: 'Tax declaration deleted successfully' });
}
