# The same commands in every project (see PRINCIPLES.md, rule 4).
# Run `make` or `make help` to list them.

.DEFAULT_GOAL := help
.PHONY: help setup dev test e2e screens lint format build preview phone evidence verdict eval export clean

help: ## List the available commands
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  make %-10s %s\n", $$1, $$2}'

setup: ## Install everything needed (first time, or after pulling changes)
	corepack enable
	pnpm install
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example")

dev: ## Run the app locally with live reload
	pnpm dev

test: ## Run the unit tests
	pnpm test

e2e: ## Run the end-to-end browser tests (downloads Chromium the first time)
	pnpm --filter @app/web exec playwright install chromium
	pnpm e2e

screens: ## Screenshot every screen (phone and desktop, light and dark) into apps/web/screenshots
	pnpm --filter @app/web exec playwright install chromium
	rm -rf apps/web/screenshots
	pnpm --filter @app/web screens

lint: ## Check formatting, code style and types
	pnpm lint

format: ## Fix formatting and auto-fixable style issues
	pnpm format

build: ## Build the production version into apps/web/dist
	pnpm build

preview: build ## Build and serve the production version (the PWA works here)
	pnpm preview

phone: build ## Build and serve it on your network, to open on a phone
	pnpm preview --host

evidence: ## Collect evidence links for each URL in a file: make evidence IN=<file>
	@test -n "$(IN)" || (echo "Usage: make evidence IN=<file with one URL per line>" && exit 2)
	@pnpm --silent --filter @app/agent evidence "$(abspath $(IN))"

verdict: ## Judge each product into live/verdicts.jsonl: make verdict IN=<file>
	@test -n "$(IN)" || (echo "Usage: make verdict IN=<organizers CSV, test set JSON, or one URL per line>" && exit 2)
	@pnpm --silent --filter @app/agent verdict "$(abspath $(IN))"

eval: ## Score live/verdicts.jsonl: make eval [LABELS=<test set>] [HALF=odd|even]
	@pnpm --silent --filter @app/agent eval "$(if $(LABELS),$(abspath $(LABELS)))" "$(HALF)"

export: ## Write live/verdicts.jsonl as stackgini-verdicts.csv (the organizers' columns)
	@pnpm --silent --filter @app/agent export

clean: ## Remove installed packages and build output
	rm -rf node_modules apps/*/node_modules packages/*/node_modules apps/*/dist apps/*/dev-dist
