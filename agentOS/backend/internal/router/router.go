package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/agentOS/backend/internal/handlers"
	"github.com/yourusername/agentOS/backend/internal/middleware"
)

func Setup(app *fiber.App, secret string, supabaseURL string, ph *handlers.ProjectHandler, sh *handlers.SkillHandler, wh *handlers.WorkflowHandler, ah *handlers.AIHandler, ih *handlers.ImportHandler) {
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	api := app.Group("/api", middleware.Auth(secret, supabaseURL))

	// Projects
	api.Get("/projects", ph.List)
	api.Post("/projects", ph.Create)
	api.Get("/projects/:id", ph.GetByID)
	api.Patch("/projects/:id", ph.Update)
	api.Delete("/projects/:id", ph.Delete)

	// Import & Generation (all consume the shared context pipeline)
	api.Post("/projects/:id/import", ih.ImportRepo)                    // extract context → save
	api.Post("/projects/:id/generate-claude-md", ih.GenerateClaudeMD)  // context → CLAUDE.md
	api.Post("/projects/:id/generate-skills", ih.GenerateSkills)       // context → skills + workflows

	// Skills
	api.Get("/projects/:id/skills", sh.ListByProject)
	api.Post("/projects/:id/skills", sh.Create)
	api.Patch("/skills/:id", sh.Update)
	api.Delete("/skills/:id", sh.Delete)

	// Workflows
	api.Get("/projects/:id/workflows", wh.ListByProject)
	api.Post("/projects/:id/workflows", wh.Create)
	api.Get("/workflows/:id", wh.GetByID)
	api.Patch("/workflows/:id", wh.Update)

	// AI (stubs)
	api.Post("/ai/generate", ah.Generate)
	api.Post("/ai/suggest", ah.Suggest)
	api.Post("/ai/skill", ah.GenerateSkill)
}
