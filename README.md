# 💎 Ledger — Next-Gen Personal Wealth & Financial Operating System

[![Live Demo on Vercel](https://img.shields.io/badge/Live%20Demo-ledger--seven--phi.vercel.app-10b981?style=for-the-badge&logo=vercel)](https://ledger-seven-phi.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Platform: Web](https://img.shields.io/badge/Platform-Web%20SPA-6366f1.svg)]()
[![Forex Engine](https://img.shields.io/badge/Forex-Multi--Currency%20Engine-06b6d4.svg)]()
[![AI Financial Copilot](https://img.shields.io/badge/AI-Financial%20Advisor-8b5cf6.svg)]()

> 🚀 **Live Production URL**: **[https://ledger-seven-phi.vercel.app](https://ledger-seven-phi.vercel.app)**
>
> **Ledger** is a high-performance personal wealth management platform and financial operating system. Designed with an ultra-sleek glassmorphic dark-mode interface, real-time mathematical multi-currency conversion, macro currency fluctuation analytics, interactive AI financial advising, fixed overhead tracking, receipt attachments, and pro wealth calculators.

---

## 🌟 Key Features

### 💱 Real-Time Mathematical Multi-Currency & Forex Trends
- **Live Base-Currency Standard**: All monetary metrics are stored with precision base standards and dynamically formatted into **USD ($)**, **EUR (€)**, **GBP (£)**, **INR (₹)**, **JPY (¥)**, and more.
- **Dynamic Market Trends Modal**: Displays 30-day and 6-month historical forex volatility trends, delta metrics, macro analysis, and a configurable currency volatility buffer (`0%`, `+3%`, `+5%`).
- **Forex Buffer Contingency**: Seamlessly simulate currency inflation contingencies across your savings portfolio runway.

### ✦ Interactive AI Financial Copilot
- **Live Cashflow Orb & Diagnostics**: Continuous real-time monitoring of spending velocity, discretionary leakage, and monthly burn rate.
- **Conversational Intelligence**: Ask natural questions like *"Can I afford a $250 purchase?"*, *"Where is my money leaking?"*, or *"Plan a 15% budget cut"*.
- **360° Financial Health Audits**: Generates instant savings optimization blueprints and discretionary category reviews.

### 🔄 Recurring Subscriptions & Fixed Overhead Tracker
- **Automated Overhead Tallies**: Track recurring services (Netflix, Spotify, Gym, Cloud Hosting, Rent) with monthly, yearly, and weekly cycles.
- **Renewal Countdown Badges**: Highlights upcoming bills due in `< 7 days` to eliminate unexpected subscription renewals.
- **Burn Rate Integration**: Auto-factors fixed overhead into your daily safe allowance calculation.

### 📎 Receipt & Invoice Image Attachments with Lightbox
- **Zero-Dependency Local Storage**: Upload receipt photos directly with expenses stored as offline-capable Base64 data URLs.
- **Interactive Lightbox**: Click any `📎 Receipt` chip to view full-resolution previews and download receipt images.

### 📜 Executive Wealth Statement & Reporting
- **Audited Financial Performance Summary**: Generates high-grade executive statements (Goldman Sachs / Revolut Ultra styling).
- **50/30/20 Wealth Framework**: Automatically calculates Needs, Wants, and Capital Growth ratios against recommended allocations.
- **Print & PDF Export**: Native one-click browser printing (`Ctrl+P` / `Cmd+P` optimized with clean print stylesheets).

### 🧮 Pro Wealth Simulators & Savings Engine
- **Compound Wealth Growth Simulator**: Interactive future-value simulator projecting returns with configurable monthly contributions, APY rates, and multi-year horizons.
- **Emergency Runway Benchmark**: Analyzes cash reserves against Lean Survival (3 mo), Balanced (6 mo), and Fortified (12 mo) benchmarks.
- **Interactive Goals Engine**: Visual progress bars, deposit and withdraw controls, target completion runways, and live pace requirements (`₹ X/mo`).

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/tiwarinaman319/ledger.git
cd ledger
```

### 2. Start the Local Server
Ledger runs with Python's built-in HTTP server:

```bash
# Start on port 8080 (includes no-cache headers for instant updates)
python server.py
```

### 3. Open in Browser
Visit **[http://localhost:8080](http://localhost:8080)** (or `http://localhost:8080/app.html`).

> **Demo Mode**: Click **"⚡ Load Demo Data"** on the login screen or in Settings to immediately populate 3 months of realistic transactions, goals, subscriptions, and receipts.

---

## 📁 Project Structure

```
ledger/
├── index.html          # Authentication portal (Login, Signup, Demo mode)
├── app.html            # Main Single Page Application (SPA) dashboard
├── server.py           # Lightweight development server with no-cache headers
├── css/
│   └── style.css       # Design system (Glassmorphism, dark/light themes, print CSS)
├── js/
│   ├── auth.js         # User authentication, session management, demo accounts
│   ├── currency.js     # Mathematical multi-currency & Forex market trends engine
│   ├── ai-assistant.js # Smart AI Financial Copilot and conversational advisor
│   ├── charts.js       # Chart.js analytics (Cashflow, Category breakdown, 50/30/20)
│   ├── expenses.js     # Transaction ledger, subscriptions, receipts, wealth statement
│   ├── calculator.js   # Compound growth, emergency fund runway, 50/30/20 simulator
│   ├── i18n.js         # Multi-language support (English, Hindi, Spanish, French)
│   └── theme.js        # Dark/Light theme manager
└── assets/
    └── icon.svg        # Vector application branding
```

---

## 🌐 Supported Currencies & Languages

| Currencies | Supported | Base Symbol | Code |
| :--- | :---: | :---: | :---: |
| US Dollar | ✅ | `$` | `USD` |
| Euro | ✅ | `€` | `EUR` |
| British Pound | ✅ | `£` | `GBP` |
| Indian Rupee | ✅ | `₹` | `INR` |
| Japanese Yen | ✅ | `¥` | `JPY` |

- **Languages Supported**: English (en), Hindi (hi), Spanish (es), French (fr).

---

## 🔒 Privacy & Offline First

All ledger data, credentials, subscriptions, and receipt attachments are stored client-side in browser `localStorage`. No financial data ever leaves your device unless you choose to export your encrypted JSON backup.

---

## 📄 License

Distributed under the MIT License. Open source and free for personal and commercial financial management.
