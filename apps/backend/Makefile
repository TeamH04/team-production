# apps/backend/Makefile (cross-platform friendly, no PowerShell noise)

.DEFAULT_GOAL := help

MIGRATIONS_DIR         := ./migrations
DB_COMPOSE             := ../../supabase/docker-compose.yml
LOCAL_DATABASE_URL    ?= postgres://postgres:postgres@localhost:5432/app?sslmode=disable
MIGRATE_DATABASE_URL  ?= $(LOCAL_DATABASE_URL)

# Go executable: assume it's on PATH (override with GO_BIN=... if必要なら)
GO_BIN ?= go

# Helper to execute Go commands (same on all OS)
GO_EXEC = $(GO_BIN) $(1)

# Use docker compose v2 style CLI
DOCKER_COMPOSE ?= docker-compose

PORT ?= 8080

ifneq (,$(wildcard .env))
include .env
export
endif

.PHONY: help run-dev serve db-up db-down destroy db-init tools migrate migrate-new test check

help:
	@echo "Available targets:"
	@echo "  make run-dev        # start database (docker compose) and run the API server"
	@echo "  make db-up          # start only the database stack"
	@echo "  make db-down        # stop the database containers"
	@echo "  make destroy        # stop database and remove volumes"
	@echo "  make db-init        # run migrations against the local Docker database"
	@echo "  make serve          # run the Go server (requires a running database)"
	@echo "  make migrate        # apply SQL migrations"
	@echo "  make migrate-new name=<name>  # create a new timestamped migration"
	@echo "  make tools          # install CLI tools (swag, migrate)"
	@echo "  make test           # run unit tests"
	@echo "  make check          # simple readiness probe"

run-dev: db-up serve

serve:
	$(GO_BIN) run ./cmd/server

db-up:
	$(DOCKER_COMPOSE) -f $(DB_COMPOSE) up -d

db-down:
	$(DOCKER_COMPOSE) -f $(DB_COMPOSE) down

destroy:
	$(DOCKER_COMPOSE) -f $(DB_COMPOSE) down -v

db-init: db-up
	migrate -path $(MIGRATIONS_DIR) -database "$(LOCAL_DATABASE_URL)" up

tools:
	$(GO_BIN) install github.com/swaggo/swag/cmd/swag@v1.16.3
	$(GO_BIN) install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.17.0

migrate:
	$(if $(strip $(MIGRATE_DATABASE_URL)),,$(error MIGRATE_DATABASE_URL is not set; set it or rely on LOCAL_DATABASE_URL))
	migrate -path $(MIGRATIONS_DIR) -database "$(MIGRATE_DATABASE_URL)" up

migrate-new:
	$(if $(name),,$(error name is required: use `make migrate-new name=...`))
	migrate create -ext sql -dir $(MIGRATIONS_DIR) -seq $(name)

test:
	$(GO_BIN) test -v ./...

check:
	@echo ok
