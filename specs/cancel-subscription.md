# Spec: Cancel & delete subscription

Status: draft · Owner: Negar

## 1. Goal

Let a user stop a subscription so that (a) it no longer counts as active and (b) **no further reminder emails are sent**. Today the `cancel` and `delete` routes are stubs, and the reminder workflow reads the subscription once at start, so a cancel mid-workflow is ignored.

## 2. Actors

| Actor | Type | Touches the system via |
|---|---|---|
| User | human | `PUT /api/v1/subscriptions/:id/cancel`, `DELETE /api/v1/subscriptions/:id` with Bearer JWT |
| Reminder Workflow | system (Upstash) | `controllers/workflow.controller.js` — wakes up before each email |
| Arcjet | external | rate-limits every request (unchanged) |

## 3. Use cases

- UC-1 (User) I cancel a subscription I no longer want, so it shows as `cancelled` and I stop getting reminders.
- UC-2 (User) I delete a subscription I added by mistake, so it disappears entirely.
- UC-3 (Reminder Workflow) Before every email I re-check the subscription; if it is not `active` any more, I stop.
- UC-4 (User) I must not be able to cancel or delete someone else's subscription.

## 4. Features

### F-1 Cancel subscription
- Route: `PUT /api/v1/subscriptions/:id/cancel` → `authorize` middleware → `cancelSubscription` controller.
- Effect: `status = 'cancelled'`. No other field changes.
- Response: `200 { success: true, data: subscription }`.

### F-2 Delete subscription
- Route: `DELETE /api/v1/subscriptions/:id` → `authorize` → `deleteSubscription`.
- Effect: document removed.
- Response: `204` with empty body.

### F-3 Workflow re-checks status before each send
- In `workflow.controller.js`, inside `triggerReminder`, re-fetch the subscription by id and return early if `status !== 'active'` or document is gone.

### F-4 Shared ownership guard
- Helper `findOwnedSubscription(id, userId)` in `controllers/subscription.controller.js` used by F-1 and F-2.
- Also replace the broken check in `getUserSubscriptions` (`req.user.id !== req.user.id`) with `req.params.id !== req.user.id`.

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-1 | an active subscription owned by me | I `PUT /:id/cancel` | 200, `status === 'cancelled'`, `renewalDate` unchanged |
| AC-2 | a subscription already `cancelled` | I cancel it again | 200, still `cancelled` (idempotent) |
| AC-3 | a subscription owned by another user | I cancel or delete it | 403, document unchanged |
| AC-4 | a non-existent id | I cancel or delete it | 404 |
| AC-5 | an invalid ObjectId (`abc`) | I cancel or delete it | 400 |
| AC-6 | no Bearer token | any of these routes | 401 |
| AC-7 | a subscription I own | I `DELETE /:id` | 204, then `GET /user/:myId` no longer lists it |
| AC-8 | a workflow that already started for subscription S | S is cancelled, then the next reminder date arrives | `sendReminderEmail` is **not** called |
| AC-9 | a workflow for S | S is deleted mid-workflow | workflow exits without throwing |
| AC-10 | `GET /user/:id` with another user's id | — | 403 |

## 6. Out of scope

Re-activating a cancelled subscription; cascading cleanup of Upstash runs; UI.

## 7. Constraints

- Keep the existing Express 4 + Mongoose + ESM style; no TypeScript migration in this slice.
- Errors go through `middlewares/error.middleware.js` — set `error.statusCode`, call `next(error)`.
- Do not log user emails.

## 8. Tasks (agent-sized, each verifiable alone)

| Task | Depends on | Done when | Group |
|---|---|---|---|
| T0 Test harness: add `vitest`, `supertest`, `mongodb-memory-server`; `npm test` runs one smoke test against `app.js` | — | `npm test` green | A |
| T1 `findOwnedSubscription` helper + fix `getUserSubscriptions` check (F-4) | T0 | AC-3, AC-4, AC-5, AC-10 tests pass | B |
| T2 `cancelSubscription` controller + route (F-1) | T1 | AC-1, AC-2, AC-6 pass | C |
| T3 `deleteSubscription` controller + route (F-2) | T1 | AC-7 pass | C |
| T4 Workflow re-check before each send (F-3), `sendReminderEmail` mocked | T0 | AC-8, AC-9 pass | B |
| T5 README endpoint table updated | T2, T3 | — | D |

Group B (T1 + T4) and group C (T2 + T3) are independent pairs — run them as parallel agents in separate worktrees.

## 9. Open questions

- Should cancel also set `renewalDate` to `null`? (Decision: no, keep history.)
