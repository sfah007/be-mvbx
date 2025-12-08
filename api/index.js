import express from 'express';
import cors from 'cors';
import { getTrending, getLatest, search, getStream } from '../lib/dramabox.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'DramaBox API',
    version: '1.0.0',
    endpoints: {
      trending: 'GET /api/dramabox/trending',
      latest: 'GET /api/dramabox/latest',
      search: 'GET /api/dramabox/search?query=...',
      stream: 'GET /api/dramabox/stream?bookId=...&episode=...'
    }
  });
});

app.get('/api/dramabox/trending', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await getTrending(page);
    res.json(data);
  } catch (error) {
    console.error('Trending error:', error.message);
    res.status(500).json({ error: 'Failed to fetch trending', message: error.message });
  }
});

app.get('/api/dramabox/latest', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await getLatest(page);
    res.json(data);
  } catch (error) {
    console.error('Latest error:', error.message);
    res.status(500).json({ error: 'Failed to fetch latest', message: error.message });
  }
});

app.get('/api/dramabox/search', async (req, res) => {
  try {
    const query = req.query.query || '';
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const data = await search(query);
    res.json(data);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Failed to search', message: error.message });
  }
});

app.get('/api/dramabox/stream', async (req, res) => {
  try {
    const bookId = req.query.bookId || '';
    const episode = parseInt(req.query.episode) || 1;
    
    if (!bookId) {
      return res.status(400).json({ error: 'bookId parameter is required' });
    }
    
    const data = await getStream(bookId, episode);
    
    if (!data) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Stream error:', error.message);
    res.status(500).json({ error: 'Failed to get stream', message: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`DramaBox API running on http://localhost:${PORT}`);
  });
}

export default app;
