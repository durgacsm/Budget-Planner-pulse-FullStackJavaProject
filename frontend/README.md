# Pulse · Budget Planner: React frontend

Personal Finance & Budget Planner UI (React + Vite). Runs on your laptop right now with sample data,
and connects to your Spring Boot + MySQL backend later by flipping one setting.

## Run it locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173 and click **Explore with demo data** (or sign in with `demo@example.com` / `demo1234`).
You can also create your own account; in demo mode everything is stored in your browser's localStorage.

## What's inside

| Screen | Features |
| --- | --- |
| Sign in / Create account | Animated aurora background, validation, show/hide password, JWT stored on sign-in, protected routes |
| Dashboard | **Safe-to-spend per day**, budget runway with a "today" marker, **Money Health score (0-100)**, income/expense/savings counters, 6-month area chart, category donut, budget alerts, **spend heatmap calendar** with no-spend streak, **what-if savings simulator**, recent activity, month switcher |
| Transactions | Add / edit / delete, date presets and custom range, type + category filters, search, grouped by day, CSV export, totals for current filters |
| Budgets | Monthly limit per category, animated progress meters, alerts at 80% and 100%, inline editing, copy last month's budgets, unbudgeted spending list |
| Goals | Savings goals with progress rings, quick "+" top-ups, monthly target from deadline, **confetti** when a goal is reached |

Unique touches: **Ctrl/Cmd + K command palette** with natural-language quick add (`swiggy 450`, `+50000 salary`),
cursor-follow card glow, animated number counters, animated page transitions, light/dark theme,
and a mobile bottom tab bar with a centre add button.

> Goals are stored in the browser (localStorage) in both modes, because the API table below has no goals endpoint yet.

## Connecting your Spring Boot backend later

1. Edit `.env`:
   ```
   VITE_USE_MOCK=false
   VITE_API_URL=http://localhost:8080/api
   ```
2. Restart `npm run dev`.
3. Enable CORS in Spring Boot for `http://localhost:5173` (and your Render URL later).

All backend calls live in `src/api/real.js`. The UI expects these endpoints (JSON, JWT in the `Authorization: Bearer <token>` header):

| Method | Path | Body / query | Returns |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | `{ name, email, password }` | `{ token, user: { name, email } }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user: { name, email } }` |
| GET | `/api/transactions` | `?from=yyyy-MM-dd&to=yyyy-MM-dd&type=INCOME\|EXPENSE&category=` (all optional) | array of transactions |
| POST | `/api/transactions` | `{ type, amount, category, date, description }` | created transaction |
| PUT | `/api/transactions/{id}` | same as above | updated transaction |
| DELETE | `/api/transactions/{id}` | | 204 |
| GET | `/api/budgets` | `?month=yyyy-MM` | array of budgets |
| PUT | `/api/budgets` | `{ category, limit, month }` (create or update) | saved budget |
| DELETE | `/api/budgets/{id}` | | 204 |

Shapes:

```json
// Transaction
{ "id": 12, "type": "EXPENSE", "amount": 1499.00, "category": "Groceries", "date": "2026-10-05", "description": "DMart" }
// Budget
{ "id": 3, "category": "Groceries", "limit": 9000, "month": "2026-10" }
```

Errors should return `{ "message": "..." }` with a proper status code. The UI shows that message, and a `401` signs the user out.

Today the dashboard totals and charts are computed in the browser from the transaction list. When your backend is ready you can move
that to SQL aggregation (`GROUP BY category`, `GROUP BY month`) and swap the calls in `Dashboard.jsx`.

## Deploying to Render (static site)

1. Push this folder to GitHub.
2. In Render: **New → Static Site**, pick the repo.
3. Build command: `npm install && npm run build`   Publish directory: `dist`
4. Environment variables: `VITE_USE_MOCK=false` and `VITE_API_URL=https://<your-backend>.onrender.com/api`
5. Under **Redirects/Rewrites** add: source `/*`, destination `/index.html`, action **Rewrite** (needed so page refreshes work on routes like `/budgets`).

## Project structure

```
src/
  api/         client.js (axios + JWT), real.js (Spring Boot), mock.js (browser demo), index.js (switch)
  components/  Layout, Modal, MonthNav, TransactionModal, CommandPalette, Ring, AnimatedNumber, Confetti
  context/     Auth, Theme, Toast
  pages/       AuthPage, Dashboard, Transactions, Budgets, Goals
  utils/       constants (categories, colors, quick-add parser), format (currency, dates, CSV), insights (health score, safe-to-spend)
  index.css    all styling and theme tokens
```

To use another currency, change `currency: 'INR'` and the `₹` labels in `src/utils/format.js`.
