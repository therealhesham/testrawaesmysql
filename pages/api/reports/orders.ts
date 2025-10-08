import prisma from "lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
if(req.method === 'POST '){

return res.status(405).json({ message: 'Method not allowed' });
}

const in_progress = await prisma.neworder.count({
  where: {
    bookingstatus: {not:{
      in: ["new_order", "new_orders", "delivered", "in_progress","received","cancelled","rejected"],
    },}
  },
});


const new_order = await prisma.neworder.count({
  where: {
    bookingstatus: {
      in: ["new_order", "new_orders"],
    }
  },
});
const delivered = await prisma.neworder.count({
  where: {
    bookingstatus: {
      in: ["received"],
    }
  },
});
const cancelled = await prisma.neworder.count({
  where: {
    bookingstatus: {
      in: ["cancelled"],
    }
  },
}); 

const thisWeekOrders = await prisma.neworder.count({
  where: {
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    }
  },
});
console.log(thisWeekOrders);
const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const ordersPerMonthsAlongYear = [];
for(let i = 0; i < 12; i++){
  ordersPerMonthsAlongYear.push(await prisma.neworder.count({
  where: {
    createdAt: {
      gte: new Date(new Date().getFullYear(), i, 1),
      lt: new Date(new Date().getFullYear(), i + 1, 1),
    }
  },
  }));
}
      const year = new Date().getFullYear(); // السنة الحالية
      const minimummPerMonths = [];

      // Loop على كل الشهور (من 1 إلى 12)
      for (let month = 1; month <= 12; month++) {
        const startOfMonth = new Date(year, month - 1, 1); // بداية الشهر
        const endOfMonth = new Date(year, month, 1); // بداية الشهر التالي

        const minimum = await prisma.minimumm.findFirst({
          where: {
            createdAt: {
              gte: startOfMonth,
              lt: endOfMonth,
            },
          },
        });

        // إضافة بيانات الشهر إلى المصفوفة (حتى لو مافيش بيانات)
        minimummPerMonths.push({
          month,
          minimum: minimum ? minimum.amount : null, // إرجاع null لو مافيش بيانات
        });
      }

console.log(minimummPerMonths );



res.status(200).json({ in_progress, new_order, delivered, cancelled, thisWeekOrders, minimummPerMonths, ordersPerMonthsAlongYear });
}







