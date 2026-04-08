package services

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/yourusername/agentOS/backend/internal/models"
)

type WorkflowService struct {
	db *pgxpool.Pool
}

func NewWorkflowService(db *pgxpool.Pool) *WorkflowService {
	return &WorkflowService{db: db}
}

func (s *WorkflowService) ListByProject(ctx context.Context, userID, projectID string) ([]models.Workflow, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, project_id, user_id, name, nodes, edges, version, created_at, updated_at
		 FROM workflows WHERE project_id = $1 AND user_id = $2 ORDER BY updated_at DESC`,
		projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("WorkflowService.ListByProject: %w", err)
	}
	defer rows.Close()

	var workflows []models.Workflow
	for rows.Next() {
		var w models.Workflow
		if err := rows.Scan(&w.ID, &w.ProjectID, &w.UserID, &w.Name, &w.Nodes, &w.Edges, &w.Version, &w.CreatedAt, &w.UpdatedAt); err != nil {
			return nil, fmt.Errorf("WorkflowService.ListByProject scan: %w", err)
		}
		workflows = append(workflows, w)
	}
	if workflows == nil {
		workflows = []models.Workflow{}
	}
	return workflows, nil
}

func (s *WorkflowService) GetByID(ctx context.Context, userID, id string) (models.Workflow, error) {
	var w models.Workflow
	err := s.db.QueryRow(ctx,
		`SELECT id, project_id, user_id, name, nodes, edges, version, created_at, updated_at
		 FROM workflows WHERE id = $1 AND user_id = $2`, id, userID).
		Scan(&w.ID, &w.ProjectID, &w.UserID, &w.Name, &w.Nodes, &w.Edges, &w.Version, &w.CreatedAt, &w.UpdatedAt)
	if err != nil {
		return w, fmt.Errorf("WorkflowService.GetByID: %w", err)
	}
	return w, nil
}

func (s *WorkflowService) Create(ctx context.Context, userID, projectID string, input models.CreateWorkflowInput) (models.Workflow, error) {
	nodes := input.Nodes
	if nodes == nil {
		nodes = []byte("[]")
	}
	edges := input.Edges
	if edges == nil {
		edges = []byte("[]")
	}
	var w models.Workflow
	err := s.db.QueryRow(ctx,
		`INSERT INTO workflows (project_id, user_id, name, nodes, edges)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, project_id, user_id, name, nodes, edges, version, created_at, updated_at`,
		projectID, userID, input.Name, nodes, edges).
		Scan(&w.ID, &w.ProjectID, &w.UserID, &w.Name, &w.Nodes, &w.Edges, &w.Version, &w.CreatedAt, &w.UpdatedAt)
	if err != nil {
		return w, fmt.Errorf("WorkflowService.Create: %w", err)
	}
	return w, nil
}

func (s *WorkflowService) Update(ctx context.Context, userID, id string, input models.UpdateWorkflowInput) (models.Workflow, error) {
	current, err := s.GetByID(ctx, userID, id)
	if err != nil {
		return current, fmt.Errorf("WorkflowService.Update: %w", err)
	}

	if input.Name != nil {
		current.Name = *input.Name
	}
	if input.Nodes != nil {
		current.Nodes = *input.Nodes
	}
	if input.Edges != nil {
		current.Edges = *input.Edges
	}

	var w models.Workflow
	err = s.db.QueryRow(ctx,
		`UPDATE workflows SET name = $1, nodes = $2, edges = $3, version = version + 1
		 WHERE id = $4 AND user_id = $5
		 RETURNING id, project_id, user_id, name, nodes, edges, version, created_at, updated_at`,
		current.Name, current.Nodes, current.Edges, id, userID).
		Scan(&w.ID, &w.ProjectID, &w.UserID, &w.Name, &w.Nodes, &w.Edges, &w.Version, &w.CreatedAt, &w.UpdatedAt)
	if err != nil {
		return w, fmt.Errorf("WorkflowService.Update: %w", err)
	}
	return w, nil
}
