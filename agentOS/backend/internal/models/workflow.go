package models

import (
	"encoding/json"
	"time"
)

type Workflow struct {
	ID        string          `db:"id"         json:"id"`
	ProjectID string          `db:"project_id" json:"project_id"`
	UserID    string          `db:"user_id"    json:"user_id"`
	Name      string          `db:"name"       json:"name"`
	Nodes     json.RawMessage `db:"nodes"      json:"nodes"`
	Edges     json.RawMessage `db:"edges"      json:"edges"`
	Version   int             `db:"version"    json:"version"`
	CreatedAt time.Time       `db:"created_at" json:"created_at"`
	UpdatedAt time.Time       `db:"updated_at" json:"updated_at"`
}

type CreateWorkflowInput struct {
	Name  string          `json:"name" validate:"required,min=1,max=100"`
	Nodes json.RawMessage `json:"nodes"`
	Edges json.RawMessage `json:"edges"`
}

type UpdateWorkflowInput struct {
	Name  *string          `json:"name" validate:"omitempty,min=1,max=100"`
	Nodes *json.RawMessage `json:"nodes"`
	Edges *json.RawMessage `json:"edges"`
}
