import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";
import { jwtDecode } from "jwt-decode";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

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
    HomemaidId, // This is the homemaid ID from the form (mapped from selectedHomemaidId)
    selectedHomemaidId, // Fallback for direct form submission
  } = req.body;

  console.log('Submitting specs order data:', req.body);
  console.log('Age received (for search only):', age);
  console.log('Age type:', typeof age);

  try {
    // Use the correct homemaid ID (either HomemaidId or selectedHomemaidId)
    const homemaidId = HomemaidId || selectedHomemaidId;
    
    // Check if homemaid is already booked (only if a homemaid is selected)
    if (homemaidId) {
      const existingOrder = await prisma.neworder.findFirst({
        where: { 
          HomemaidId: homemaidId,
          bookingstatus: { not: "cancelled" } // Don't consider cancelled orders
        },
      });

      if (existingOrder) {
        return res.status(400).json({
          message: "العاملة محجوزة بالفعل",
        });
      }
    }

    // Get user info from token for logging
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    let userId = null;
    try {
      const token = jwtDecode(cookies.authToken) as any;
      userId = token.id;
    } catch (error) {
      console.log('No valid token found, proceeding without user info');
    }

    // Create the order (age is only used for search, not stored)
    const orderData: any = {
      ClientName,
      PhoneNumber,
      Nationalitycopy,
      Religion,
      PaymentMethod,
      typeOfContract: "recruitment",
      Total: Total ? Number(Total) : 0,
      paid: Paid ? Number(Paid) : 0,
      // age is only used for search, not stored in order
      ExperienceYears: ExperienceYears ? ExperienceYears.toString() : "",
      notes: notes || "", // Using the new notes field from schema
      orderDocument: orderDocument || "",
      contract: contract || "",
      bookingstatus: "pending_external_office",
      clientID: clientID ? Number(clientID) : null,
    };

    // Add homemaid connection if one is selected
    if (homemaidId) {
      orderData.HomemaidId = homemaidId;
      orderData.HomemaidIdCopy = homemaidId;
    }

    const result = await prisma.neworder.create({
      data: orderData,
      include: {
        client: true,
        HomeMaid: true,
      },
    });


     await prisma.arrivallist.create({
      data: {
        // OrderId:id,
        // SponsorName,
        // HomemaidName,
        // PassportNumber,


        Order: { connect: { id:result.id } },
      },
    });


    try{
    // Log the action if user is authenticated
    if (userId) {
      await prisma.logs.create({
        data: {
          Status: "إنشاء طلب جديد حسب المواصفات",
          Details: `تم إنشاء طلب رقم ${result.id} للعميل ${ClientName}`,
          userId: token?.username,
          homemaidId: homemaidId ? Number(homemaidId) : null,
          },
        });
      }
    } catch (error: any) {
      console.error("Error creating log:", error);
    }
  

    res.status(200).json({
      success: true,
      message: "تم إضافة الطلب بنجاح",
      orderId: result.id,
    });
  } catch (error: any) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إضافة الطلب",
      error: error.message,
    });
  }
}