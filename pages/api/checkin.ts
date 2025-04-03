import prisma from "./globalprisma";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { guestId, breakfast, lunch, supper, complaint } = req.body;

      // تحديد تاريخ اليوم بدون الوقت للمقارنة
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // التحقق مما إذا كان هناك سجل موجود لنفس guestId في نفس اليوم
      const existingCheckIn = await prisma.checkIn.findFirst({
        where: {
          housedWorkerId: parseInt(guestId),
          createdAt: {
            gte: today, // أكبر من أو يساوي بداية اليوم
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // أقل من نهاية اليوم
          },
        },
      });
      console.log(breakfast.option);
      if (existingCheckIn) {
        // تحديث السجل الموجود إذا كان هناك بيانات جديدة فقط
        const updatedCheckIn = await prisma.checkIn.update({
          where: { id: existingCheckIn.id },
          data: {
            cost: req.body.cost ? req.body.cost : existingCheckIn.cost,
            breakfastOption:
              breakfast.option !== ""
                ? breakfast.option
                : existingCheckIn.breakfastOption,
            lunchOption:
              lunch !== "" ? lunch.option : existingCheckIn.lunchOption,
            supperOption:
              supper !== "" ? supper.option : existingCheckIn.supperOption,
            complaint:
              complaint !== undefined ? complaint : existingCheckIn.complaint,
            lunchCost:
              lunch.cost !== ""
                ? parseInt(lunch.cost)
                : existingCheckIn.lunchCost,
            supperCost:
              supper.cost !== ""
                ? parseInt(supper.cost)
                : existingCheckIn.supperCost,
            breakfastCost:
              breakfast.cost !== ""
                ? parseInt(breakfast.cost)
                : existingCheckIn.breakfastCost,
          },
        });
        return res.status(200).json(updatedCheckIn);
      } else {
        // إنشاء سجل جديد إذا لم يكن موجودًا
        const newCheckIn = await prisma.checkIn.create({
          data: {
            cost: req.body.cost,
            housedWorkerId: parseInt(guestId),
            breakfastOption: breakfast.option || null,
            lunchOption: lunch.option || null,
            supperOption: supper.option || null,
            complaint: complaint || null,
            lunchCost: lunch.cost ? parseInt(lunch.cost) : null,
            supperCost: supper.cost ? parseInt(supper.cost) : null,
            breakfastCost: breakfast.cost ? parseInt(breakfast.cost) : null,
          },
        });
        return res.status(200).json(newCheckIn);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error processing check-in" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
