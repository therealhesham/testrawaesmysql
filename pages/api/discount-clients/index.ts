import type { NextApiRequest, NextApiResponse } from 'next';
import { getDiscountDbPool, DiscountRegistration } from '../../../lib/discountDb';
import { RowDataPacket } from 'mysql2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const pool = getDiscountDbPool();
    const {
      q,
      city_sector,
      department,
      status,
      page = '1',
      limit = '50',
      all = 'false',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit as string, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    // Building WHERE clause
    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    if (q && typeof q === 'string' && q.trim() !== '') {
      const searchTerm = `%${q.trim()}%`;
      whereConditions.push(`(
        full_name LIKE ? OR 
        phone LIKE ? OR 
        national_id LIKE ? OR 
        registration_number LIKE ? OR 
        city_sector LIKE ? OR 
        department LIKE ?
      )`);
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (city_sector && typeof city_sector === 'string' && city_sector !== 'all') {
      whereConditions.push('city_sector = ?');
      queryParams.push(city_sector);
    }

    if (department && typeof department === 'string' && department !== 'all') {
      whereConditions.push('department = ?');
      queryParams.push(department);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      whereConditions.push('status = ?');
      queryParams.push(status);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Total filtered count
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM national_day_registrations ${whereSql}`,
      queryParams
    );
    const total = (countRows[0] as any)?.total || 0;

    // Query data
    let querySql = `SELECT * FROM national_day_registrations ${whereSql} ORDER BY id DESC`;
    const dataParams = [...queryParams];

    if (all !== 'true') {
      querySql += ` LIMIT ? OFFSET ?`;
      dataParams.push(limitNum, offset);
    }

    const [rows] = await pool.query<RowDataPacket[]>(querySql, dataParams);

    // Global Stats (for counters and filters)
    const [statsRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as totalRegistrations,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmedCount,
        COUNT(DISTINCT city_sector) as sectorsCount,
        COUNT(DISTINCT department) as departmentsCount
      FROM national_day_registrations
    `);

    // Unique sectors and departments list for filter dropdowns
    const [sectorsRows] = await pool.query<RowDataPacket[]>(`
      SELECT DISTINCT city_sector FROM national_day_registrations WHERE city_sector IS NOT NULL AND city_sector != '' ORDER BY city_sector ASC
    `);
    const [deptRows] = await pool.query<RowDataPacket[]>(`
      SELECT DISTINCT department FROM national_day_registrations WHERE department IS NOT NULL AND department != '' ORDER BY department ASC
    `);

    const sectors = sectorsRows.map((r: any) => r.city_sector);
    const departments = deptRows.map((r: any) => r.department);

    return res.status(200).json({
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      stats: statsRows[0] || {
        totalRegistrations: total,
        confirmedCount: 0,
        sectorsCount: 0,
        departmentsCount: 0,
      },
      filterOptions: {
        sectors,
        departments,
      },
    });
  } catch (error: any) {
    console.error('Error fetching discount clients:', error);
    return res.status(500).json({
      message: 'فشل الاتصال بقاعدة بيانات الخصومات',
      error: error.message,
    });
  }
}
