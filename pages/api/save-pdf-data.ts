import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to normalize boolean values
const normalizeBoolean = (value: any) => {
  if (typeof value === 'boolean') return value;
  if (value == null) return undefined;
  const v = String(value).trim().toLowerCase();
  if (["yes", "y", "true", "1", "نعم"].includes(v)) return true;
  if (["no", "n", "false", "0", "لا"].includes(v)) return false;
  return undefined;
};

// Helper function to parse JSON strings for skills and languages
const parseJsonField = (value: any) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }
  return value;
};

// Helper function to parse date string to DateTime
const parseDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

// Helper function to parse age to Int
const parseAge = (ageValue: any): number | null => {
  if (ageValue == null) return null;
  if (typeof ageValue === 'number') return ageValue;
  if (typeof ageValue === 'string') {
    const parsed = parseInt(ageValue, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

// Helper function to map Gemini data to homemaid schema
const mapGeminiDataToHomemaid = (geminiData: any, selectedImages: string[]) => {
  const data = geminiData.jsonResponse || {};
  
  // Parse skills and languages_spoken if they are JSON strings
  const skills = parseJsonField(data.skills);
  const languagesSpoken = parseJsonField(data.languages_spoken);
  
  // Extract skill levels (matching homemaid schema)
  const washingLevel = skills?.WASHING || skills?.washing || '';
  const cookingLevel = skills?.COOKING || skills?.cooking || '';
  const childcareLevel = skills?.babysetting || skills?.BABYSITTING || skills?.babysitting || '';
  const cleaningLevel = skills?.CLEANING || skills?.cleaning || '';
  const laundryLevel = skills?.LAUNDRY || skills?.laundry || '';
  const ironingLevel = skills?.IRONING || skills?.ironing || '';
  const sewingLevel = skills?.SEWING || skills?.sewing || '';
  const elderlycareLevel = skills?.ELDERLYCARE || skills?.elderlycare || '';
  
  // Extract language levels
  const englishLanguageLevel = languagesSpoken?.English || languagesSpoken?.english || '';
  const arabicLanguageLeveL = languagesSpoken?.Arabic || languagesSpoken?.arabic || '';
  
  // Prepare images as JSON (homemaid uses Json type for Picture and FullPicture)
  // Format: { url: "..." } to match the expected format
  const profileImage = selectedImages[0] || null;
  const fullImage = selectedImages[1] || selectedImages[0] || null;
  
  // Parse nationality to JSON if it's a string
  let nationalityJson: any = null;
  const nationalityValue = data.Nationality || data.nationality;
  if (nationalityValue) {
    if (typeof nationalityValue === 'string') {
      try {
        nationalityJson = JSON.parse(nationalityValue);
      } catch {
        nationalityJson = nationalityValue; // If not JSON, store as string in JSON
      }
    } else {
      nationalityJson = nationalityValue;
    }
  }
  
  return {
    Name: data.Name || data.full_name || data.name || '',
    age: parseAge(data.Age || data.age),
    Religion: data.Religion || data.religion || '',
    maritalstatus: data.MaritalStatus || data.marital_status || data.maritalStatus || '',
    dateofbirth: parseDate(data.BirthDate || data.birthDate || data.birth_date || data.date_of_birth),
    Nationality: nationalityJson,
    Nationalitycopy: typeof nationalityValue === 'string' ? nationalityValue : (nationalityJson ? JSON.stringify(nationalityJson) : ''),
    officeName: data.company_name || data.CompanyName || data.OfficeName || data.office_name || data.officeName ,
  
    Passportnumber: data.PassportNumber || data.passport_number || data.passportNumber || '',
    PassportStart: parseDate(data.PassportStartDate || data.passport_issue_date || data.passportStartDate),
    PassportEnd: parseDate(data.PassportEndDate || data.passport_expiration || data.passportEndDate),
    Salary: data.salary || data.Salary || '',
    Picture: profileImage ? { url: profileImage } : Prisma.JsonNull,
    FullPicture: fullImage ? { url: fullImage } : Prisma.JsonNull,
    // weight: data.weight || data.Weight || '',
    // height: data.height || data.Height || '',
    // Language levels
    EnglishLanguageLevel: englishLanguageLevel || '',
    ArabicLanguageLeveL: arabicLanguageLeveL || '',
    
    // Skill levels
    washingLevel: washingLevel || '',
    cookingLevel: cookingLevel || '',
    childcareLevel: childcareLevel || '',
    cleaningLevel: cleaningLevel || '',
    laundryLevel: laundryLevel || '',
    ironingLevel: ironingLevel || '',
    sewingLevel: sewingLevel || '',
    elderlycareLevel: elderlycareLevel || '',
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, selectedImages, geminiData, originalFileName, notes, processedBy } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!geminiData || !geminiData.jsonResponse) {
      return res.status(400).json({ error: 'Gemini data is required' });
    }

    if (!selectedImages || selectedImages.length === 0) {
      return res.status(400).json({ error: 'Selected images are required' });
    }

    // Map Gemini data to homemaid schema
    const homemaidData = mapGeminiDataToHomemaid(geminiData, selectedImages);

    // Handle office relation - find office and use connect syntax
    let officeRelation: any = undefined;
    const officeNameValue = homemaidData.officeName;
    
    if (officeNameValue) {
      const trimmedOfficeName = String(officeNameValue).trim();
      
      // Try exact match first
      let office = await prisma.offices.findUnique({
        where: { office: trimmedOfficeName }
      });
      
      // If not found, try case-insensitive search
      if (!office) {
        const allOffices = await prisma.offices.findMany({
          where: {
            office: {
              not: null
            }
          }
        });
        
        // Try exact case-insensitive match
        office = allOffices.find(
          o => o.office && o.office.trim().toLowerCase() === trimmedOfficeName.toLowerCase()
        ) || null;
        
        // If still not found, try partial match (contains)
        if (!office) {
          office = allOffices.find(
            o => o.office && o.office.trim().toLowerCase().includes(trimmedOfficeName.toLowerCase())
          ) || null;
        }
        
        // If still not found, try reverse partial match (office name contains search term)
        if (!office) {
          office = allOffices.find(
            o => o.office && trimmedOfficeName.toLowerCase().includes(o.office.trim().toLowerCase())
          ) || null;
        }
      }
      
      if (office) {
        // Use the relation connect syntax
        officeRelation = {
          connect: {
            office: office.office
          }
        };
      } else {
        console.warn(`Office "${trimmedOfficeName}" not found in offices table. Skipping office relation.`);
      }
    }
    
    // Remove officeName from homemaidData as we'll use the relation field instead
    delete homemaidData.officeName;

    // Build the create data object
    const createData: any = { ...homemaidData };
    
    // Add office relation if found
    if (officeRelation) {
      createData.office = officeRelation;
    }

    // Log the data being sent for debugging
    console.log('Homemaid data to be saved:', JSON.stringify(createData, null, 2));

    // Create the homemaid record in homemaid table
    const homemaidRecord = await prisma.homemaid.create({
      data: createData
    });

    return res.status(200).json({
      success: true,
      homemaidId: homemaidRecord.id,
      message: 'Employee data saved successfully to homemaid table'
    });

  } catch (error) {
    console.error('Error saving PDF data:', error);
    return res.status(500).json({ 
      error: 'Failed to save PDF data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
}
