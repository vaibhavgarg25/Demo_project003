# Copilot Instructions for Kochi Metro Fleet Induction Monorepo

This guide helps AI coding agents work productively in the Kochi Metro Fleet Induction monorepo. It covers architecture, workflows, conventions, and integration points specific to this project.

## Architecture Overview
- **Monorepo Structure**: Uses [Turborepo](https://turborepo.com/) to manage multiple apps and packages.
  - `apps/`: Contains deployable applications (e.g., `frontend` for dashboard UI, `docs` for documentation).
  - `packages/`: Shared libraries and configurations (e.g., `@repo/ui`, `@repo/eslint-config`, `@repo/typescript-config`).
- **Frontend**: Professional dashboard for trainset induction/monitoring (`apps/frontend`). Built with Next.js and React.
- **Simulation/AI/ML**: RL and simulation code may reside in `apps/AIML` or similar directories. Check for Python scripts and model artifacts.

## Developer Workflows
- **Build All Apps/Packages**:
  - With global turbo: `turbo build`
  - With package manager: `npx turbo build` or `yarn dlx turbo build`
- **Build Specific App/Package**:
  - Example: `turbo build --filter=frontend`
- **Frontend Development**:
  - `cd apps/frontend`
  - `npm install`
  - `npm run dev` (starts Next.js dev server at [localhost:3000](http://localhost:3000))
- **Font Setup**: Place Chirp font files in `apps/frontend/public/fonts/` for custom typography.

## Conventions & Patterns
- **TypeScript**: All JS/TS code is strictly typed. Shared configs in `packages/typescript-config`.
- **Linting/Formatting**: Use shared ESLint/Prettier configs from `packages/eslint-config`.
- **React Component Sharing**: UI components are shared via `@repo/ui`.
- **Simulation/AI/ML**: Python scripts may use RL, PPO, or simulation logic. Data files (CSV, model checkpoints) are often stored alongside code.

## Integration Points
- **External Dependencies**:
  - Next.js, React, Turbo, ESLint, Prettier (JS/TS)
  - Python (AI/ML scripts)
- **Cross-Component Communication**:
  - Shared packages for types, UI, and configs
  - Data exchange via CSV, model files, or API endpoints

## Examples
- To add a new dashboard feature, update `apps/frontend` and share UI logic via `@repo/ui`.
- To run a simulation, locate relevant Python scripts in `apps/AIML` or similar, and ensure required data files are present.

## Key Files & Directories
- `apps/frontend/README.md`: Frontend setup and features
- `mono-repo/README.md`: Monorepo structure and build instructions
- `packages/eslint-config/README.md`: Linting conventions
- `apps/AIML/`: AI/ML code (explore for RL, PPO, simulation logic)

---

**For unclear workflows or missing conventions, ask maintainers for clarification. Update this file as new patterns emerge.**
