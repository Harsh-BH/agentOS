package services

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/yourusername/agentOS/backend/internal/models"
)

const projectCols = `id, user_id, name, description, context, repo_url, created_at, updated_at`

type ProjectService struct {
	db *pgxpool.Pool
}

func NewProjectService(db *pgxpool.Pool) *ProjectService {
	return &ProjectService{db: db}
}

func scanProject(scan func(dest ...any) error) (models.Project, error) {
	var p models.Project
	err := scan(&p.ID, &p.UserID, &p.Name, &p.Description, &p.Context, &p.RepoURL, &p.CreatedAt, &p.UpdatedAt)
	return p, err
}

func (s *ProjectService) List(ctx context.Context, userID string) ([]models.Project, error) {
	rows, err := s.db.Query(ctx,
		`SELECT `+projectCols+` FROM projects WHERE user_id = $1 ORDER BY updated_at DESC`, userID)
	if err != nil {
		return nil, fmt.Errorf("ProjectService.List: %w", err)
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		p, err := scanProject(rows.Scan)
		if err != nil {
			return nil, fmt.Errorf("ProjectService.List scan: %w", err)
		}
		projects = append(projects, p)
	}
	if projects == nil {
		projects = []models.Project{}
	}
	return projects, nil
}

func (s *ProjectService) GetByID(ctx context.Context, userID, id string) (models.Project, error) {
	p, err := scanProject(s.db.QueryRow(ctx,
		`SELECT `+projectCols+` FROM projects WHERE id = $1 AND user_id = $2`, id, userID).Scan)
	if err != nil {
		return p, fmt.Errorf("ProjectService.GetByID: %w", err)
	}
	return p, nil
}

func (s *ProjectService) Create(ctx context.Context, userID string, input models.CreateProjectInput) (models.Project, error) {
	p, err := scanProject(s.db.QueryRow(ctx,
		`INSERT INTO projects (user_id, name, description, context)
		 VALUES ($1, $2, $3, $4)
		 RETURNING `+projectCols,
		userID, input.Name, input.Description, input.Context).Scan)
	if err != nil {
		return p, fmt.Errorf("ProjectService.Create: %w", err)
	}
	return p, nil
}

func (s *ProjectService) Update(ctx context.Context, userID, id string, input models.UpdateProjectInput) (models.Project, error) {
	current, err := s.GetByID(ctx, userID, id)
	if err != nil {
		return current, fmt.Errorf("ProjectService.Update: %w", err)
	}
	if input.Name != nil {
		current.Name = *input.Name
	}
	if input.Description != nil {
		current.Description = *input.Description
	}
	if input.Context != nil {
		current.Context = *input.Context
	}

	p, err := scanProject(s.db.QueryRow(ctx,
		`UPDATE projects SET name = $1, description = $2, context = $3
		 WHERE id = $4 AND user_id = $5
		 RETURNING `+projectCols,
		current.Name, current.Description, current.Context, id, userID).Scan)
	if err != nil {
		return p, fmt.Errorf("ProjectService.Update: %w", err)
	}
	return p, nil
}

func (s *ProjectService) SetRepoURL(ctx context.Context, userID, id, repoURL string) error {
	_, err := s.db.Exec(ctx,
		`UPDATE projects SET repo_url = $1, updated_at = now() WHERE id = $2 AND user_id = $3`,
		repoURL, id, userID)
	if err != nil {
		return fmt.Errorf("ProjectService.SetRepoURL: %w", err)
	}
	return nil
}

func (s *ProjectService) Delete(ctx context.Context, userID, id string) error {
	tag, err := s.db.Exec(ctx,
		`DELETE FROM projects WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return fmt.Errorf("ProjectService.Delete: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("ProjectService.Delete: %w", ErrNotFound)
	}
	return nil
}
