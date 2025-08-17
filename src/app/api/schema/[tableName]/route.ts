import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { tableName: string } }
) {
  const tableName = params.tableName;
  try {
    const [rows] = await pool.query(`DESCRIBE ??`, [tableName]);
    return NextResponse.json({ success: true, schema: rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
