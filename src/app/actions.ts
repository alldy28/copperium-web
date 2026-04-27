/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { Client } from 'pg'
import { revalidatePath } from 'next/cache'

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432'),
  connectionTimeoutMillis: 5000
}

// --- 1. ACTIONS UNTUK MASTER PRODUK ---

// Mengambil semua produk beserta jumlah kepingan yang dimiliki
export async function getProducts () {
  const client = new Client(dbConfig)
  try {
    await client.connect()
    const query = `
      SELECT p.*, COUNT(k.uuid)::int as total_kepingan 
      FROM products p 
      LEFT JOIN kepingan k ON p.id = k.product_id 
      GROUP BY p.id 
      ORDER BY p.id DESC
    `
    const res = await client.query(query)
    return res.rows
  } catch (error) {
    console.error('Database Error (getProducts):', error)
    return []
  } finally {
    await client.end()
  }
}

// Menambah Master Produk Baru
export async function addMasterProduct (formData: {
  name: string
  weight: number
  description: string
  production_date: string
  image: string
  finest: string
}) {
  const client = new Client(dbConfig)
  try {
    await client.connect()

    // 👇 BARIS SAKTI (SEMENTARA) UNTUK MENGUBAH TIPE DATA DATABASE 👇
    console.log('👉 Memaksa ubah tipe data weight menjadi NUMERIC...')
    await client.query(
      'ALTER TABLE products ALTER COLUMN weight TYPE NUMERIC(10,2);'
    )
    // 👆 ----------------------------------------------------------- 👆

    const query = `
      INSERT INTO products (name, weight, description, production_date, image, finest) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id
    `
    const values = [
      formData.name,
      formData.weight,
      formData.description,
      formData.production_date,
      formData.image,
      formData.finest
    ]
    const res = await client.query(query, values)
    revalidatePath('/products')
    return { success: true, productId: res.rows[0].id }
  } catch (error) {
    console.error('Database Error (addMasterProduct):', error)
    return { success: false, error: 'Gagal menambah produk' }
  } finally {
    await client.end()
  }
}



// Menghapus Master Produk (Otomatis menghapus kepingan karena CASCADE)
export async function deleteMasterProduct (id: number) {
  const client = new Client(dbConfig)
  try {
    await client.connect()
    await client.query('DELETE FROM products WHERE id = $1', [id])
    revalidatePath('/products')
    return { success: true }
  } catch (error) {
    console.error('Database Error (deleteMasterProduct):', error)
    return { success: false }
  } finally {
    await client.end()
  }
}

// --- 2. ACTIONS UNTUK KEPINGAN (QR & PIN) ---

// Generate banyak kepingan untuk satu produk tertentu
export async function generateKepingan (productId: number, count: number) {
  // 1. KITA LIHAT APAKAH FUNGSI INI TERPANGGIL
  console.log(
    '👉 MEMULAI MINTING UNTUK PRODUK ID:',
    productId,
    'JUMLAH:',
    count
  )

  const client = new Client(dbConfig)
  try {
    console.log('👉 MENCOBA CONNECT KE DATABASE...')
    await client.connect()

    console.log('👉 CONNECT BERHASIL! MEMULAI TRANSAKSI...')
    await client.query('BEGIN')

    for (let i = 0; i < count; i++) {
      const uuid =
        'CPR-' + Math.random().toString(36).substring(2, 7).toUpperCase()
      const pin = Math.floor(100000 + Math.random() * 900000).toString()

      console.log(`👉 INSERT KEPINGAN ${i + 1}...`)
      await client.query(
        'INSERT INTO kepingan (uuid, product_id, validation_code) VALUES ($1, $2, $3)',
        [uuid, productId, pin]
      )
    }

    console.log('👉 MENYIMPAN DATA (COMMIT)...')
    await client.query('COMMIT')
    revalidatePath('/qrcode')
    return { success: true }
  } catch (error) {
    console.error('❌ ERROR DI DATABASE:', error)
    try {
      await client.query('ROLLBACK')
    } catch (e) {}
    return { success: false, error: 'Gagal menyimpan' }
  } finally {
    console.log('👉 MENUTUP KONEKSI...')
    try {
      await client.end()
    } catch (e) {}
  }
}





// Mengambil semua kepingan milik satu produk (untuk download ZIP massal per produk)
export async function getKepinganByProduct (productId: number) {
  const client = new Client(dbConfig)
  try {
    await client.connect()
    // HANYA AMBIL YANG STATUSNYA 'NEW' (BELUM DIDOWNLOAD)
    const query = `
      SELECT k.*, p.name, p.weight, p.finest 
      FROM kepingan k
      JOIN products p ON k.product_id = p.id
      WHERE k.product_id = $1 AND (k.status = 'NEW' OR k.status IS NULL)
      ORDER BY k.created_at DESC
    `
    const res = await client.query(query, [productId])
    return res.rows
  } catch (error) {
    console.error('Database Error:', error)
    return []
  } finally {
    await client.end()
  }
}



export async function updateMasterProduct (id: number, formData: any) {
  const client = new Client(dbConfig)
  try {
    await client.connect()
    const query = `
      UPDATE products 
      SET name = $1, 
          weight = $2, 
          description = $3, 
          production_date = $4, 
          finest = $5 
      WHERE id = $6
    `
    const values = [
      formData.name,
      formData.weight,
      formData.description,
      formData.production_date,
      formData.finest,
      id
    ]

    await client.query(query, values)
    revalidatePath('/products')
    return { success: true }
  } catch (error) {
    console.error('Database Error (updateMasterProduct):', error)
    return { success: false, error: 'Gagal memperbarui produk' }
  } finally {
    await client.end()
  }
}


export async function getAllKepingan () {
  const client = new Client(dbConfig)
  try {
    await client.connect()
    // JOIN dengan tabel products agar kita tahu QR ini milik produk apa
    const query = `
      SELECT k.*, p.name as product_name 
      FROM kepingan k
      JOIN products p ON k.product_id = p.id
      ORDER BY k.created_at DESC
    `
    const res = await client.query(query)
    return res.rows
  } catch (error) {
    console.error('Database Error (getAllKepingan):', error)
    return []
  } finally {
    try {
      await client.end()
    } catch (e) {}
  }
}


export async function markKepinganAsDownloaded(uuids: string[]) {
  if (!uuids || uuids.length === 0) return { success: true };
  const client = new Client(dbConfig);
  try {
    await client.connect();
    
    // Format array ke string untuk query IN ($1, $2, $3...)
    const placeholders = uuids.map((_, i) => `$${i + 1}`).join(',');
    
    // Ubah status menjadi DOWNLOADED
    await client.query(
      `UPDATE kepingan SET status = 'DOWNLOADED' WHERE uuid IN (${placeholders})`,
      uuids
    );
    
    revalidatePath('/qrcode');
    return { success: true };
  } catch (error) {
    console.error('Update Status Error:', error);
    return { success: false };
  } finally {
    await client.end();
  }
}


export async function getKepinganByUuid (uuid: string) {
  const client = new Client(dbConfig)
  try {
    await client.connect()
    // Kita JOIN agar data produk utamanya juga terbawa
    const query = `
      SELECT k.*, p.name as product_name, p.weight, p.finest, p.production_date
      FROM kepingan k
      JOIN products p ON k.product_id = p.id
      WHERE k.uuid = $1
    `
    const res = await client.query(query, [uuid])
    return res.rows[0] || null // Return 1 baris saja
  } catch (error) {
    console.error('Database Error (getKepinganByUuid):', error)
    return null
  } finally {
    try {
      await client.end()
    } catch (e) {}
  }
}
