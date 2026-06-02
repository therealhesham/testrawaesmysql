import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { jwtDecode } from "jwt-decode";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { search } = req.query;
  const searchTerm = search ? String(search).trim() : "";

  try {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    if (!cookies.authToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Build Prisma query to find active orders matching the search term
    const whereClause: any = {
      bookingstatus: {
        notIn: ["cancelled", "rejected", "new_order", "new_orders", "neworder"],
      },
    };

    if (searchTerm) {
      const isNumeric = /^\d+$/.test(searchTerm);
      
      // Generate search variations to handle Arabic spacing issues (e.g., عبد العزيز vs عبدالعزيز)
      const variations = [searchTerm];
      
      // Normalize "عبد" prefixes
      const noSpaceAbd = searchTerm.replace(/عبد\s+/g, "عبد");
      if (!variations.includes(noSpaceAbd)) variations.push(noSpaceAbd);
      
      const spaceAbd = searchTerm.replace(/عبد(?![\s]|$)/g, "عبد ");
      if (!variations.includes(spaceAbd)) variations.push(spaceAbd);
      
      // Normalize "ابو" / "أبو" prefixes
      const noSpaceAbu = searchTerm.replace(/(ابو|أبو)\s+/g, "$1");
      if (!variations.includes(noSpaceAbu)) variations.push(noSpaceAbu);
      
      const spaceAbu = searchTerm.replace(/(ابو|أبو)(?![\s]|$)/g, "$1 ");
      if (!variations.includes(spaceAbu)) variations.push(spaceAbu);

      whereClause.OR = [
        { id: isNumeric ? Number(searchTerm) : undefined },
        ...variations.flatMap((v) => [
          { client: { fullname: { contains: v } } },
          { HomeMaid: { Name: { contains: v } } },
        ]),
        { client: { phonenumber: { contains: searchTerm } } },
        { client: { nationalId: { contains: searchTerm } } },
        { HomeMaid: { Passportnumber: { contains: searchTerm } } },
      ].filter((condition) => {
        // Only remove the { id: undefined } condition if search is not numeric
        if ("id" in condition && condition.id === undefined) return false;
        return true;
      });
    }

    const orders = await prisma.neworder.findMany({
      where: whereClause,
      include: {
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
            office: {
              select: {
                Country: true,
              },
            },
          },
        },
        arrivals: {
          select: {
            deparatureCityCountry: true,
            deparatureCityCountryDate: true,
            deparatureCityCountryTime: true,
            arrivalSaudiAirport: true,
            KingdomentryDate: true,
            KingdomentryTime: true,
            ticketFile: true,
            travelPermit: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
      take: 50, // limit to 50 search results
    });

    // Format the results for easy display
    const formatted = orders.map((order) => {
      const arrival = order.arrivals?.[0];
      const isReadyForDestinations = arrival?.travelPermit === "issued" || !!arrival?.deparatureCityCountry;
      return {
        orderId: order.id,
        bookingStatus: order.bookingstatus,
        workerId: order.HomeMaid?.id || "",
        workerName: order.HomeMaid?.Name || "غير محدد",
        passport: order.HomeMaid?.Passportnumber || "غير محدد",
        nationality: order.HomeMaid?.office?.Country || "غير محدد",
        clientName: order.client?.fullname || "غير متوفر",
        clientPhone: order.client?.phonenumber || "",
        clientNationalId: order.client?.nationalId || "",
        from: arrival?.deparatureCityCountry || "",
        to: arrival?.arrivalSaudiAirport || "",
        departureDate: arrival?.deparatureCityCountryDate
          ? new Date(arrival.deparatureCityCountryDate).toISOString().split("T")[0]
          : "",
        departureTime: arrival?.deparatureCityCountryTime || "",
        arrivalDate: arrival?.KingdomentryDate
          ? new Date(arrival.KingdomentryDate).toISOString().split("T")[0]
          : "",
        arrivalTime: arrival?.KingdomentryTime || "",
        isReadyForDestinations,
      };
    });

    res.status(200).json({ data: formatted });
  } catch (error) {
    console.error("Error in bulk arrival search:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
}
