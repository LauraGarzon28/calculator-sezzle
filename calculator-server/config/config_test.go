package config

import (
	"slices"
	"testing"
)

func TestFromEnv(t *testing.T) {
	tests := []struct {
		name string
		env  map[string]string
		want Config
	}{
		{
			name: "defaults",
			env:  map[string]string{},
			want: Config{Port: "8080"},
		},
		{
			name: "custom values",
			env: map[string]string{
				"PORT":            "9090",
				"STATIC_DIR":      "/web",
				"ALLOWED_ORIGINS": " http://localhost:5173, ,http://example.com ",
			},
			want: Config{
				Port:           "9090",
				StaticDir:      "/web",
				AllowedOrigins: []string{"http://localhost:5173", "http://example.com"},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := FromEnv(func(key string) string { return tt.env[key] })

			if got.Port != tt.want.Port || got.StaticDir != tt.want.StaticDir ||
				!slices.Equal(got.AllowedOrigins, tt.want.AllowedOrigins) {
				t.Errorf("got %+v, want %+v", got, tt.want)
			}
		})
	}
}
