# 🏛️ The Ultimate InvestFlow Master Manual

Welcome to the definitive source of truth for **InvestFlow**. This document is an exhaustive, deep-dive exploration of every technical decision, mathematical formula, database constraint, and user workflow within the application. 

---

## 💎 1. Product Philosophy & Design Language

### A. The "Wealth-First" Aesthetic
InvestFlow is built on the principle of **High-Signal Minimalism**. Inspired by the Apple Stocks application, the UI prioritizes readability and high-contrast data visualization.
*   **The Palette**: A custom-tuned dark mode using `#0a0a0a` as the void background. Primary actions use "InvestFlow Green" (`#10b981`), while cautionary balances use Amber/Orange alerts.
*   **Glassmorphism**: UI components use translucent backdrops (`backdrop-blur-md`) and subtle borders (`border-white/10`) to create a sense of depth and premium quality.
*   **Micro-Animations**: Uses Tailwind-native animations like `animate-pulse` for live market indicators and `animate-in` for modal transitions.

### B. Asset Taxonomy
The application categorizes wealth into four distinct "Liquidity Layers":
1.  **Liquid Cash**: Immediate spending power, distributed across bank accounts.
2.  **Staked Assets**: Fixed Deposits (locked for a duration).
3.  **Market Assets**: Stocks and Cryptocurrencies (volatile, requires live tracking).
4.  **Liabilities**: Loans and recurring bills.

---

## ⚙️ 2. Core Technological Architecture

The application is a **Distributed Polyglot Ecosystem** comprising three independent runtime environments.

### I. Frontend SPA (React + Vite)
- **Directory**: `/frontend`
- **State Management**: Uses the **Context API** (`AuthContext.jsx`). This provides a globally available `user` object and a reactive `updateBalance()` helper that synchronizes UI changes instantly across components without a page reload.
- **Routing**: `react-router-dom` handles the navigation lifecycle. A custom `<Layout>` component wraps all authenticated routes to provide a consistent `Sidebar` and scrolling container.

### II. Core Intelligence API (Node.js + Express)
- **Directory**: `/backend`
- **Concurrency**: Built for high-throughput using the **MySQL2 Promise Pool**. It handles up to 10 simultaneous database connections with automated queueing.
- **Transactional Integrity**: Critical operations (investing, loan payments) are wrapped in **SQL Transactions**. This prevents "Phantom Deductions" where money is taken from a user but the asset is not correctly recorded.

### III. Market Extraction Service (Python + FastAPI)
- **Directory**: `/data-service`
- **Performance**: FastAPI utilizes asynchronous ASGI workers, allowing it to fetch multiple tickers from Yahoo Finance in parallel.
- **Data Engine**: `yfinance` scrapes raw data, which is then serialized into clean JSON. It handles ticker metadata, current price ticks, and historical OHLC (Open-High-Low-Close) data.

---

## 🧮 3. The Financial Engineering (How the math works)

### 📈 The Net Worth Algorithm
The `Dashboard.jsx` computes your "Wealth Score" in real-time by aggregating data from four separate database tables:
1.  **Cash Component**: Fetches `liquid_cash` from the `users` table.
2.  **Equity Component**: Sums `(shares * live_price)` for every entry in the `holdings` table.
3.  **FD Component**: Sums `principal_amount` from the `fixed_deposits` table.
4.  **Liability Component**: Sums `remaining_balance` from the `loans` table.
**Final Formula**: `Net Worth = (Cash + Equity + FDs) - Debt`.

### 🏦 The Delegation & Sync Model
Liquid cash is managed via a **Masterpool-Subset Relationship**:
- **Master Pool**: `users.liquid_cash` in the database.
- **Subsets**: Each record in `bank_accounts` has its own `balance`.
- **Validation**: The system calculates "Unallocated Funds" by subtracting the sum of all bank balances from the Master Pool. 
- **buy/Sell Sync**: When you buy a stock using "Bank A":
    1.  Deduct $X from `bank_accounts (id: Bank A)`.
    2.  Deduct $X from `users.liquid_cash`.
    3.  This keeps the specific bank and your global net worth in perfect sync.

### 📅 The Monthly Burn Normalization
Recurring expenses in `Subscriptions.jsx` come in different frequencies. The app normalizes these into a single "Monthly Burn" statistic:
- **1m (Monthly)**: `price * 1`
- **3m (Quarterly)**: `price / 3`
- **1y (Yearly)**: `price / 12`
This allows the user to see exactly how much money is leaving their accounts every 30 days.

---

