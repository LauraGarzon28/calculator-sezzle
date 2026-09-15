package api

import (
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"path"
	"strings"

	httpSwagger "github.com/swaggo/http-swagger/v2"
)

type RouterOptions struct {
	StaticDir      string
	AllowedOrigins []string
}

func NewRouter(h *Handler, logger *slog.Logger, opts RouterOptions) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/v1/health", h.Health)
	mux.HandleFunc("GET /api/v1/operations", h.ListOperations)
	mux.HandleFunc("POST /api/v1/operations/{operation}", h.Calculate)
	mux.Handle("GET /swagger/", httpSwagger.WrapHandler)
	mux.HandleFunc("/api/", h.NotFound)

	if opts.StaticDir != "" {
		mux.Handle("/", spaHandler(opts.StaticDir))
	}

	return chain(mux, recoverPanics(logger), logRequests(logger), cors(opts.AllowedOrigins))
}

func spaHandler(dir string) http.Handler {
	fsys := os.DirFS(dir)
	fileServer := http.FileServerFS(fsys)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.Header().Set("Allow", "GET, HEAD")
			http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
			return
		}
		name := strings.TrimPrefix(path.Clean(r.URL.Path), "/")
		if name == "" {
			name = "."
		}
		if _, err := fs.Stat(fsys, name); err != nil {
			http.ServeFileFS(w, r, fsys, "index.html")
			return
		}
		fileServer.ServeHTTP(w, r)
	})
}
