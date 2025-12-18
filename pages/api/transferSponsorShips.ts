import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    // استرجاع قائمة معاملات نقل الكفالة أو معاملة محددة
case 'GET':
      try {
        const { id, page = '1', limit = '10', statusFilter, stageFilter,searchTerm } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;



        // إذا كان في id → جلب معاملة واحدة (بدون pagination)
        if (id) {
          const transfer = await prisma.transferSponsorShips.findUnique({
            where: { id: Number(id) },
            include: {
              HomeMaid: { select: { Name: true, Passportnumber: true, Nationalitycopy: true } },
              NewClient: { select: { fullname: true, phonenumber: true, nationalId: true, city: true } },
              OldClient: { select: { fullname: true, phonenumber: true, nationalId: true, city: true } },
            },
          });

          if (!transfer) {
            return res.status(404).json({ error: 'معاملة نقل الكفالة غير موجودة' });
          }
          return res.status(200).json(transfer);
        }

        // بناء الفلاتر
        const where: any = {};
        if (statusFilter) {
          where.ExperimentRate = statusFilter;
        }
        if (stageFilter) {
          where.TransferingDate = stageFilter;
        }
if(searchTerm) {//or
  where.OR = [
    { TransferOperationNumber: { contains: searchTerm as string } },
    { NewClient: { fullname: { contains: searchTerm as string } } },
    {HomeMaid: { Name: { contains: searchTerm as string } } },
    {NationalID: { contains: searchTerm as string } },
    { OldClient: { fullname: { contains: searchTerm as string } } },
  ];
}
        // جلب البيانات مع Pagination
        const [transfers, total] = await Promise.all([
          prisma.transferSponsorShips.findMany({
            where,
            include: {
              HomeMaid: { select: { Name: true, Passportnumber: true, Nationalitycopy: true } },
              NewClient: { select: { fullname: true, phonenumber: true, city: true } },
              OldClient: { select: { fullname: true, phonenumber: true, city: true } },
            },
            orderBy: { id: 'desc' },
            skip,
            take: limitNum,
          }),
          prisma.transferSponsorShips.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limitNum);

        return res.status(200).json({
          transfers,
          pagination: {
            total,
            totalPages,
            currentPage: pageNum,
            limit: limitNum,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1,
          },
        });
        // ...
      } catch (error) {
        console.error('خطأ في استرجاع معاملات نقل الكفالة:', error);
        return res.status(500).json({ error: 'حدث خطأ في السيرفر' });
      }
    // إنشاء معاملة نقل كفالة جديدة
    case 'POST':
      try {
        const {
          HomeMaidId,
          NewClientId,
          OldClientId,
          Cost,
          Paid,
          ExperimentStart,
          ExperimentEnd,
          ContractDate,
          ExperimentRate,
          Notes,
          NationalID,
transferStage,ExperimentDuration,
WorkDuration,
EntryDate,
          TransferingDate,
          file,
          TransferOperationNumber
        } = req.body;
console.log(req.body)
        // التحقق من الحقول المطلوبة
        if (!HomeMaidId || !NewClientId || !OldClientId) {
          return res.status(400).json({ error: 'معرف العاملة، العميل الجديد، والعميل القديم مطلوبين' });
        }

        const transfer = await prisma.transferSponsorShips.create({
          data: {
            HomeMaidId: Number(HomeMaidId),
            NewClientId: Number(NewClientId),
            OldClientId: Number(OldClientId),
            Cost: Cost ? parseFloat(Cost) : null,
            Paid: Paid ? parseFloat(Paid) : null,
            ExperimentStart: ExperimentStart ? new Date(ExperimentStart) : null,
            ExperimentEnd: ExperimentEnd ? new Date(ExperimentEnd) : null,
            ExperimentRate,
            Notes,
            TransferOperationNumber:TransferOperationNumber?TransferOperationNumber:null,
          ContractDate,
          EntryDate: EntryDate ? new Date(EntryDate) : null,
          ExperimentDuration: ExperimentDuration ? ExperimentDuration : null,
          WorkDuration, 
            transferStage,
            NationalID,
            TransferingDate,
            file,
          },
          include: {
            HomeMaid: { select: { Name: true, Passportnumber: true } },
            NewClient: { select: { fullname: true ,city:true,phonenumber:true} },
            OldClient: { select: { fullname: true ,city:true,phonenumber:true} },
          },
        });

        return res.status(201).json(transfer);
      } catch (error) {
        console.error('خطأ في إنشاء معاملة نقل الكفالة:', error);
        return res.status(500).json({ error: 'حدث خطأ في السيرفر' });
      }

    // تعديل معاملة نقل كفالة
    case 'PUT':
      try {
        console.log(req.body)
        const { id } = req.query;
        const {
          HomeMaidId,
          NewClientId,
          OldClientId,
          Cost,
          ContractDate,
          ExperimentDuration,
          WorkDuration,
          Paid,
          TransferOperationNumber,
          ExperimentStart,
          ExperimentEnd,
          ExperimentRate,
          Notes,
          NationalID,
          TransferingDate,
          file,
          transferStage,
          EntryDate
        } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'معرف المعاملة مطلوب' });
        }
