package handlers

import (
	"encoding/json"
	"log"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/agentOS/backend/internal/claudemd"
	"github.com/yourusername/agentOS/backend/internal/models"
	"github.com/yourusername/agentOS/backend/internal/services"
)

type ImportHandler struct {
	pipeline  *claudemd.Pipeline
	projects  *services.ProjectService
	skills    *services.SkillService
	workflows *services.WorkflowService
}

func NewImportHandler(
	apiKey string,
	projects *services.ProjectService,
	skills *services.SkillService,
	workflows *services.WorkflowService,
) *ImportHandler {
	return &ImportHandler{
		pipeline:  claudemd.NewPipeline(apiKey),
		projects:  projects,
		skills:    skills,
		workflows: workflows,
	}
}

type importRequest struct {
	RepoURL      string `json:"repo_url"`
	Branch       string `json:"branch"`
	IncludeTests bool   `json:"include_tests"`
}

// ImportRepo handles POST /api/projects/:id/import
// Extracts repo context (stages 1-5) and saves it to project.context.
// Does NOT generate anything yet — user chooses what to generate next.
func (h *ImportHandler) ImportRepo(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	projectID := c.Params("id")

	var req importRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.RepoURL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "repo_url is required"})
	}

	// Verify project ownership
	if _, err := h.projects.GetByID(c.Context(), userID, projectID); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "project not found"})
	}

	// Parse GitHub URL
	info, err := services.ParseRepoURL(req.RepoURL)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	cfg := claudemd.DefaultConfig()
	if req.Branch != "" {
		cfg.TargetBranch = req.Branch
	}
	cfg.IncludeTests = req.IncludeTests

	// Stage 1-5: Extract context
	log.Printf("[import] extracting context for %s/%s → project %s", info.Owner, info.Repo, projectID)
	repoCtx, err := h.pipeline.ExtractContext(c.Context(), info.Owner, info.Repo, cfg)
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
			"error": "context extraction failed: " + err.Error(),
		})
	}

	// Serialize and save context to project
	contextJSON, _ := json.Marshal(repoCtx)
	contextStr := string(contextJSON)
	_ = h.projects.SetRepoURL(c.Context(), userID, projectID, req.RepoURL)
	_, _ = h.projects.Update(c.Context(), userID, projectID, models.UpdateProjectInput{
		Context: &contextStr,
	})

	log.Printf("[import] context saved: %d files scanned, %d ranked, ~%d tokens", repoCtx.FilesScanned, repoCtx.FilesRanked, repoCtx.TokensUsed)

	return c.JSON(fiber.Map{
		"message":       "Repository context extracted and saved",
		"files_scanned": repoCtx.FilesScanned,
		"files_ranked":  repoCtx.FilesRanked,
		"stack":         repoCtx.Stack,
		"tokens_used":   repoCtx.TokensUsed,
	})
}

// GenerateClaudeMD handles POST /api/projects/:id/generate-claude-md
// Reads saved context from project, generates CLAUDE.md via Claude.
func (h *ImportHandler) GenerateClaudeMD(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	projectID := c.Params("id")

	repoCtx, err := h.loadContext(c, userID, projectID)
	if err != nil {
		return err // already sent HTTP response
	}

	log.Printf("[generate] CLAUDE.md for %s/%s", repoCtx.Owner, repoCtx.Repo)
	result, err := h.pipeline.GenerateClaudeMD(c.Context(), repoCtx)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "CLAUDE.md generation failed: " + err.Error(),
		})
	}

	return c.JSON(result)
}

// GenerateSkills handles POST /api/projects/:id/generate-skills
// Reads saved context, generates skills + workflows via Claude, saves them to DB.
func (h *ImportHandler) GenerateSkills(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	projectID := c.Params("id")

	repoCtx, err := h.loadContext(c, userID, projectID)
	if err != nil {
		return err
	}

	log.Printf("[generate] skills+workflows for %s/%s", repoCtx.Owner, repoCtx.Repo)
	analysis, err := h.pipeline.GenerateSkillsWorkflows(c.Context(), repoCtx)
	if err != nil {
		status := fiber.StatusInternalServerError
		errMsg := err.Error()
		if strings.Contains(errMsg, "rate_limit") || strings.Contains(errMsg, "429") {
			status = fiber.StatusTooManyRequests
			errMsg = "AI rate limit reached — please wait a minute and try again"
		}
		return c.Status(status).JSON(fiber.Map{
			"error": errMsg,
		})
	}

	// Save skills to DB
	var savedSkills []models.Skill
	for _, gs := range analysis.Skills {
		configBytes, _ := json.Marshal(gs.Config)
		if gs.Config == nil {
			configBytes = []byte("{}")
		}
		skillType := models.SkillType(gs.Type)
		if skillType != models.SkillTypePrompt && skillType != models.SkillTypeTool && skillType != models.SkillTypeAgent {
			skillType = models.SkillTypePrompt
		}
		sk, err := h.skills.Create(c.Context(), userID, projectID, models.CreateSkillInput{
			Name:   gs.Name,
			Type:   skillType,
			Config: configBytes,
		})
		if err != nil {
			log.Printf("[generate] warning: failed to save skill %q: %v", gs.Name, err)
			continue
		}
		savedSkills = append(savedSkills, sk)
	}

	// Save workflows to DB
	var savedWorkflows []models.Workflow
	for _, gw := range analysis.Workflows {
		nodesBytes := gw.Nodes
		if nodesBytes == nil {
			nodesBytes = []byte("[]")
		}
		edgesBytes := gw.Edges
		if edgesBytes == nil {
			edgesBytes = []byte("[]")
		}
		wf, err := h.workflows.Create(c.Context(), userID, projectID, models.CreateWorkflowInput{
			Name:  gw.Name,
			Nodes: nodesBytes,
			Edges: edgesBytes,
		})
		if err != nil {
			log.Printf("[generate] warning: failed to save workflow %q: %v", gw.Name, err)
			continue
		}
		savedWorkflows = append(savedWorkflows, wf)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"summary":           analysis.Summary,
		"skills_created":    len(savedSkills),
		"workflows_created": len(savedWorkflows),
		"skills":            savedSkills,
		"workflows":         savedWorkflows,
	})
}

// loadContext reads and deserializes the saved RepoContext from project.context.
func (h *ImportHandler) loadContext(c *fiber.Ctx, userID, projectID string) (*claudemd.RepoContext, error) {
	project, err := h.projects.GetByID(c.Context(), userID, projectID)
	if err != nil {
		_ = c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "project not found"})
		return nil, err
	}
	if project.Context == "" {
		_ = c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "no repo context found — import a GitHub repo first",
		})
		return nil, fiber.ErrBadRequest
	}

	var repoCtx claudemd.RepoContext
	if err := json.Unmarshal([]byte(project.Context), &repoCtx); err != nil {
		_ = c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "saved context is not valid — re-import the repo",
		})
		return nil, err
	}
	if repoCtx.Prompt == "" {
		_ = c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "saved context has no prompt — re-import the repo",
		})
		return nil, fiber.ErrBadRequest
	}
	return &repoCtx, nil
}
