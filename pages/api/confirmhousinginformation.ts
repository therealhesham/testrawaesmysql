import { jwtDecode } from "jwt-decode";
import prisma from "./globalprisma";

export default async function handler(req, res) {
  if (req.method === "POST") {
    // 🟢 إنشاء (Create) فقط
    const {
      homeMaidId,
      profileStatus,
      deparatureCity,
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
          location_id:Number(req.body.location),
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

  } else if (req.method === "PUT") {
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

  }
   else if (req.method === "GET") {
       const cookieHeader = req.headers.cookie;
          let cookies: { [key: string]: string } = {};
          if (cookieHeader) {
            cookieHeader.split(";").forEach(cookie => {
              const [key, value] = cookie.trim().split("=");
              cookies[key] = decodeURIComponent(value);
            });
          }
        const token =   jwtDecode(cookies.authToken)
        console.log(token);
        const findUser  = await prisma.user.findUnique({where:{id:token.id},include:{role:true}})
        if(!findUser?.role?.permissions["شؤون الاقامة"]["عرض"] )return;
    
    // 🔵 قراءة (Read)
    const {
      Name,
      age,
      reason,
      Passportnumber,
      id,
      Nationality,
      page,
      sortKey,
      sortDirection,
      contractType,
    } = req.query;
console.log(req.query)
    const pageSize = 10;
    const pageNumber = parseInt(page, 10) || 1;

    // Build the filter object dynamically based on query parameters
    const filters = {
      Reason: { contains: reason || "" },
      Order: {
        Name: { contains: Name || "" },
        Passportnumber: { contains: Passportnumber || "" },
        ...(id && { id: { equals: Number(id) } }),
      },
    };
    // Add contract type filter if provided - filter by NewOrder relation
    if (contractType) {
      // The relationship is: housedworker -> homemaid (Order) -> neworder[] (NewOrder)
      filters.Order = {
        ...filters.Order,
        NewOrder: {
          some: {
            typeOfContract: contractType as string
          }
        }
      };
    }

    // Build the sorting object dynamically based on sortKey and sortDirection
    let orderBy: any = { id: "desc" }; // Default sorting by id in descending order
    if (sortKey) {
      switch (sortKey) {
        case "Name":
          orderBy = { Order: { Name: sortDirection || "asc" } };
          break;
        case "phone":
          orderBy = { Order: { phone: sortDirection || "asc" } };
          break;
        case "Details":
          orderBy = { Details: sortDirection || "asc" };
          break;
        case "Nationalitycopy":
          orderBy = {
            Order: { Nationalitycopy: sortDirection || "asc" },
          };
          break;
        default:
          orderBy = { id: "desc" };
      }
    }

    try {
      console.log('Filters:', JSON.stringify(filters, null, 2));
      
      // First, let's check total count without contract type filter
      const totalCountWithoutFilter = await prisma.housedworker.count({
        where: {
          deparatureHousingDate: null,
        },
      });
      console.log('Total housed workers without filter:', totalCountWithoutFilter);
      
      const totalCount = await prisma.housedworker.count({
        where: {
          ...filters,
          deparatureHousingDate: null,
        },
      });
      console.log('Total housed workers with filter:', totalCount);

      const housing = await prisma.housedworker.findMany({
        where: {
          Order:{NewOrder:{ some:{typeOfContract:contractType as string}}},
          deparatureHousingDate: null,
        },
        include: { 
          Order: { 
            include: { 
              weeklyStatusId: true, 
              logs: true,
              NewOrder: {select:{typeOfContract:true}} // Include NewOrder to access typeOfContract
            } 
          } 
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: orderBy,
      });

      console.log('Housing results:', housing.length);
      

      // Let's also check if there are any neworder records with recruitment type
      if (!housing) {
        return res.status(404).json({ error: "Housing not found" });
      }

      return res.status(200).json({ housing, totalCount });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error fetching housing" });
    }

  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
