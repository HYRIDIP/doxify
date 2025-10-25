import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('=== CREATE API CALLED ===');
    
    let body;
    try {
      body = req.body;
      console.log('Received body:', body);
    } catch (error) {
      console.log('Body parsing error:', error);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid request body' 
      });
    }

    const { slug, title, content } = body;

    // Basic validation
    if (!slug || !title || !content) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required' 
      });
    }

    const cleanSlug = slug.toString().toLowerCase().trim();

    // Validate slug format
    if (!/^[a-zA-Z0-9-]{3,50}$/.test(cleanSlug)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid page name format. Use only letters, numbers and hyphens (3-50 characters).' 
      });
    }

    console.log('Creating page:', { cleanSlug, title: title.substring(0, 50) });

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

      // Check if page exists
      const existing = await sql`
        SELECT slug FROM pages WHERE slug = ${cleanSlug}
      `;
      
      if (existing.rows.length > 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Page name already exists' 
        });
      }

      // Insert new page
      await sql`
        INSERT INTO pages (slug, title, content) 
        VALUES (${cleanSlug}, ${title.toString()}, ${content.toString()})
      `;

      console.log('Page created successfully:', cleanSlug);

      return res.status(200).json({ 
        success: true, 
        slug: cleanSlug,
        url: `/${cleanSlug}`,
        message: 'Page created successfully'
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      
      if (dbError.code === '23505') {
        return res.status(400).json({ 
          success: false,
          error: 'Page name already exists' 
        });
      }
      
      return res.status(500).json({ 
        success: false,
        error: 'Database error: ' + dbError.message 
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}
