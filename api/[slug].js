import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { slug } = req.query;

  console.log('Request received for slug:', slug);

  // Список системных маршрутов которые не должны обрабатываться здесь
  const systemRoutes = [
    'create', 'write', 'api', 'public', 'list', 'check-slug',
    'favicon.ico', 'robots.txt', 'sitemap.xml'
  ];

  // Если это системный маршрут - редирект на главную
  if (systemRoutes.includes(slug)) {
    console.log('System route detected, redirecting to home:', slug);
    return res.redirect('/');
  }

  // Если slug undefined или слишком короткий/длинный
  if (!slug || slug.length < 3 || slug.length > 50) {
    console.log('Invalid slug format:', slug);
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
    <p>Page URL must be between 3 and 50 characters (letters, numbers, hyphens only).</p>
    <div style="margin: 20px 0;">
        <a href="/">← Back to Home</a>
        <a href="/write">Create New Page</a>
    </div>
</body>
</html>
    `);
  }

  try {
    console.log('Processing page request for:', slug);

    // Ensure table exists
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS pages (
          slug VARCHAR(50) PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      console.log('Table check completed');
    } catch (tableError) {
      console.log('Table already exists:', tableError.message);
    }

    // Clean the slug
    const cleanSlug = String(slug).toLowerCase().trim();
    console.log('Cleaned slug:', cleanSlug);

    // Get page from database
    const result = await sql`
      SELECT * FROM pages WHERE slug = ${cleanSlug}
    `;

    console.log('Database query result:', result.rows.length, 'rows found');

    if (result.rows.length === 0) {
      console.log('Page not found in database');
      return res.status(404).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Page Not Found - Doxify</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
        body { background: #000; color: #fff; line-height: 1.6; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; }
        h1 { margin-bottom: 20px; }
        p { margin-bottom: 30px; color: #ccc; }
        .btn { display: inline-block; padding: 10px 20px; background: #333; color: #fff; text-decoration: none; border: 1px solid #333; margin: 0 10px; }
        .btn:hover { background: #444; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Page Not Found</h1>
        <p>The page "<strong>${cleanSlug}</strong>" does not exist.</p>
        <div>
            <a href="/" class="btn">← Back to Home</a>
            <a href="/write?slug=${cleanSlug}" class="btn">Create This Page</a>
        </div>
    </div>
</body>
</html>
      `);
    }

    const page = result.rows[0];
    console.log('Page found:', page.slug);

    const createdDate = new Date(page.created_at);
    const formattedDate = createdDate.toLocaleDateString();

    res.setHeader('Content-Type', 'text/html');
    res.send(`
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

        <h1>${escapeHtml(page.title)}</h1>
        <div class="page-info">
            /${page.slug} • Created: ${formattedDate}
        </div>
        
        <div class="page-content">${escapeHtml(page.content)}</div>
        
        <a href="/" class="btn">Back to Home</a>
    </div>
</body>
</html>
    `);

  } catch (error) {
    console.error('Error loading page:', error);
    res.status(500).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Server Error - Doxify</title>
    <style>
        body { background: #000; color: #fff; font-family: Arial; text-align: center; padding: 50px; }
        .error { color: #f00; margin: 20px 0; font-family: monospace; }
        a { color: #ccc; text-decoration: none; margin: 0 10px; }
    </style>
</head>
<body>
    <h1>Internal Server Error</h1>
    <div class="error">${error.message}</div>
    <div style="margin: 20px 0;">
        <a href="/">← Back to Home</a>
        <a href="/write">Try Again</a>
    </div>
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
