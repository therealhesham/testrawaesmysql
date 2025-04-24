import prisma from "./globalprisma";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { guestId, breakfast, lunch, supper, complaint } = req.body;

      const existingCheckIn = await prisma.checkIn.findFirst({
        where: {
          CheckDate: req.body.checkDate, // تحويل التاريخ إلى ISO string للمقارنة
        },
      });

      if (existingCheckIn) {
        // تحديث السجل الموجود إذا كان هناك بيانات جديدة فقط
        const updatedCheckIn = await prisma.checkIn.updateMany({
          where: { CheckDate: req.body.checkDate },
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
        const guests = await prisma.housedworker.findMany({
          where: {
            isActive: true,
            // ,

            // checkIns: {
            //   some: { CheckDate: req.body.checkDate },
            // },
            // // تأكد من أن هذه هي الطريقة الصحيحة للبحث بناءً على CheckDate
            // على سبيل المثال، إذا كانت الضيوف مرتبطين بتاريخ CheckIn أو تاريخ آخر.
            // checkInDate: req.body.checkDate, // افترض أن هناك حقل مرتبط بتاريخ CheckIn
          },
          select: {
            id: true, // اختيار guestId فقط
          },
        });
        const guestIds = guests.map((guest) => guest.id);

        const dataToInsert = guests.map((guest) => ({
          CheckDate: req.body.checkDate,
          cost: req.body.cost,
          housedWorkerId: guest.id, // استخدام guestId المستخلص
          breakfastOption: breakfast.option || null,
          lunchOption: lunch.option || null,
          supperOption: supper.option || null,
          complaint: complaint || null,
          lunchCost: lunch.cost ? parseInt(lunch.cost) : null,
          supperCost: supper.cost ? parseInt(supper.cost) : null,
          breakfastCost: breakfast.cost ? parseInt(breakfast.cost) : null,
        }));

        const newCheckIn = await prisma.checkIn.createMany({
          data: dataToInsert,
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