## 🗄️ 4. Data Relational Model (Entity Breakdown)

The SQL schema (`investflow_db`) uses Relational Constraints and Foreign Keys for data safety.

### 1. `users` Table
The central authority for identity and wealth.
- `id`: Auto-increment primary key.
- `liquid_cash`: `DECIMAL(15, 2)` (We use Decimal, not Float, to avoid floating-point math errors in finance).

### 2. `bank_accounts` Table
Links specific banks to users.
- `user_id`: Foreign key (CASCADE).
- `phone_number`: Required for account creation.
- `balance`: The portion of liquid cash allocated to this bank.

### 3. `holdings` Table
Tracks what you own.
- `shares`: Up to 4 decimal places (allows for fractional stock buys).
- `average_price`: Computed at buy-time to track profit/loss.

### 4. `loans` & `loan_payments`
- **`loans`**: Tracks the original principal and the **decreasing** `remaining_balance`.
- **`loan_payments`**: Every EMI or "Extra Payment" is logged as its own record, creating an audit trail of debt reduction.

---

## 🛡️ 5. Integration Workflow: The "Stock Buy" Lifecycle

When you click "Confirm Buy" on a stock, the following 8-step sequence occurs:

1.  **UI Check**: React verifies that `quantity > 0` and `selectedAccount` is chosen.
2.  **API Call**: A `POST` request is sent to `/api/invest`.
3.  **Backend Lock**: Node opens a transaction and uses `FOR UPDATE` on both the `bank_accounts` and `users` tables, locking them for modification.
4.  **Balance Verification**: The server checks if the bank balance is actually enough for `(shares * price)`.
5.  **Master Update**: Deducts the cost from `users.liquid_cash`.
6.  **Subset Update**: Deducts the cost from the specific `bank_accounts.balance`.
7.  **Portfolio Update**: Checks if you already own this stock. If yes, it updates the `average_price` using a weighted average. If no, it creates a new `holdings` record.
8.  **Ledger Logging**: Inserts a record into the `transactions` table.
9.  **Commit**: If all 8 steps succeed, the transaction is committed. If any fail, MySQL rolls everything back as if nothing happened.

---

## 🎨 6. The UX Design System

### I. Navigation (Sidebar)
The sidebar (`Sidebar.jsx`) uses dynamic active-route matching. It maps over a curated `navItems` array, injecting the correct Lucide icons and applying high-contrast primary colors to the active selection.

### II. Dynamic Utility Logic (`Subscriptions.jsx`)
This page handles the "provider dynamic dropdown" system.
- **`PROVIDER_DATA` Dictionary**: A monolithic object containing major ISPs and Cell providers.
- **Provider Selection**: Triggers an event listener that filters the available packages.
- **Auto-Fill Logic**: Once a package (e.g., "Airtel Black") is chosen, the `price`, `benefits`, and `frequency` are automatically injected into the form state.

### III. Data Visualization
Sparklines on the Dashboard are generated using **SVG path strings**. We use a ternary operator to decide the path direction and color (`#10b981` vs `#ef4444`) based on the `change` metric.

---

## 📁 7. File Manifest: Location Guide

| Path | Purpose | Key Complexity |
| :--- | :--- | :--- |
| **`frontend/src/App.jsx`** | The Routing Hub. | Handles layout wrapping and auth redirects. |
| **`frontend/src/AuthContext.jsx`** | Global Wealth State. | Persistence layer for session data. |
| **`frontend/src/pages/Dashboard.jsx`** | Portfolio Aggregator. | Computes Net Worth across 4 API calls. |
| **`frontend/src/pages/StockDetail.jsx`** | Market Interaction. | Handles "Ounces" vs "Shares" labeling. |
| **`frontend/src/pages/TransactionalAccounts.jsx`** | Banking Hub. | Inter-account transfer complex modal. |
| **`frontend/src/pages/Loans.jsx`** | Debt Hub. | EMI math and remaining balance tracking. |
| **`backend/index.js`** | API Engine. | The entire REST routing logic. |
| **`backend/db.js`** | Database Connection. | Connection pooling and init script. |
| **`data-service/main.py`** | External Data Pipe. | `yfinance` to JSON bridge. |

---

## ⚡ 8. Operations & Lifecycle

### Environment Variables (.env)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`: Connectivity to your MySQL instance.
- `PORT`: Usually `5005` for the backend.

### Port Taxonomy
- **`:5173`**: Client-side development server.
- **`:5005`**: Backend execution environment.
- **`:8000`**: Financial data stream.

---
*Created for the InvestFlow Technical Manual - April 2026*
