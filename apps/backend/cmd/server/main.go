package main

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/config"
	"github.com/TeamH04/team-production/apps/backend/internal/router"
)

func main() {
	// 設定の読み込み
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	// データベース接続
	db, err := gorm.Open(postgres.Open(cfg.DBURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	// 依存性の構築
	deps := buildRouterDependencies(cfg, db)

	// サーバーの構築とルーティング設定
	e := router.NewServer(deps)

	// サーバー起動
	port := cfg.Port
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on port %s", port)
	if err := e.Start(":" + port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
