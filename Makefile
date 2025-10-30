# Root Makefile for Team Production Project
.DEFAULT_GOAL := help
.PHONY: help setup dev build test lint clean deploy

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Legacy variables for backward compatibility
PNPM        := pnpm
BACKEND_DIR := apps/backend
MOBILE_DIR  := apps/mobile
FRONTEND_CMD := node $(MOBILE_DIR)/scripts/start-dev.js
BACKEND_CMD  := $(MAKE) -C $(BACKEND_DIR) serve
CONCURRENT   := $(PNPM) dlx --package concurrently@9.2.1 concurrently --kill-others-on-fail --names "frontend,backend" --prefix-colors "cyan,green"

## ----- Setup Commands -----

help: ## 📋 Show this help message
	@echo "$(BLUE)Team Production - Available Commands$(NC)"
	@echo
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
setup: ## 🚀 Initial project setup
	@echo "$(BLUE)Setting up Team Production project...$(NC)"
	@echo "$(YELLOW)Installing dependencies...$(NC)"
	corepack enable pnpm
	$(PNPM) install
	@echo "$(YELLOW)Setting up Git hooks...$(NC)"
	@if [ ! -f .git/hooks/pre-commit ]; then \
		echo "#!/bin/sh\npnpm run lint && pnpm run format:check" > .git/hooks/pre-commit; \
		chmod +x .git/hooks/pre-commit; \
		echo "$(GREEN)✅ Pre-commit hook installed$(NC)"; \
	fi
	@echo "$(GREEN)✅ Setup completed!$(NC)"

# Legacy compatibility commands
install: setup ## 📦 Install dependencies (legacy)

## ----- Development Commands -----

dev: ## 🔧 Start development servers (all)
	@echo "$(BLUE)Starting development servers...$(NC)"
	@echo "$(YELLOW)Backend will start on :8080$(NC)"
	@echo "$(YELLOW)Mobile app will start with Expo$(NC)"
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
	@echo "$(BLUE)Running all tests...$(NC)"
	@make backend-test
	@echo "$(GREEN)✅ All tests completed!$(NC)"

lint: ## 🔍 Run linters
	@echo "$(BLUE)Running linters...$(NC)"
	$(PNPM) run lint
	@echo "$(GREEN)✅ Linting completed!$(NC)"

build: ## 🏗️ Build all applications
	@echo "$(BLUE)Building all applications...$(NC)"
	cd $(BACKEND_DIR) && make build
	cd $(MOBILE_DIR) && npx expo export --platform web
	@echo "$(GREEN)✅ All builds completed!$(NC)"

clean: ## 🧹 Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	cd $(BACKEND_DIR) && make clean
	cd $(MOBILE_DIR) && rm -rf dist/ .expo/
	rm -rf node_modules/.cache/
	@echo "$(GREEN)✅ Cleanup completed!$(NC)"

status: ## 📊 Show project status
	@echo "$(BLUE)Project Status$(NC)"
	@echo
	@echo "$(YELLOW)📁 Backend Status:$(NC)"
	@cd $(BACKEND_DIR) && make status || echo "  Backend not configured"
	@echo
	@echo "$(YELLOW)📱 Mobile Status:$(NC)"
	@if [ -d "$(MOBILE_DIR)/node_modules" ]; then echo "  ✅ Dependencies installed"; else echo "  ❌ Dependencies not installed"; fi
	@echo
	@echo "$(YELLOW)🗄️ Database Status:$(NC)"
	@if docker ps | grep -q postgres; then echo "  ✅ Database running"; else echo "  ❌ Database not running"; fi

ci-info: ## ℹ️ Show CI/CD information
	@echo "$(BLUE)CI/CD Pipeline Information$(NC)"
	@echo
	@echo "$(YELLOW)🔄 Workflows:$(NC)"
	@echo "  • CI/CD Pipeline: Runs on PR and push to main/develop"
	@echo "  • Mobile Deploy: Expo builds and deployments"
	@echo "  • Backend Deploy: Go builds and Docker deployments"
	@echo "  • Dependabot: Automated dependency updates"
	@echo
	@echo "$(YELLOW)🏷️ Required Secrets:$(NC)"
	@echo "  • EXPO_TOKEN: For Expo builds"
	@echo "  • CODECOV_TOKEN: For coverage reports"
	@echo "  • DISCORD_WEBHOOK_URL: For notifications (already set)"
	@echo "  • PRODUCTION_DATABASE_URL: For production deployments"

# Legacy dev command (maintained for backward compatibility)
dev: backend-db-up
	$(CONCURRENT) "$(FRONTEND_CMD)" "$(BACKEND_CMD)"
