package main

import (
	"log"
	"os"

	"github.com/TeamH04/team-production/apps/backend/internal/config"
	"github.com/TeamH04/team-production/apps/backend/internal/server"
)

func main() {
	cfg := config.Load()
	e := server.NewRouter(cfg)
	addr := ":" + cfg.Port
	log.Printf("listening on %s", addr)
	if err := e.Start(addr); err != nil {
		log.Println("server stopped:", err)
		os.Exit(1)
	}
}
