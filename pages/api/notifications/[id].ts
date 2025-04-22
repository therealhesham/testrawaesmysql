import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === "PATCH") {
    try {
      const { isRead } = req.body;

      // Validate input
      if (typeof isRead !== "boolean") {
        return res
          .status(400)
          .json({ error: "isRead must be a boolean value" });
      }

      // Update notification
      const updatedNotification = await prisma.notifications.update({
        where: { id: Number(id) },
        data: { isRead },
      });

      return res.status(200).json(updatedNotification);
    } catch (error) {
      console.error("Error updating notification:", error);
      return res.status(500).json({ error: "Failed to update notification" });
    }
  } else {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
