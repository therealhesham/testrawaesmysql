import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const admins = await prisma.user.findMany();
      res.status(200).json(admins);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch admins" });
    }
  } else if (req.method === "POST") {
    try {
      const {
        admin,
        password,
        pictureurl,
        idnumber,
        role,
        username,
        phonenumber,
      } = req.body;
      const newAdmin = await prisma.user.create({
        data: {
          admin,
          password,
          pictureurl,
          idnumber: Number(idnumber),
          role,
          username,
          phonenumber,
        },
      });
      res.status(201).json(newAdmin);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create admin" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
