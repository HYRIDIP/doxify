import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { slug } = req.query;

  // Skip system routes
  if (['create', 'write', 'api', 'public'].includes(slug)) {
    return res.redirect('/');
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
      SELECT * FROM pages WHERE slug = ${slug.toLowerCase()}
    `;

    if (result.rows.length === 0) {
      return res.status(404).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Page Not Found - Doxify</title>
    <style>
        body { background: #000; color: #fff; font-family: Arial; text-align: center; padding: 50px; }
        a { color: #ccc; text-decoration: none; margin: 0 10px; }
        a:hover { color: #fff; }
    </style>
</head>
<body>
    <h1>Page Not Found</h1>
    <p>The page "${slug}" does not exist.</p>
    <div style="margin: 20px 0;">
        <a href="/">← Back to Home</a>
        <a href="/write">Create this page</a>
    </div>
</body>
</html>
      `);
    }

    const page = result.rows[0];

    res.setHeader('Content-Type', 'text/html');
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>${page.title} - Doxify</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
        body { background: #000; color: #fff; line-height: 1.4; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        header { border-bottom: 1px solid #333; padding: 10px 0; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #fff; text-decoration: none; }
        nav a { color: #ccc; text-decoration: none; margin-right: 15px; }
        nav a:hover { color: #fff; }
        .page-content { white-space: pre-wrap; background: #111; padding: 20px; border: 1px solid #333; margin: 20px 0; }
        .btn { display: inline-block; padding: 8px 15px; background: #333; color: #fff; text-decoration: none; border: 1px solid #333; margin: 10px 0; }
        .btn:hover { background: #444; }
        .page-info { color: #888; margin: 10px 0; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <a href="/" class="logo">DOXIFY</a>
            <nav>
                <a href="/">Home</a>
                <a href="/write">Write Dox</a>
            </nav>
        </header>

        <h1>${page.title}</h1>
        <div class="page-info">
            /${page.slug} • Created: ${new Date(page.created_at).toLocaleDateString()}
        </div>
        
        <div class="page-content">${page.content}</div>
        
        <a href="/" class="btn">Back to Home</a>
    </div>
</body>
</html>
    `);

  } catch (error) {
    console.error('Error loading page:', error);
    res.status(500).send('Internal server error');
  }
}
