# Kochi Metro Fleet Induction Dashboard

A professional fleet management dashboard for Kochi Metro trainset induction and monitoring.

## Getting Started

1. Navigate to the frontend directory:
\`\`\`bash
cd apps/frontend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Font Setup

Place the Chirp font files in the `public/fonts/` directory:
- `chirp-regular.woff2`
- `chirp-medium.woff2`
- `chirp-bold.woff2`

The application will fall back to system fonts if Chirp fonts are not available.

## Features

- **Dashboard**: Fleet overview with KPIs, recommendations, and animated train visualization
- **Trainsets**: Complete trainset management with filtering and detailed views
- **Planner**: Intelligent trainset allocation with scoring algorithm
- **Simulation**: Fleet availability simulation with parameter adjustments
- **History**: Planner run history and analysis
- **Settings**: Theme management and display preferences

## Customization

### Clock Placement
The clock can be moved between header and sidebar in the Settings page.

### Animated Train
Replace `public/graphics/train.jpg` with your custom train design. The component will automatically apply animations to elements with IDs: `train-body`, `train-wheels`, `wheel-1`, `wheel-2`, etc.

### Theme Colors
Modify CSS variables in `styles/tailwind.css` to customize the color scheme while maintaining accessibility.

## Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Technology Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- React Hook Form + Zod
- Recharts
- next-themes
- Lucide React Icons
