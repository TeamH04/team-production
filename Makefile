# Root Makefile for Team Production Project
# NOTE:
#   - This Makefile assumes a POSIX shell (bash/sh).
#   - On Windows, please run it from Git Bash (MINGW64) instead of PowerShell/cmd.
#   - Example:
#       $ cd ~/product/team-production
#       $ make install
SHELL := /usr/bin/env bash

.DEFAULT_GOAL := help
.PHONY: help setup dev build test lint clean deploy frontend backend \
        frontend-web frontend-lint backend-db-up backend-db-down \
        backend-destroy backend-db-init backend-test status ci-info \
        dev-backend dev-mobile install

# Colors for output (ANSI escape sequences)
RED    := \033[0;31m
GREEN  := \033[0;32m
YELLOW := \033[0;33m
BLUE   := \033[0;34m
NC     := \033[0m # No Color

# Legacy variables for backward compatibility
PNPM        := pnpm
BACKEND_DIR := apps/backend
MOBILE_DIR  := apps/mobile

# Frontend dev command
# NOTE:
#   - Cross-platform (Linux/macOS/Windows + Git Bash)
#   - Expo CLI の古いフラグ (--non-interactive / --metro-port) は使わず、
#     pnpm exec expo start をラップした start-dev.js を叩く。
FRONTEND_CMD := node $(MOBILE_DIR)/scripts/start-dev.js

# Backend dev command (Go server)
BACKEND_CMD  := $(MAKE) -C $(BACKEND_DIR) serve

CONCURRENT   := $(PNPM) dlx --package concurrently@9.2.1 concurrently --kill-others-on-fail --names "frontend,backend" --prefix-colors "cyan,green"

## ----- Setup Commands -----

help: ## 📋 Show this help message
	@printf '%b\n' "$(BLUE)Team Production - Available Commands$(NC)"
	@echo
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

setup: ## 🚀 Initial project setup (run from Git Bash on Windows)
	@printf '%b\n' "$(BLUE)Setting up Team Production project...$(NC)"
	@printf '%b\n' "$(YELLOW)Installing dependencies...$(NC)"
	corepack enable pnpm
	$(PNPM) install
	@printf '%b\n' "$(YELLOW)Setting up Git hooks...$(NC)"
	@if [ ! -f .git/hooks/pre-commit ]; then \
		printf '#!/bin/sh\npnpm run lint && pnpm run format:check\n' > .git/hooks/pre-commit; \
		chmod +x .git/hooks/pre-commit; \
		printf '%b\n' "$(GREEN)✅ Pre-commit hook installed$(NC)"; \
	fi
	@printf '%b\n' "$(GREEN)✅ Setup completed!$(NC)"

# Legacy compatibility commands
install: setup ## 📦 Install dependencies (legacy)

## ----- Development Commands -----

dev: backend-db-up ## 🔧 Start development servers (DB + backend + mobile)
	@printf '%b\n' "$(BLUE)Starting development servers...$(NC)"
	@printf '%b\n' "$(YELLOW)Backend will start on :8080$(NC)"
	@printf '%b\n' "$(YELLOW)Mobile app will start with Expo$(NC)"
	$(CONCURRENT) "$(FRONTEND_CMD)" "$(BACKEND_CMD)"

dev-backend: backend ## 🐹 Start backend development server

dev-mobile: frontend ## 📱 Start mobile development server

# Legacy compatibility commands
frontend: ## 📱 Start the Expo app (legacy)
	$(PNPM) --dir $(MOBILE_DIR) start

frontend-web: ## 🌐 Run Expo in web mode (legacy)
	$(PNPM) --dir $(MOBILE_DIR) web

frontend-lint: ## 🔍 Lint the mobile app (legacy)
	$(PNPM) --dir $(MOBILE_DIR) lint

backend: ## 🐹 Start DB and Go API (legacy)
	$(MAKE) -C $(BACKEND_DIR) run-dev

backend-db-up: ## 🗄️ Start database stack
	$(MAKE) -C $(BACKEND_DIR) db-up

backend-db-down: ## 🗄️ Stop database stack
	$(MAKE) -C $(BACKEND_DIR) db-down

backend-destroy: ## 🗄️ Stop DB and remove volumes
	$(MAKE) -C $(BACKEND_DIR) destroy

backend-db-init: ## 🗄️ Run migrations against local DB
	$(MAKE) -C $(BACKEND_DIR) db-init

backend-test: ## 🧪 Run Go unit tests
	$(MAKE) -C $(BACKEND_DIR) test

## ----- Enhanced Commands -----

test: ## 🧪 Run all tests
	@printf '%b\n' "$(BLUE)Running all tests...$(NC)"
	@$(MAKE) backend-test
	@printf '%b\n' "$(GREEN)✅ All tests completed!$(NC)"

lint: ## 🔍 Run linters
	@printf '%b\n' "$(BLUE)Running linters...$(NC)"
	$(PNPM) run lint
	@printf '%b\n' "$(GREEN)✅ Linting completed!$(NC)"

build: ## 🏗️ Build all applications
	@printf '%b\n' "$(BLUE)Building all applications...$(NC)"
	cd $(BACKEND_DIR) && $(MAKE) build
	cd $(MOBILE_DIR) && npx expo export --platform web
	@printf '%b\n' "$(GREEN)✅ All builds completed!$(NC)"

clean: ## 🧹 Clean build artifacts
	@printf '%b\n' "$(BLUE)Cleaning build artifacts...$(NC)"
	cd $(BACKEND_DIR) && $(MAKE) clean
	cd $(MOBILE_DIR) && rm -rf dist/ .expo/
	rm -rf node_modules/.cache/
	@printf '%b\n' "$(GREEN)✅ Cleanup completed!$(NC)"

status: ## 📊 Show project status
	@printf '%b\n' "$(BLUE)Project Status$(NC)"
	@echo
	@printf '%b\n' "$(YELLOW)📁 Backend Status:$(NC)"
	@cd $(BACKEND_DIR) && $(MAKE) status || echo "  Backend not configured"
	@echo
	@printf '%b\n' "$(YELLOW)📱 Mobile Status:$(NC)"
	@if [ -d "$(MOBILE_DIR)/node_modules" ]; then echo "  ✅ Dependencies installed"; else echo "  ❌ Dependencies not installed"; fi
	@echo
	@printf '%b\n' "$(YELLOW)🗄️ Database Status:$(NC)"
	@if docker ps | grep -q postgres; then echo "  ✅ Database running"; else echo "  ❌ Database not running"; fi

ci-info: ## ℹ️ Show CI/CD information
	@printf '%b\n' "$(BLUE)CI/CD Pipeline Information$(NC)"
	@echo
	@printf '%b\n' "$(YELLOW)🔄 Workflows:$(NC)"
	@echo "  • CI/CD Pipeline: Runs on PR and push to main/develop"
	@echo "  • Mobile Deploy: Expo builds and deployments"
	@echo "  • Backend Deploy: Go builds and Docker deployments"
	@echo "  • Dependabot: Automated dependency updates"
	@echo
	@printf '%b\n' "$(YELLOW)🏷️ Required Secrets:$(NC)"
	@echo "  • EXPO_TOKEN: For Expo builds"
	@echo "  • CODECOV_TOKEN: For coverage reports"
	@echo "  • DISCORD_WEBHOOK_URL: For notifications (already set)"
	@echo "  • PRODUCTION_DATABASE_URL: For production deployments"
