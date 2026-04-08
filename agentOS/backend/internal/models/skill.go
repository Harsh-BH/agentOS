package models

import (
	"encoding/json"
	"time"
)

type SkillType string

const (
	SkillTypePrompt SkillType = "prompt"
	SkillTypeTool   SkillType = "tool"
	SkillTypeAgent  SkillType = "agent"
)

type Skill struct {
	ID        string          `db:"id"         json:"id"`
	ProjectID string          `db:"project_id" json:"project_id"`
	UserID    string          `db:"user_id"    json:"user_id"`
	Name      string          `db:"name"       json:"name"`
	Type      SkillType       `db:"type"       json:"type"`
	Config    json.RawMessage `db:"config"     json:"config"`
	CreatedAt time.Time       `db:"created_at" json:"created_at"`
	UpdatedAt time.Time       `db:"updated_at" json:"updated_at"`
}

type CreateSkillInput struct {
	Name   string          `json:"name" validate:"required,min=1,max=100"`
	Type   SkillType       `json:"type" validate:"required,oneof=prompt tool agent"`
	Config json.RawMessage `json:"config"`
}

type UpdateSkillInput struct {
	Name   *string          `json:"name" validate:"omitempty,min=1,max=100"`
	Type   *SkillType       `json:"type" validate:"omitempty,oneof=prompt tool agent"`
	Config *json.RawMessage `json:"config"`
}
