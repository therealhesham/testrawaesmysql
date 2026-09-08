// ✅ استدعاء loggers لكن تأكد أنه خفيف ولا يعمل عمليات I/O أثناء التحميل
import "../../lib/loggers";

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import eventBus from "lib/eventBus";
import { jwtDecode } from "jwt-decode";

/* ✅ استخدم Prisma Singleton لتجنب فتح/غلق اتصال جديد في كل طلب
   هذا يحل واحدة من أكثر أسباب البطء شيوعًا في Next.js API Routes */
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"], // فقط للأخطاء لتقليل الضوضاء
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

function extractStatement(order: any) {
  if (!order) return null;
  const raw = order.clientAccountStatement;
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return raw.length > 0 ? raw[0] : null;
  }
  if (typeof raw === 'object') {
    return raw;
  }
  return null;
}

function extractEntries(statement: any): any[] {
  if (!statement) return [];
  const raw = statement.entries;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

function getOrderFinancialStatusCode(order: any): string {
  const statement = extractStatement(order);
  if (!statement) {
    return 'no_statement';
  }

  const entries = extractEntries(statement);

  let totalDebit = 0;
  let totalCredit = 0;
  let remainingBalance = 0;

  if (entries.length > 0) {
    totalDebit = entries.reduce((sum: number, entry: any) => sum + Number(entry.debit || 0), 0);
    totalCredit = entries.reduce((sum: number, entry: any) => sum + Number(entry.credit || 0), 0);
    remainingBalance = totalDebit - totalCredit;
  } else {
    totalDebit = Number(statement.totalRevenue ?? order?.Total ?? 0);
    totalCredit = Number(statement.totalExpenses ?? order?.paid ?? 0);
    remainingBalance = Number(statement.netAmount ?? (totalDebit - totalCredit));
  }

  const sanadUrl = order?.orderDocument || statement?.attachment || null;
  const hasSanad = Boolean(sanadUrl && String(sanadUrl).trim() !== '' && sanadUrl !== 'عرض' && sanadUrl !== 'غير متوفر');

  const isTwoInstallments =
    order?.Installments === 2 ||
    order?.PaymentMethod === 'two-installments' ||
    order?.PaymentMethod === 'دفعتين' ||
    (entries.length > 0 && entries.some((e: any) => String(e?.description || '').includes('دفعة أولى') || String(e?.description || '').includes('دفعة ثانية')));

  // Case A: Fully Paid (Remaining <= 0)
  if (remainingBalance <= 0 && (totalCredit > 0 || totalDebit === 0)) {
    if (isTwoInstallments) {
      return 'paid_full_two';
    } else {
      return 'paid_full_single';
    }
  }

  // Case B: No payment made yet (Unpaid / pending)
  if (totalCredit <= 0) {
    return 'unpaid';
  }

  // Case C: Partial Payment (Remaining > 0)
  if (hasSanad) {
    return 'two_installments_with_sanad';
  } else {
    return 'two_installments_no_sanad';
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const {
        ClientName,
        typeOfContract,
        Passport,
        Nationality,
        Passportnumber,
        searchTerm,
        age,
        clientphonenumber,
        Nationalitycopy,
        page,
        perPage,
        HomemaidId,
        officeName,
        bookingstatus,
        bookingstatusIn,
        isLinked,
        dateFrom,
        dateTo,
        financialStatus,
      } = req.query;

      // دعم التصدير: عند إرسال perPage كبير نستخدمه لجلب كل البيانات (صفحة واحدة كبيرة)
      const requestedPerPage = parseInt(perPage as string, 10);
      const pageSize = requestedPerPage > 0 && requestedPerPage <= 50000 ? requestedPerPage : 10;
      const pageNumber = Math.max(parseInt(page as string, 10) || 1, 1);

      const filters: any = {};

      // ✅ فلترة ديناميكية مرنة
      if (Passportnumber) filters.Passportnumber = { contains: Passportnumber };
      if (clientphonenumber) filters.clientphonenumber = { contains: clientphonenumber };
      if (HomemaidId) filters.HomemaidId = { equals: Number(HomemaidId) };


      if (age) {
        const ageNum = parseInt(age as string, 10);
        if (!isNaN(ageNum)) {
          const currentYear = new Date().getFullYear();
          const targetBirthYear = currentYear - ageNum;
          filters.dateofbirth = {
            gte: new Date(`${targetBirthYear - 2}-01-01`).toISOString(),
            lte: new Date(`${targetBirthYear + 2}-12-31`).toISOString(),
          };
        }
      }

      if (Nationalitycopy) {
        filters.HomeMaid = { office: { Country: { contains: Nationalitycopy as string } } };
      }

      if (typeOfContract) filters.typeOfContract = { equals: typeOfContract };
      if (officeName) filters.HomeMaid = { office: { office: { contains: officeName as string } } };
      if (bookingstatusIn) {
        const parts = String(bookingstatusIn)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (parts.length) filters.bookingstatus = { in: parts };
      } else if (bookingstatus) {
        filters.bookingstatus = { equals: bookingstatus };
      }

      if (dateFrom || dateTo || isLinked) {
        filters.arrivals = {
          some: {
            ...(dateFrom || dateTo ? {
              DateOfApplication: {
                ...(dateFrom && { gte: new Date(dateFrom as string).toISOString() }),
                ...(dateTo && { lte: new Date(`${dateTo as string}T23:59:59.999Z`).toISOString() }),
              }
            } : {}),
            ...(isLinked === 'true' && { ExternalDateLinking: { not: null } }),
            ...(isLinked === 'false' && { ExternalDateLinking: null }),
          }
        };
      }

      if (searchTerm) {
        const termStr = String(searchTerm).trim();
        const idStr = termStr.replace(/^#/, "").trim();
        const idNum = /^\d+$/.test(idStr) ? parseInt(idStr, 10) : NaN;
        filters.OR = [
          { HomeMaid: { Name: { contains: termStr } } },
          { ClientName: { contains: termStr } },
          { client: { fullname: { contains: termStr } } },
          { client: { nationalId: { contains: termStr } } },
          { nationalId: { contains: termStr } },
          { Passportnumber: { contains: termStr } },
          { clientphonenumber: { contains: termStr } },
          { client: { phonenumber: { contains: termStr } } },
          ...(Number.isFinite(idNum) && !Number.isNaN(idNum) ? [{ id: idNum }] : []),
        ];
      }

      const orderSelectFields = {
        id: true,
        bookingstatus: true,
        orderDocument: true,
        contract: true,
        PaymentMethod: true,
        Installments: true,
        Total: true,
        paid: true,
        clientAccountStatement: {
          select: {
            id: true,
            totalRevenue: true,
            totalExpenses: true,
            netAmount: true,
            attachment: true,
            entries: {
              select: {
                id: true,
                debit: true,
                credit: true,
                balance: true,
                description: true,
              },
            },
          },
        },
        arrivals: { select: { InternalmusanedContract: true, DateOfApplication: true } },
        client: {
          select: {
            id: true,
            fullname: true,
            phonenumber: true,
            nationalId: true,
          },
        },
        HomeMaid: {
          select: {
            id: true,
            Name: true,
            Passportnumber: true,
            office: { select: { office: true, Country: true } },
          },
        },
      };

      const baseNotCondition = {
        OR: [
          {
            bookingstatus: {
              in: ["new_order", "new_orders", "delivered", "cancelled", "rejected"],
            },
          },
          // استبعاد الطلبات التي لديها ملف استلام
          {
            DeliveryDetails: {
              some: {
                deliveryFile: {
                  not: null,
                },
              },
            },
          },
        ],
      };

      // ✅ جلب السجلات وحساب الإحصائيات لكافة الصفحات
      const [allCandidateOrders, recCount, rentCount] = await Promise.all([
        prisma.neworder.findMany({
          orderBy: { id: "desc" },
          select: orderSelectFields,
          where: {
            ...filters,
            NOT: baseNotCondition,
          },
        }),
        prisma.neworder.count({
          where: {
            typeOfContract: "recruitment",
            NOT: baseNotCondition,
          },
        }),
        prisma.neworder.count({
          where: {
            typeOfContract: "rental",
            NOT: baseNotCondition,
          },
        }),
      ]);

      const financialStatusCounts: Record<string, number> = {
        all: allCandidateOrders.length,
        paid_full_single: 0,
        paid_full_two: 0,
        two_installments_with_sanad: 0,
        two_installments_no_sanad: 0,
        unpaid: 0,
        no_statement: 0,
      };

      for (const order of allCandidateOrders) {
        const code = getOrderFinancialStatusCode(order);
        if (financialStatusCounts[code] !== undefined) {
          financialStatusCounts[code]++;
        }
      }

      let homemaids: any[] = [];
      let totalCount = 0;

      if (financialStatus && financialStatus !== "all") {
        const filteredOrders = allCandidateOrders.filter(
          (order) => getOrderFinancialStatusCode(order) === financialStatus
        );
        totalCount = filteredOrders.length;
        homemaids = filteredOrders.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
      } else {
        totalCount = allCandidateOrders.length;
        homemaids = allCandidateOrders.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
      }

      const recruitment = recCount;
      const rental = rentCount;
      const totalPages = Math.ceil(totalCount / pageSize) || 1;

      // ✅ إرسال الرد مباشرة قبل أي عمليات غير ضرورية (لتقليل زمن الاستجابة للمستخدم)
      res.status(200).json({
        homemaids,
        totalCount,
        recruitment,
        rental,
        totalPages,
        financialStatusCounts,
      });

      // ✅ إرسال الحدث بعد الرد حتى لا يؤخر العميل
      (async () => {
        try {
          const cookieHeader = req.headers.cookie;
          const referer = req.headers.referer || '/admin/currentorders';
          let tokenId = null;

          if (cookieHeader) {
            const cookies = Object.fromEntries(
              cookieHeader.split(";").map((c) => {
                const [k, v] = c.trim().split("=");
                return [k, decodeURIComponent(v)];
              })
            );
            const decoded = jwtDecode(cookies.authToken);
            tokenId = (decoded as any).id;
          }

          if (tokenId) {
            eventBus.emit("ACTION", {
              type: "عرض قائمة الطلبات الحالية",
              beneficiary: "homemaid",
              pageRoute: referer,
              actionType: "view",
              userId: Number(tokenId),
            });
          }
        } catch (error) {
          console.error("Error emitting event:", error);
        }
      })();

    } else if (req.method === "POST") {
      const updatedOrder = await prisma.neworder.update({
        where: { id: Number(req.body.id) },
        data: { bookingstatus: "delivered" },
      });
      res.status(200).json(updatedOrder);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
}
