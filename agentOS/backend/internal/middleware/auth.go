package middleware

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"sync"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// Auth creates a middleware that verifies Supabase JWTs.
// It supports both HMAC (HS256) and ECDSA (ES256) signing methods.
// For ES256, it fetches the JWKS from Supabase.
func Auth(secret string, supabaseURL string) fiber.Handler {
	jwks := &jwksCache{supabaseURL: supabaseURL}

	return func(c *fiber.Ctx) error {
		auth := c.Get("Authorization")
		if auth == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "missing authorization header",
			})
		}

		tokenString := strings.TrimPrefix(auth, "Bearer ")
		if tokenString == auth {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid authorization format",
			})
		}

		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			switch t.Method.(type) {
			case *jwt.SigningMethodHMAC:
				return []byte(secret), nil
			case *jwt.SigningMethodECDSA:
				kid, _ := t.Header["kid"].(string)
				return jwks.getKey(kid)
			default:
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
		})
		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid or expired token",
			})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid token claims",
			})
		}

		sub, ok := claims["sub"].(string)
		if !ok || sub == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "missing user id in token",
			})
		}

		c.Locals("userID", sub)
		return c.Next()
	}
}

// jwksCache fetches and caches the JWKS from Supabase for ES256 verification.
type jwksCache struct {
	supabaseURL string
	mu          sync.RWMutex
	keys        map[string]interface{} // kid -> parsed public key
}

func (j *jwksCache) getKey(kid string) (interface{}, error) {
	j.mu.RLock()
	if j.keys != nil {
		if key, ok := j.keys[kid]; ok {
			j.mu.RUnlock()
			return key, nil
		}
	}
	j.mu.RUnlock()

	// Fetch JWKS
	return j.fetchAndCache(kid)
}

func (j *jwksCache) fetchAndCache(kid string) (interface{}, error) {
	j.mu.Lock()
	defer j.mu.Unlock()

	// Double-check after acquiring write lock
	if j.keys != nil {
		if key, ok := j.keys[kid]; ok {
			return key, nil
		}
	}

	url := strings.TrimRight(j.supabaseURL, "/") + "/auth/v1/.well-known/jwks.json"
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read JWKS response: %w", err)
	}

	var jwksResp struct {
		Keys []json.RawMessage `json:"keys"`
	}
	if err := json.Unmarshal(body, &jwksResp); err != nil {
		return nil, fmt.Errorf("failed to parse JWKS: %w", err)
	}

	j.keys = make(map[string]interface{})
	for _, rawKey := range jwksResp.Keys {
		var header struct {
			Kid string `json:"kid"`
			Kty string `json:"kty"`
		}
		if err := json.Unmarshal(rawKey, &header); err != nil {
			continue
		}

		key, err := parseJWK(rawKey)
		if err != nil {
			continue
		}
		j.keys[header.Kid] = key
	}

	if key, ok := j.keys[kid]; ok {
		return key, nil
	}
	return nil, fmt.Errorf("key %q not found in JWKS", kid)
}

// parseJWK parses a JSON Web Key into a crypto public key.
func parseJWK(raw json.RawMessage) (interface{}, error) {
	var header struct {
		Kty string `json:"kty"`
		Crv string `json:"crv"`
		X   string `json:"x"`
		Y   string `json:"y"`
	}
	if err := json.Unmarshal(raw, &header); err != nil {
		return nil, err
	}

	switch header.Kty {
	case "EC":
		return parseECKey(header.Crv, header.X, header.Y)
	default:
		return nil, fmt.Errorf("unsupported key type: %s", header.Kty)
	}
}

func parseECKey(crv, xB64, yB64 string) (interface{}, error) {
	var curve elliptic.Curve
	switch crv {
	case "P-256":
		curve = elliptic.P256()
	case "P-384":
		curve = elliptic.P384()
	case "P-521":
		curve = elliptic.P521()
	default:
		return nil, fmt.Errorf("unsupported curve: %s", crv)
	}

	xBytes, err := base64.RawURLEncoding.DecodeString(xB64)
	if err != nil {
		return nil, fmt.Errorf("failed to decode x: %w", err)
	}
	yBytes, err := base64.RawURLEncoding.DecodeString(yB64)
	if err != nil {
		return nil, fmt.Errorf("failed to decode y: %w", err)
	}

	return &ecdsa.PublicKey{
		Curve: curve,
		X:     new(big.Int).SetBytes(xBytes),
		Y:     new(big.Int).SetBytes(yBytes),
	}, nil
}
