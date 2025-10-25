import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create table if not exists
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
      LIMIT 100
    `;

    const pages = result.rows.map(page => ({
      slug: page.slug,
      title: page.title,
      content: page.content,
      created_at: page.created_at
    }));

    return res.json(pages);

  } catch (error) {
    console.error('Error listing pages:', error);
    return res.json([]);
  }
}
