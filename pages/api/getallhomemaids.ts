import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { Name, id } = req.query;
      console.log(Name)
    const homemaids = await prisma.homemaid.findMany({
      where: {
     
        Name: {contains:typeof Name === 'string' ? Name : undefined},
        id: typeof id === 'string' ? parseInt(id) : undefined
      }
    });
     
      res.status(200).json({
        data: homemaids});
    } catch (error) {
      console.error("Error fetching clients data:", error);
      res.status(500).json({ message: "Internal Server Error" });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}