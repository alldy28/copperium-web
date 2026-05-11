import { NextResponse } from 'next/server'
import { Client } from 'pg'

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432'),
  connectionTimeoutMillis: 5000
}

export async function GET () {
  const client = new Client(dbConfig)
  try {
    await client.connect()
    // Ambil data stokis terbaru
    const res = await client.query('SELECT * FROM stockists ORDER BY id DESC')

    // Kembalikan data dalam bentuk JSON dengan izin akses (CORS) agar bisa dibaca React Vite
    return NextResponse.json(res.rows, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Izinkan semua website membaca data ini
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  } finally {
    await client.end()
  }
}
