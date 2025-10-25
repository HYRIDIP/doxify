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

  try {
    console.log('Fetching pages list...');

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
      SELECT slug, title, content, created_at 
      FROM pages 
      ORDER BY created_at DESC 
      LIMIT 100
    `;

    console.log(`Found ${result.rows.length} pages`);

    const pages = result.rows.map(page => ({
      slug: page.slug,
      title: page.title,
      content: page.content,
      created_at: page.created_at
    }));

    res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
    res.json(pages);

  } catch (error) {
    console.error('Error listing pages:', error);
    
    // Return empty array instead of error for better UX
    res.json([]);
  }
}
