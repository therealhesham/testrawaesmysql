import mysql, { Pool } from 'mysql2/promise';

let pool: Pool;

export function getDiscountDbPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DISCOUNT_DB_HOST || '31.97.55.12',
      port: Number(process.env.DISCOUNT_DB_PORT) || 3306,
      user: process.env.DISCOUNT_DB_USER || 'root',
      password: process.env.DISCOUNT_DB_PASSWORD || 'nSfhCaIUqWRmye5MHbWNnFU2NrdGdpPGeR7MKb3fNn6u6iT6oCawCdRWqYFjEjMe',
      database: process.env.DISCOUNT_DB_NAME || 'job',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
}

export interface DiscountRegistration {
  id: number;
  full_name: string;
  phone: string;
  national_id: string;
  city_sector: string;
  registration_number: string;
  status: string;
  created_at: string | Date;
  department: string;
}
