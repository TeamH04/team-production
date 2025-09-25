# apps/backend/Makefile
# Usage:
#   make run-dev       # start DB -> wait healthy -> start API with air
#   make destroy       # stop DB and remove volume
#   make migrate       # migrate up using DATABASE_URL
#   make migrate-new name=init_users
#   make tools / lint / format / test / test-ci / test-coverage

SHELL := pwsh.exe
.SHELLFLAGS := -NoProfile -ExecutionPolicy Bypass -Command

MIGRATIONS_DIR := ./migrations
DB_COMPOSE := ../../infra/supabase/docker-compose.yml
PORT ?= 8080

# load .env if present (expects PORT and DATABASE_URL)
ifneq (,$(wildcard .env))
include .env
export
endif

.PHONY: run-dev destroy migrate migrate-new tools lint format test test-ci test-coverage check

run-dev:
	docker compose -f $(DB_COMPOSE) up -d
	$$Env:PORT="$(PORT)"; $$Env:DATABASE_URL="$(DATABASE_URL)"; go run ./cmd/server

destroy:
	docker compose -f $(DB_COMPOSE) down -v

migrate:
	migrate -path $(MIGRATIONS_DIR) -database "$(DATABASE_URL)" up

migrate-new:
	if (-not "$(name)") { throw 'Usage: make migrate-new name=add_users' } ; migrate create -ext sql -dir $(MIGRATIONS_DIR) -seq $(name)

tools:
	go install github.com/swaggo/swag/cmd/swag@v1.16.3
	go install github.com/golang-migrate/migrate/v4/cmd/migrate@v4.17.0

format:
	.bin/golangci-lint.exe run ./... --fix

test:
	go test -v ./...

test-ci:
	go test -v -cover ./... -coverprofile=coverage.txt ; go tool cover -func coverage.txt

test-coverage:
	go test -v -cover ./... -coverprofile=cover.out ; go tool cover -html=cover.out -o cover.html ; go tool cover -func cover.out

check:
	echo "called"
