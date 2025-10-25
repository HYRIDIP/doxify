import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.json({ available: false });
  }

  try {
    const cleanSlug = slug.toLowerCase().trim();

    await sql`
      CREATE TABLE IF NOT EXISTS pages (
        slug VARCHAR(50) PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    const result = await sql`SELECT slug FROM pages WHERE slug = ${cleanSlug}`;
    const available = result.rows.length === 0;

    res.json({ available });

  } catch (error) {
    res.json({ available: false });
  }
}
