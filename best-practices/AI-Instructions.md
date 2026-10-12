# Antigravity Agent Guidelines & Best Practices

This document outlines core principles, operational constraints, and architectural standards for Antigravity AI coding agents and automated contributors collaborating on this codebase.

---

## 1. Security & Secret Protection (Strict Enforcement)

- **Do Not Inspect Secrets:** NEVER read, dump, query, or display credentials, API keys, authentication tokens, passwords, or private secrets in chat outputs or tool logs.
- **Database Safeguards:**
  - Do NOT query SQLite databases, credential tables, or `.db` / `.sqlite` files containing private credentials or keys.
  - When inspecting schema or debugging, request confirmation or use synthetic/dummy data.
  - Ensure sensitive columns or tables are never included in diagnostic scripts or logs.
- **Environment Isolation:**
  - Never display the contents of `.env`, `.env.local`, or secret manager outputs in terminal logs or conversation responses.
  - Reference environment variables abstractly by key name (e.g., `process.env.GEMINI_API_KEY`) without echoing values.

---

## 2. Code Quality & Architecture

- **Maintainability First:**
  - Write modular, clean, readable code with explicit type annotations where applicable.
  - Avoid monolithic files, tight coupling, and duplicate logic.
- **Follow Idiomatic Patterns:**
  - Adhere to established project patterns and conventions (framework style, naming conventions, directory structure).
  - Respect existing architectural boundaries between client, server, and database layers.
- **Error Handling & Resilience:**
  - Implement comprehensive error boundaries, graceful fallbacks, and descriptive user-facing error logs.
  - Never leak stack traces, database schemas, or sensitive context in error payloads.
- **Minimal Footprint:**
  - Only modify files directly relevant to the current user objective.
  - Do not reformat, reorganize, or alter unrelated files without explicit instructions.

---

## 3. Tool Usage & Execution Safety

- **Validate Before Executing:**
  - Carefully review commands before running them in the shell.
  - Ensure non-destructive flags are used (e.g., avoid `rm -rf`, force-pushing, or mass overwrites).
- **Dry-Run & Verification:**
  - Always run tests and type checks (`npm test`, `pytest`, `tsc --noEmit`, `npm run build`, etc.) before concluding tasks to verify that changes introduce zero regressions.
- **Git Hygiene:**
  - Do not stage or commit credentials, `.env` files, large binary blobs, or temporary scratch files.
  - Verify `.gitignore` rules are respected at all times.

---

## 4. Communication & Context Management

- **Be Direct & Factual:**
  - Summarize technical changes concisely: what was modified, why, and how it was verified.
- **State Assumptions Clearly:**
  - If requirements or paths are ambiguous, state assumptions or ask clarifying questions before performing irreversible mutations.
