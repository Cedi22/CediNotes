const path = require('path');
const fs = require('fs');

let dbInstance;

function getDatabase() {
  if (dbInstance) return dbInstance;

  const dbPath = path.join(__dirname, 'local_brain.db');

  // 1. Try native node:sqlite DatabaseSync first (Node 22+, zero native build dependencies)
  try {
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
    
    dbInstance = {
      exec: (sql) => db.exec(sql),
      prepare: (sql) => {
        const stmt = db.prepare(sql);
        return {
          run: (...params) => {
            const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
            return stmt.run(...flattened);
          },
          get: (...params) => {
            const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
            return stmt.get(...flattened);
          },
          all: (...params) => {
            const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
            return stmt.all(...flattened);
          }
        };
      },
      close: () => db.close()
    };
    console.log('[Database] Connected using native node:sqlite DatabaseSync at:', dbPath);
  } catch (nativeErr) {
    // 2. Fallback to better-sqlite3 if compiled natively on this PC
    try {
      const BetterSqlite3 = require('better-sqlite3');
      const db = new BetterSqlite3(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      dbInstance = db;
      console.log('[Database] Connected using better-sqlite3 at:', dbPath);
    } catch (betterErr) {
      console.error('[Database Error] Neither node:sqlite nor better-sqlite3 could be loaded.');
      console.error('Recommended solution: Use Node.js v22.5.0 or newer for built-in zero-dependency SQLite support.');
      throw new Error('SQLite driver unavailable. Please use Node.js v22+ or install C++ build tools for better-sqlite3.');
    }
  }

  initSchema(dbInstance);
  seedInitialData(dbInstance);

  return dbInstance;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      parent_id TEXT REFERENCES nodes(id) ON DELETE CASCADE,
      content TEXT NOT NULL DEFAULT '',
      is_expanded INTEGER NOT NULL DEFAULT 1,
      sort_order REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(parent_id);
    CREATE INDEX IF NOT EXISTS idx_nodes_sort ON nodes(parent_id, sort_order);

    CREATE TABLE IF NOT EXISTS links (
      source_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      target_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (source_id, target_id)
    );

    CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_id);

    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,
      node_id TEXT REFERENCES nodes(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      card_type TEXT NOT NULL DEFAULT 'concept',
      interval INTEGER NOT NULL DEFAULT 1,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      repetitions INTEGER NOT NULL DEFAULT 0,
      due_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_flashcards_due ON flashcards(due_date);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Ensure is_starred column exists on nodes table
  try {
    db.exec(`ALTER TABLE nodes ADD COLUMN is_starred INTEGER NOT NULL DEFAULT 0;`);
  } catch (err) {
    // Column already exists, ignore
  }

  // Populate default AI settings if not present
  const defaultSettings = [
    ['ai_provider', 'gemini'],
    ['gemini_api_key', process.env.GEMINI_API_KEY || ''],
    ['gemini_model', 'gemini-3.8-flash'],
    ['local_endpoint', 'http://localhost:11434'],
    ['local_model', 'llama3.2']
  ];

  for (const [key, val] of defaultSettings) {
    try {
      db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run(key, val);
    } catch (e) {
      // Ignore
    }
  }
}

function seedInitialData(db) {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM nodes').get();
  if (count && count.cnt > 0) return;

  const { v4: uuidv4 } = require('uuid');

  const rootId = uuidv4();
  const gettingStartedId = uuidv4();
  const keyboardId = uuidv4();
  const enterId = uuidv4();
  const tabId = uuidv4();
  const shiftTabId = uuidv4();
  const backspaceId = uuidv4();
  const wikiLinkId = uuidv4();
  const flashcardDemoId = uuidv4();
  const conceptRemId = uuidv4();

  const insertNode = db.prepare(`
    INSERT INTO nodes (id, parent_id, content, is_expanded, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertNode.run(rootId, null, '🧠 Welcome to CediNote Brain', 1, 100);
  insertNode.run(gettingStartedId, rootId, 'CediNote is a local-first, hierarchical outliner with [[WikiLinks]] & Spaced Repetition', 1, 100);
  
  insertNode.run(keyboardId, rootId, '⌨️ Core Outliner Keyboard Shortcuts:', 1, 200);
  insertNode.run(enterId, keyboardId, 'Press Enter: Create a new sibling bullet below the active note', 1, 100);
  insertNode.run(tabId, keyboardId, 'Press Tab: Indent active bullet (nested under previous sibling)', 1, 200);
  insertNode.run(shiftTabId, keyboardId, 'Press Shift+Tab: Outdent active bullet (move one level up)', 1, 300);
  insertNode.run(backspaceId, keyboardId, 'Press Backspace on empty line: Delete bullet and return to previous node', 1, 400);

  insertNode.run(wikiLinkId, rootId, '🔗 Bidirectional Links: Type [[WikiLinks]] anywhere to link notes and view backlinks', 1, 300);

  insertNode.run(flashcardDemoId, rootId, '⚡ Flashcards & Spaced Repetition:', 1, 400);
  insertNode.run(conceptRemId, flashcardDemoId, 'RemNote :: A hierarchical outliner with integrated spaced repetition flashcards', 1, 100);

  // Link between gettingStartedId and wikiLinkId
  const insertLink = db.prepare('INSERT OR IGNORE INTO links (source_id, target_id) VALUES (?, ?)');
  insertLink.run(gettingStartedId, wikiLinkId);

  // Create initial flashcard for conceptRemId
  const insertCard = db.prepare(`
    INSERT INTO flashcards (id, node_id, question, answer, card_type)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertCard.run(
    uuidv4(),
    conceptRemId,
    'RemNote',
    'A hierarchical outliner with integrated spaced repetition flashcards',
    'concept'
  );

  console.log('[Database] Seeded initial CediNote knowledge brain nodes successfully.');
}

module.exports = {
  getDatabase
};
