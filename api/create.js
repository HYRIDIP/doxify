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

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed. Only POST requests are accepted.' 
    });
  }

  try {
    console.log('Received create request:', { 
      body: req.body,
      headers: req.headers 
    });

    const { slug, title, content } = req.body;

    // Validation
    if (!slug || !title || !content) {
      console.log('Missing required fields:', { slug, title, content });
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required: slug, title, and content.' 
      });
    }

    if (typeof slug !== 'string' || typeof title !== 'string' || typeof content !== 'string') {
      console.log('Invalid field types:', { 
        slugType: typeof slug, 
        titleType: typeof title, 
        contentType: typeof content 
      });
      return res.status(400).json({ 
        success: false,
        error: 'All fields must be strings.' 
      });
    }

    const cleanSlug = slug.toLowerCase().trim();

    // Validate slug format
    if (!/^[a-zA-Z0-9-]{3,50}$/.test(cleanSlug)) {
      console.log('Invalid slug format:', cleanSlug);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid page name format. Use only letters, numbers and hyphens (3-50 characters).' 
      });
    }

    // Validate title length
    if (title.length > 200) {
      return res.status(400).json({ 
        success: false,
        error: 'Title must be less than 200 characters.' 
      });
    }

    console.log('Creating page with data:', { cleanSlug, titleLength: title.length, contentLength: content.length });

    try {
      // Auto-create table if not exists with detailed schema
      console.log('Creating pages table if not exists...');
      await sql`
        CREATE TABLE IF NOT EXISTS pages (
          slug VARCHAR(50) PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      console.log('Table creation/check completed');

      // Check if page already exists
      console.log('Checking if page exists:', cleanSlug);
      const existingResult = await sql`
        SELECT slug FROM pages WHERE slug = ${cleanSlug}
      `;
      
      if (existingResult.rows.length > 0) {
        console.log('Page already exists:', cleanSlug);
        return res.status(400).json({ 
          success: false,
          error: 'Page name already exists. Please choose a different URL name.' 
        });
      }

      // Save to database
      console.log('Inserting new page:', cleanSlug);
      const insertResult = await sql`
        INSERT INTO pages (slug, title, content) 
        VALUES (${cleanSlug}, ${title}, ${content})
        RETURNING slug, title, created_at
      `;
      
      console.log('Page created successfully:', insertResult.rows[0]);

      res.status(200).json({ 
        success: true, 
        slug: cleanSlug,
        title: title,
        url: `/${cleanSlug}`,
        message: 'Page created successfully'
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      
      if (dbError.code === '23505') { // Unique violation
        return res.status(400).json({ 
          success: false,
          error: 'Page name already exists. Please choose a different URL name.' 
        });
      }
      
      throw dbError; // Re-throw to be caught by outer catch
    }

  } catch (error) {
    console.error('Unexpected error in create API:', error);
    
    // Detailed error information for debugging
    const errorInfo = {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    
    console.error('Error details:', errorInfo);
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
}
