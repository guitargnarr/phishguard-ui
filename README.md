# Meridian

US economic data explorer with interactive map visualization. Live BLS and Census data across all 50 states.

[![Live](https://img.shields.io/badge/Live-meridian.projectlavos.com-teal)](https://meridian.projectlavos.com)

## Features

- Interactive SVG map with zoom, pan, and state selection
- 5 data overlays: Population, Income, Poverty, Employment, Gig Economy
- Metric cluster dots showing state-level economic indicators
- Choropleth coloring with gradient legends
- State detail panel with full economic breakdown
- County-level zoom detail with interstate highway overlay

## Data Sources

- **BLS** (Bureau of Labor Statistics) - Unemployment rates via LAUS API
- **Census Bureau** - Population, median income, poverty rates via ACS 5-Year
- Fallback to hardcoded state metrics when APIs are unavailable

## Tech Stack

- **Frontend:** Next.js 16 (App Router), D3.js, Tailwind CSS v4, TypeScript
- **Deployment:** Vercel

## Quick Start

```bash
git clone https://github.com/guitargnarr/meridian.git
cd meridian
npm install
npm run dev
```

Open [http://localhost:3000/explore](http://localhost:3000/explore)

## Deploy

```bash
npm run build
vercel --prod --yes
```

## Author

**Matthew Scott** - [Portfolio](https://projectlavos.com) | [GitHub](https://github.com/guitargnarr)

## License

MIT
