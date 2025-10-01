# Top-level Makefile for team-production monorepo

.DEFAULT_GOAL := help

PNPM        := pnpm
BACKEND_DIR := apps/backend
MOBILE_DIR  := apps/mobile

FRONTEND_CMD := node $(MOBILE_DIR)/scripts/start-dev.js
BACKEND_CMD  := $(MAKE) -C $(BACKEND_DIR) serve
CONCURRENT   := $(PNPM) dlx --package concurrently@9.2.1 concurrently --kill-others-on-fail --names "frontend,backend" --prefix-colors "cyan,green"

.PHONY: help install frontend frontend-web frontend-lint backend backend-db-up backend-db-down backend-destroy backend-test dev

help:
	@echo "Available targets:"
	@echo "  make install            # install monorepo dependencies"
	@echo "  make frontend           # start the Expo app"
	@echo "  make frontend-web       # run Expo in web mode"
	@echo "  make frontend-lint      # lint the mobile app"
	@echo "  make backend            # start DB (docker compose) and run the Go API"
	@echo "  make backend-db-up      # only start the database stack"
	@echo "  make backend-db-down    # stop the database stack"
	@echo "  make backend-destroy    # stop database and remove volumes"
	@echo "  make backend-test       # run Go unit tests"
	@echo "  make dev                # start Expo and Go API together (db up beforehand)"

install:
	corepack enable pnpm
	$(PNPM) install

frontend:
	$(PNPM) --dir $(MOBILE_DIR) start

frontend-web:
	$(PNPM) --dir $(MOBILE_DIR) web

frontend-lint:
	$(PNPM) --dir $(MOBILE_DIR) lint

backend:
	$(MAKE) -C $(BACKEND_DIR) run-dev

backend-db-up:
	$(MAKE) -C $(BACKEND_DIR) db-up

backend-db-down:
	$(MAKE) -C $(BACKEND_DIR) db-down

backend-destroy:
	$(MAKE) -C $(BACKEND_DIR) destroy

backend-test:
	$(MAKE) -C $(BACKEND_DIR) test

dev: backend-db-up
	$(CONCURRENT) "$(FRONTEND_CMD)" "$(BACKEND_CMD)"
