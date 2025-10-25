import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { slug } = req.query;

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
    return res.status(405).send('Method not allowed');
  }

  console.log('Loading page for slug:', slug);

  // Skip system routes
  if (['create', 'write', 'api', 'public', 'list', 'check-slug'].includes(slug)) {
    console.log('Redirecting system route to home:', slug);
    return res.redirect('/');
  }

  try {
    // Auto-create table if not exists
    console.log('Ensuring pages table exists...');
    await sql`
      CREATE TABLE IF NOT EXISTS pages (
        slug VARCHAR(50) PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log('Querying page from database:', slug);
    const result = await sql`
      SELECT * FROM pages WHERE slug = ${slug.toLowerCase()}
    `;

    if (result.rows.length === 0) {
      console.log('Page not found:', slug);
      return res.status(404).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Page Not Found - Doxify</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Courier New', monospace; }
        body { background: #000; color: #fff; line-height: 1.6; padding: 50px 20px; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { font-size: 2.5em; margin-bottom: 20px; color: #fff; }
        p { font-size: 1.2em; margin-bottom: 30px; color: #ccc; }
        .slug { font-family: 'Courier New', monospace; color: #888; background: #111; padding: 10px; border: 1px solid #333; margin: 20px 0; }
        .actions { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin: 30px 0; }
        .btn { display: inline-block; padding: 12px 25px; background: #333; color: #fff; text-decoration: none; border: 1px solid #333; transition: all 0.3s ease; }
        .btn:hover { background: #444; border-color: #555; }
        .btn-primary { background: #222; border-color: #fff; }
        .btn-primary:hover { background: #333; }
        .error-code { color: #666; font-size: 0.9em; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <div class="slug">/${slug}</div>
        <div class="actions">
            <a href="/" class="btn btn-primary">← Back to Home</a>
            <a href="/write" class="btn">Create New Page</a>
        </div>
        <div class="error-code">Error 404 - Page Not Found</div>
    </div>
</body>
</html>
      `);
    }

    const page = result.rows[0];
    console.log('Page found:', page.slug);

    const createdDate = new Date(page.created_at);
    const formattedDate = createdDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>${escapeHtml(page.title)} - Doxify</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeHtml(page.content.substring(0, 160))}">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Courier New', monospace; }
        body { background: #000; color: #fff; line-height: 1.6; padding: 20px; min-height: 100vh; }
        .container { max-width: 900px; margin: 0 auto; }
        header { border-bottom: 1px solid #333; padding: 20px 0; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #fff; text-decoration: none; text-transform: uppercase; letter-spacing: 2px; }
        nav { margin-top: 15px; }
        nav a { color: #ccc; text-decoration: none; margin-right: 20px; font-size: 14px; transition: color 0.3s ease; }
        nav a:hover { color: #fff; }
        .page-header { margin-bottom: 30px; }
        .page-title { font-size: 2.5em; margin-bottom: 15px; color: #fff; line-height: 1.2; }
        .page-meta { color: #888; font-size: 14px; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #333; }
        .page-slug { font-family: 'Courier New', monospace; color: #0f0; background: #111; padding: 5px 10px; border: 1px solid #333; }
        .page-date { color: #666; }
        .page-content { white-space: pre-wrap; background: #111; padding: 30px; border: 1px solid #333; margin: 25px 0; line-height: 1.7; font-size: 15px; }
        .page-actions { display: flex; gap: 15px; margin: 30px 0; flex-wrap: wrap; }
        .btn { display: inline-block; padding: 12px 25px; background: #333; color: #fff; text-decoration: none; border: 1px solid #333; transition: all 0.3s ease; }
        .btn:hover { background: #444; border-color: #555; }
        .url-info { background: #111; padding: 15px; border: 1px solid #333; margin: 20px 0; }
        .url-label { color: #888; font-size: 12px; margin-bottom: 5px; }
        .url-value { font-family: 'Courier New', monospace; color: #0f0; word-break: break-all; }
        footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #333; color: #666; font-size: 12px; text-align: center; }
        
        @media (max-width: 768px) {
            .container { padding: 0 10px; }
            .page-title { font-size: 2em; }
            .page-content { padding: 20px; }
            .page-actions { flex-direction: column; }
            .btn { width: 100%; text-align: center; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <a href="/" class="logo">Doxify</a>
            <nav>
                <a href="/">Home</a>
                <a href="/write">Write Dox</a>
                <a href="/">Browse Pages</a>
            </nav>
        </header>

        <div class="page-header">
            <h1 class="page-title">${escapeHtml(page.title)}</h1>
            <div class="page-meta">
                <span class="page-slug">/${page.slug}</span>
                <span class="page-date"> • Created: ${formattedDate}</span>
            </div>
        </div>
        
        <div class="page-content">${escapeHtml(page.content)}</div>
        
        <div class="url-info">
            <div class="url-label">Page URL:</div>
            <div class="url-value">https://${req.headers.host}/${page.slug}</div>
        </div>
        
        <div class="page-actions">
            <a href="/" class="btn">← Back to Home</a>
            <a href="/write" class="btn">Create New Page</a>
            <a href="/write?slug=${page.slug}" class="btn">Create Similar</a>
        </div>

        <footer>
            Doxify - Anonymous Text Sharing Platform<br>
            Page created ${formattedDate}
        </footer>
    </div>

    <script>
        // Add any client-side functionality here
        console.log('Page loaded: ${escapeHtml(page.title)}');
    </script>
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
        body { background: #000; color: #fff; font-family: 'Courier New', monospace; text-align: center; padding: 50px; }
        h1 { color: #f00; margin-bottom: 20px; }
        a { color: #ccc; text-decoration: none; margin: 0 10px; }
        a:hover { color: #fff; }
    </style>
</head>
<body>
    <h1>Internal Server Error</h1>
    <p>Something went wrong while loading the page.</p>
    <div style="margin: 30px 0;">
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
