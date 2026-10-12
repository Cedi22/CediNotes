const express = require('express');
const cors = require('cors');
const { getDatabase } = require('./db');
const createNodesRouter = require('./routes/nodes');
const createFlashcardsRouter = require('./routes/flashcards');
const createAIRouter = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Database
const db = getDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/nodes', createNodesRouter(db));
app.use('/api/flashcards', createFlashcardsRouter(db));
app.use('/api/ai', createAIRouter(db));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'CediNote Backend',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 CediNote Backend API server listening on http://localhost:${PORT}`);
});
