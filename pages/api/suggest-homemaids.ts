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
    const { experience, nationality, religion, age } = req.query;

    // Build where clause for filtering
    const whereClause: any = {
      bookingstatus: { not: "booked" }, // Only available homemaids
    };

    if (experience) {
      whereClause.ExperienceYears = { contains: experience as string };
    }

    if (nationality) {
      whereClause.Nationalitycopy = { contains: nationality as string };
    }

    if (religion) {
      whereClause.Religion = { contains: religion as string };
    }

    if (age) {
      const ageNum = parseInt(age as string);
      if (!isNaN(ageNum)) {
        // Calculate birth year directly from current year minus age
        const currentYear = new Date().getFullYear();
        const targetBirthYear = currentYear - ageNum;
        
        // Search for birth year with tolerance of ±2 years
        whereClause.dateofbirth = {
          gte: `${targetBirthYear - 2}-01-01`,
          lte: `${targetBirthYear + 2}-12-31`,
        };
      }
    }

    // Find matching homemaids with flexible matching
    const homemaids = await prisma.homemaid.findMany({
      where: whereClause,
      include: {
        office: {
          select: {
            Country: true,
            office: true,
          },
        },
      },
      take: 10, // Get more results to sort
    });

    // If no exact matches, try flexible matching
    if (homemaids.length === 0) {
      const flexibleWhereClause: any = {
        bookingstatus: { not: {in: ["booked", "new_order", "new_orders", "delivered", "cancelled","rejected"]} },
      };

      // Try matching nationality only
      if (nationality) {
        flexibleWhereClause.Nationalitycopy = { contains: nationality as string };
      }

      const flexibleHomemaids = await prisma.homemaid.findMany({
        where: flexibleWhereClause,
        include: {
          office: {
            select: {
              Country: true,
              office: true,
            },
          },
        },
        take: 10,
      });

      // If still no matches, get any available homemaids
      if (flexibleHomemaids.length === 0) {
        const anyAvailable = await prisma.homemaid.findMany({
          where: {
            bookingstatus: { not: {in: ["booked", "new_order", "new_orders", "delivered", "cancelled","rejected"]} },
          },
          include: {
            office: {
              select: {
                Country: true,
                office: true,
              },
            },
          },
          take: 10,
        });
        homemaids.push(...anyAvailable);
      } else {
        homemaids.push(...flexibleHomemaids);
      }
    }

    // Sort homemaids by relevance score
    const scoredHomemaids = homemaids.map((homemaid) => {
      let score = 0;
      
      // Exact matches get highest score
      if (nationality && homemaid.Nationalitycopy?.toLowerCase().includes((nationality as string).toLowerCase())) {
        score += 10;
      }
      if (religion && homemaid.Religion?.toLowerCase().includes((religion as string).toLowerCase())) {
        score += 8;
      }
      if (experience && homemaid.ExperienceYears?.includes(experience as string)) {
        score += 6;
      }
      if (age && homemaid.dateofbirth) {
        // Calculate age from dateofbirth
        const birthDate = new Date(homemaid.dateofbirth);
        const currentDate = new Date();
        const calculatedAge = currentDate.getFullYear() - birthDate.getFullYear();
        const monthDiff = currentDate.getMonth() - birthDate.getMonth();
        const finalAge = monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate()) 
          ? calculatedAge - 1 
          : calculatedAge;
        
        const ageDiff = Math.abs(finalAge - parseInt(age as string));
        if (ageDiff <= 2) score += 5;
        else if (ageDiff <= 5) score += 3;
        else if (ageDiff <= 10) score += 1;
      }

      return { ...homemaid, relevanceScore: score };
    });

    // Sort by relevance score (highest first) and take top 5
    const sortedHomemaids = scoredHomemaids
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);

    // Transform the data for the frontend
    const suggestions = sortedHomemaids.map((homemaid) => {
      // Calculate age from dateofbirth
      let calculatedAge = null;
      if (homemaid.dateofbirth) {
        const birthDate = new Date(homemaid.dateofbirth);
        const currentDate = new Date();
        const age = currentDate.getFullYear() - birthDate.getFullYear();
        const monthDiff = currentDate.getMonth() - birthDate.getMonth();
        calculatedAge = monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate()) 
          ? age - 1 
          : age;
      }
      
      return {
        id: homemaid.id,
        name: homemaid.Name,
        nationality: homemaid.Nationalitycopy,
        religion: homemaid.Religion,
        experience: homemaid.ExperienceYears,
        age: calculatedAge,
        passportNumber: homemaid.Passportnumber,
        office: homemaid.office?.office,
        country: homemaid.office?.Country,
        picture: homemaid.Picture,
        relevanceScore: homemaid.relevanceScore,
      };
    });

    res.status(200).json({
      success: true,
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error("Error fetching homemaid suggestions:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal Server Error" 
    });
  } finally {
    await prisma.$disconnect();
  }
}
