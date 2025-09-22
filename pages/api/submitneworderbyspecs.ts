import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const {
      clientID,
      ClientName,
      PhoneNumber,
      Nationalitycopy,
      Religion,
      PaymentMethod,
      Total,
      Paid,
      Remaining,
      age,
      ExperienceYears,
      notes,
      orderDocument,
      contract,
      selectedHomemaidId,
    } = req.body;

    console.log('Received specs order data:', req.body);

    try {
      // Validate required fields
      if (!clientID || !ClientName) {
        return res.status(400).json({
          message: "البيانات المطلوبة مفقودة",
        });
      }

      // If homemaid is selected, get homemaid data first
      let homemaidData = null;
      if (selectedHomemaidId) {
        homemaidData = await prisma.homemaid.findUnique({
          where: { id: selectedHomemaidId },
          select: {
            Name: true,
            Passportnumber: true,
            Nationalitycopy: true,
            Religion: true,
            age: true,
            ExperienceYears: true,
          }
        });
      }

      // Create new order for specs-based request
      const result = await prisma.neworder.create({
        data: {
          ClientName,
          PhoneNumber: PhoneNumber || '',
          Nationality: homemaidData?.Nationalitycopy || Nationalitycopy || '',
          Religion: homemaidData?.Religion || Religion || '',
          ages: homemaidData?.age?.toString() || (age ? age.toString() : ''),
          ExperienceYears: homemaidData?.ExperienceYears || (ExperienceYears ? ExperienceYears.toString() : ''),
          bookingstatus: selectedHomemaidId ? "new_order" : "new_order", // If homemaid selected, mark as booked
          HomemaidIdCopy: selectedHomemaidId || 0, // Use selected homemaid ID if available
          Passportnumber: homemaidData?.Passportnumber || '', // Use homemaid passport if selected
          Name: homemaidData?.Name || '', // Use homemaid name if selected
          clientphonenumber: PhoneNumber || '',
          client: {
            connect: { id: parseInt(clientID) }
          },
          // Add financial information (allow zero amounts)
          Total: Total !== undefined ? parseFloat(Total.toString()) : 0,
          PaymentMethod: PaymentMethod || 'كاش',
          orderDocument: orderDocument || '',
          contract: contract || '',
        },
      });

      // Create client account statement for financial tracking
      try {
        const statement = await prisma.clientAccountStatement.create({
          data: {
            clientId: parseInt(clientID),
            contractNumber: `SPEC-${result.id}`,
            officeName: 'طلب حسب المواصفات',
            totalRevenue: Total !== undefined ? parseFloat(Total.toString()) : 0,
            totalExpenses: 0,
            netAmount: Total !== undefined ? parseFloat(Total.toString()) : 0,
            contractStatus: 'new',
            notes: notes || '',
          },
        });

        // Create initial payment entry if paid amount is provided (even if zero)
        if (Paid !== undefined) {
          await prisma.clientAccountEntry.create({
            data: {
              statementId: statement.id,
              date: new Date(),
              description: 'دفعة أولى',
              debit: 0,
              credit: parseFloat(Paid.toString()),
              balance: parseFloat(Paid.toString()),
              entryType: 'payment',
            },
          });
        }
      } catch (e) {
        console.error('Failed to create client account statement:', e);
        // Don't block order creation if statement creation fails
      }

      res.status(200).json({
        message: "تم إنشاء الطلب بنجاح",
        orderId: result.id,
        result
      });
    } catch (error) {
      console.error("Error in creating specs order:", error);
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
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === "PATCH") {
    const {
      orderId,
      clientID,
      ClientName,
      PhoneNumber,
      Nationalitycopy,
      Religion,
      PaymentMethod,
      Total,
      Paid,
      Remaining,
      age,
      ExperienceYears,
      notes,
      orderDocument,
      contract,
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

      // Update the order
      const updatedOrder = await prisma.neworder.update({
        where: { id: Number(orderId) },
        data: {
          ClientName: ClientName ?? existingOrder.ClientName,
          PhoneNumber: PhoneNumber ?? existingOrder.PhoneNumber,
          Nationality: Nationalitycopy ?? existingOrder.Nationality,
          Religion: Religion ?? existingOrder.Religion,
          ages: age ? age.toString() : existingOrder.ages,
          ExperienceYears: ExperienceYears ? ExperienceYears.toString() : existingOrder.ExperienceYears,
          Total: Total !== undefined ? parseFloat(Total.toString()) : existingOrder.Total,
          PaymentMethod: PaymentMethod ?? existingOrder.PaymentMethod,
          orderDocument: orderDocument ?? existingOrder.orderDocument,
          contract: contract ?? existingOrder.contract,
        },
      });

      res.status(200).json({
        message: "تم تحديث الطلب بنجاح",
        orderId: updatedOrder.id,
        result: updatedOrder
      });
    } catch (error) {
      console.error("Error in updating specs order:", error);
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
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
}