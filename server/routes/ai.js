const express = require('express');
const {
  getSettings,
  updateSettings,
  generateAIResponse,
  buildNoteContext,
  callGemini,
  callLocalLLM
} = require('../services/aiService');

function createAIRouter(db) {
  const router = express.Router();

  // 1. Get AI settings
  router.get('/settings', (req, res) => {
    try {
      const settings = getSettings(db);
      res.json({ success: true, settings });
    } catch (err) {
      console.error('Error getting AI settings:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Update AI settings
  router.post('/settings', (req, res) => {
    try {
      const updated = updateSettings(db, req.body);
      res.json({ success: true, settings: updated });
    } catch (err) {
      console.error('Error updating AI settings:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Test Connection
  router.post('/test', async (req, res) => {
    try {
      const config = req.body || {};
      const provider = config.ai_provider || 'gemini';
      let reply = '';

      const testMessages = [
        { role: 'user', content: 'Respond with exactly: "Connection successful!" and nothing else.' }
      ];

      if (provider === 'local') {
        reply = await callLocalLLM({
          endpoint: config.local_endpoint || 'http://localhost:11434',
          model: config.local_model || 'llama3.2',
          messages: testMessages
        });
      } else {
        reply = await callGemini({
          apiKey: config.gemini_api_key || process.env.GEMINI_API_KEY,
          model: config.gemini_model || 'gemini-3.8-flash',
          messages: testMessages
        });
      }

      res.json({ success: true, reply, message: `Connected to ${provider === 'local' ? 'Local LLM' : 'Google Gemini'} successfully!` });
    } catch (err) {
      console.error('AI Connection Test Error:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 4. Chat with AI
  router.post('/chat', async (req, res) => {
    try {
      const { message, history = [], nodeId } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Message cannot be empty' });
      }

      const noteContext = buildNoteContext(db, nodeId);

      const systemPrompt = `You are CediNote AI, an intelligent, concise, and helpful knowledge assistant built into CediNote (a hierarchical outliner and knowledge management app).
You help users brainstorm, organize, summarize, and understand their notes.

Format your responses cleanly using Markdown bullet points or clear short paragraphs. Keep your answers focused and practical.

CURRENT USER NOTES CONTEXT:
${noteContext || '(No note context selected)'}
`;

      const messages = [
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ];

      const reply = await generateAIResponse(db, {
        messages,
        systemPrompt
      });

      res.json({ success: true, reply });
    } catch (err) {
      console.error('AI Chat Error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. One-Click AI Actions (Summarize, Expand, Flashcards)
  router.post('/action', async (req, res) => {
    try {
      const { action, nodeId } = req.body;
      const noteContext = buildNoteContext(db, nodeId);

      if (!noteContext || !noteContext.trim()) {
        return res.status(400).json({ success: false, error: 'The selected document is empty.' });
      }

      let prompt = '';
      if (action === 'summarize') {
        prompt = `Please provide a clean, high-level summary of the following document. Highlight key concepts in bullet points:\n\n${noteContext}`;
      } else if (action === 'expand') {
        prompt = `Suggest 3-5 thoughtful follow-up sub-bullets, related ideas, or questions to explore deeper for this document. Format as bullet points (- item):\n\n${noteContext}`;
      } else if (action === 'flashcards') {
        prompt = `Extract 3 to 5 high-yield flashcard Question & Answer pairs from the following notes in RemNote format (Concept :: Definition). Format each on a new line like: "Question :: Answer":\n\n${noteContext}`;
      } else if (action === 'takeaways') {
        prompt = `Extract the top 3 essential takeaways from these notes:\n\n${noteContext}`;
      } else {
        return res.status(400).json({ success: false, error: 'Unknown action' });
      }

      const systemPrompt = `You are CediNote AI Assistant. Provide direct, helpful markdown output without unnecessary conversational filler.`;

      const reply = await generateAIResponse(db, {
        messages: [{ role: 'user', content: prompt }],
        systemPrompt
      });

      res.json({ success: true, reply, action });
    } catch (err) {
      console.error('AI Action Error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

module.exports = createAIRouter;
