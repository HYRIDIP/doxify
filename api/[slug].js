import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { slug } = req.query;

  // Skip system routes
  const systemRoutes = ['create', 'write', 'api', 'public', 'list', 'check-slug'];
  if (systemRoutes.includes(slug)) {
    return res.redirect('/');
  }

  // Validate slug
  if (!slug || slug.length < 3 || slug.length > 50) {
    return res.status(400).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Invalid Page - Doxify</title>
    <style>
        body { background: #000; color: #fff; font-family: Arial; text-align: center; padding: 50px; }
        a { color: #ccc; text-decoration: none; margin: 0 10px; }
    </style>
</head>
<body>
    <h1>Invalid Page URL</h1>
    <p>Page URL must be between 3 and 50 characters.</p>
    <div style="margin: 20px 0;">
        <a href="/">← Back to Home</a>
        <a href="/write">Create New Page</a>
    </div>
</body>
</html>
    `);
  }

  try {
    const cleanSlug = slug.toString().toLowerCase().trim();

    // Create table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS pages (
        slug VARCHAR(50) PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Get page from database
    const result = await sql`
      SELECT * FROM pages WHERE slug = ${cleanSlug}
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
    </style>
</head>
<body>
    <h1>Page Not Found</h1>
    <p>The page "${cleanSlug}" does not exist.</p>
    <div style="margin: 20px 0;">
        <a href="/">← Back to Home</a>
        <a href="/write?slug=${cleanSlug}">Create this page</a>
    </div>
</body>
</html>
      `);
    }

    const page = result.rows[0];
    const date = new Date(page.created_at).toLocaleDateString();

    res.setHeader('Content-Type', 'text/html');
    return res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>${escapeHtml(page.title)} - Doxify</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
        body { background: #000; color: #fff; line-height: 1.6; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        header { border-bottom: 1px solid #333; padding: 10px 0; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #fff; text-decoration: none; }
        nav a { color: #ccc; text-decoration: none; margin-right: 15px; }
        .page-content { white-space: pre-wrap; background: #111; padding: 20px; border: 1px solid #333; margin: 20px 0; }
        .btn { display: inline-block; padding: 8px 15px; background: #333; color: #fff; text-decoration: none; border: 1px solid #333; margin: 10px 0; }
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

        <h1>${escapeHtml(page.title)}</h1>
        <div style="color: #888; margin: 10px 0;">/${page.slug} • ${date}</div>
        <div class="page-content">${escapeHtml(page.content)}</div>
        <a href="/" class="btn">Back to Home</a>
    </div>
</body>
</html>
    `);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Error - Doxify</title>
    <style>
        body { background: #000; color: #fff; font-family: Arial; text-align: center; padding: 50px; }
    </style>
</head>
<body>
    <h1>Database Error</h1>
    <p>${error.message}</p>
    <a href="/" style="color: #ccc;">← Back to Home</a>
</body>
</html>
    `);
  }
}

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
