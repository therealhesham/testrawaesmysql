import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // await prisma..
    const createAdmin = await prisma.user.create({
      data: {
        admin: req.body.admin,
        password: req.body.password,
        pictureurl: req.body.pictureurl,
        idnumber: Number(req.body.idnumber),
        role: req.body.role,
        username: req.body.username,
        phonenumber: req.body.phonenumber,
      },
    });

    res.status(200).send(createAdmin);
  } catch (error) {
    console.log(error);
    res.status(301).send("createAdmin");

    // res.send("error")
  }
}
