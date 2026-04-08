package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/agentOS/backend/internal/models"
	"github.com/yourusername/agentOS/backend/internal/services"
)

type SkillHandler struct {
	svc *services.SkillService
}

func NewSkillHandler(svc *services.SkillService) *SkillHandler {
	return &SkillHandler{svc: svc}
}

func (h *SkillHandler) ListByProject(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	projectID := c.Params("id")

	skills, err := h.svc.ListByProject(c.Context(), userID, projectID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(skills)
}

func (h *SkillHandler) Create(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	projectID := c.Params("id")

	var input models.CreateSkillInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if input.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name is required"})
	}
	if input.Type == "" {
		input.Type = models.SkillTypePrompt
	}

	skill, err := h.svc.Create(c.Context(), userID, projectID, input)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(skill)
}

func (h *SkillHandler) Update(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	id := c.Params("id")

	var input models.UpdateSkillInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	skill, err := h.svc.Update(c.Context(), userID, id, input)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(skill)
}

func (h *SkillHandler) Delete(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	id := c.Params("id")

	err := h.svc.Delete(c.Context(), userID, id)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "skill not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "deleted"})
}
