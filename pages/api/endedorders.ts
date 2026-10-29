import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

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
        ratingStatus,
        starsCount,
        fromDate,
        toDate,
        warrantyStatus,
        page,
        HomemaidId,
        perPage,
      } = req.query;

      const pageSize = perPage ? parseInt(perPage as string, 10) : 10;
      const pageNumber = parseInt(page as string, 10) || 1;

      if (pageNumber < 1) {
        return res.status(400).json({ error: "Page number must be positive" });
      }

      const andConditions: any[] = [];

      // Contract Type
      if (typeOfContract) {
        andConditions.push({ typeOfContract: { equals: typeOfContract as string } });
      }

      // Filter by HomeMaid office Country (where nationality is stored)
      if (Nationality) {
        andConditions.push({
          HomeMaid: {
            office: {
              Country: {
                contains: Nationality as string,
              },
            },
          },
        });
      }

      // Explicit legacy filters if provided directly
      if (Passportnumber) {
        andConditions.push({
          OR: [
            { Passportnumber: { contains: Passportnumber as string } },
            { HomeMaid: { Passportnumber: { contains: Passportnumber as string } } },
          ],
        });
      }

      if (clientphonenumber) {
        andConditions.push({
          OR: [
            { clientphonenumber: { contains: clientphonenumber as string } },
            { PhoneNumber: { contains: clientphonenumber as string } },
            { phone: { contains: clientphonenumber as string } },
            { client: { phonenumber: { contains: clientphonenumber as string } } },
          ],
        });
      }

      if (HomemaidId) {
        andConditions.push({ HomemaidId: { equals: Number(HomemaidId) } });
      }

      if (age) {
        const ageNum = parseInt(age as string, 10);
        if (!isNaN(ageNum)) {
          const currentYear = new Date().getFullYear();
          const targetBirthYear = currentYear - ageNum;
          andConditions.push({
            dateofbirth: {
              gte: new Date(`${targetBirthYear - 2}-01-01`),
              lte: new Date(`${targetBirthYear + 2}-12-31`),
            },
          });
        }
      }

      if (Nationalitycopy) {
        andConditions.push({
          Nationalitycopy: { contains: (Nationalitycopy as string).toLowerCase() },
        });
      }

      // 🔍 تفعيل البحث: باسم العاملة، العميل، رقم هوية العميل، رقم جواز العاملة، رقم جوال العميل
      if (searchTerm) {
        const rawTerm = String(searchTerm).trim();
        if (rawTerm) {
          // تحويل الأرقام العربية إلى إنجليزية لدعم البحث بالأرقام العربية والإنجليزية
          const normalizedDigits = rawTerm.replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
          const terms = Array.from(new Set([rawTerm, normalizedDigits])).filter(Boolean);

          const searchOrConditions: any[] = [];

          for (const term of terms) {
            const idStr = term.replace(/^#/, "").trim();
            const idNum = /^\d+$/.test(idStr) ? parseInt(idStr, 10) : NaN;

            // 1. اسم العاملة
            searchOrConditions.push({ HomeMaid: { Name: { contains: term } } });
            searchOrConditions.push({ Name: { contains: term } });

            // 2. اسم العميل
            searchOrConditions.push({ ClientName: { contains: term } });
            searchOrConditions.push({ client: { fullname: { contains: term } } });

            // 3. رقم هوية العميل
            searchOrConditions.push({ nationalId: { contains: term } });
            searchOrConditions.push({ client: { nationalId: { contains: term } } });

            // 4. رقم جواز العاملة
            searchOrConditions.push({ HomeMaid: { Passportnumber: { contains: term } } });
            searchOrConditions.push({ Passportnumber: { contains: term } });

            // 5. رقم جوال العميل
            searchOrConditions.push({ clientphonenumber: { contains: term } });
            searchOrConditions.push({ PhoneNumber: { contains: term } });
            searchOrConditions.push({ phone: { contains: term } });
            searchOrConditions.push({ client: { phonenumber: { contains: term } } });
            searchOrConditions.push({ client: { alternativePhone: { contains: term } } });

            // رقم الطلب أو رقم العميل / العاملة إذا كان المدخل رقماً
            if (Number.isFinite(idNum) && !Number.isNaN(idNum)) {
              searchOrConditions.push({ id: idNum });
              searchOrConditions.push({ clientID: idNum });
              searchOrConditions.push({ client: { id: idNum } });
              searchOrConditions.push({ HomemaidId: idNum });
              searchOrConditions.push({ HomeMaid: { id: idNum } });
            }
          }

          andConditions.push({ OR: searchOrConditions });
        }
      }

      // 1. & 2. Rating Filters
      if (ratingStatus === 'rated') {
        andConditions.push({ ratings: { some: { isRated: true } } });
      } else if (ratingStatus === 'unrated') {
        andConditions.push({ ratings: { none: { isRated: true } } });
      }

      if (starsCount && starsCount !== 'all' && starsCount !== '') {
        const starsNum = parseInt(starsCount as string, 10);
        if (!isNaN(starsNum)) {
          andConditions.push({ ratings: { some: { stars: starsNum } } });
        }
      }

      // 3. Date Filter (Delivery Date)
      if (fromDate || toDate) {
        const dateFilter: any = {};
        if (fromDate) dateFilter.gte = new Date(fromDate as string);
        if (toDate) {
          const end = new Date(toDate as string);
          end.setHours(23, 59, 59, 999);
          dateFilter.lte = end;
        }
        andConditions.push({
          DeliveryDetails: {
            some: {
              deliveryFile: { not: null },
              deliveryDate: dateFilter,
            },
          },
        });
      } else {
        // 5. Completed Orders Condition (الطلبات المكتملة)
        andConditions.push({
          OR: [
            {
              DeliveryDetails: {
                some: {
                  deliveryFile: {
                    not: null,
                  },
                },
              },
            },
            {
              isContractEnded: true,
            },
            {
              bookingstatus: {
                in: ['مغلق لهروب العاملة من المطار', 'closed', 'مغلق'],
              },
            },
          ],
        });
      }

      // 4. Warranty Filter
      if (warrantyStatus && warrantyStatus !== 'all' && warrantyStatus !== '') {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        if (warrantyStatus === 'valid') {
          andConditions.push({ isContractEnded: { not: true } });
          andConditions.push({ arrivals: { some: { KingdomentryDate: { gte: ninetyDaysAgo } } } });
        } else if (warrantyStatus === 'expired') {
          andConditions.push({
            OR: [
              { isContractEnded: true },
              { arrivals: { some: { KingdomentryDate: { lt: ninetyDaysAgo } } } },
              { arrivals: { none: {} } },
            ],
          });
        }
      }

      const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

      // جلب البيانات - الطلبات المكتملة
      const homemaids = await prisma.neworder.findMany({
        include: {
          HomeMaid: {
            include: {
              office: true,
            },
          },
          client: true,
          ratings: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          arrivals: {
            select: {
              KingdomentryDate: true,
              GuaranteeDurationEnd: true,
              DateOfApplication: true,
            },
          },
          DeliveryDetails: {
            where: {
              deliveryFile: { not: null },
              deliveryDate: { not: null },
            },
            orderBy: { id: 'desc' },
            take: 1,
            select: { deliveryDate: true },
          },
        },
        orderBy: { id: "desc" },
        where: whereClause,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      });

      const totalCount = await prisma.neworder.count({
        where: whereClause,
      });

      // تسلسل كامل لضمان وصول createdAt وجميع التواريخ للفرونت
      const serialized = JSON.parse(
        JSON.stringify(homemaids, (_, v) => (v instanceof Date ? v.toISOString() : v))
      );

      return res.status(200).json({
        homemaids: serialized,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      });
    } else if (req.method === "POST") {
      const updatedOrder = await prisma.neworder.update({
        where: { id: Number(req.body.id) },
        data: { bookingstatus: "received" },
      });
      return res.status(200).json(updatedOrder);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
}
