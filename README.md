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

- ⚡ Automated Flashcard Generation & Spaced Repetition (SM-2):
  - Click the Card (⚡) button on any note to generate Q&A flashcard pairs from the note and its children.
  - Interactive Study Session Deck with 3D card flips (Spacebar) and SM-2 ratings:
    - [1] Again
    - [2] Hard
    - [3] Good
    - [4] Easy

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
