import prisma from "./globalprisma";
import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {

const cookie = req.cookies.authToken
const decoder = jwt.verify(cookie, "rawaesecret") as any  || {};
const users = await prisma.user.findFirst({
  where: {
username: decoder?.username,

  },
});
console.log("users",users);
if(!users) return res.status(401).json({ error: 'Unauthorized' });
if(Number(users?.roleId) !== 1) return res.status(401).json({ error: 'Unauthorized' });
// console.log("success");
res.status(200).json({success:"success"});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}