const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const PAGES_DIR = path.join(__dirname, 'pages');

// Создаем директорию для страниц если не существует
async function ensurePagesDir() {
    try {
        await fs.access(PAGES_DIR);
    } catch {
        await fs.mkdir(PAGES_DIR, { recursive: true });
    }
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// Главная страница
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Doxify</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
        body { background: #000; color: #fff; line-height: 1.4; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        header { border-bottom: 1px solid #333; padding: 10px 0; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #fff; text-decoration: none; }
        nav a { color: #ccc; text-decoration: none; margin-right: 15px; }
        nav a:hover { color: #fff; }
        .search-box { margin: 20px 0; }
        .search-box input { width: 300px; padding: 8px; background: #111; border: 1px solid #333; color: #fff; }
        .search-box button { padding: 8px 15px; background: #333; border: 1px solid #333; color: #fff; cursor: pointer; }
        .btn { display: inline-block; padding: 8px 15px; background: #333; color: #fff; text-decoration: none; border: 1px solid #333; margin: 10px 0; }
        .btn:hover { background: #444; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; color: #ccc; }
        .form-group input, .form-group textarea { width: 100%; padding: 8px; background: #111; border: 1px solid #333; color: #fff; }
        .form-group textarea { height: 300px; resize: vertical; }
        .page-content { white-space: pre-wrap; background: #111; padding: 20px; border: 1px solid #333; margin: 20px 0; }
        .error { color: #f00; margin: 5px 0; }
        .success { color: #0f0; margin: 5px 0; }
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

        <div class="search-box">
            <form action="/search" method="GET">
                <input type="text" name="q" placeholder="Search posts..." value="${req.query.q || ''}">
                <button type="submit">Search</button>
            </form>
        </div>
        
        <a href="/write" class="btn">Write Dox</a>

        <div style="margin: 20px 0;">
            ${req.query.q ? `<h3>Search results for: "${req.query.q}"</h3>` : '<h3>Recent Pages</h3>'}
            ${await getPagesList(req.query.q)}
        </div>
    </div>

    <script>
        // Client-side search enhancement
        document.addEventListener('DOMContentLoaded', function() {
            const searchForm = document.querySelector('form');
            const searchInput = document.querySelector('input[name="q"]');
            
            searchForm.addEventListener('submit', function(e) {
                if (!searchInput.value.trim()) {
                    e.preventDefault();
                    window.location.href = '/';
                }
            });
        });
    </script>
</body>
</html>
    `);
});

// Страница создания
app.get('/write', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Write Dox - Doxify</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
        body { background: #000; color: #fff; line-height: 1.4; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        header { border-bottom: 1px solid #333; padding: 10px 0; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #fff; text-decoration: none; }
        nav a { color: #ccc; text-decoration: none; margin-right: 15px; }
        nav a:hover { color: #fff; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; color: #ccc; }
        .form-group input, .form-group textarea { width: 100%; padding: 8px; background: #111; border: 1px solid #333; color: #fff; }
        .form-group textarea { height: 300px; resize: vertical; }
        .btn { display: inline-block; padding: 8px 15px; background: #333; color: #fff; text-decoration: none; border: 1px solid #333; margin: 10px 0; cursor: pointer; }
        .btn:hover { background: #444; }
        .error { color: #f00; margin: 5px 0; }
        .url-preview { background: #111; padding: 10px; border: 1px solid #333; margin: 10px 0; font-family: monospace; color: #0f0; }
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

        <h2>Create New Dox</h2>
        
        <form action="/create" method="POST">
            <div class="form-group">
                <label for="slug">Page URL (doxify.cc/your-page-name)</label>
                <input type="text" id="slug" name="slug" required 
                       pattern="[a-zA-Z0-9-]{3,50}" 
                       title="Only letters, numbers and hyphens (3-50 characters)"
                       placeholder="my-page-name">
                <div class="error">${req.query.error || ''}</div>
            </div>
            
            <div class="form-group">
                <label for="title">Title</label>
                <input type="text" id="title" name="title" required placeholder="Page title">
            </div>
            
            <div class="form-group">
                <label for="content">Content</label>
                <textarea id="content" name="content" required placeholder="Page content"></textarea>
            </div>
            
            <div class="url-preview" id="urlPreview">
                URL: https://doxify.cc/<span id="slugPreview">your-page-name</span>
            </div>
            
            <button type="submit" class="btn">Create Page</button>
        </form>
    </div>

    <script>
        document.getElementById('slug').addEventListener('input', function() {
            const slug = this.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
            document.getElementById('slugPreview').textContent = slug || 'your-page-name';
        });
    </script>
</body>
</html>
    `);
});

// Создание страницы
app.post('/create', async (req, res) => {
    const { slug, title, content } = req.body;
    
    // Валидация
    if (!slug || !title || !content) {
        return res.redirect('/write?error=All fields are required');
    }
    
    if (!/^[a-zA-Z0-9-]{3,50}$/.test(slug)) {
        return res.redirect('/write?error=Invalid page name. Use only letters, numbers and hyphens (3-50 characters)');
    }
    
    const cleanSlug = slug.toLowerCase();
    const filePath = path.join(PAGES_DIR, `${cleanSlug}.json`);
    
    try {
        // Проверяем существование файла
        await fs.access(filePath);
        return res.redirect('/write?error=Page name already exists');
    } catch {
        // Файл не существует, создаем новый
        const pageData = {
            slug: cleanSlug,
            title: title,
            content: content,
            createdAt: new Date().toISOString()
        };
        
        await fs.writeFile(filePath, JSON.stringify(pageData, null, 2));
        return res.redirect(`/${cleanSlug}`);
    }
});

// Просмотр страницы
app.get('/:slug', async (req, res) => {
    const slug = req.params.slug.toLowerCase();
    
    // Исключаем системные пути
    if (['write', 'create', 'search', 'pages'].includes(slug)) {
        return res.redirect('/');
    }
    
    const filePath = path.join(PAGES_DIR, `${slug}.json`);
    
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const page = JSON.parse(data);
        
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
});

// Поиск
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.redirect('/');
    }
    res.redirect(`/?q=${encodeURIComponent(query)}`);
});

// Вспомогательная функция для получения списка страниц
async function getPagesList(searchQuery = '') {
    try {
        const files = await fs.readdir(PAGES_DIR);
        const pages = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const data = await fs.readFile(path.join(PAGES_DIR, file), 'utf8');
                const page = JSON.parse(data);
                
                if (!searchQuery || 
                    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    page.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    page.slug.toLowerCase().includes(searchQuery.toLowerCase())) {
                    pages.push(page);
                }
            }
        }
        
        // Сортируем по дате создания (новые сначала)
        pages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (pages.length === 0) {
            return searchQuery ? 
                '<p>No pages found matching your search.</p>' : 
                '<p>No pages yet. <a href="/write">Create the first one!</a></p>';
        }
        
        return pages.slice(0, 20).map(page => `
            <div style="border: 1px solid #333; padding: 15px; margin-bottom: 10px; background: #111;">
                <div style="font-weight: bold;">
                    <a href="/${page.slug}" style="color: #fff; text-decoration: none;">${page.title}</a>
                </div>
                <div style="color: #888; font-size: 12px; margin: 5px 0;">/${page.slug}</div>
                <div style="color: #ccc; font-size: 13px;">
                    ${page.content.length > 200 ? page.content.substring(0, 200) + '...' : page.content}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        return '<p>No pages yet. <a href="/write">Create the first one!</a></p>';
    }
}

// Запуск сервера
async function startServer() {
    await ensurePagesDir();
    app.listen(PORT, () => {
        console.log(`Doxify running on http://localhost:${PORT}`);
    });
}

startServer();
