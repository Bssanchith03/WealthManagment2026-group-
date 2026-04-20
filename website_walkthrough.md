# 🎓 InvestFlow Master Orientation Guide

This guide is your "Cheat Sheet." If anyone asks you how the app works, what the tech stack is, or how the math is handled, the answers are right here.

---

## 🏛️ 1. The Core Architecture (The "3 Pillars")

Question: *"How is the app built technically?"*
**Answer**: InvestFlow uses a **Decoupled Microservices Architecture**. Each layer has a specific job:
1.  **The UI (Frontend)**: Built with **React 18 and Vite**. It’s incredibly fast because it only renders what moves. It uses **Tailwind CSS v4** for the "Glassmorphic" (see-through) aesthetic.
2.  **The Brain (Backend)**: Built with **Node.js and Express**. This is the secure layer that talks to the **MySQL Database**. It handles all the "money movements" to ensure accuracy.
3.  **The Heart (Data Service)**: Built with **Python and FastAPI**. It bridges the app to **Yahoo Finance**. Python is used here because it is the industry standard for financial data processing.

---

## 🧮 2. The Financial Logic

Question: *"How is my Net Worth calculated?"*
**Answer**: It’s not just your cash balance. We use a **Master Aggregator** logic:
> **Net Worth** = `(Cash in all Banks)` + `(Value of all Stocks)` + `(Value of all Crypto)` + `(Fixed Deposit Principals)` - `(Total Outstanding Debt/Loans)`

Question: *"What is a Transactional Account?"*
**Answer**: Unlike a standard wallet app, InvestFlow uses a **Delegation Model**. You have a "Master Liquid Cash" pool. When you link a bank account (HDFC, Chase, etc.), you are "delegating" a portion of your total cash to that specific bank. Any money not in a bank is classified as **"Unallocated Funds."**

Question: *"What happens when I buy a stock?"*
**Answer**: We use **Database Transactions (ACID Compliance)**. When you click buy, the server simultaneously:
1.  Subtracts money from your specific Bank Account.
2.  Subtracts money from your Global Liquid Cash.
3.  Adds the shares to your Holdings.
If any of these fail, the whole thing "Rolls Back" so you never lose money to a technical glitch.

---

## 📡 3. Market Data & Tracking

Question: *"Is the stock data live?"*
**Answer**: Yes. We use a **Live Data Pipeline**. Every time you view a stock, the Python service makes a real-time request to the markets, pulls the current price, and feeds it back to the React UI in under 200 milliseconds.

---

## 🛡️ 4. Security & Integrity

Question: *"Is my data safe?"*
**Answer**: We use **Foreign Key Constraints** in our MySQL database. This means a transaction cannot exist without a user, and a loan payment cannot exist without a loan. This data integrity prevents "orphaned data" and keeps your portfolio perfectly structured.

---

## 📂 5. Where is everything? (Project Manifest)

- **`frontend/`**: All the screens you see.
- **`backend/index.js`**: All the API logic (The "Brain").
- **`data-service/main.py`**: The market data connection.
- **`system_architecture.md`**: The technical blueprint (in the root folder).
