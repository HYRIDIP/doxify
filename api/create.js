import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  console.log('=== CREATE API CALLED ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request handled');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    // Parse JSON body
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      console.log('Parsed body:', body);
    } catch (parseError) {
      console.log('Body parse error:', parseError);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid JSON body' 
      });
    }

    const { slug, title, content } = body;

    console.log('Extracted data:', { slug, title, content });

    // Validation
    if (!slug || !title || !content) {
      console.log('Missing fields:', { slug: !!slug, title: !!title, content: !!content });
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required' 
      });
    }

    const cleanSlug = slug.toLowerCase().trim();
    console.log('Clean slug:', cleanSlug);

    // Validate slug format
    if (!/^[a-zA-Z0-9-]{3,50}$/.test(cleanSlug)) {
      console.log('Invalid slug format');
      return res.status(400).json({ 
        success: false,
        error: 'Invalid page name format' 
      });
    }

    console.log('Connecting to database...');

    try {
      // Auto-create table if not exists
      console.log('Creating table if not exists...');
      await sql`
        CREATE TABLE IF NOT EXISTS pages (
          slug VARCHAR(50) PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      console.log('Table check completed');

      // Check if page already exists
      console.log('Checking if page exists:', cleanSlug);
      const existingResult = await sql`
        SELECT slug FROM pages WHERE slug = ${cleanSlug}
      `;
      
      if (existingResult.rows.length > 0) {
        console.log('Page already exists');
        return res.status(400).json({ 
          success: false,
          error: 'Page name already exists' 
        });
      }

      // Save to database
      console.log('Inserting new page...');
      const insertResult = await sql`
        INSERT INTO pages (slug, title, content) 
        VALUES (${cleanSlug}, ${title}, ${content})
        RETURNING slug, title, created_at
      `;
      
      console.log('Page created successfully:', insertResult.rows[0]);

      res.status(200).json({ 
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
      
      throw dbError;
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
}
