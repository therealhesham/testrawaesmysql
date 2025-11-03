import { jwtDecode } from "jwt-decode";
import prisma from "./globalprisma";

export default async function handler(req: any, res: any) {
  if (req.method === "POST") {
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
      isHasEntitlements,
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

    const excludeEmptyFields = (obj: any) => {
      return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => {
          return (
            value !== null &&
            value !== undefined &&
            value !== "" &&
            !(Array.isArray(value) && value.length === 0)
          );
        })
      );
    };

    const newObj = excludeEmptyFields(object);

    try {
      const search = await prisma.housedworker.findFirst({
        where: { homeMaid_id: homeMaidId },
      });
// const count = await prisma.inHouseLocation.findFirst({where:{id:Number(req.body.location)}})
if (req.body.location) {
  const locationId = Number(req.body.location);

  const locationData = await prisma.inHouseLocation.findUnique({
    where: { id: locationId },
    select: { quantity: true },
  });

  if (!locationData) {
    return res.status(400).json({ error: "الموقع المحدد غير موجود" });
  }

  const currentCount = await prisma.housedworker.count({
    where: {
      location_id: locationId,
      deparatureHousingDate: null, // لسه ساكنة
    },
  });

  if (currentCount >= locationData.quantity) {
    return res.status(400).json({
      error: `السكن ممتلئ (${currentCount}/${locationData.quantity})، لا يمكن تسكين عاملة جديدة.`,
    });
  }
}


      if (search) {
        return res
          .status(400)
          .json({ error: "Housing record already exists, use PUT to update" });
      }

      await prisma.housedworker.create({
        data: {
          checkIns: {
            create: {
              CheckDate: newObj.houseentrydate
                ? new Date(newObj.houseentrydate as string)
                : new Date(),
            },
          },
          location_id: Number(req.body.location),
          employee: req.body.employee,
          Reason: req.body.reason,
          Details: req.body.details,
          houseentrydate: newObj.houseentrydate
            ? new Date(newObj.houseentrydate as string)
            : null,
          deliveryDate: newObj.deliveryDate
            ? new Date(newObj.deliveryDate as string)
            : null,
          homeMaid_id: homeMaidId,
          deparatureHousingDate: null,
          // @ts-ignore
          isHasEntitlements:
            isHasEntitlements !== undefined ? isHasEntitlements : true,
        },
      });

      await prisma.logs.create({
        data: {
          Status: `تم تسكين العاملة منزلية بتاريخ ${new Date().toLocaleDateString()}`,
          userId: req.body.employee,
          homemaidId: homeMaidId,
        },
      });

      const homeMaidData = await prisma.homemaid.findUnique({
        where: {
          id: homeMaidId,
        },
      });

      await prisma.notifications.create({
        data: {
          title: `تسكين عاملة  ${homeMaidData?.Name} منزلية`,
          message: `تم تسكين العاملة بنجاح <br/>
              يمكنك فحص المعلومات في قسم التسكين ......  <a href="/admin/housedarrivals" target="_blank" className="text-blue-500">اضغط هنا</a>`,
          // userId: req.body.employee,
          isRead: false,
        },
      });

      return res.status(200).json({ message: "Housing created successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error creating housing" });
    }

  } else if (req.method === "PUT") {
    const {
      homeMaidId,
      employee,
      reason,
      details,
      houseentrydate,
      deliveryDate,
      location_id,
      isHasEntitlements,
    } = req.body;

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

      if (location_id && location_id !== 0) {
        const locationExists = await prisma.inHouseLocation.findUnique({
          where: { id: location_id },
        });

        if (!locationExists) {
          return res.status(400).json({ error: "Invalid location_id provided" });
        }
      }

      const updated = await prisma.housedworker.update({
        where: { homeMaid_id: homeMaidId },
        data: {
          ...(location_id && location_id !== 0 && { location_id }),
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
          // @ts-ignore
          isHasEntitlements:
            isHasEntitlements !== undefined
              ? isHasEntitlements
              : (search as any).isHasEntitlements,
        },
      });

      await prisma.logs.create({
        data: {
          Status: `تم تعديل بيانات التسكين للعاملة المنزلية بتاريخ ${new Date().toLocaleDateString()}`,
          userId: employee,
          homemaidId: homeMaidId,
        },
      });

      return res.status(200).json({ message: "Housing updated successfully", updated });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error updating housing" });
    }

  } else if (req.method === "GET") {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie: any) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    const token = jwtDecode(cookies.authToken) as any;
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });

    const {
      Name,
      age,
      reason,
      Passportnumber,
      id,
      Nationality,
      page,houseentrydate,
      sortKey,
      sortDirection,
      contractType,
      size,
      location,
    } = req.query;

    const pageSize = parseInt(size as string, 10) || 10;
    const pageNumber = parseInt(page as string, 10) || 1;

    const filters: any = {
      ...(location && { location_id: { equals: Number(location) } }),
      // ...(location_id && { location_id: { equals: Number(location_id) } }),
      ...(houseentrydate && { houseentrydate: { equals: new Date(houseentrydate as string) } }),
      Reason: { contains: reason || "" },
      Order: {
        Name: { contains: Name || "" },
        Passportnumber: { contains: Passportnumber || "" },
        ...(id && { id: { equals: Number(id) } }),
        ...(contractType && {
          NewOrder: {
            some: {
              typeOfContract: contractType as string,
            },
          },
        }),
      },
    };

    let orderBy: any = { id: "desc" };
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
          orderBy = { Order: { Nationalitycopy: sortDirection || "asc" } };
          break;
        default:
          orderBy = { id: "desc" };
      }
    }

    try {
      const housing = await prisma.housedworker.findMany({
        where: {
          ...filters,
          deparatureHousingDate: null,
        },
        include: {
          Order: {
            include: {
              weeklyStatusId: true,
              logs: true,
              NewOrder: { select: { typeOfContract: true } },
            },
          },
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy,
      });

      const totalCount = await prisma.housedworker.count({
        where: {
          ...filters,
          deparatureHousingDate: null,
        },
      });

      return res.status(200).json({ housing, totalCount });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error fetching housing" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
