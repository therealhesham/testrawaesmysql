import '../../lib/loggers';
import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
import eventBus from "lib/eventBus";
import { jwtDecode } from "jwt-decode";
import cookie from "cookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const {
    ClientName,
    PhoneNumber,
    HomemaidId,
    address,
    nationalId,
    age,
    clientphonenumber,
    PaymentMethod,
    Name,
    typeOfContract,
    Passportnumber,
    maritalstatus,
    email,
    orderDocument,
    contract,
    Nationality,
    Religion,
    city,
    externalOfficeStatus,
    ExperienceYears,
    Paid
  } = req.body;

  try {
    // ✅ تحقق من الحجز المسبق
    const existingOrder = await prisma.neworder.findFirst({
      where: { HomeMaid: { id: HomemaidId } },
    });

    if (existingOrder) {
      return res.status(400).json({ message: "العاملة محجوزة بالفعل" });
    }

    // ✅ إنشاء الطلب الأساسي
    const result = await prisma.neworder.create({
      include: { client: true },
      data: {
        HomemaidIdCopy: HomemaidId,
        ExperienceYears: ExperienceYears + "",
        Nationality,
        bookingstatus: "pending_external_office",
        Passportnumber,
        PaymentMethod,
        typeOfContract,
        Name,
        ClientName,
        clientphonenumber,
        Religion,
        PhoneNumber,
        ages: age + "",
        housed: { create: { HomeMaidId: HomemaidId } },
        paid: Paid == null ? undefined : Number(Paid),
        client: {
          create: {
            email,
            address,
            city,
            nationalId,
            fullname: ClientName,
            phonenumber: clientphonenumber,
          },
        },
        HomeMaid: { connect: { id: HomemaidId } },
      },
    });

    // ✅ أرسل الاستجابة للمستخدم بسرعة
    res.status(200).json(result);

    // ✅ تنفيذ باقي العمليات في الخلفية (بدون تعطيل الرد)
    setImmediate(async () => {
      try {
        // كوكيز وتحليل التوكن
        const cookies = cookie.parse(req.headers.cookie || "");
        const token = jwtDecode(cookies.authToken || "") as any;

        // جلب بيانات العاملة لمعلومات المكتب
        const homemaid = await prisma.homemaid.findUnique({
          where: { id: HomemaidId },
          include: { office: true },
        });

        const officeName = homemaid?.officeName || homemaid?.office?.office || '';

        // ✅ تنفيذ العمليات المتعددة بالتوازي لتحسين الأداء
        const [arrivallist, statement] = await Promise.all([
          prisma.arrivallist.create({
            data: {
              SponsorName: ClientName,
              PassportNumber: Passportnumber,
              Order: { connect: { id: result.id } },
            },
          }),
          prisma.clientAccountStatement.create({
            data: {
              clientId: Number(result.client?.id),
              orderId: Number(result.id),
              contractNumber: `ORD-${result.id}`,
              officeName,
              totalRevenue: Number(Paid),
              totalExpenses: 0,
              netAmount: Number(Paid),
              contractStatus: result.bookingstatus,
              notes: 'تم اضافتها تلقائيا خلال عملية اضافة الطلب',
            },
          }),
        ]);

        // ✅ إنشاء سجل الحساب
        await prisma.clientAccountEntry.create({
          data: {
            statementId: statement.id,
            date: new Date(),
            description: 'دفعة أولى',
            debit: 0,
            credit: Number(Paid),
            balance: Number(Paid),
            entryType: 'payment',
          },
        });

        // ✅ تسجيل الحدث في EventBus
        eventBus.emit('ACTION', {
          type: 'تسجيل طلب جديد رقم ' + result.id,
          userId: Number(token.id),
        });

        // ✅ حفظ سجل في logs
        await prisma.logs.create({
          data: {
            Details: 'تسجيل طلب جديد رقم ' + result.id,
            homemaidId: result.HomemaidId,
            userId: token.username,
            Status: "طلب جديد",
          },
        });

      } catch (err) {
        console.error("Error in background processing:", err);
      }
    });

  } catch (error: unknown) {
    console.error("Error in creating new order:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(400).json({
          message: "البيانات التي تحاول إدخالها قد تكون مسجلة بالفعل",
          details: error.meta,
        });
      } else if (error.code === "P2003") {
        return res.status(400).json({
          message: "خطأ في الربط ببيانات أخرى. يرجى التحقق من البيانات المرتبطة.",
          details: error.meta,
        });
      }
      return res.status(500).json({
        message: "خطأ في الاتصال بقاعدة البيانات",
        details: (error as Error).message,
      });
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return res.status(400).json({
        message: "عدم تطابق في البيانات المدخلة",
        details: (error as Error).message,
      });
    }

    res.status(500).json({
      message: "حدث خطأ غير متوقع.",
      details: (error as Error).message,
    });
  }
}
