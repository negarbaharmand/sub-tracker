# Context for coding agents

## Project
Express 4 REST API (ESM, plain JavaScript) with MongoDB/Mongoose, JWT auth, Arcjet rate limiting, and Upstash Workflow + Nodemailer for renewal reminders. Entry point: `app.js`.

## Layout
- `routes/` — Express routers, mounted under `/api/v1` in `app.js`
- `controllers/` — request handlers; errors are passed to `next(error)`
- `models/` — Mongoose schemas
- `middlewares/` — `auth.middleware.js` (sets `req.user`), `error.middleware.js`, `arcjet.middleware.js`
- `config/` — env, DB, Upstash, Nodemailer
- `specs/` — feature specs. **Read the relevant spec before touching code.**

## Rules
1. Work on exactly one task from the spec's task table. Name your branch/worktree after it (`t2-cancel`).
2. Write the tests for your task's acceptance criteria first, run them (expect red), then implement until green.
3. Do not edit files outside your task's scope. If you believe you must, stop and write why in `specs/QUESTIONS.md`.
4. Keep the existing style: ESM imports, async/await, `try { } catch (error) { next(error) }`.
5. Never log email addresses or tokens. Log IDs only.
6. Before declaring done: `npm run lint && npm test` must pass.
7. Do not add TypeScript, change the DB, or add dependencies beyond what the task lists.
