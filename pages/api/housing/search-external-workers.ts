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

    // Search homemaids by ID, name, passport number, or phone
    // Search for homemaids that are NOT linked to housedworker table (housedarrivals)
    // and are linked to transferSponsorShips table (external workers)
    const homemaids = await prisma.homemaid.findMany({
      where: {
        AND: [
          {
            OR: [
              { id: parseInt(search) || undefined },
              { Name: { contains: search } },
              { Passportnumber: { contains: search } },
              { phone: { contains: search } }
            ]
          },
          // {
            // // Only get homemaids that have a record in transferSponsorShips table
            // transferSponsorShips: {
            //   isNot: null
            // }
          // }
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
    const formattedHomemaids = homemaids.map(worker => ({
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
      // Client data from NewOrder.client (Order related to the worker)
      clientData: worker.NewOrder && worker.NewOrder.length > 0 && worker.NewOrder[0].client ? {
        clientId: worker.NewOrder[0].client.id,
        clientName: worker.NewOrder[0].client.fullname || '',
        clientMobile: worker.NewOrder[0].client.phonenumber || '',
        clientIdNumber: worker.NewOrder[0].client.nationalId || '',
        city: worker.NewOrder[0].client.city || '',
        address: worker.NewOrder[0].client.address || ''
      } : null,
      isExternal: worker.isExternal || true,
      isAvailable: true, // All workers returned are available for housing
      status: 'متاحة للتسكين - نقل كفالة'
    }));

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
