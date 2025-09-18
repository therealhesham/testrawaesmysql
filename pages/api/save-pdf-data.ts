import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

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

// Helper function to map Gemini data to AutomaticEmployee schema
const mapGeminiDataToEmployee = (geminiData: any, selectedImages: string[]) => {
  const data = geminiData.jsonResponse || {};
  
  // Parse skills and languages_spoken if they are JSON strings
  const skills = parseJsonField(data.skills);
  const languagesSpoken = parseJsonField(data.languages_spoken);
  
  // Extract flattened skill values
  const skill_washing = skills?.WASHING || skills?.washing || '';
  const skill_cooking = skills?.COOKING || skills?.cooking || '';
  const skill_babysetting = skills?.babysetting || skills?.BABYSITTING || skills?.babysitting || '';
  const skill_cleaning = skills?.CLEANING || skills?.cleaning || '';
  const skill_laundry = skills?.LAUNDRY || skills?.laundry || '';
  
  // Extract flattened language values
  const lang_english = languagesSpoken?.English || languagesSpoken?.english || '';
  const lang_arabic = languagesSpoken?.Arabic || languagesSpoken?.arabic || '';
  
  return {
    name: data.Name || data.full_name || data.name,
    age: data.Age || data.age,
    religion: data.Religion || data.religion,
    maritalStatus: data.MaritalStatus || data.marital_status || data.maritalStatus,
    birthDate: data.BirthDate || data.birthDate || data.birth_date || data.date_of_birth,
    nationality: data.Nationality || data.nationality,
    officeName: data.OfficeName || data.office_name || data.officeName,
    passportNumber: data.PassportNumber || data.passport_number || data.passportNumber,
    passportStartDate: data.PassportStartDate || data.passport_issue_date || data.passportStartDate,
    passportEndDate: data.PassportEndDate || data.passport_expiration || data.passportEndDate,
    contractDuration: data.Contract_duration || data.contractDuration || data.contract_duration,
    weight: data.Weight || data.weight,
    height: data.height || data.Height,
    salary: data.salary || data.Salary,
    profileImage: selectedImages[0] || null, // First image as profile
    fullImage: selectedImages[1] || selectedImages[0] || null, // Second image as full image
    
    // Flattened skill fields
    skill_washing,
    skill_cooking,
    skill_babysetting,
    skill_cleaning,
    skill_laundry,
    
    // Flattened language fields
    lang_english,
    lang_arabic,
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

    // Map Gemini data to AutomaticEmployee schema
    const employeeData = mapGeminiDataToEmployee(geminiData, selectedImages);

    // Create the employee record in AutomaticEmployee table
    const employeeRecord = await prisma.automaticEmployee.create({
      data: employeeData
    });

    return res.status(200).json({
      success: true,
      employeeId: employeeRecord.id,
      message: 'Employee data saved successfully'
    });

  } catch (error) {
    console.error('Error saving PDF data:', error);
    return res.status(500).json({ 
      error: 'Failed to save PDF data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
