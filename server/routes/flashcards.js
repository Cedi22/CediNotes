const express = require('express');
const { generateFlashcardsForNode, processReview } = require('../services/flashcardService');

function createFlashcardsRouter(db) {
  const router = express.Router();

  // 1. Generate flashcards for a specific node
  router.post('/generate/:nodeId', (req, res) => {
    try {
      const cards = generateFlashcardsForNode(db, req.params.nodeId);
      res.json({ success: true, count: cards.length, cards });
    } catch (err) {
      console.error('Error generating flashcards:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Get flashcards due for study session
  router.get('/due', (req, res) => {
    try {
      const cards = db.prepare(`
        SELECT f.*, n.content as node_content
        FROM flashcards f
        LEFT JOIN nodes n ON f.node_id = n.id
        WHERE f.due_date <= datetime('now')
        ORDER BY f.due_date ASC
      `).all();

      res.json({ success: true, count: cards.length, cards });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Get all flashcards
  router.get('/all', (req, res) => {
    try {
      const cards = db.prepare(`
        SELECT f.*, n.content as node_content
        FROM flashcards f
        LEFT JOIN nodes n ON f.node_id = n.id
        ORDER BY f.created_at DESC
      `).all();
      res.json({ success: true, count: cards.length, cards });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Review flashcard (SM-2)
  router.post('/:id/review', (req, res) => {
    try {
      const rating = Number(req.body.rating) || 3;
      const result = processReview(db, req.params.id, rating);
      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Deck stats
  router.get('/stats', (req, res) => {
    try {
      const total = db.prepare('SELECT COUNT(*) as count FROM flashcards').get().count;
      const due = db.prepare("SELECT COUNT(*) as count FROM flashcards WHERE due_date <= datetime('now')").get().count;
      const mastered = db.prepare('SELECT COUNT(*) as count FROM flashcards WHERE repetitions >= 3').get().count;
      res.json({
        success: true,
        stats: {
          totalCards: total,
          dueCards: due,
          masteredCards: mastered
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

module.exports = createFlashcardsRouter;
