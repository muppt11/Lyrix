# LyraLytics — Cybernetic Analytics Platform 🚀

A futuristic, sci-fi themed unified analytics platform built with Next.js 14, TypeScript, and Tailwind CSS.

![LyraLytics Platform](https://img.shields.io/badge/LyraLytics-Cybernetic%20Analytics%20Platform-00ffff?style=for-the-badge&logo=react&logoColor=black)

## 🌟 Features

- **🎨 Futuristic Sci-Fi UI** — cyberpunk-inspired interface with glow, glass panels, and animated grids
- **🧠 Neural Core Dashboard** — unified overview across every connected platform
- **📊 Commerce Matrix** — sales and revenue analytics
- **📱 Social Grid Monitor** — cross-platform engagement for Instagram, Facebook, YouTube, TikTok, and X
- **🎭 Creator Platform** — multi-platform creator analytics (Instagram, YouTube, TikTok, Facebook/Meta, X, Patreon, OnlyFans) with a pluggable data-source layer
- **📋 Task Protocol** — simple workflow/task tracking
- **⚡ Demo-data by default** — every page renders fully without any API keys

## 🎨 Design Theme

Inspired by Star Wars, Blade Runner 2049, Ghost in the Shell, and Tron — glowing neon accents, glass panels, and grid backgrounds.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
cd frontend

# Run the setup script (installs deps + creates .env.local)
./setup.sh

# Or manually:
npm install
cp .env.example .env.local
```

### Run it

```bash
npm run dev
```

Visit http://localhost:3000 — every page works immediately with demo data. No API keys are required to explore the UI.

## 📁 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## 🧩 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Neural Core (dashboard overview)
│   │   ├── ecommerce/            # Commerce Matrix
│   │   ├── social/               # Social Grid Monitor
│   │   ├── creator-platform/     # Creator Platform module
│   │   └── tasks/                # Task Protocol
│   ├── components/                # Shared UI (Sidebar, Panel, StatTile, ...)
│   ├── lib/
│   │   ├── utils.ts               # Formatting helpers
│   │   └── creator-platform/      # Platform registry, mock data, providers
│   └── types/
│       └── creator-platform.ts    # Shared types for the Creator Platform module
├── .env.example
└── setup.sh
```

## 🎭 Creator Platform Module

The Creator Platform page gives you one dashboard for analytics across multiple social and creator-monetization platforms:

- Instagram
- Facebook (Meta)
- YouTube
- TikTok
- X (Twitter)
- Patreon
- OnlyFans (demo data only — see notes below)

**All platforms run on demo/mock data out of the box.** To connect a real account, see [`src/lib/creator-platform/CREATOR_PLATFORM.md`](./src/lib/creator-platform/CREATOR_PLATFORM.md) for how the provider system works and what's needed per platform.

> ⚠️ **About OnlyFans**: OnlyFans does not offer a public developer API. The OnlyFans tile in the Creator Platform module is included for layout/demo purposes only and cannot be connected to live data through an official integration.

## 🎨 Design System

### Colors
- **Primary**: Cyan `#00ffff` — main accent
- **Secondary/Neon palette**: blue, purple, pink, red, orange, yellow, green accents (see `tailwind.config.js` under `theme.extend.colors.neon`)

### Typography
- **Headings**: Orbitron
- **Body**: Exo 2

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts, Chart.js
- **Icons**: Lucide React
- **State**: React hooks, Zustand
- **HTTP/Auth**: Axios, NextAuth.js

## 🚨 Troubleshooting

**Node.js version error** — use Node 18+ (`node --version`).

**Module not found** — run `npm install`.

**Build fails on TypeScript errors** — run `npm run type-check` to see details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT
