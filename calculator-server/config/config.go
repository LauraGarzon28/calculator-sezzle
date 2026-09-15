package config

import "strings"

type Config struct {
	Port           string
	StaticDir      string
	AllowedOrigins []string
}

func FromEnv(getenv func(string) string) Config {
	return Config{
		Port:           valueOrDefault(getenv("PORT"), "8080"),
		StaticDir:      getenv("STATIC_DIR"),
		AllowedOrigins: splitList(getenv("ALLOWED_ORIGINS")),
	}
}

func valueOrDefault(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

func splitList(value string) []string {
	var items []string
	for item := range strings.SplitSeq(value, ",") {
		if trimmed := strings.TrimSpace(item); trimmed != "" {
			items = append(items, trimmed)
		}
	}
	return items
}
