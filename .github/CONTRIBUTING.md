# Contributing

Thanks for your interest in improving Chalkbox! 🖍️

## Getting Started

1. Fork the repo and branch from `main`: `git checkout -b feat/your-feature`
2. Install dependencies: `npm install`
3. Copy the env template: `cp .env.example .env.local`
4. Start the dev server: `npm run dev`

> Chalkbox runs fully in **demo mode** with zero API keys — the seeded gallery
> and the stubbed self-test build trace work with no OpenAI/Supabase config.

## Before You Open a PR

- `npm run ci` passes (format, lint, typecheck, tests, build).
- `npm run e2e` passes (Playwright — build first with `npm run build`).
- Add or update tests for any behavior change.
- Keep commits conventional (`feat:`, `fix:`, `docs:`, `chore:`).

## Reporting Bugs / Requesting Features

Open an issue using the provided templates. Include repro steps, expected vs.
actual behavior, and environment details.
