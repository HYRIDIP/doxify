import { readFile } from 'fs/promises';
import { join } from 'path';

export default async function handler(req, res) {
  const { slug } = req.query;

  // Skip system routes
  if (['create', 'write', 'api', 'public'].includes(slug)) {
    return res.redirect('/');
  }

  try {
    const data = await readFile(
      join(process.cwd(), 'pages', `${slug}.json`),
      'utf8'
    );
    
    const page = JSON.parse(data);

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
            /${page.slug} • Created: ${new Date(page.createdAt).toLocaleDateString()}
        </div>
        
        <div class="page-content">${page.content}</div>
        
        <a href="/" class="btn">Back to Home</a>
    </div>
</body>
</html>
    `);

  } catch (error) {
    res.status(404).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Page Not Found - Doxify</title>
    <style>
        body { background: #000; color: #fff; font-family: Arial; text-align: center; padding: 50px; }
        a { color: #ccc; }
    </style>
</head>
<body>
    <h1>Page Not Found</h1>
    <p>The page "${slug}" does not exist.</p>
    <a href="/">← Back to Home</a>
    <br><br>
    <a href="/write">Create this page</a>
</body>
</html>
    `);
  }
}