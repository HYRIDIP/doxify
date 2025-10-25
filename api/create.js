import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug, title, content } = req.body;

    // Validation
    if (!slug || !title || !content) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!/^[a-zA-Z0-9-]{3,50}$/.test(slug)) {
      return res.status(400).json({ error: 'Invalid page name format' });
    }

    const cleanSlug = slug.toLowerCase();

    // Auto-create table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS pages (
        slug VARCHAR(50) PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Save to database
    await sql`
      INSERT INTO pages (slug, title, content) 
      VALUES (${cleanSlug}, ${title}, ${content})
    `;

    res.status(200).json({ 
      success: true, 
      slug: cleanSlug,
      url: `/${cleanSlug}`
    });

  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Page name already exists' });
    }
    console.error('Error creating page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
