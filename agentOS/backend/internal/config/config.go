package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                  string
	Env                   string
	FrontendURL           string
	SupabaseURL           string
	SupabaseAnonKey       string
	SupabaseServiceRoleKey string
	SupabaseJWTSecret     string
	AnthropicAPIKey       string
	DatabaseURL           string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		Port:                  getEnv("PORT", "8080"),
		Env:                   getEnv("ENV", "development"),
		FrontendURL:           getEnv("FRONTEND_URL", "http://localhost:3000"),
		SupabaseURL:           os.Getenv("SUPABASE_URL"),
		SupabaseAnonKey:       os.Getenv("SUPABASE_ANON_KEY"),
		SupabaseServiceRoleKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
		SupabaseJWTSecret:     os.Getenv("SUPABASE_JWT_SECRET"),
		AnthropicAPIKey:       os.Getenv("ANTHROPIC_API_KEY"),
		DatabaseURL:           os.Getenv("DATABASE_URL"),
	}

	if cfg.SupabaseServiceRoleKey == "" {
		return nil, fmt.Errorf("config.Load: SUPABASE_SERVICE_ROLE_KEY is required")
	}
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("config.Load: DATABASE_URL is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
