import prisma from "./globalprisma";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      // Fetch all deliveries that are not delivered yet
      const deliveries = await prisma.deliveryDetails.findMany({
        where: {
          isDelivered: false,
          deliveryDate: { not: null },
        },
        include: {
          neworder: {
            select: {
              id: true,
              ClientName: true,
              Name: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: {
          deliveryDate: 'asc',
        },
      });

      // Convert BigInt to string for JSON serialization
      const serializedDeliveries = JSON.parse(
        JSON.stringify(deliveries, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      );

      return res.status(200).json(serializedDeliveries);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      return res.status(500).json({ error: "Error fetching deliveries" });
    }
  } else if (req.method === "POST") {
    // You can add POST method later for creating/updating deliveries
    return res.status(405).json({ error: "Method not implemented yet" });
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

