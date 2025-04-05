import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { Passportnumber } = req.query;

  if (!Passportnumber) {
    return res.status(400).json({ error: "Passportnumber is required" });
  }

  try {
    // البحث عن العاملة باستخدام Passportnumber
    const homeMaid = await prisma.neworder.findFirst({
      include: { HomeMaid: { select: { Name: true } } },
      where: {
        Passportnumber: { contains: Passportnumber }, // تأكد من تحويله إلى نص
      },
    });

    if (!homeMaid) {
      return res
        .status(404)
        .json({ error: "No homemaid found with this Passportnumber" });
    }

    // إرجاع بيانات العاملة
    return res.status(200).json(homeMaid);
  } catch (error) {
    console.error("Error searching homemaid:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
}
