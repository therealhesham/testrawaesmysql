import prisma from "./globalprisma";

export default async function handler(req, res) {
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
      startWoringDate,
      DeparatureTime,
    } = req.body;
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
    if (!homeMaidId) {
      return res.status(400).json({ error: "HomeMaidId is required" });
    }

    try {
      const search = await prisma.housedworker.findFirst({
        where: { homeMaid_id: homeMaidId },
      });

      if (!search) {
        await prisma.housedworker.create({
          data: {
            employee: req.body.employee,
            Reason: req.body.reason,
            Details: req.body.details,
            houseentrydate: newObj.houseentrydate,
            deliveryDate: newObj.deliveryDate,
            homeMaid_id: homeMaidId,
          },
        });
      } else {
        await prisma.housedworker.update({
          where: { homeMaid_id: homeMaidId },
          data: {
            employee: req.body.employee,
            Reason: req.body.reason,
            Details: req.body.details,
            houseentrydate: req.body.houseentrydate
              ? new Date(req.body.houseentrydate).toISOString()
              : search.houseentrydate,
            deliveryDate: req.body.deliverDate
              ? new Date(req.body.deliveryDate)
              : search.deliveryDate,
          },
        });
      }

      return res.status(200).json({ message: "Housing updated successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error updating housing" });
    }
  } else if (req.method === "GET") {
    const {
      Name,
      age,
      Passportnumber,
      id,
      Nationality,
      page,
      sortKey,
      sortDirection,
    } = req.query;

    const pageSize = 10;
    const pageNumber = parseInt(page, 10) || 1;

    // Build the filter object dynamically based on query parameters
    const filters = {
      Order: {
        Name: { contains: Name || "" },
        Passportnumber: { contains: Passportnumber || "" },
        ...(id && { id: { equals: Number(id) } }),
      },
    };

    if (Nationality)
      filters.Nationalitycopy = { contains: Nationality.toLowerCase() };

    // Build the sorting object dynamically based on sortKey and sortDirection
    let orderBy = {};
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
        // case "ClientName":
        //   orderBy = { Order: { ClientName: sortDirection || "asc" } };
        //   break;
        default:
          orderBy = {};
      }
    }

    try {
      const housing = await prisma.housedworker.findMany({
        where: { ...filters },
        include: { Order: true },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: orderBy, // Apply sorting
      });

      if (!housing) {
        return res.status(404).json({ error: "Housing not found" });
      }

      return res.status(200).json({ housing });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error fetching housing" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
