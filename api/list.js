import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export default async function handler(req, res) {
  try {
    const files = await readdir(join(process.cwd(), 'pages'));
    const pages = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const data = await readFile(join(process.cwd(), 'pages', file), 'utf8');
          pages.push(JSON.parse(data));
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
        }
      }
    }

    // Sort by creation date (newest first)
    pages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(pages.slice(0, 20));
  } catch (error) {
    // If pages directory doesn't exist, return empty array
    res.json([]);
  }
}