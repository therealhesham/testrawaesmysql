import type { NextApiRequest, NextApiResponse } from 'next';
import { getDiscountDbPool } from '../../../lib/discountDb';
import { RowDataPacket } from 'mysql2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const rawQuery = req.method === 'POST' ? req.body.query : req.query.query;
    
    if (!rawQuery || typeof rawQuery !== 'string' || rawQuery.trim() === '') {
      return res.status(400).json({ 
        isEligible: false,
        message: 'يرجى إدخال رقم الهوية، رقم الجوال، أو رقم التسجيل للتحقق' 
      });
    }

    const query = rawQuery.trim();
    // Normalize phone number if applicable (e.g., handles 05..., 9665..., 5...)
    let cleanPhone = query.replace(/[\s\-\+]/g, '');
    if (cleanPhone.startsWith('966')) {
      cleanPhone = '0' + cleanPhone.slice(3);
    } else if (cleanPhone.length === 9 && cleanPhone.startsWith('5')) {
      cleanPhone = '0' + cleanPhone;
    }

    const pool = getDiscountDbPool();

    // Look for exact or normalized match on registration_number, national_id, or phone
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM national_day_registrations 
       WHERE registration_number = ? 
          OR national_id = ? 
          OR phone = ? 
          OR phone = ? 
          OR full_name = ?
          OR registration_number LIKE ?
       ORDER BY id DESC LIMIT 5`,
      [query, query, query, cleanPhone, query, `%${query}%`]
    );

    if (!rows || rows.length === 0) {
      return res.status(200).json({
        isEligible: false,
        message: 'غير مسجل بقائمة الخصومات - العميل غير مؤهل للخصم',
        query,
      });
    }

    const client = rows[0];
    const isConfirmed = client.status === 'confirmed';

    return res.status(200).json({
      isEligible: true,
      status: client.status,
      isConfirmed,
      client,
      allMatches: rows,
      message: isConfirmed 
        ? 'تم التحقق بنجاح: العميل مؤهل للخصم (مسجل ومؤكد)' 
        : `العميل مسجل بحالة: ${client.status}`,
    });

  } catch (error: any) {
    console.error('Error verifying discount client:', error);
    return res.status(500).json({
      isEligible: false,
      message: 'حدث خطأ أثناء التحقق من قاعدة البيانات',
      error: error.message,
    });
  }
}
