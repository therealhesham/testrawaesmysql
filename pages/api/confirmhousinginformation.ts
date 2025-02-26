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
      deliverydate,
      StartingDate,
      startWoringDate,
      DeparatureTime,
    } = req.body;
    const object = {
      houseentrydate: houseentrydate
        ? new Date(houseentrydate).toISOString()
        : null,
      deliverydate: deliverydate ? new Date(deliverydate).toISOString() : null,
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
    // Ensure HomeMaidId is provided
    if (!homeMaidId) {
      return res.status(400).json({ error: "HomeMaidId is required" });
    }

    try {
      const housing = await prisma.neworder.update({
        where: { id: homeMaidId },
        // include: { inHouse:{ include:{Order:{include:{}}}} },
        data: { profileStatus: "تسكين" },
      });
      await prisma.housedworker.create({
        data: {
          houseentrydate: newObj.houseentrydate,
          deliveryDate: newObj.deliverydate,
          Order: { connect: { id: homeMaidId } },
        },
      });

      // Return a success message
      return res
        .status(200)
        .json({ message: "Housing updated successfully", housing });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error updating housing" });
    }
  } else if (req.method === "GET") {
    // Set the page size for pagination
    const { page } = req.query;

    const pageSize = 10;
    const pageNumber = parseInt(page as string, 10) || 1; // Handle the page query as a number

    // // Ensure HomeMaidId is provided in the query
    // if (!homeMaidId) {
    //   return res.status(400).json({ error: "HomeMaidId is required" });
    // }

    try {
      // Fetch the housing record based on HomeMaidId
      const housing = await prisma.housedworker.findMany({
        include: { Order: { include: { arrivals: true, HomeMaid: true } } },
        skip: (pageNumber - 1) * pageSize, // Pagination logic (skip previous pages)
        take: pageSize, // Limit the results to the page size
      });
      // Check if housing is found
      if (!housing) {
        return res.status(404).json({ error: "Housing not found" });
      }

      // console.log(housing[0].Order.);
      // Return the housing data
      return res.status(200).json({ housing });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error fetching housing" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
