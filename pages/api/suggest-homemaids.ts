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
      bookingstatus: { not: {in: ["booked", "new_order", "new_orders", "delivered", "cancelled","rejected"]} }, // Only available homemaids
    };

    if (experience) {
      whereClause.ExperienceYears = { contains: experience as string };
    }

    if (nationality) {
      // Search in office.Country field where nationality is actually stored
      // This is the primary search criteria
      whereClause.office = {
        Country: { contains: nationality as string }
      };
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
        // Convert to proper ISO-8601 DateTime format
        whereClause.dateofbirth = {
          gte: new Date(`${targetBirthYear - 2}-01-01T00:00:00.000Z`),
          lte: new Date(`${targetBirthYear + 2}-12-31T23:59:59.999Z`),
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

      // Try matching nationality only (highest priority)
      if (nationality) {
        flexibleWhereClause.office = {
          Country: { contains: nationality as string }
        };
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
      
      // Exact matches get highest score - NATIONALITY FIRST (highest priority)
      if (nationality) {
        const nationalityLower = (nationality as string).toLowerCase();
        // Check office Country field (where nationality is actually stored) - HIGHEST PRIORITY
        if (homemaid.office?.Country?.toLowerCase().includes(nationalityLower)) {
          score += 25; // Highest score for nationality match
        }
        // Also check Nationalitycopy field as fallback
        if (homemaid.Nationalitycopy?.toLowerCase().includes(nationalityLower)) {
          score += 15;
        }
      }
      // RELIGION SECOND PRIORITY
      if (religion && homemaid.Religion?.toLowerCase().includes((religion as string).toLowerCase())) {
        score += 20; // Second highest score for religion match
      }
      
      // AGE THIRD PRIORITY
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
        if (ageDiff <= 2) score += 15; // High score for exact age match
        else if (ageDiff <= 5) score += 10; // Medium score for close age
        else if (ageDiff <= 10) score += 5; // Low score for far age
      }
      
      // EXPERIENCE FOURTH PRIORITY
      if (experience && homemaid.ExperienceYears?.includes(experience as string)) {
        score += 12; // Fourth priority for experience match
      }

      return { ...homemaid, relevanceScore: score };
    });

    // Sort by relevance score (highest first) and take top 5
    // Priority: Nationality (25) > Religion (20) > Age (15) > Experience (12)
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
        nationality: homemaid.office?.Country || homemaid.Nationalitycopy, // Use office country as primary nationality
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
      message: suggestions.length === 0 ? "لم يتم العثور على عاملات تطابق المواصفات المطلوبة" : null,
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
