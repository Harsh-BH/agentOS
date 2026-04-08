package models

import "time"

type Project struct {
	ID          string    `db:"id"          json:"id"`
	UserID      string    `db:"user_id"     json:"user_id"`
	Name        string    `db:"name"        json:"name"`
	Description string    `db:"description" json:"description"`
	Context     string    `db:"context"     json:"context"`
	RepoURL     string    `db:"repo_url"    json:"repo_url"`
	CreatedAt   time.Time `db:"created_at"  json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"  json:"updated_at"`
}

type CreateProjectInput struct {
	Name        string `json:"name" validate:"required,min=1,max=100"`
	Description string `json:"description" validate:"max=500"`
	Context     string `json:"context"`
}

type UpdateProjectInput struct {
	Name        *string `json:"name" validate:"omitempty,min=1,max=100"`
	Description *string `json:"description" validate:"omitempty,max=500"`
	Context     *string `json:"context"`
}
