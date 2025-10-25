import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { slug } = req.query;

  if (['create', 'write', 'api', 'public'].includes(slug)) {
    return res.redirect('/');
  }

  if (!slug || slug.length < 3 || slug.length > 50) {
    return res.status(400).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Invalid Page</title>
    <style>body{background:#000;color:#fff;font-family:Arial;text-align:center;padding:50px;}</style>
</head>
<body>
    <h1>Invalid Page</h1>
    <a href="/">Home</a> | <a href="/write">Create Page</a>
</body>
</html>
    `);
  }

  try {
    const cleanSlug = slug.toLowerCase().trim();

    await sql`
      CREATE TABLE IF NOT EXISTS pages (
        slug VARCHAR(50) PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    const result = await sql`SELECT * FROM pages WHERE slug = ${cleanSlug}`;

    if (result.rows.length === 0) {
      return res.status(404).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Page Not Found</title>
    <style>body{background:#000;color:#fff;font-family:Arial;text-align:center;padding:50px;}</style>
</head>
<body>
    <h1>Page Not Found</h1>
    <p>/${cleanSlug}</p>
    <a href="/">Home</a> | <a href="/write?slug=${cleanSlug}">Create this page</a>
</body>
</html>
      `);
    }

    const page = result.rows[0];
    const date = new Date(page.created_at).toLocaleDateString();

    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>${page.title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body{background:#000;color:#fff;font-family:Arial;padding:20px;margin:0;}
        .container{max-width:800px;margin:0 auto;}
        header{border-bottom:1px solid #333;padding:10px 0;margin-bottom:20px;}
        .logo{font-size:24px;font-weight:bold;color:#fff;text-decoration:none;}
        nav a{color:#ccc;text-decoration:none;margin-right:15px;}
        .page-content{white-space:pre-wrap;background:#111;padding:20px;border:1px solid #333;margin:20px 0;}
        .btn{padding:8px 15px;background:#333;color:#fff;text-decoration:none;border:1px solid #333;display:inline-block;margin:10px 0;}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <a href="/" class="logo">DOXIFY</a>
            <nav>
                <a href="/">Home</a>
                <a href="/write">Write</a>
            </nav>
        </header>
        <h1>${page.title}</h1>
        <div style="color:#888;">/${page.slug} • ${date}</div>
        <div class="page-content">${page.content}</div>
        <a href="/" class="btn">Home</a>
    </div>
</body>
</html>
    `);

  } catch (error) {
    res.status(500).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Error</title>
    <style>body{background:#000;color:#fff;font-family:Arial;text-align:center;padding:50px;}</style>
</head>
<body>
    <h1>Error</h1>
    <a href="/">Home</a>
</body>
</html>
    `);
  }
}
