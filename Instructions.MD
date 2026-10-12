# CediNote User & Multi-PC Setup Guide

This guide explains how to install, run, and share CediNote on any computer, as well as how to access it across multiple PCs on your local network.

---

System Requirements & Compatibility

- Node.js: Recommended Node.js v22.5.0 or newer (download from https://nodejs.org). Node 22+ includes native SQLite support with zero external C++ compiler or Python build tools required.
- Operating Systems: Compatible with Windows 10/11, macOS (Intel & Apple Silicon M1/M2/M3), and Linux.
- Web Browser: Any modern browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, Safari).

---

Step 1: Setting Up CediNote on a New PC

1. Copy or clone the CediNote folder to your new computer (via USB drive, zip download, OneDrive, or git).

2. Open your terminal (PowerShell, Command Prompt, or Mac/Linux Terminal) and enter the directory:
```bash
cd CediNote
```

3. Install all dependencies across the project:
```bash
npm install
```
(Thanks to npm workspaces, this single command installs root, server, and client packages together cleanly).

4. Start CediNote:
```bash
npm run dev
```

5. Open your web browser to:
http://localhost:3000

The backend will automatically start on port 3001 and initialize your local brain database (server/local_brain.db).

---

Step 2: Accessing CediNote From Other PCs On the Same Network (Wi-Fi / LAN)

Network access is pre-configured out of the box (`host: true` in vite.config.ts). If you have CediNote running on one PC and want to use it from a second laptop, phone, or tablet on the same Wi-Fi:

1. Find the IP address of the PC running CediNote:
- On Windows: In PowerShell or Command Prompt, run:
```bash
ipconfig
```
Look for your Wi-Fi or Ethernet "IPv4 Address" (for example: 192.168.1.105 or 192.168.10.52).

- On Mac / Linux: Run:
```bash
ifconfig | grep "inet "
```

2. Open CediNote from any other device:
Open the browser on the other computer or smartphone and navigate to:
http://<HOST_IP>:3000
Example: http://192.168.1.105:3000

Both devices will see and update the exact same live CediNote workspace in real-time.

---

Step 3: Transferring and Backing Up Your Knowledge Brain Across PCs

All notes, hierarchy, links, and flashcards are stored inside one portable SQLite database file:
server/local_brain.db

Ways to sync across PCs:
- Direct File Copy: Copy server/local_brain.db onto a USB flash drive or send it to your other PC.
- Cloud Sync: Store the CediNote folder inside OneDrive, Google Drive, or Dropbox. Changes sync automatically across your machines.
- Git Version Control: You can commit your notes and sync with a private Git repository.

---

Step 4: Outliner Keyboard Navigation & Flashcards

Keyboard Controls:
- Enter: Create a new sibling bullet directly beneath the current one.
- Tab: Indent current bullet (nests under the sibling above it).
- Shift + Tab: Outdent current bullet (moves back up one level).
- Backspace on empty line: Deletes the bullet and returns focus to previous note.
- Up / Down Arrows: Move cursor between bullets.

Knowledge Links ([[WikiLinks]]):
- Type [[ anywhere while writing to open the note search popup.
- Select an existing note or type a title to create bidirectional backlinks.
- Click the link icon on any note to open the Linked References panel.

Flashcards & Spaced Repetition (RemNote Style):
- Inline format: Type Concept :: Definition on any bullet to make it a flashcard.
- Automatic extraction: Click the Card (⚡) icon on any parent bullet to generate Q&A cards from its child notes.
- Study Session: Click "Study Deck" in the top bar or sidebar. Press Spacebar to flip the card, then press 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy) to schedule review intervals using the SM-2 algorithm.

---

Troubleshooting & Port Conflicts

- Port 3000 or 3001 in use?
Make sure no other instance is running. You can stop previous processes in PowerShell using:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000, 3001).OwningProcess | Stop-Process -Force
```
- Node Version Check:
Run `node -v` in your terminal. If your Node is below v22, download the current LTS version from https://nodejs.org for zero-compile SQLite support.
