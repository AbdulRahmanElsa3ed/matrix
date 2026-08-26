import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const DATA_DIR = path.join(process.cwd(), 'data');
  const DATA_FILE = path.join(DATA_DIR, 'app-data.json');

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Middleware
  app.use(express.json({ limit: '15mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // GET /api/data - Load current state from JSON file
  app.get('/api/data', (req, res) => {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        return res.status(404).json({ error: 'No data file found yet' });
      }
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return res.json(parsed);
    } catch (err: any) {
      console.error('Error reading JSON database:', err);
      return res.status(500).json({ error: 'Failed to read data file', details: err.message });
    }
  });

  // POST /api/data - Save current state directly into data/app-data.json
  app.post('/api/data', (req, res) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'Invalid payload' });
      }

      const dataToSave = {
        ...payload,
        lastSaved: new Date().toISOString(),
      };

      // Write with pretty printing for human readability in the project files
      fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
      return res.json({ success: true, savedAt: dataToSave.lastSaved });
    } catch (err: any) {
      console.error('Error writing to JSON database:', err);
      return res.status(500).json({ error: 'Failed to write data file', details: err.message });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/data/**', '**/*.json', '**/dist/**', '**/node_modules/**'],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Production/Dev Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
