import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    searchTerm,
    age,
    externalOfficeStatus,
    InternalmusanedContract,
    Passportnumber,
    clientphonenumber,
    Nationalitycopy,
    page,
    HomemaidId,
    Country,
  } = req.query;

  // Set the page size for pagination
  const pageSize = 10;
  const pageNumber = parseInt(page as string, 10) || 1;

  // Build the filter object dynamically based on query parameters
  const filters: any = {};

  if (Passportnumber) filters.Passportnumber = { contains: Passportnumber };

  if (InternalmusanedContract) {
    filters.arrivals = {
      some: {
        InternalmusanedContract: { contains: InternalmusanedContract },
      },
    };
  }
  if (externalOfficeStatus) {
    filters.arrivals = {
      some: {
        externalOfficeStatus: { contains: externalOfficeStatus },
      },
    };
  }

  // Age filter: Calculate age from dateofbirth
  if (age) {
    const ageString = age as string;
    const currentYear = new Date().getFullYear();
    
    // Check if age is in range format (e.g., "25-35") or single age (e.g., "30")
    if (ageString.includes("-")) {
      const [minAge, maxAge] = ageString.split("-").map(Number);
      
      // Validate that both ages are valid numbers
      if (!isNaN(minAge) && !isNaN(maxAge) && minAge > 0 && maxAge > 0) {
        // For age range: minAge=25, maxAge=35
        // We want birth years between (currentYear - maxAge) and (currentYear - minAge)
        const maxBirthYear = currentYear - minAge; // Older birth year (younger age)
        const minBirthYear = currentYear - maxAge; // Younger birth year (older age)

        filters.HomeMaid = {
          ...filters.HomeMaid,
          dateofbirth: {
            gte: new Date(`${minBirthYear}-01-01T00:00:00.000Z`).toISOString(), // Greater than or equal to younger birth year
            lte: new Date(`${maxBirthYear}-12-31T23:59:59.999Z`).toISOString(), // Less than or equal to older birth year
          },
        };
      }
    } else {
      // Single age format
      const singleAge = parseInt(ageString, 10);
      if (!isNaN(singleAge) && singleAge > 0) {
        const targetBirthYear = currentYear - singleAge;
        
        filters.HomeMaid = {
          ...filters.HomeMaid,
          dateofbirth: {
            gte: new Date(`${targetBirthYear - 2}-01-01T00:00:00.000Z`).toISOString(),
            lte: new Date(`${targetBirthYear + 2}-12-31T23:59:59.999Z`).toISOString(),
          },
        };
      }
    }
  }

  // Nationality filter: Search in neworder.Nationalitycopy, homemaid.Nationalitycopy, and offices.Country
  if (Country) {
    filters.AND = [
      ...(filters.AND || []),
      {
        OR: [
          {
            HomeMaid: {
              office: {
                Country: { contains: Country as string },
              },
            },
          },
        ],
      },
    ];
  }

  // بناء شرط البحث: عند عدم وجود searchTerm لا نضيف فلتر البحث (ليشمل الطلبات بدون عاملة)
  const searchCondition = searchTerm
    ? {
        OR: [
          { ClientName: { contains: (searchTerm as string).toLowerCase() } },
          { Name: { contains: (searchTerm as string).toLowerCase() } },
          // الطلبات بدون عاملة تظهر عبر ClientName أو Name فقط
          { HomeMaid: { Name: { contains: (searchTerm as string).toLowerCase() } } },
        ],
      }
    : {};

  const andConditions = [
    ...(filters.AND || []),
    ...(Object.keys(searchCondition).length > 0 ? [searchCondition] : []),
  ];
  const whereClause = {
    bookingstatus: { in: ["rejected", "cancelled", "طلب مرفوض", "عقد ملغي"] },
    ...filters,
    ...(andConditions.length > 0 ? { AND: andConditions } : {}),
  };

  try {
    // Fetch data with the filters and pagination
    const [orders, totalCount] = await Promise.all([
      prisma.neworder.findMany({
        orderBy: { id: "desc" },
        include: {
          rejectedOrders: {
            include: {
              HomeMaid: {
                select: {
                  id: true,
                  Name: true,
                  Passportnumber: true,
                  Nationalitycopy: true,
                  Religion: true,
                  age: true,
                  dateofbirth: true,
                  office: { select: { Country: true } },
                },
              },
            },
          },
          client: true,
          HomeMaid: true,
          cancelledOrders: {
            include: {
              HomeMaid: {
                select: {
                  id: true,
                  Name: true,
                  Passportnumber: true,
                  Nationalitycopy: true,
                  Religion: true,
                  age: true,
                  dateofbirth: true,
                  office: { select: { Country: true } },
                },
              },
            },
          },
        },
        where: whereClause,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      prisma.neworder.count({
        where: whereClause,
      }),
    ]);

    // جلب بيانات العاملات من HomemaidIdCopy للطلبات المرفوضة/الملغية
    const homemaidIds = orders
      .filter(order => order.HomemaidIdCopy)
      .map(order => order.HomemaidIdCopy as number);

    const homemaidsData = await prisma.homemaid.findMany({
      where: {
        id: { in: homemaidIds },
      },
      select: {
        id: true,
        Name: true,
        Passportnumber: true,
        Nationalitycopy: true,
        Religion: true,
        age: true,
        dateofbirth: true,
        office: {
          select: {
            Country: true,
          },
        },
      },
    });

    // دمج البيانات: السبب وبيانات العاملة من الجدول المناسب (rejectedOrders أو cancelledOrders)
    const isRejected = (status: string | null) =>
      status === "rejected" || status === "طلب مرفوض";
    const isCancelled = (status: string | null) =>
      status === "cancelled" || status === "عقد ملغي";

    const homemaids = orders.map(order => {
      // بيانات العاملة من السجل المرتبط: rejected -> rejectedOrders[0].HomeMaid، cancelled -> cancelledOrders[0].HomeMaid
      let homemaid = null;
      if (isRejected(order.bookingstatus) && order.rejectedOrders?.[0]?.HomeMaid) {
        homemaid = order.rejectedOrders[0].HomeMaid;
      } else if (isCancelled(order.bookingstatus) && order.cancelledOrders?.[0]?.HomeMaid) {
        homemaid = order.cancelledOrders[0].HomeMaid;
      } else if (order.HomemaidIdCopy) {
        homemaid = homemaidsData.find(h => h.id === order.HomemaidIdCopy) || null;
      }

      const reasonFromRejected = order.rejectedOrders?.[0]?.ReasonOfRejection ?? order.ReasonOfRejection;
      const reasonFromCancelled = order.cancelledOrders?.[0]?.ReasonOfCancellation ?? order.ReasonOfCancellation;
      const reason = isRejected(order.bookingstatus)
        ? reasonFromRejected
        : isCancelled(order.bookingstatus)
          ? reasonFromCancelled
          : reasonFromRejected || reasonFromCancelled;
      const reasonType = isRejected(order.bookingstatus) ? "rejection" : "cancellation";
      const orderType = isRejected(order.bookingstatus) ? "مرفوض" : "ملغي";

      return {
        ...order,
        HomeMaid: homemaid,
        reason: reason || null,
        reasonType,
        orderType,
      };
    });

    res.status(200).json({ homemaids, totalCount, page: pageNumber, pageSize });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}