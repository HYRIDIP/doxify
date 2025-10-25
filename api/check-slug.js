import { readdir } from 'fs/promises';
import { join } from 'path';

export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'Slug parameter required' });
  }

  try {
    const files = await readdir(join(process.cwd(), 'pages'));
    const exists = files.includes(`${slug.toLowerCase()}.json`);
    
    res.json({ available: !exists });
  } catch (error) {
    // If pages directory doesn't exist, slug is available
    res.json({ available: true });
  }
}