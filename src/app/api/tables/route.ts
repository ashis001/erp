import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [dbName] = await pool.query('SELECT DATABASE() AS db');
    const [tables] = await pool.query('SHOW TABLES');

    return NextResponse.json({
      connected: true,
      database: (dbName as any)[0].db,
      tables: (tables as any).map((t: any) => Object.values(t)[0]),
    });
  } catch (err: any) {
    return NextResponse.json({ connected: false, error: err.message }, { status: 500 });
  }
}
