import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    // استرجاع قائمة معاملات نقل الكفالة أو معاملة محددة
    case 'GET':
      try {
        const { id } = req.query;

        if (id) {
          // استرجاع معاملة معينة بناءً على ID
          const transfer = await prisma.transferSponsorShips.findUnique({
            where: { id: Number(id) },
            include: {
              HomeMaid: true,
              NewClient: { select: { fullname: true, phonenumber: true, nationalId: true } },
              OldClient: { select: { fullname: true, phonenumber: true, nationalId: true } },
            },
          });

          if (!transfer) {
            return res.status(404).json({ error: 'معاملة نقل الكفالة غير موجودة' });
          }

          return res.status(200).json(transfer);
        }

        const transfers = await prisma.transferSponsorShips.findMany({
          include: {
            HomeMaid: { select: { Name: true, Passportnumber: true, Nationalitycopy: true } },
            NewClient: { select: { fullname: true, phonenumber: true } },
            OldClient: { select: { fullname: true, phonenumber: true } },
          },
        });

        return res.status(200).json(transfers);
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
transferStage,
WorkDuration,
          TransferingDate,
          file,
        } = req.body;

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
          ContractDate,

          WorkDuration, 
            transferStage,
            NationalID,
            TransferingDate,
            file,
          },
          include: {
            HomeMaid: { select: { Name: true, Passportnumber: true } },
            NewClient: { select: { fullname: true } },
            OldClient: { select: { fullname: true } },
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
        const { id } = req.query;
        const {
          HomeMaidId,
          NewClientId,
          OldClientId,
          Cost,
          ContractDate,
          WorkDuration,
          Paid,
          ExperimentStart,
          ExperimentEnd,
          ExperimentRate,
          Notes,
          NationalID,
          TransferingDate,
          file,
          transferStage
        } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'معرف المعاملة مطلوب' });
        }
console.log(req.body)
        const transfer = await prisma.transferSponsorShips.update({
          where: { id: Number(id) },
          data: {
            HomeMaidId: HomeMaidId ? Number(HomeMaidId) : undefined,
            NewClientId: NewClientId ? Number(NewClientId) : undefined,
            OldClientId: OldClientId ? Number(OldClientId) : undefined,
            Cost: Cost ? parseFloat(Cost) : undefined,
            Paid: Paid ? parseFloat(Paid) : undefined,
            ExperimentStart: ExperimentStart ? new Date(ExperimentStart) : undefined,
            ExperimentEnd: ExperimentEnd ? new Date(ExperimentEnd) : undefined,
            ExperimentRate,
          ContractDate:ContractDate?new Date(ContractDate):undefined,
WorkDuration,
            Notes,
            transferStage,
            NationalID,
            TransferingDate,
            file,
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

        await prisma.transferSponsorShips.delete({
          where: { id: Number(id) },
        });

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