console.log("update",req.body)
        const transfer = await prisma.transferSponsorShips.update({
          where: { id: Number(id) },
          data: {
            TransferOperationNumber:TransferOperationNumber?TransferOperationNumber:null,
            HomeMaidId: HomeMaidId ? Number(HomeMaidId) : undefined,
            NewClientId: NewClientId ? Number(NewClientId) : undefined,
            OldClientId: OldClientId ? Number(OldClientId) : undefined,
            Cost: Cost ? parseFloat(Cost) : undefined,
            Paid: Paid ? parseFloat(Paid) : undefined,
            ExperimentStart: ExperimentStart ? new Date(ExperimentStart) : undefined,
            ExperimentEnd: ExperimentEnd ? new Date(ExperimentEnd) : undefined,
            ExperimentRate,
          ContractDate:ContractDate?new Date(ContractDate):undefined,
          ExperimentDuration: ExperimentDuration ? ExperimentDuration : undefined,
WorkDuration,
            Notes,
            transferStage,
            NationalID,
            TransferingDate,
            file,
            EntryDate: EntryDate ? new Date(EntryDate) : undefined,
          },
          include: {
            HomeMaid: { select: { Name: true, Passportnumber: true } },
            NewClient: { select: { fullname: true } },
            OldClient: { select: { fullname: true } },
          },
        });

        return res.status(200).json(transfer);
      } catch (error) {
        console.error('خطأ في تعديل معاملة نقل الكفالة:', error);
        return res.status(500).json({ error: 'حدث خطأ في السيرفر' });
      }

    // حذف معاملة نقل كفالة
    case 'DELETE':
      try {
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({ error: 'معرف المعاملة مطلوب' });
        }

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

        const transfer = await prisma.transferSponsorShips.findUnique({
          where: { id: Number(id) },
          include: {
            HomeMaid: { select: { Name: true } },
            NewClient: { select: { fullname: true } },
          },
        });

        await prisma.transferSponsorShips.delete({
          where: { id: Number(id) },
        });

        // تسجيل الحدث
        if (transfer && userId) {
          eventBus.emit('ACTION', {
            type: `حذف معاملة نقل كفالة #${id} - ${transfer.TransferOperationNumber || 'غير محدد'}`,
            actionType: 'delete',
            userId: userId,
          });
        }

        return res.status(204).end();
      } catch (error) {
        console.error('خطأ في حذف معاملة نقل الكفالة:', error);
        return res.status(500).json({ error: 'حدث خطأ في السيرفر' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `الطريقة ${method} غير مدعومة` });
  }
}