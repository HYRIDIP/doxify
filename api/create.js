import { writeFile, readdir } from 'fs/promises';
import { join } from 'path';

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
    
    // Check if page already exists
    try {
      const files = await readdir(join(process.cwd(), 'pages'));
      if (files.includes(`${cleanSlug}.json`)) {
        return res.status(400).json({ error: 'Page name already exists' });
      }
    } catch (error) {
      // Pages directory doesn't exist yet, which is fine
    }

    // Create page data
    const pageData = {
      slug: cleanSlug,
      title: title,
      content: content,
      createdAt: new Date().toISOString()
    };

    // Save to file
    await writeFile(
      join(process.cwd(), 'pages', `${cleanSlug}.json`),
      JSON.stringify(pageData, null, 2)
    );

    res.status(200).json({ 
      success: true, 
      slug: cleanSlug,
      url: `/${cleanSlug}`
    });

  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}