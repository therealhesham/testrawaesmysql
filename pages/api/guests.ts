// pages/api/guests.js
import prisma from "./globalprisma";

export default async function handler(req, res) {
  const { search } = req.query;
  console.log(search);
  const guests = await prisma.housedworker.findMany({
    include: { Order: true },
    where: {
      homeMaid_id: { equals: parseInt(search) },
      // { roomNumber: { contains:
    },
  });
  res.status(200).json(guests);
}
