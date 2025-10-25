import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    // Auto-create table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS pages (
        slug VARCHAR(50) PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    const result = await sql`
      SELECT * FROM pages 
      ORDER BY created_at DESC 
      LIMIT 20
    `;

    res.json(result.rows);
  } catch (error) {
    console.error('Error listing pages:', error);
    res.json([]);
  }
}
