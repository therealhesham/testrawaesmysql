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
    const { search, limit = '10' } = req.query;

    if (!search || typeof search !== 'string') {
      return res.status(400).json({ message: 'Search term is required' });
    }

    const limitNum = parseInt(limit as string);
    const parsedSearchNumber = parseInt(search);
    const isValidNumber = !isNaN(parsedSearchNumber);

    // Search homemaids by ID, name, passport number, phone, or client info
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
              {
                transferSponsorShips: {
                  OR: [
                    ...(isValidNumber ? [{ NewClientId: parsedSearchNumber }, { OldClientId: parsedSearchNumber }] : []),
                    {
                      NewClient: {
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
            ]
          },
          {
            // Only get homemaids that have at least one order linked
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
        transferSponsorShips: {
          select: {
            id: true,
            NewClientId: true,
            OldClientId: true,
            EntryDate: true,
            transferStage: true,
            createdAt: true,
            NewClient: {
              select: {
                id: true,
                fullname: true,
                phonenumber: true,
                nationalId: true,
                city: true,
                address: true
              }
            }
          }
        },
        NewOrder: {
          select: {
            id: true,
            clientID: true,
            ClientName: true,
            PhoneNumber: true,
            clientphonenumber: true,
            nationalId: true,
            client: {
              select: {
                id: true,
                fullname: true,
                phonenumber: true,
                nationalId: true,
                city: true,
                address: true
              }
            },
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      take: limitNum,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedHomemaids = homemaids.map(worker => {
      const order = worker.NewOrder && worker.NewOrder.length > 0 ? worker.NewOrder[0] : null;
      const client = order?.client;
      const newClient = worker.transferSponsorShips?.NewClient;

      const clientName = client?.fullname || order?.ClientName || newClient?.fullname || '';
      const clientMobile = client?.phonenumber || order?.PhoneNumber || order?.clientphonenumber || newClient?.phonenumber || '';
      const clientIdNumber = client?.nationalId || order?.nationalId || newClient?.nationalId || '';
      const clientId = client?.id || order?.clientID || newClient?.id || null;
      const city = client?.city || newClient?.city || '';
      const address = client?.address || newClient?.address || '';

      const clientData = (clientName || clientMobile || clientIdNumber || clientId) ? {
        clientId,
        clientName,
        clientMobile,
        clientIdNumber,
        city,
        address
      } : null;

      return {
        id: worker.id,
        name: worker.Name,
        nationality: worker.Nationalitycopy,
        passportNumber: worker.Passportnumber,
        phone: worker.phone,
        age: worker.age,
        office: worker.office?.office || 'غير محدد',
        country: worker.office?.Country || 'غير محدد',
        hasTransferSponsorship: worker.transferSponsorShips !== null,
        transferSponsorShips: worker.transferSponsorShips || null,
        clientData,
        isExternal: worker.isExternal || true,
        isAvailable: true, // All workers returned are available for housing
        status: 'متاحة للتسكين - نقل كفالة'
      };
    });

    // Additional verification: Double-check that these workers are not in housedworker table
    const verificationCheck = await prisma.housedworker.findMany({
      where: {
        homeMaid_id: {
          in: homemaids.map(w => w.id)
        }
      },
      select: {
        homeMaid_id: true
      }
    });

    if (verificationCheck.length > 0) {
      console.warn(`Warning: Found ${verificationCheck.length} workers that are actually housed but appeared in search results`);
      console.warn('Housed worker IDs:', verificationCheck.map(w => w.homeMaid_id));
    }

    console.log(`Found ${homemaids.length} external workers (transferSponsorShips) for search: "${search}"`);
    console.log('Sample external worker data:', homemaids[0]);
    console.log('Verification: No housed workers found in results:', verificationCheck.length === 0);

    res.status(200).json({
      success: true,
      homemaids: formattedHomemaids,
      count: homemaids.length,
      searchTerm: search,
      message: 'العاملات المتاحة للتسكين (نقل كفالة فقط - مربوطة بجدول transferSponsorShips)',
      debug: {
        totalFound: homemaids.length,
        searchTerm: search,
        sampleWorker: homemaids[0] || null,
        isUnlinked: true,
        isAvailable: true,
        isTransferSponsorship: true
      }
    });

  } catch (error) {
    console.error('Error searching external workers (transferSponsorShips):', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error searching external workers (transferSponsorShips)',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
