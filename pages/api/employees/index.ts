import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        search,
        department,
        position,
        isActive,
        page = 1,
        limit = 50
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause for filtering
      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { phoneNumber: { contains: search as string } },
          { email: { contains: search as string } },
          { nationalId: { contains: search as string } }
        ];
      }
      
      if (department && department !== 'all') {
        where.department = department;
      }
      
      if (position && position !== 'all') {
        where.position = position;
      }
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      // Get employees with pagination
      const [employees, total] = await Promise.all([
        prisma.employee.findMany({
          where,
          select: {
            id: true,
            name: true,
            position: true,
            department: true,
            phoneNumber: true,
            email: true,
            nationalId: true,
            address: true,
            hireDate: true,
            salary: true,
            isActive: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                employeeCash: true,
                employeeCashDetails: true
              }
            }
          },
          orderBy: {
            name: 'asc'
          },
          skip,
          take: Number(limit)
        }),
        prisma.employee.count({ where })
      ]);

      // Get unique departments and positions for filter dropdowns
      const [departments, positions] = await Promise.all([
        prisma.employee.findMany({
          select: {
            department: true
          },
          distinct: ['department'],
          where: {
            department: {
              not: null
            }
          }
        }),
        prisma.employee.findMany({
          select: {
            position: true
          },
          distinct: ['position'],
          where: {
            position: {
              not: null
            }
          }
        })
      ]);

      res.status(200).json({
        employees,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        filters: {
          departments: departments.map(d => d.department).filter(Boolean),
          positions: positions.map(p => p.position).filter(Boolean)
        }
      });

    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ error: 'Failed to fetch employees' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        name,
        position,
        department,
        phoneNumber,
        email,
        nationalId,
        address,
        hireDate,
        salary,
        notes
      } = req.body;

      // Basic validation
      if (!name) {
        return res.status(400).json({ error: 'اسم الموظف مطلوب' });
      }

      const employee = await prisma.employee.create({
        data: {
          name,
          position: position || null,
          department: department || null,
          phoneNumber: phoneNumber || null,
          email: email || null,
          nationalId: nationalId || null,
          address: address || null,
          hireDate: hireDate ? new Date(hireDate) : null,
          salary: salary ? Number(salary) : null,
          notes: notes || null,
          isActive: true
        }
      });

      res.status(201).json({ 
        message: 'تم إضافة الموظف بنجاح', 
        employee 
      });

    } catch (error) {
      console.error('Error creating employee:', error);
      res.status(500).json({ error: 'Failed to create employee' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
