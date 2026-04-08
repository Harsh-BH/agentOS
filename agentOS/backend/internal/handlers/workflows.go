package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/agentOS/backend/internal/models"
	"github.com/yourusername/agentOS/backend/internal/services"
)

type WorkflowHandler struct {
	svc *services.WorkflowService
}

func NewWorkflowHandler(svc *services.WorkflowService) *WorkflowHandler {
	return &WorkflowHandler{svc: svc}
}

func (h *WorkflowHandler) ListByProject(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	projectID := c.Params("id")

	workflows, err := h.svc.ListByProject(c.Context(), userID, projectID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(workflows)
}

func (h *WorkflowHandler) Create(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	projectID := c.Params("id")

	var input models.CreateWorkflowInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if input.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name is required"})
	}

	workflow, err := h.svc.Create(c.Context(), userID, projectID, input)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(workflow)
}

func (h *WorkflowHandler) GetByID(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	id := c.Params("id")

	workflow, err := h.svc.GetByID(c.Context(), userID, id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "workflow not found"})
	}
	return c.JSON(workflow)
}

func (h *WorkflowHandler) Update(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	id := c.Params("id")

	var input models.UpdateWorkflowInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	workflow, err := h.svc.Update(c.Context(), userID, id, input)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(workflow)
}
