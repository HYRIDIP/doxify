import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'Slug parameter required' });
  }

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
      SELECT slug FROM pages WHERE slug = ${slug.toLowerCase()}
    `;

    res.json({ available: result.rows.length === 0 });
  } catch (error) {
    console.error('Error checking slug:', error);
    res.json({ available: true });
  }
}
