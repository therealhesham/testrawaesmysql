import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { search, limit = '10', contractType } = req.query;

    if (!search || typeof search !== 'string') {
      return res.status(400).json({ message: 'Search term is required' });
    }

    const limitNum = parseInt(limit as string);
    const parsedSearchNumber = parseInt(search);
    const isValidNumber = !isNaN(parsedSearchNumber);

    // Search homemaids by ID, name, passport number, phone, OR client name/phone/nationalId/id
    // Only search homemaids that are linked to neworder table (have orders)
    const homemaids = await prisma.homemaid.findMany({
      where: {
        AND: [
          {
            OR: [
              ...(isValidNumber ? [{ id: parsedSearchNumber }] : []),
              { Name: { contains: search } },
              { Passportnumber: { contains: search } },
              { phone: { contains: search } },
              { clientphonenumber: { contains: search } },
              // البحث عن طريق بيانات العميل في NewOrder
              {
                NewOrder: {
                  some: {
                    OR: [
                      ...(isValidNumber ? [{ clientID: parsedSearchNumber }] : []),
                      { ClientName: { contains: search } },
                      { PhoneNumber: { contains: search } },
                      { clientphonenumber: { contains: search } },
                      { nationalId: { contains: search } },
                      {
                        client: {
                          OR: [
                            ...(isValidNumber ? [{ id: parsedSearchNumber }] : []),
                            { fullname: { contains: search } },
                            { phonenumber: { contains: search } },
                            { nationalId: { contains: search } }
                          ]
                        }
                      }
                    ]
                  }
                }
              },
              // البحث عن طريق جدول Client المرتبط بـ homemaid
              {
                Client: {
                  some: {
                    OR: [
                      ...(isValidNumber ? [{ id: parsedSearchNumber }] : []),
                      { fullname: { contains: search } },
                      { phonenumber: { contains: search } },
                      { nationalId: { contains: search } }
                    ]
                  }
                }
              }
            ]
          },
          {
            // Only get homemaids that have at least one record in NewOrder table
            NewOrder: {
              some: {}
            }
          }
        ]
      },
      include: {
        office: {
          select: {
            id: true,
            office: true,
            Country: true
          }
        },
        NewOrder: {
          select: {
            id: true,
            bookingstatus: true,
            profileStatus: true,
            typeOfContract: true,
            ClientName: true,
            PhoneNumber: true,
            clientphonenumber: true,
            nationalId: true,
            clientID: true,
            createdAt: true,
            arrivals: {
              select: {
                KingdomentryDate: true,
                KingdomentryTime: true,
                GuaranteeDurationEnd: true
              },
              take: 1
            },
            client: {
              select: {
                id: true,
                fullname: true,
                phonenumber: true,
                nationalId: true,
                city: true,
                address: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      take: limitNum,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedHomemaids = homemaids.map(homemaid => {
      // Get the most recent order
      const latestOrder = homemaid.NewOrder && homemaid.NewOrder.length > 0 ? homemaid.NewOrder[0] : null;
      
      const clientName = latestOrder?.client?.fullname || latestOrder?.ClientName || '';
      const clientMobile = latestOrder?.client?.phonenumber || latestOrder?.PhoneNumber || latestOrder?.clientphonenumber || '';
      const clientIdNumber = latestOrder?.client?.nationalId || latestOrder?.nationalId || '';
      const clientId = latestOrder?.client?.id || latestOrder?.clientID || null;
      const city = latestOrder?.client?.city || '';
      const address = latestOrder?.client?.address || '';

      const clientData = (clientName || clientMobile || clientIdNumber || clientId) ? {
        clientId,
        clientName,
        clientMobile,
        clientIdNumber,
        city,
        address
      } : null;

      const arrival = latestOrder?.arrivals?.[0] || null;
      const arrivalDate = arrival?.KingdomentryDate ? String(arrival.KingdomentryDate).split('T')[0] : '';
      const guaranteeEndDate = arrival?.GuaranteeDurationEnd ? String(arrival.GuaranteeDurationEnd).split('T')[0] : '';

      return {
        id: homemaid.id,
        name: homemaid.Name,
        nationality: homemaid.Nationalitycopy,
        passportNumber: homemaid.Passportnumber,
        phone: homemaid.phone,
        age: homemaid.age,
        dateofbirth: homemaid.dateofbirth,
        experience: homemaid.ExperienceYears,
        religion: homemaid.Religion,
        office: homemaid.office?.office,
        country: homemaid.office?.Country,
        picture: homemaid.Picture,
        bookingStatus: homemaid.bookingstatus,
        createdAt: homemaid.createdAt,
        latestOrderId: latestOrder?.id || null,
        latestOrderDate: latestOrder?.createdAt || null,
        latestContractType: latestOrder?.typeOfContract || null,
        totalOrdersCount: homemaid.NewOrder?.length || 0,
        arrivalDate,
        guaranteeEndDate,
        // Add order information
        orders: homemaid.NewOrder?.map(order => ({
          id: order.id,
          bookingStatus: order.bookingstatus,
          profileStatus: order.profileStatus,
          typeOfContract: order.typeOfContract,
          createdAt: order.createdAt
        })) || [],
        hasOrders: homemaid.NewOrder && homemaid.NewOrder.length > 0,
        clientData
      };
    });

    // Sort homemaids: prioritize workers with the newest / most recent orders (الأولوية للطلب الأحدث/الثاني)
    formattedHomemaids.sort((a, b) => {
      const dateA = a.latestOrderDate ? new Date(a.latestOrderDate).getTime() : 0;
      const dateB = b.latestOrderDate ? new Date(b.latestOrderDate).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      const orderIdA = a.latestOrderId || 0;
      const orderIdB = b.latestOrderId || 0;
      if (orderIdB !== orderIdA) return orderIdB - orderIdA;
      return b.id - a.id;
    });

    res.status(200).json({
      success: true,
      homemaids: formattedHomemaids,
      total: formattedHomemaids.length
    });

  } catch (error) {
    console.error("Error searching homemaids:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal Server Error" 
    });
  } finally {
    await prisma.$disconnect();
  }
}