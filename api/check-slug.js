import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ 
      available: false,
      error: 'Slug parameter is required' 
    });
  }

  try {
    console.log('Checking slug availability:', slug);

    const cleanSlug = slug.toLowerCase().trim();

    // Validate slug format first
    if (!/^[a-zA-Z0-9-]{3,50}$/.test(cleanSlug)) {
      return res.json({ 
        available: false,
        reason: 'invalid_format'
      });
    }

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
      SELECT slug FROM pages WHERE slug = ${cleanSlug}
    `;

    const available = result.rows.length === 0;
    
    console.log(`Slug "${cleanSlug}" available:`, available);

    res.setHeader('Cache-Control', 'no-cache');
    res.json({ 
      available: available,
      slug: cleanSlug
    });

  } catch (error) {
    console.error('Error checking slug:', error);
    res.json({ 
      available: false,
      error: 'check_failed'
    });
  }
}
