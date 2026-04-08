package services

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/yourusername/agentOS/backend/internal/models"
)

type SkillService struct {
	db *pgxpool.Pool
}

func NewSkillService(db *pgxpool.Pool) *SkillService {
	return &SkillService{db: db}
}

func (s *SkillService) ListByProject(ctx context.Context, userID, projectID string) ([]models.Skill, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, project_id, user_id, name, type, config, created_at, updated_at
		 FROM skills WHERE project_id = $1 AND user_id = $2 ORDER BY created_at DESC`,
		projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("SkillService.ListByProject: %w", err)
	}
	defer rows.Close()

	var skills []models.Skill
	for rows.Next() {
		var sk models.Skill
		if err := rows.Scan(&sk.ID, &sk.ProjectID, &sk.UserID, &sk.Name, &sk.Type, &sk.Config, &sk.CreatedAt, &sk.UpdatedAt); err != nil {
			return nil, fmt.Errorf("SkillService.ListByProject scan: %w", err)
		}
		skills = append(skills, sk)
	}
	if skills == nil {
		skills = []models.Skill{}
	}
	return skills, nil
}

func (s *SkillService) Create(ctx context.Context, userID, projectID string, input models.CreateSkillInput) (models.Skill, error) {
	config := input.Config
	if config == nil {
		config = []byte("{}")
	}
	var sk models.Skill
	err := s.db.QueryRow(ctx,
		`INSERT INTO skills (project_id, user_id, name, type, config)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, project_id, user_id, name, type, config, created_at, updated_at`,
		projectID, userID, input.Name, input.Type, config).
		Scan(&sk.ID, &sk.ProjectID, &sk.UserID, &sk.Name, &sk.Type, &sk.Config, &sk.CreatedAt, &sk.UpdatedAt)
	if err != nil {
		return sk, fmt.Errorf("SkillService.Create: %w", err)
	}
	return sk, nil
}

func (s *SkillService) Update(ctx context.Context, userID, id string, input models.UpdateSkillInput) (models.Skill, error) {
	// Fetch current
	var current models.Skill
	err := s.db.QueryRow(ctx,
		`SELECT id, project_id, user_id, name, type, config, created_at, updated_at
		 FROM skills WHERE id = $1 AND user_id = $2`, id, userID).
		Scan(&current.ID, &current.ProjectID, &current.UserID, &current.Name, &current.Type, &current.Config, &current.CreatedAt, &current.UpdatedAt)
	if err != nil {
		return current, fmt.Errorf("SkillService.Update fetch: %w", err)
	}

	if input.Name != nil {
		current.Name = *input.Name
	}
	if input.Type != nil {
		current.Type = *input.Type
	}
	if input.Config != nil {
		current.Config = *input.Config
	}

	var sk models.Skill
	err = s.db.QueryRow(ctx,
		`UPDATE skills SET name = $1, type = $2, config = $3
		 WHERE id = $4 AND user_id = $5
		 RETURNING id, project_id, user_id, name, type, config, created_at, updated_at`,
		current.Name, current.Type, current.Config, id, userID).
		Scan(&sk.ID, &sk.ProjectID, &sk.UserID, &sk.Name, &sk.Type, &sk.Config, &sk.CreatedAt, &sk.UpdatedAt)
	if err != nil {
		return sk, fmt.Errorf("SkillService.Update: %w", err)
	}
	return sk, nil
}

func (s *SkillService) Delete(ctx context.Context, userID, id string) error {
	tag, err := s.db.Exec(ctx,
		`DELETE FROM skills WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return fmt.Errorf("SkillService.Delete: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("SkillService.Delete: %w", ErrNotFound)
	}
	return nil
}
