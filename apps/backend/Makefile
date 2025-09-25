# apps/backend/Makefile  (cross-platform, no PowerShell/Bash tricks, no air)

# ---- config ----
MIGRATIONS_DIR := ./migrations
DB_COMPOSE     := ../../infra/supabase/docker-compose.yml
PORT           ?= 8080

# .env の内容を環境変数として全ターゲットにエクスポート（PORT, DATABASE_URL など）
ifneq (,$(wildcard .env))
include .env
export
endif

.PHONY: run-dev run destroy tools migrate migrate-new test check

## DB を起動してから API を起動（ホットリロードなし）
run-dev:
	docker compose -f $(DB_COMPOSE) up -d
	go run ./cmd/server

## DB を停止してボリュームも削除
destroy:
	docker compose -f $(DB_COMPOSE) down -v

tools:
	go install github.com/swaggo/swag/cmd/swag@v1.16.3
	go install github.com/golang-migrate/migrate/v4/cmd/migrate@v4.17.0

## マイグレーション適用（.env の DATABASE_URL 先に）
migrate:
	migrate -path $(MIGRATIONS_DIR) -database "$(DATABASE_URL)" up

## 新規マイグレーション作成（例: make migrate-new name=init_users）
migrate-new:
	$(if $(name),,$(error name is required: use `make migrate-new name=...`))
	migrate create -ext sql -dir $(MIGRATIONS_DIR) -seq $(name)

## テスト
test:
	go test -v ./...

check:
	@echo ok
