import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const {
      ClientName,
      PhoneNumber,
      HomemaidId,
      address,
      nationalId,
      age,
      clientphonenumber,
      Name,
      Passportnumber,
      maritalstatus,
      email,
      Nationality,
      Religion,
      city,
      externalOfficeStatus,
      ExperienceYears,
    } = req.body;
    console.log(req.body);
    try {
      const existingOrder = await prisma.neworder.findFirst({
        where: { HomeMaid: { id: HomemaidId } },
      });

      if (existingOrder) {
        console.log(existingOrder)
        return res.status(400).json({
          message: "العاملة محجوزة بالفعل",
        });
      }

      // Begin transaction to update homemaid and create related records
      const result = await prisma.neworder.create({
        data: {
          HomemaidIdCopy: HomemaidId,
          ExperienceYears: ExperienceYears + "",
          Nationality,
          bookingstatus: "new_order",
          Passportnumber,
          Name,
          ClientName,
          clientphonenumber,
          Religion,
          PhoneNumber: PhoneNumber,
          ages: age + "",
          housed: { create: { HomeMaidId: HomemaidId } },
          client: {
            create: {
              email,
              address,
              city,
              nationalId,
              fullname: ClientName,
              phonenumber: clientphonenumber,
            },
          },
        },
      });

      await prisma.arrivallist.create({
        data: {
          PassportNumber: Passportnumber,
          Order: { connect: { id: result?.id } },
        },
      });

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in creating new order:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res.status(400).json({
            message: "البيانات التي تحاول ادخالها قد تكون مسجلة بالفعل",
            details: error.meta,
          });
        } else if (error.code === "P2003") {
          return res.status(400).json({
            message: "Foreign key constraint violation. Please check related data.",
            details: error.meta,
          });
        }
        return res.status(500).json({
          message: "خطأ في الاتصال بقاعدة البيانات",
          details: error.message,
        });
      }

      if (error instanceof Prisma.PrismaClientValidationError) {
        console.error("Validation error:", error);
        return res.status(400).json({
          message: "عدم تطابق للبيانات",
          details: error.message,
        });
      }

      res.status(500).json({
        message: "An unexpected error occurred.",
        details: error.message,
      });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === "PUT") {
    const {
      orderId,
      ClientName,
      PhoneNumber,
      HomemaidId,
      address,
      nationalId,
      age,
      clientphonenumber,
      Name,
      Passportnumber,
      maritalstatus,
      email,
      Nationality,
      Religion,
      city,
      externalOfficeStatus,
      ExperienceYears,
      bookingstatus,
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required for update" });
    }

    try {
      // Check if the order exists
      const existingOrder = await prisma.neworder.findUnique({
        where: { id: Number(orderId) },
      });

      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if the new HomemaidId (if provided) is already booked
      if (HomemaidId && HomemaidId !== existingOrder.HomemaidIdCopy) {
        const homemaidBooked = await prisma.neworder.findFirst({
          where: { HomeMaid: { id: HomemaidId } },
        });

        if (homemaidBooked && homemaidBooked.id !== orderId) {
          return res.status(400).json({
            message: "العاملة محجوزة بالفعل",
          });
        }
      }

      // Update the order
      const updatedOrder = await prisma.neworder.update({
        where: { id: Number(orderId) },
        data: {
          HomemaidIdCopy: HomemaidId ?? existingOrder.HomemaidIdCopy,
          ExperienceYears: ExperienceYears ? ExperienceYears + "" : existingOrder.ExperienceYears,
          Nationality: Nationality ?? existingOrder.Nationality,
          bookingstatus: bookingstatus ?? existingOrder.bookingstatus,
          Passportnumber: Passportnumber ?? existingOrder.Passportnumber,
          Name: Name ?? existingOrder.Name,
          ClientName: ClientName ?? existingOrder.ClientName,
          clientphonenumber: clientphonenumber ?? existingOrder.clientphonenumber,
          Religion: Religion ?? existingOrder.Religion,
          PhoneNumber: PhoneNumber ?? existingOrder.PhoneNumber,
          ages: age ? age + "" : existingOrder.ages,
          client: {
            update: {
              email: email ?? existingOrder.client?.email,
              address: address ?? existingOrder.client?.address,
              city: city ?? existingOrder.client?.city,
              nationalId: nationalId ?? existingOrder.client?.nationalId,
              fullname: ClientName ?? existingOrder.client?.fullname,
              phonenumber: clientphonenumber ?? existingOrder.client?.phonenumber,
            },
          },
          housed: HomemaidId
            ? { update: { HomeMaidId: HomemaidId } }
            : undefined,
        },
      });

      // Update related arrivallist if Passportnumber is provided
      if (Passportnumber) {
        await prisma.arrivallist.updateMany({
          where: { OrderId: orderId },
          data: { PassportNumber: Passportnumber },
        });
      }

      res.status(200).json(updatedOrder);
    } catch (error) {
      console.error("Error in updating order:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res.status(400).json({
            message: "البيانات التي تحاول ادخالها قد تكون مسجلة بالفعل",
            details: error.meta,
          });
        } else if (error.code === "P2003") {
          return res.status(400).json({
            message: "Foreign key constraint violation. Please check related data.",
            details: error.meta,
          });
        }
        return res.status(500).json({
          message: "خطأ في الاتصال بقاعدة البيانات",
          details: error.message,
        });
      }

      if (error instanceof Prisma.PrismaClientValidationError) {
        console.error("Validation error:", error);
        return res.status(400).json({
          message: "عدم تطابق للبيانات",
          details: error.message,
        });
      }

      res.status(500).json({
        message: "An unexpected error occurred.",
        details: error.message,
      });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
}