package services

import (
	"context"
	"errors"
	"fmt"
)

var (
	ErrNotImplemented = errors.New("not implemented")
	ErrNotFound       = errors.New("not found")
)

// AIService handles the stub /api/ai/* endpoints.
// Real AI generation is handled by the claudemd.Pipeline in the import handler.
type AIService struct {
	apiKey string
}

func NewAIService(apiKey string) *AIService {
	return &AIService{apiKey: apiKey}
}

type GenerateRequest struct {
	ProjectID string `json:"project_id"`
	Prompt    string `json:"prompt"`
}

type GenerateResponse struct {
	Content string `json:"content"`
}

func (s *AIService) Generate(ctx context.Context, req GenerateRequest) (GenerateResponse, error) {
	return GenerateResponse{}, fmt.Errorf("AIService.Generate: %w", ErrNotImplemented)
}
