
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../globalprisma";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      const {
        Passportnumber,
        searchTerm,
        age,
        clientphonenumber,
        Nationalitycopy,
        page,
        HomemaidId,
        ReasonOfRejection,
      } = req.query;


      // Build the filter object dynamically based on query parameters
      const filters: any = {};

      // Fetch total count of matching records
      const totalCount = await prisma.neworder.count({
        where: {
          bookingstatus: "cancelled",
        },
      });

      // Fetch paginated data with related fields
      const homemaids = await prisma.neworder.findMany({
        orderBy: { id: "desc" },
        where: {
          bookingstatus: "cancelled",
        },
        include: {
          HomeMaid: {
            include: {
              office: true, // Include offices to get Country
            },
          },
        },
       
        take: 3,
      });

      // Map the results to include Nationalitycopy from offices.Country
      const formattedData = homemaids.map((order) => ({
        ...order,
        Nationalitycopy: order.HomeMaid?.office?.Country || order.Nationalitycopy || "غير متوفر",
      }));

      // Send the filtered and paginated data along with total count
      res.status(200).json({
        data: formattedData,
        totalCount,
    
      });
    } else if (req.method === "POST") {
      const updatedOrder = await prisma.neworder.update({
        where: { id: Number(req.body.id) },
        data: {
          bookingstatus: "عقد ملغي",
          ReasonOfRejection: req.body.ReasonOfRejection,
          HomeMaid: { disconnect: true },
        },
      });
      res.status(200).json(updatedOrder);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}