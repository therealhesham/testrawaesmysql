import prisma from "./globalprisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // جلب جميع housedworker النشطين (isActive = true)
    const deleteMany = await prisma.checkIn.deleteMany({
      where: {
        CheckDate: req.body.CheckDate,

        isActive: true,
      },
    });
    // جلب جميع housedworker النشطين (isActive = true)
    const checkexisting = await prisma.checkIn.findMany({
      where: {
        CheckDate: req.body.CheckDate,
        isActive: true,
      },
    });
    if (checkexisting.length > 0) {
      return res.status(201).json({
        message: `يوجد سجلات بنفس التاريخ اذا اردت اعادة عملية الاعاشة اضغط متابعة`,
      });
    }
    // تاريخ اليوم
    // جلب جميع housedworker النشطين (isActive = true)
    const activeHousedWorkers = await prisma.housedworker.findMany({
      where: {
        isActive: true,
      },
    });
    const checkInPromises = activeHousedWorkers.map((worker) =>
      prisma.checkIn.create({
        data: {
          housedWorkerId: worker.id,
          isActive: true,
          CheckDate: req.body.CheckDate,
        },
      })
    );

    // تنفيذ جميع عمليات الإنشاء
    await Promise.all(checkInPromises);

    return res.status(200).json({
      message: `تم إنشاء ${activeHousedWorkers.length} سجل CheckIn بنجاح بتاريخ اليوم.`,
    });
  } catch (error) {
    console.error("خطأ أثناء إنشاء سجلات CheckIn:", error);
    return res
      .status(500)
      .json({ message: "خطأ داخلي في الخادم", error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
