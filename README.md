# CediNote 🧠

A local-first, outliner-based knowledge management app (RemNote alternative) built with React, TypeScript, Tailwind CSS, Express, and SQLite.

---

Features

- Recursive Outliner Mechanics:
  - Enter: Create a new sibling bullet below the active note.
  - Tab: Indent current bullet (nest under the previous sibling).
  - Shift + Tab: Outdent current bullet (move up to the parent's level).
  - Backspace: If the bullet is empty, deletes it and focuses the previous bullet.
  - ↑ / ↓ Arrows: Navigate vertically between visible bullet points.
  - Click on bullet dot to zoom in as the root document (with breadcrumbs navigation).

- Bidirectional [[WikiLinks]] & Backlinks:
  - Type [[ anywhere to search and insert links to other notes.
  - Backlinks panel automatically displays all incoming references across the brain.

- 📑 Document Tabs & Gemini-Style '...' Menu:
  - Top tab bar for open documents with '+' new tab button and close tabs.
  - Three-dot (`...`) dropdown menu on both tabs and sidebar items (just like Gemini chat):
    - ⭐ **Star / Unstar**: Favorite notes with golden star indicator and a dedicated Starred section.
    - ✏️ **Rename**: Quickly rename documents via modal or inline edit.
    - 📋 **Duplicate**: Recursively copy a document and all child bullets.
    - 📤 **Export as Markdown**: One-click download of the note hierarchy as `.md`.
    - ⚡ **Flashcards**: Directly extract flashcards from note.
    - 🤖 **Ask AI**: Direct contextual AI querying.
    - 🗑️ **Delete**: Delete note and its descendants.

- 🤖 CediNote AI Copilot (Google Gemini & Local LLM):
  - Built-in AI assistant drawer accessible via the top navigation bar or note context menu.
  - Connects to either **Google Gemini** (Gemini 2.5 Flash, 1.5 Flash, 1.5 Pro) or **Local LLM** (Ollama, LM Studio, etc. e.g. `llama3.2`, `mistral`, `deepseek-r1`).
  - Grounded in your active document's hierarchy.
  - One-click smart action chips: **Summarize**, **Expand Bullets**, **Flashcards**, and **Key Takeaways**.
  - **Insert into note**: Directly inserts AI-generated points into your document as outliner bullets.
  - Connection tester in AI Settings with instant feedback.
---

Tech Stack

- Frontend: Vite, React 18, TypeScript, Tailwind CSS, Lucide React icons.
- Backend: Node.js, Express.js.
- Database: SQLite (local_brain.db) with nodes, links, and flashcards tables.
- Tooling: concurrently running frontend (port 3000) and backend (port 3001) with a single command.

---

Running Locally

To start both frontend and backend concurrently:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
