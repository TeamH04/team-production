# apps/backend/Makefile (cross-platform friendly)

.DEFAULT_GOAL := help

MIGRATIONS_DIR := ./migrations
DB_COMPOSE     := ../../infra/supabase/docker-compose.yml

# Detect Go executable in a cross-platform manner.
ifeq ($(OS),Windows_NT)
  GO_BIN ?= $(shell powershell -NoProfile -Command "$$cmd = Get-Command go -ErrorAction SilentlyContinue; if ($$cmd) { $$cmd.Source }")
else
  GO_BIN ?= $(shell command -v go 2>/dev/null)
endif
ifeq ($(strip $(GO_BIN)),)
  ifneq ($(OS),Windows_NT)
    GO_BIN := $(shell which go 2>/dev/null)
  endif
endif
ifeq ($(strip $(GO_BIN)),)
  ifeq ($(OS),Windows_NT)
    ifneq ($(wildcard C:/Program\ Files/Go/bin/go.exe),)
      GO_BIN := C:/Program Files/Go/bin/go.exe
    else ifneq ($(wildcard C:/Go/bin/go.exe),)
      GO_BIN := C:/Go/bin/go.exe
    endif
  endif
endif
GO_BIN := $(strip $(GO_BIN))
ifeq ($(GO_BIN),)
  $(error Go executable not found. Install Go 1.23+ and ensure it is on PATH or run `make backend GO_BIN="/full/path/to/go"`.)
endif

# Helper to execute Go commands with proper quoting on Windows.
GO_EXEC = $(if $(filter Windows_NT,$(OS)),powershell -NoProfile -Command "& '$(GO_BIN)' $(1)",$(GO_BIN) $(1))
DOCKER_COMPOSE := docker compose

PORT ?= 8080

ifneq (,$(wildcard .env))
include .env
export
endif

.PHONY: help run-dev serve db-up db-down destroy tools migrate migrate-new test check

help:
	@echo "Available targets:"
	@echo "  make run-dev        # start database (docker compose) and run the API server"
	@echo "  make db-up          # start only the database stack"
	@echo "  make db-down        # stop the database containers"
	@echo "  make destroy        # stop database and remove volumes"
	@echo "  make serve          # run the Go server (requires a running database)"
	@echo "  make migrate        # apply SQL migrations"
	@echo "  make migrate-new name=<name>  # create a new timestamped migration"
	@echo "  make tools          # install CLI tools (swag, migrate)"
	@echo "  make test           # run unit tests"
	@echo "  make check          # simple readiness probe"

run-dev: db-up serve

serve:
	$(call GO_EXEC,run ./cmd/server)

db-up:
	$(DOCKER_COMPOSE) -f $(DB_COMPOSE) up -d

db-down:
	$(DOCKER_COMPOSE) -f $(DB_COMPOSE) down

destroy:
	$(DOCKER_COMPOSE) -f $(DB_COMPOSE) down -v

tools:
	$(call GO_EXEC,install github.com/swaggo/swag/cmd/swag@v1.16.3)
	$(call GO_EXEC,install github.com/golang-migrate/migrate/v4/cmd/migrate@v4.17.0)

migrate:
	$(if $(strip $(DATABASE_URL)),,$(error DATABASE_URL is not set; configure it in .env))
	migrate -path $(MIGRATIONS_DIR) -database "$(DATABASE_URL)" up

migrate-new:
	$(if $(name),,$(error name is required: use `make migrate-new name=...`))
	migrate create -ext sql -dir $(MIGRATIONS_DIR) -seq $(name)

test:
	$(call GO_EXEC,test -v ./...)

check:
	@echo ok
