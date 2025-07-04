import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
export default async function handler(req, res) {
  if (req.method === "PUT") {
    const { homemaids } = req.body;

    try {
      // Update displayOrder for each homemaid
      await Promise.all(
        homemaids.map((homemaid) =>
          prisma.homemaid.update({
            where: { id: homemaid.id },
            data: { displayOrder: homemaid.displayOrder },
          })
        )
      );
      res.status(200).json({ message: "Order updated" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update order" });
    }
  } 
}