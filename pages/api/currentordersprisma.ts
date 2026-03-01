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
      if (bookingstatus) filters.bookingstatus = { equals: bookingstatus };

      if (searchTerm) {
        filters.OR = [
          { HomeMaid:{Name:{contains:searchTerm}}  },
          { ClientName: { contains: searchTerm as string } },
          { client: { fullname: { contains: searchTerm as string } } },
          { Passportnumber: { contains: searchTerm as string } },
          { clientphonenumber: { contains: searchTerm as string } },
          { client: { phonenumber: { contains: searchTerm as string } } },
        ];
      }

      // ✅ الاستعلامات بالتوازي لتقليل زمن التنفيذ
      const [homemaids, totalCount, recruitment, rental] = await Promise.all([
        prisma.neworder.findMany({
          orderBy: { id: "desc" },
          select: {
            id: true,
            bookingstatus: true,
            arrivals: { select: { InternalmusanedContract: true } },
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
          },
          where: {
            ...filters,
            NOT: {
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
            },
          },
          skip: (pageNumber - 1) * pageSize,
          take: pageSize,
        }),

        prisma.neworder.count({
          where: {
            ...filters,
            NOT: {
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
            },
          },
        }),

        prisma.neworder.count({
          where: {
            typeOfContract: "recruitment",
            NOT: {
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
            },
          },
        }),

        prisma.neworder.count({
          where: {
            typeOfContract: "rental",
            NOT: {
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
            },
          },
        }),
      ]);

      // ✅ إرسال الرد مباشرة قبل أي عمليات غير ضرورية (لتقليل زمن الاستجابة للمستخدم)
      res.status(200).json({
        homemaids,
        totalCount,
        recruitment,
        rental,
        totalPages: Math.ceil(totalCount / pageSize),
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
