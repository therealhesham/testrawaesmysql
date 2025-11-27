import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Worker ID is required' });
      }

      const worker = await prisma.homemaid.findUnique({
        where: {
          id: parseInt(id as string)
        },
        include: {
          office: true,
          logs: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!worker) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      return res.status(200).json(worker);
    } catch (error) {
      console.error('Error fetching worker:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Worker ID is required' });
      }

      // Remove fields that shouldn't be updated directly
      const { logs, ...updateFields } = updateData;
      
      // Filter out any fields that don't exist in the schema or are relations
      // معالجة تاريخ الميلاد - التأكد من أنه صالح قبل التحويل
      let dateOfBirthValue = undefined;
      if (updateFields.dateofbirth && updateFields.dateofbirth.trim() !== "") {
        const dateObj = new Date(updateFields.dateofbirth);
        if (!isNaN(dateObj.getTime())) {
          dateOfBirthValue = dateObj.toISOString();
        }
      }
      
      const allowedFields = {
        Name: updateFields.Name,
        Religion: updateFields.Religion,
        Nationalitycopy: updateFields.Nationalitycopy,
        maritalstatus: updateFields.maritalstatus,
        dateofbirth: dateOfBirthValue,
        Passportnumber: updateFields.Passportnumber,
        phone: updateFields.phone,
        Education: updateFields.Education,
        ArabicLanguageLeveL: updateFields.ArabicLanguageLeveL,
        EnglishLanguageLevel: updateFields.EnglishLanguageLevel,
        Experience: updateFields.Experience,
        ExperienceYears: updateFields.ExperienceYears,
        washingLevel: updateFields.washingLevel,
        ironingLevel: updateFields.ironingLevel,
        cleaningLevel: updateFields.cleaningLevel,
        cookingLevel: updateFields.cookingLevel,
        sewingLevel: updateFields.sewingLevel,
        childcareLevel: updateFields.childcareLevel,
        elderlycareLevel: updateFields.elderlycareLevel,
        officeName: updateFields.officeName,
        Salary: updateFields.salary || updateFields.Salary
      };

      // Remove undefined values
      const filteredFields = Object.fromEntries(
        Object.entries(allowedFields).filter(([_, value]) => value !== undefined)
      );

      console.log('Filtered update fields:', filteredFields);
      
      const updatedWorker = await prisma.homemaid.update({
        where: {
          id: parseInt(id as string)
        },
        data: filteredFields,
        include: {
          office: true,
          logs: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      return res.status(200).json(updatedWorker);
    } catch (error) {
      console.error('Error updating worker:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}