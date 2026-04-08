package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	fiberlogger "github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/yourusername/agentOS/backend/internal/config"
	"github.com/yourusername/agentOS/backend/internal/db"
	"github.com/yourusername/agentOS/backend/internal/handlers"
	"github.com/yourusername/agentOS/backend/internal/router"
	"github.com/yourusername/agentOS/backend/internal/services"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Services
	projectSvc := services.NewProjectService(pool)
	skillSvc := services.NewSkillService(pool)
	workflowSvc := services.NewWorkflowService(pool)
	aiSvc := services.NewAIService(cfg.AnthropicAPIKey)

	// Handlers
	projectH := handlers.NewProjectHandler(projectSvc)
	skillH := handlers.NewSkillHandler(skillSvc)
	workflowH := handlers.NewWorkflowHandler(workflowSvc)
	aiH := handlers.NewAIHandler(aiSvc)
	importH := handlers.NewImportHandler(cfg.AnthropicAPIKey, projectSvc, skillSvc, workflowSvc)

	// Fiber app
	app := fiber.New(fiber.Config{
		AppName: "AgentOS API",
	})

	app.Use(fiberlogger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.FrontendURL,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

		jwtSecret := cfg.SupabaseJWTSecret
	if jwtSecret == "" {
		jwtSecret = cfg.SupabaseServiceRoleKey
	}
	router.Setup(app, jwtSecret, cfg.SupabaseURL, projectH, skillH, workflowH, aiH, importH)

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		log.Println("shutting down...")
		cancel()
		_ = app.Shutdown()
	}()

	log.Printf("starting AgentOS API on :%s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
