import { jwtDecode } from "jwt-decode";
import prisma from "lib/prisma";

export default async function handler(req, res) {
  if (req.method === "POST") {
    // 🟢 إنشاء (Create) فقط
    const {
      homeMaidId,
      profileStatus,
      deparatureCity,
      typeOfContract,
      arrivalCity,
      deparatureDate,
      houseentrydate,
      deliveryDate,
      StartingDate,
      location,
      startWoringDate,
      DeparatureTime,
    } = req.body;

    if (!req.body.reason)
      return res.status(500).json({ error: "سبب التسكين مطلوب" });

    if (!houseentrydate) {
      return res.status(500).json({ error: "تاريخ التسكين مطلوب" });
    }

    if (!homeMaidId) {
      return res.status(400).json({ error: "HomeMaidId is required" });
    }

    const object = {
      houseentrydate: houseentrydate
        ? new Date(houseentrydate).toISOString()
        : null,
      deliverydate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
      startWoringDate:
        profileStatus == "بدأت العمل" ? new Date().toISOString() : null,
      DeparatureFromSaudiCity: deparatureCity,
      ArrivalOutSaudiCity: arrivalCity,
      DeparatureFromSaudiDate: deparatureDate
        ? new Date(deparatureDate).toISOString()
        : null,
      DeparatureFromSaudiTime: DeparatureTime,
    };

    function excludeEmptyFields(obj) {
      return Object.fromEntries(
        Object.entries(obj).filter(([key, value]) => {
          return (
            value !== null &&
            value !== undefined &&
            value !== "" &&
            !(Array.isArray(value) && value.length === 0)
          );
        })
      );
    }
    const newObj = excludeEmptyFields(object);

    try {
      // 🔎 نتأكد إنه مش موجود
      const search = await prisma.housedworker.findFirst({
        where: { homeMaid_id: homeMaidId },
      });

      if (search) {
        return res.status(400).json({ error: "Housing record already exists, use PUT to update" });
      }

      await prisma.housedworker.create({
        data: {
          checkIns: {
            create: {
              CheckDate: newObj.houseentrydate, // Ensure this is a valid date
            },
          },
          employee: req.body.employee,
          Reason: req.body.reason,
          Details: req.body.details,
          houseentrydate: newObj.houseentrydate,
          deliveryDate: newObj.deliveryDate,
          homeMaid_id: homeMaidId,
          deparatureHousingDate: null,
        },
      });

      try {
        await prisma.logs.create({
          data: {
            Status: `تم تسكين العاملة منزلية بتاريخ ${new Date().toLocaleDateString()}`,
            userId: req.body.employee,
            homemaidId: homeMaidId,
          },
        });
      } catch (error) {
        console.log(error);
      }

      try {
        const homeMaidIds = await prisma.homemaid.findUnique({
          where: {
            id: homeMaidId,
          },
        });

        await prisma.notifications.create({
          data: {
            title: `تسكين عاملة  ${homeMaidIds?.Name} منزلية`,
            message: `تم تسكين العاملة   بنجاح <br/>
              يمكنك فحص المعلومات في قسم التسكين ......  <a href="/admin/housedarrivals" target="_blank" className="text-blue-500">اضغط هنا</a>`,
            userId: req.body.employee,
            isRead: false,
          },
        });
      } catch (e) {
        console.log(e);
      }

      return res.status(200).json({ message: "Housing created successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error creating housing" });
    }

  } 
  else if (req.method === "PUT") {
    // 🟡 تحديث (Update) فقط
    const { homeMaidId, employee, reason, details, houseentrydate, deliveryDate ,location_id} = req.body;

    if (!homeMaidId) {
      return res.status(400).json({ error: "HomeMaidId is required" });
    }

    try {
      const search = await prisma.housedworker.findFirst({
        where: { homeMaid_id: homeMaidId },
      });

      if (!search) {
        return res.status(404).json({ error: "Housing record not found" });
      }

      const updated = await prisma.housedworker.update({
        where: { homeMaid_id: homeMaidId },
        data: {
          location_id,
          employee,
          Reason: reason,
          deparatureHousingDate: null,
          Details: details,
          houseentrydate: houseentrydate
            ? new Date(houseentrydate).toISOString()
            : search.houseentrydate,
          deliveryDate: deliveryDate
            ? new Date(deliveryDate).toISOString()
            : search.deliveryDate,
        },
      });

      try {
        await prisma.logs.create({
          data: {
            Status: `تم تعديل بيانات التسكين للعاملة المنزلية بتاريخ ${new Date().toLocaleDateString()}`,
            userId: employee,
            homemaidId: homeMaidId,
          },
        });
      } catch (error) {
        console.log(error);
      }

      return res.status(200).json({ message: "Housing updated successfully", updated });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error updating housing" });
    }

  } else if (req.method === "GET") {
       // تأكد من استقبال contractType وتمريره للـ query
const { contractType, page = 1, pageSize = 10000 } = req.query; 
    try {
      const housing = await prisma.housedworker.findMany({
        where: {
          Order:{NewOrder:{ some:{typeOfContract:contractType as string}}},
          deparatureHousingDate: null
        },

      });


      return res.status(200).json({ housing });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error fetching housing" });
    }

  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
