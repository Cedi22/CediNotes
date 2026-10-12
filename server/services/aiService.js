/**
 * AI Service for CediNote
 * Provides unified interface to Google Gemini API and Local LLM (Ollama, LM Studio, etc.)
 */

function getSettings(db) {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {
    ai_provider: 'gemini',
    gemini_api_key: process.env.GEMINI_API_KEY || '',
    gemini_model: 'gemini-3.8-flash',
    local_endpoint: 'http://localhost:11434',
    local_model: 'llama3.2'
  };

  for (const row of rows) {
    settings[row.key] = row.value;
  }

  // Automatically upgrade legacy gemini-2.5-flash to gemini-3.8-flash
  if (settings.gemini_model === 'gemini-2.5-flash') {
    settings.gemini_model = 'gemini-3.8-flash';
  }

  // Fallback if environment variable is set
  if (!settings.gemini_api_key && process.env.GEMINI_API_KEY) {
    settings.gemini_api_key = process.env.GEMINI_API_KEY;
  }

  return settings;
}

function updateSettings(db, newSettings) {
  const allowedKeys = ['ai_provider', 'gemini_api_key', 'gemini_model', 'local_endpoint', 'local_model'];
  for (const key of allowedKeys) {
    if (newSettings[key] !== undefined) {
      let val = String(newSettings[key]);
      if (key === 'gemini_model' && val === 'gemini-2.5-flash') {
        val = 'gemini-3.8-flash';
      }
      db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(key, val);
    }
  }
  return getSettings(db);
}

/**
 * Call Google Gemini REST API with retry and extended timeout
 */
async function callGemini({ apiKey, model, messages, systemPrompt }, maxRetries = 1) {
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please enter your API key in AI Settings.');
  }

  let cleanModel = model || 'gemini-3.8-flash';
  if (cleanModel === 'gemini-2.5-flash') {
    cleanModel = 'gemini-3.8-flash';
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;

  // Format messages into Gemini format
  const contents = [];
  for (const msg of messages) {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    contents.push({
      role,
      parts: [{ text: msg.content }]
    });
  }

  // Ensure contents starts with user and does not repeat consecutive identical roles
  const validContents = [];
  let lastRole = null;
  for (const c of contents) {
    if (c.role === lastRole) {
      // Append text to previous turn
      validContents[validContents.length - 1].parts[0].text += '\n\n' + c.parts[0].text;
    } else {
      validContents.push(c);
      lastRole = c.role;
    }
  }

  if (validContents.length === 0) {
    validContents.push({ role: 'user', parts: [{ text: 'Hello' }] });
  }

  const payload = {
    contents: validContents
  };

  if (systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 90-second timeout to accommodate peak API latency and larger documents
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(90000)
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error?.message || `Gemini API returned status ${res.status}`;
        throw new Error(errMsg);
      }

      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) {
        throw new Error('Gemini returned an empty response.');
      }

      return reply;
    } catch (err) {
      lastError = err;
      const isTimeout = err.name === 'TimeoutError' || (err.message && err.message.toLowerCase().includes('timeout'));
      const isNetwork = err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND';

      if (attempt < maxRetries && (isTimeout || isNetwork)) {
        console.warn(`[AI Gemini] Attempt ${attempt + 1} failed (${err.message}). Retrying in 1.5s...`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }
      break;
    }
  }

  if (lastError) {
    if (lastError.name === 'TimeoutError' || (lastError.message && lastError.message.toLowerCase().includes('timeout'))) {
      throw new Error('The AI request timed out. Google Gemini may be experiencing network latency. Please try again.');
    }
    throw lastError;
  }
}

/**
 * Call Local LLM (Ollama, LM Studio, LocalAI)
 */
async function callLocalLLM({ endpoint, model, messages, systemPrompt }) {
  const base = (endpoint || 'http://localhost:11434').replace(/\/+$/, '');
  const cleanModel = model || 'llama3.2';

  const fullMessages = [];
  if (systemPrompt) {
    fullMessages.push({ role: 'system', content: systemPrompt });
  }
  for (const msg of messages) {
    fullMessages.push({
      role: msg.role === 'model' ? 'assistant' : msg.role,
      content: msg.content
    });
  }

  // Strategy 1: Try OpenAI compatible /v1/chat/completions (supported by Ollama, LM Studio, etc.)
  let targetUrl = `${base}/v1/chat/completions`;
  if (base.endsWith('/v1')) {
    targetUrl = `${base}/chat/completions`;
  } else if (base.includes('/chat/completions')) {
    targetUrl = base;
  }

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: cleanModel,
        messages: fullMessages,
        stream: false
      }),
      signal: AbortSignal.timeout(120000)
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return content;
    }
  } catch (err) {
    if (err.name === 'TimeoutError' || (err.message && err.message.toLowerCase().includes('timeout'))) {
      throw new Error(`Local LLM timed out after 120s at ${base}. Model might still be loading or generating.`);
    }
    // If OpenAI route fails or port refused, try Ollama native /api/chat
  }

  // Strategy 2: Try Ollama native /api/chat
  const ollamaUrl = `${base}/api/chat`;
  try {
    const res = await fetch(ollamaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: cleanModel,
        messages: fullMessages,
        stream: false
      }),
      signal: AbortSignal.timeout(120000)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Local LLM returned ${res.status}: ${txt}`);
    }

    const data = await res.json();
    if (data.message && data.message.content) {
      return data.message.content;
    }
  } catch (err) {
    if (err.name === 'TimeoutError' || (err.message && err.message.toLowerCase().includes('timeout'))) {
      throw new Error(`Local LLM timed out after 120s at ${base}.`);
    }
    throw new Error(`Failed to connect to Local LLM at ${base}: ${err.message}. Ensure Ollama or LM Studio is running.`);
  }

  throw new Error('Local LLM did not return a valid message.');
}

/**
 * Unified dispatch based on current settings
 */
async function generateAIResponse(db, { messages, systemPrompt, customConfig }) {
  const settings = customConfig || getSettings(db);
  const provider = settings.ai_provider || 'gemini';

  if (provider === 'local') {
    return await callLocalLLM({
      endpoint: settings.local_endpoint,
      model: settings.local_model,
      messages,
      systemPrompt
    });
  } else {
    return await callGemini({
      apiKey: settings.gemini_api_key,
      model: settings.gemini_model,
      messages,
      systemPrompt
    });
  }
}

/**
 * Build contextual note tree representation
 */
function buildNoteContext(db, targetNodeId) {
  if (!targetNodeId) {
    // Grab top root notes as general context
    const roots = db.prepare('SELECT id, content FROM nodes WHERE parent_id IS NULL LIMIT 10').all();
    return roots.map(r => `- ${r.content}`).join('\n');
  }

  const targetNode = db.prepare('SELECT * FROM nodes WHERE id = ?').get(targetNodeId);
  if (!targetNode) return '';

  // Get descendants
  function getDescendants(parentId, depth = 0) {
    const indent = '  '.repeat(depth);
    const children = db.prepare('SELECT * FROM nodes WHERE parent_id = ? ORDER BY sort_order ASC').all(parentId);
    let text = '';
    for (const child of children) {
      text += `${indent}- ${child.content}\n`;
      text += getDescendants(child.id, depth + 1);
    }
    return text;
  }

  let result = `Current Document: "${targetNode.content}"\n`;
  result += `Content hierarchy:\n`;
  result += getDescendants(targetNode.id, 1);
  return result;
}

module.exports = {
  getSettings,
  updateSettings,
  generateAIResponse,
  buildNoteContext,
  callGemini,
  callLocalLLM
};
