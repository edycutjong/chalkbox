.PHONY: help install dev build start lint typecheck test test-coverage ci e2e lighthouse security-scan format

help: ## Show this help
	@echo "Chalkbox — make targets"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm ci

dev: ## Start the dev server
	npm run dev

build: ## Production build
	npm run build

start: ## Start the production server
	npm run start

lint: ## Lint
	npm run lint

typecheck: ## Type check
	npm run typecheck

test: ## Unit tests (vitest)
	npm test

test-coverage: ## Unit tests with coverage
	npm run test:coverage

ci: ## Full quality gate (format, lint, typecheck, tests, build)
	npm run ci

# ── Advanced Testing & Security ─────────────────────────────
e2e: ## Run Playwright E2E tests (demo mode)
	@echo "🎭 Running Playwright E2E tests (demo mode)..."
	npx playwright test

lighthouse: ## Run Lighthouse CI audit
	@echo "🔦 Running Lighthouse CI audit..."
	npx lhci autorun

security-scan: ## npm audit + license compliance
	@echo "=== NPM AUDIT ==="
	npm audit --audit-level=high || true
	@echo ""
	@echo "=== LICENSE CHECK ==="
	npx license-checker --production --failOn "GPL-3.0;AGPL-3.0" --summary || true

format: ## Format with Prettier
	npm run format
