# apps/backend/Makefile

.DEFAULT_GOAL := help

MIGRATIONS_DIR        := ./migrations
DB_COMPOSE            := ../../docker-compose.yml
LOCAL_DATABASE_URL   ?= postgres://postgres:postgres@localhost:5432/app?sslmode=disable
MIGRATE_DATABASE_URL ?= $(LOCAL_DATABASE_URL)

# Go binary detection
GO_BIN ?= go

ifeq ($(OS),Windows_NT)
  ifeq ($(GO_BIN),go)
    ifneq ($(wildcard C:/Program\ Files/Go/bin/go.exe),)
      GO_BIN := "C:/Program Files/Go/bin/go.exe"
    else ifneq ($(wildcard C:/Go/bin/go.exe),)
      GO_BIN := "C:/Go/bin/go.exe"
    endif
  endif
endif

DOCKER_COMPOSE := docker compose
PORT ?= 8080

ifneq (,$(wildcard .env))
include .env
export
endif

.PHONY: help serve db-start db-stop db-migrate db-reset db-destroy tools lint fmt test

help:
	@echo "Available targets:"
	@echo "  make serve       # Run the Go server locally"
	@echo "  make db-start    # Start database (PostgreSQL + pgAdmin)"
	@echo "  make db-stop     # Stop database"
	@echo "  make db-migrate  # Run database migrations"
	@echo "  make db-reset    # Reset database (drop + migrate)"
	@echo "  make db-destroy  # Destroy database (remove volumes)"
	@echo "  make tools       # Install CLI tools (migrate)"
	@echo "  make lint        # Run golangci-lint"
	@echo "  make fmt         # Run gofumpt"
	@echo "  make test        # Run tests"

serve:
	$(GO_BIN) run ./cmd/server

db-start:
	$(DOCKER_COMPOSE) -f $(DB_COMPOSE) up -d db pgadmin

db-stop:
	$(DOCKER_COMPOSE) -f $(DB_COMPOSE) stop db pgadmin

db-migrate: db-start
	migrate -path $(MIGRATIONS_DIR) -database "$(LOCAL_DATABASE_URL)" up

db-reset: db-start
	migrate -path $(MIGRATIONS_DIR) -database "$(LOCAL_DATABASE_URL)" drop -f
	migrate -path $(MIGRATIONS_DIR) -database "$(LOCAL_DATABASE_URL)" up

db-destroy:
	$(DOCKER_COMPOSE) -f $(DB_COMPOSE) down -v

tools:
	$(GO_BIN) install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.17.0
	$(GO_BIN) install github.com/golangci/golangci-lint/cmd/golangci-lint@v1.61.0
	$(GO_BIN) install mvdan.cc/gofumpt@v0.6.0

lint:
	@command -v golangci-lint >/dev/null 2>&1 || { echo "golangci-lint not found. Run: make tools"; exit 1; }
	golangci-lint run ./...

fmt:
	@command -v gofumpt >/dev/null 2>&1 || { echo "gofumpt not found. Run: make tools"; exit 1; }
	gofumpt -w .

test:
	$(GO_BIN) test -race -coverprofile=coverage.out -count=1 ./...
	@$(GO_BIN) tool cover -func=coverage.out | grep total
	@rm -f coverage.out
