package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/agentOS/backend/internal/services"
)

type AIHandler struct {
	svc *services.AIService
}

func NewAIHandler(svc *services.AIService) *AIHandler {
	return &AIHandler{svc: svc}
}

func (h *AIHandler) Generate(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "AI generation not yet implemented — connect your ANTHROPIC_API_KEY",
	})
}

func (h *AIHandler) Suggest(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "AI suggestions not yet implemented",
	})
}

func (h *AIHandler) GenerateSkill(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "AI skill generation not yet implemented",
	})
}
