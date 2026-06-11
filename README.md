# KwentaKo 🪙

KwentaKo is a modern, lightweight, and offline-capable personal finance tracker and bookkeeping web application. Designed for speed, simplicity, and ease of use, it features a custom NumPad for quick transaction entry, accounts management, category tracking, dynamic analytics, and support for progressive web app (PWA) installation.

## 🚀 Features

- **Personal Finance Dashboard**: Get a quick overview of your total net worth (with visibility toggle) and current period summaries (today, week, month, year) for income, expenses, and net balance.
- **Transaction Logging**: Fast logging of income, expenses, and account-to-account transfers with a custom on-screen NumPad.
- **Account Management**: Manage multiple financial accounts (cash, bank, digital wallets, credit cards, investments) with transaction logs per account.
- **Category Customization**: Add, edit, or delete categories with custom colors and icons for personalized expense and income classification.
- **Analytics & Visualizations**: Interactive expense/income distribution charts (donut and bar charts) powered by Recharts, helping you understand spending habits by category.
- **Themes**: Support for light, dark, and system themes.
- **PWA Ready**: Offline availability, service worker integration, and app-like experience.

## 🛠️ Tech Stack

- **Core Framework**: React 19, Vite, TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Charts / Data Visualization**: Recharts
- **Date Utilities**: date-fns
- **Icons**: FontAwesome 6 (free CDN)
- **Deployment**: Vercel / PWA configs

## 📂 Project Structure

```
KwentaKo/
├── public/                 # Static assets and PWA icons
├── src/
│   ├── assets/             # Images, styles, and other raw assets
│   ├── components/         # Reusable React components
│   │   ├── layout/         # AppShell, BottomNav, and layout wrappers
│   │   ├── modals/         # NumPad modal and transaction detail sheets
│   │   └── ui/             # General UI elements (cards, input fields, state views)
│   ├── pages/              # Main view screens:
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── Accounts.tsx
│   │   ├── Analytics.tsx
│   │   ├── Categories.tsx
│   │   └── Settings.tsx
│   ├── store/              # Zustand global store configuration
│   ├── types/              # TypeScript types and interface definitions
│   ├── utils/              # Helper functions, calculations, and seed data
│   ├── App.tsx             # Root page router and state coordinator
│   ├── main.tsx            # Main application entry point
│   └── index.css           # Core stylesheet with Tailwind and custom style layers
├── postcss.config.js       # PostCSS config
├── tailwind.config.js      # Tailwind utility config
├── tsconfig.json           # TS base config
├── vercel.json             # Vercel configuration
└── vite.config.ts          # Vite bundler configuration
```

## 💻 Getting Started

### Prerequisites
Make sure you have Node.js (version 18 or above recommended) and npm installed on your system.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/KwentaKo.git
   cd KwentaKo
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:5173` to see the application.

### Build and Deployment

To compile the application into static production files:
```bash
npm run build
```
The build artifacts will be written to the `dist` directory, which can be deployed to any static host (like Vercel, Netlify, or GitHub Pages).

## 📄 License

This project is licensed under the MIT License.
