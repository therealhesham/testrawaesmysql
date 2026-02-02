import '../../lib/loggers';

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { jwtDecode } from "jwt-decode";
import eventBus from "lib/eventBus";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { SponsorName, PassportNumber, Name, OrderId, age, page, perPage, contractType, sortBy, sortOrder } = req.query;
  console.log(req.query);
  // Set the page size for pagination
  const pageSize = parseInt(perPage as string, 10) || 10;
  const pageNumber = parseInt(page as string, 10) || 1;

  // Build the filter object dynamically based on query parameters
  const filters: any = {};
  
  // Add contractType filter if provided
  if (contractType) {
    filters.contractType = contractType as string;
  }

  if (OrderId) {
    filters.id = {
      equals: Number(OrderId),
    };
  }
  if(Name){
    filters.Name = {
      contains: (Name as string).toLowerCase(),
      // mode: "insensitive",
    };
  }
  if (SponsorName) {
    filters.Name = {
      contains: (SponsorName as string).toLowerCase(),
      // mode: "insensitive",
    };
  }
  if (PassportNumber) {
    filters.Passportnumber = {
      contains: PassportNumber as string,
      // mode: "insensitive",
    };
  }
  if (age) {
  const ageNum = parseInt(age as string, 10);
  if (!isNaN(ageNum)) {
    const today = new Date();

    // أقصى تاريخ ميلاد (الأكبر سنًا)
    const maxBirthDate = new Date(
      today.getFullYear() - ageNum,
      today.getMonth(),
      today.getDate()
    );

    // أقل تاريخ ميلاد (الأصغر سنًا)
    const minBirthDate = new Date(
      today.getFullYear() - ageNum - 1,
      today.getMonth(),
      today.getDate() + 1
    );

    filters.dateofbirth = {
      gte: minBirthDate.toISOString(),
      lte: maxBirthDate.toISOString(),
    };
  }
}

  // Build orderBy object based on sortBy and sortOrder
  let orderBy: any = { displayOrder: "desc" }; // Default sorting
  
  if (sortBy && sortOrder) {
    const sortField = sortBy as string;
    const sortDirection = (sortOrder as string).toLowerCase() === 'asc' ? 'asc' : 'desc';
    
    // Handle nested fields (Country and office)
    if (sortField === 'Country' || sortField === 'office') {
      orderBy = {
        office: {
          [sortField]: sortDirection
        }
      };
    } else {
      orderBy = { [sortField]: sortDirection };
    }
  }

  try {
    // Count total records for pagination (with contractType filter)
    const totalRecords = await prisma.homemaid.count({
      where: filters,
    });
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Count by contract type for tabs (total counts, independent of search filters)
    // Remove contractType from filters for total counts
    const countFilters = { ...filters };
    delete countFilters.contractType;
    
    const recruitmentCount = await prisma.homemaid.count({
      where: {
        ...countFilters,
        contractType: 'recruitment',
      },
    });
    
    const rentalCount = await prisma.homemaid.count({
      where: {
        ...countFilters,
        contractType: 'rental',
      },
    });

    // Fetch data with the filters and pagination
    const homemaids = await prisma.homemaid.findMany({
      include: {
        office: {
          select: {
            office: true,
            Country: true,
          },
        },
      },
      where: filters,
      orderBy: orderBy,
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    });

    // Map the data to match the frontend's expected field names
    const formattedData = homemaids.map((homemaid) => {
      // Extract Picture URL from JSON field
      let pictureUrl = null;
      if (homemaid.Picture) {
        if (typeof homemaid.Picture === 'object' && homemaid.Picture !== null && 'url' in homemaid.Picture) {
          pictureUrl = (homemaid.Picture as any).url;
        } else if (typeof homemaid.Picture === 'string') {
          pictureUrl = homemaid.Picture;
        }
      }
      
      return {
        id: homemaid.id,
        Name: homemaid.Name || "",
        homemaidId: homemaid.id, // Added to match frontend navigation
        phone: homemaid.phone || "",
        maritalstatus: homemaid.maritalstatus || "",
        dateofbirth: homemaid.dateofbirth || "",
        Passportnumber: homemaid.Passportnumber || "",
        PassportStart: homemaid.PassportStart || "",
        PassportEnd: homemaid.PassportEnd || "",
        displayOrder: homemaid.displayOrder || 0,
        isApproved: homemaid.isApproved || false,
        Picture: pictureUrl,
        office: homemaid.office
          ? {
              office: homemaid.office.office || "",
              Country: homemaid.office.Country || "",
            }
          : { office: "", Country: "" },
      };
    });

try {
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      cookies[key] = decodeURIComponent(value);
    });
  }
  const referer = req.headers.referer || '/admin/fulllist'
  const token = jwtDecode(cookies.authToken);
  eventBus.emit('ACTION', {
    type: "عرض قائمة العاملات ",
    beneficiary: "homemaid",
    pageRoute: referer,
    actionType: "view",
    userId: Number((token as any).id),
  });
} catch (error) {
  console.error("Error emitting event:", error);
}



    // Send the filtered, paginated, and formatted data as the response
    res.status(200).json({
      data: formattedData,
      totalPages,
      totalCount: totalRecords,
      recruitment: recruitmentCount,
      rental: rentalCount,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}