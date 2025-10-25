import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS pages (
        slug VARCHAR(50) PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    const result = await sql`
      SELECT slug, title, content, created_at 
      FROM pages 
      ORDER BY created_at DESC 
      LIMIT 20
    `;

    res.json(result.rows);

  } catch (error) {
    res.json([]);
  }
}
