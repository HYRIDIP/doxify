import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug, title, content } = req.body;

    if (!slug || !title || !content) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const cleanSlug = slug.toLowerCase().trim();

    if (!/^[a-zA-Z0-9-]{3,50}$/.test(cleanSlug)) {
      return res.status(400).json({ error: 'Invalid page name format' });
    }

    await sql`
      CREATE TABLE IF NOT EXISTS pages (
        slug VARCHAR(50) PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    const existing = await sql`SELECT slug FROM pages WHERE slug = ${cleanSlug}`;
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Page name already exists' });
    }

    await sql`
      INSERT INTO pages (slug, title, content) 
      VALUES (${cleanSlug}, ${title}, ${content})
    `;

    res.json({ 
      success: true, 
      slug: cleanSlug,
      url: `/${cleanSlug}`
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}
