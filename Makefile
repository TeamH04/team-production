# Root Makefile for Team Production Project
# NOTE:
#   - This Makefile assumes a POSIX shell (bash/sh).
#   - On Windows, please run it from Git Bash (MINGW64) instead of PowerShell/cmd.
SHELL := /usr/bin/env bash

.DEFAULT_GOAL := help
.PHONY: help install dev mobile web backend \
	db-start db-stop db-migrate db-reset db-destroy \
	test test-backend test-web test-mobile lint typecheck build clean \
	m w b

# Colors for output (ANSI escape sequences)
RED    := \033[0;31m
GREEN  := \033[0;32m
YELLOW := \033[0;33m
BLUE   := \033[0;34m
NC     := \033[0m # No Color

# Variables
PNPM        := pnpm
BACKEND_DIR := apps/backend
MOBILE_DIR  := apps/mobile

# Commands
MOBILE_CMD  := cd $(MOBILE_DIR) && $(PNPM) expo start --dev-client
BACKEND_CMD := docker compose up backend

CONCURRENT  := $(PNPM) dlx --package concurrently@9.2.1 concurrently \
	--kill-others-on-fail \
	--names "mobile,backend" \
	--prefix-colors "cyan,green"

## ----- Setup -----

help: ## Show available commands
	@printf '%b\n' "$(BLUE)Team Production - Available Commands$(NC)"
	@echo
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

install: ## Install dependencies + setup Git hooks
	@printf '%b\n' "$(BLUE)Setting up project...$(NC)"
	corepack enable pnpm
	$(PNPM) install
	@if [ ! -f .git/hooks/pre-commit ]; then \
		printf '%s\n' '#!/bin/sh' \
			'printf "\\033[34m▶ Running pre-commit checks...\\033[0m\\n"' \
			'pnpm run format:check --log-level=warn && pnpm run lint --quiet && pnpm run typecheck' \
			'printf "\\033[32m✓ All checks passed\\033[0m\\n"' \
			> .git/hooks/pre-commit; \
		chmod +x .git/hooks/pre-commit; \
		printf '%b\n' "$(GREEN)✅ Pre-commit hook installed$(NC)"; \
	fi
	@printf '%b\n' "$(GREEN)✅ Setup completed!$(NC)"

## ----- Development Servers -----

dev: db-start ## Start DB + backend + mobile
	@printf '%b\n' "$(BLUE)Starting development servers...$(NC)"
	$(CONCURRENT) "$(MOBILE_CMD)" "$(BACKEND_CMD)"

mobile: ## Start mobile app (Expo dev client)
	@printf '%b\n' "$(BLUE)Starting mobile app...$(NC)"
	$(MOBILE_CMD)

web: ## Start web app (Next.js)
	$(PNPM) --dir apps/web dev

backend: db-start ## Start backend (Docker)
	@printf '%b\n' "$(BLUE)Starting backend...$(NC)"
	$(BACKEND_CMD)

## ----- Database -----

db-start: ## Start database
	$(MAKE) -C $(BACKEND_DIR) db-start

db-stop: ## Stop database
	$(MAKE) -C $(BACKEND_DIR) db-stop

db-migrate: ## Run database migrations
	$(MAKE) -C $(BACKEND_DIR) db-migrate

db-reset: ## Reset database (drop + migrate)
	$(MAKE) -C $(BACKEND_DIR) db-reset

db-destroy: ## Destroy database (remove volumes)
	$(MAKE) -C $(BACKEND_DIR) db-destroy

## ----- Quality -----

test: test-backend test-web test-mobile ## Run all tests
	@printf '%b\n' "$(GREEN)✅ All tests completed!$(NC)"

test-backend: ## Run backend tests
	@printf '%b\n' "$(BLUE)Running backend tests...$(NC)"
	@$(MAKE) -C $(BACKEND_DIR) test

test-web: ## Run web tests
	@printf '%b\n' "$(BLUE)Running web tests...$(NC)"
	@$(PNPM) --dir apps/web test

test-mobile: ## Run mobile tests
	@printf '%b\n' "$(BLUE)Running mobile tests...$(NC)"
	@$(PNPM) --dir apps/mobile test

lint: ## Run linters
	@printf '%b\n' "$(BLUE)Running linters...$(NC)"
	$(PNPM) run lint
	@printf '%b\n' "$(GREEN)✅ Linting completed!$(NC)"

typecheck: ## Run type checking (Turbo cached)
	@printf '%b\n' "$(BLUE)Running type check...$(NC)"
	$(PNPM) run typecheck
	@printf '%b\n' "$(GREEN)✅ Type check completed!$(NC)"

build: ## Build all applications
	@printf '%b\n' "$(BLUE)Building applications...$(NC)"
	cd $(BACKEND_DIR) && $(MAKE) build
	$(PNPM) run build
	@printf '%b\n' "$(GREEN)✅ Build completed!$(NC)"

clean: ## Clean build artifacts
	@printf '%b\n' "$(BLUE)Cleaning...$(NC)"
	cd $(BACKEND_DIR) && $(MAKE) clean
	cd $(MOBILE_DIR) && rm -rf dist/ .expo/
	rm -rf node_modules/.cache/
	@printf '%b\n' "$(GREEN)✅ Cleanup completed!$(NC)"

## ----- Aliases -----

m: mobile ## Alias: make m -> make mobile
w: web    ## Alias: make w -> make web
b: backend ## Alias: make b -> make backend
