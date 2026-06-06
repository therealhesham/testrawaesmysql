import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
import jwt from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { OrderId, type } = req.body;

    if (!OrderId || !type) {
      return res.status(400).json({ error: "OrderId and type are required" });
    }

    let dataToUpdate = {};
    let actionTypeLabel = "";

    if (type === "internal") {
      dataToUpdate = {
        internaldeparatureCity: null,
        internaldeparatureDate: null,
        internaldeparatureTime: null,
        internalArrivalCity: null,
        internalArrivalCityDate: null,
        internalArrivalCityTime: null,
        internalTicketFile: null,
        deliveryOfficer: null,
        internalReason: null,
      };
      actionTypeLabel = "المغادرة الداخلية";
    } else if (type === "external") {
      dataToUpdate = {
        externaldeparatureCityCountry: null,
        externaldeparatureDate: null,
        externaldeparatureTime: null,
        externalArrivalCityCountry: null,
        externalArrivalDate: null,
        externalArrivalTime: null,
        externalTicketFile: null,
        externalReason: null,
      };
      actionTypeLabel = "المغادرة الخارجية";
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }

    const arrivallistRow = await prisma.arrivallist.findFirst({
      where: { OrderId: Number(OrderId) },
      include: { Order: { include: { HomeMaid: true } } },
    });

    if (!arrivallistRow) {
      return res.status(404).json({ error: "Arrival list entry not found" });
    }

    const updated = await prisma.arrivallist.update({
      where: { id: arrivallistRow.id },
      data: dataToUpdate,
    });

    try {
      const token = req.cookies?.authToken;
      let userId: string | null = null;
      let decodedToken: any = null;

      if (token) {
        decodedToken = jwt.verify(token, "rawaesecret");
        userId = decodedToken?.username;
      }

      const referer = req.headers.referer || "/admin/deparatures";

      if (decodedToken) {
        try {
          const eventBus = require("lib/eventBus").default;
          eventBus.emit("ACTION", {
            type: `حذف بيانات ${actionTypeLabel} للعاملة ${
              arrivallistRow.Order?.HomeMaid?.Name || ""
            } - طلب رقم ${OrderId}`,
            beneficiary: "homemaid",
            pageRoute: referer,
            actionType: "delete",
            BeneficiaryId: arrivallistRow.id,
            userId: Number(decodedToken.id),
          });
        } catch (e) {
          console.error("Error emitting departure delete event:", e);
        }
      }

      await prisma.logs.create({
        data: {
          Status: `تم حذف بيانات ${actionTypeLabel} للعاملة ${
            arrivallistRow.Order?.HomeMaid?.Name || ""
          } بنجاح`,
          homemaidId: arrivallistRow.Order?.HomemaidId,
          userId: userId,
        },
      });
    } catch (error) {
      console.error("Error updating logs:", error);
    }

    res.status(200).json({ message: "Departure deleted successfully" });
  } catch (error) {
    console.error("Error deleting departure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
