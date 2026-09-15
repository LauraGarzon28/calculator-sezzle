package api

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"calculator-api/calculator"
)

func newTestServer(t *testing.T, calc Calculator, opts RouterOptions) *httptest.Server {
	t.Helper()
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	server := httptest.NewServer(NewRouter(NewHandler(calc, logger), logger, opts))
	t.Cleanup(server.Close)
	return server
}

func defaultCalculator() Calculator {
	return calculator.NewService(calculator.DefaultOperations()...)
}

func postJSON(t *testing.T, url, body string) *http.Response {
	t.Helper()
	resp, err := http.Post(url, "application/json", strings.NewReader(body))
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	t.Cleanup(func() { resp.Body.Close() })
	return resp
}

func decodeBody[T any](t *testing.T, resp *http.Response) T {
	t.Helper()
	var body T
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decoding response: %v", err)
	}
	return body
}

func TestCalculate_Success(t *testing.T) {
	server := newTestServer(t, defaultCalculator(), RouterOptions{})

	tests := []struct {
		operation string
		body      string
		want      float64
	}{
		{"add", `{"operands":[2,3]}`, 5},
		{"subtract", `{"operands":[2,3]}`, -1},
		{"multiply", `{"operands":[2.5,4]}`, 10},
		{"divide", `{"operands":[12,3]}`, 4},
		{"power", `{"operands":[2,8]}`, 256},
		{"sqrt", `{"operands":[16]}`, 4},
		{"percentage", `{"operands":[50,10]}`, 5},
	}

	for _, tt := range tests {
		t.Run(tt.operation, func(t *testing.T) {
			resp := postJSON(t, server.URL+"/api/v1/operations/"+tt.operation, tt.body)

			if resp.StatusCode != http.StatusOK {
				t.Fatalf("status: got %d, want %d", resp.StatusCode, http.StatusOK)
			}
			if ct := resp.Header.Get("Content-Type"); ct != "application/json" {
				t.Errorf("content type: got %q", ct)
			}
			body := decodeBody[CalculationResponse](t, resp)
			if body.Result != tt.want || body.Operation != tt.operation {
				t.Errorf("got %+v, want result %v", body, tt.want)
			}
		})
	}
}

func TestCalculate_Errors(t *testing.T) {
	server := newTestServer(t, defaultCalculator(), RouterOptions{})

	tests := []struct {
		name       string
		path       string
		body       string
		wantStatus int
		wantCode   string
	}{
		{"division by zero", "/api/v1/operations/divide", `{"operands":[1,0]}`, http.StatusUnprocessableEntity, codeDivisionByZero},
		{"negative square root", "/api/v1/operations/sqrt", `{"operands":[-9]}`, http.StatusUnprocessableEntity, codeNegativeSqrt},
		{"overflow", "/api/v1/operations/power", `{"operands":[10,1000]}`, http.StatusUnprocessableEntity, codeUndefinedResult},
		{"unknown operation", "/api/v1/operations/modulo", `{"operands":[1,2]}`, http.StatusNotFound, codeUnknownOperation},
		{"wrong operand count", "/api/v1/operations/add", `{"operands":[1]}`, http.StatusBadRequest, codeInvalidOperands},
		{"missing operands", "/api/v1/operations/add", `{}`, http.StatusBadRequest, codeInvalidOperands},
		{"empty body", "/api/v1/operations/add", ``, http.StatusBadRequest, codeInvalidJSON},
		{"malformed JSON", "/api/v1/operations/add", `{"operands":[1,`, http.StatusBadRequest, codeInvalidJSON},
		{"non-numeric operand", "/api/v1/operations/add", `{"operands":["1",2]}`, http.StatusBadRequest, codeInvalidJSON},
		{"number out of float64 range", "/api/v1/operations/add", `{"operands":[1e400,2]}`, http.StatusBadRequest, codeInvalidJSON},
		{"unknown field", "/api/v1/operations/add", `{"operands":[1,2],"extra":true}`, http.StatusBadRequest, codeInvalidJSON},
		{"multiple JSON values", "/api/v1/operations/add", `{"operands":[1,2]}{"operands":[3,4]}`, http.StatusBadRequest, codeInvalidJSON},
		{"body too large", "/api/v1/operations/add", `{"operands":[` + strings.Repeat("1,", 5000) + `1]}`, http.StatusBadRequest, codeInvalidJSON},
		{"unknown api route", "/api/v1/unknown", `{}`, http.StatusNotFound, codeNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp := postJSON(t, server.URL+tt.path, tt.body)

			if resp.StatusCode != tt.wantStatus {
				t.Fatalf("status: got %d, want %d", resp.StatusCode, tt.wantStatus)
			}
			body := decodeBody[ErrorResponse](t, resp)
			if body.Error.Code != tt.wantCode || body.Error.Message == "" {
				t.Errorf("got %+v, want code %q with a message", body.Error, tt.wantCode)
			}
		})
	}
}

type failingCalculator struct{}

func (failingCalculator) Calculate(string, []float64) (float64, error) {
	return 0, errors.New("unexpected failure")
}
func (failingCalculator) Operations() []calculator.OperationInfo { return nil }

func TestCalculate_HidesUnexpectedErrors(t *testing.T) {
	server := newTestServer(t, failingCalculator{}, RouterOptions{})

	resp := postJSON(t, server.URL+"/api/v1/operations/add", `{"operands":[1,2]}`)

	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("status: got %d", resp.StatusCode)
	}
	body := decodeBody[ErrorResponse](t, resp)
	if body.Error.Code != codeInternal || strings.Contains(body.Error.Message, "unexpected failure") {
		t.Errorf("internal details leaked: %+v", body.Error)
	}
}

type panickingCalculator struct{ failingCalculator }

func (panickingCalculator) Calculate(string, []float64) (float64, error) { panic("boom") }

func TestRouter_RecoversFromPanics(t *testing.T) {
	server := newTestServer(t, panickingCalculator{}, RouterOptions{})

	resp := postJSON(t, server.URL+"/api/v1/operations/add", `{"operands":[1,2]}`)

	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("status: got %d", resp.StatusCode)
	}
}

func TestListOperations(t *testing.T) {
	server := newTestServer(t, defaultCalculator(), RouterOptions{})

	resp, err := http.Get(server.URL + "/api/v1/operations")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	body := decodeBody[OperationsResponse](t, resp)
	if len(body.Operations) != len(calculator.DefaultOperations()) {
		t.Fatalf("got %d operations", len(body.Operations))
	}
	if first := body.Operations[0]; first.Name != "add" || first.Arity != 2 {
		t.Errorf("unexpected first operation: %+v", first)
	}
}

func TestHealth(t *testing.T) {
	server := newTestServer(t, defaultCalculator(), RouterOptions{})

	resp, err := http.Get(server.URL + "/api/v1/health")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if body := decodeBody[HealthResponse](t, resp); resp.StatusCode != http.StatusOK || body.Status != "ok" {
		t.Errorf("got status %d, body %+v", resp.StatusCode, body)
	}
}

func TestCORS(t *testing.T) {
	server := newTestServer(t, defaultCalculator(), RouterOptions{AllowedOrigins: []string{"http://localhost:5173"}})

	tests := []struct {
		origin     string
		wantHeader string
	}{
		{"http://localhost:5173", "http://localhost:5173"},
		{"http://evil.example", ""},
	}

	for _, tt := range tests {
		t.Run(tt.origin, func(t *testing.T) {
			req, _ := http.NewRequest(http.MethodOptions, server.URL+"/api/v1/operations/add", nil)
			req.Header.Set("Origin", tt.origin)

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatal(err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusNoContent {
				t.Errorf("status: got %d", resp.StatusCode)
			}
			if got := resp.Header.Get("Access-Control-Allow-Origin"); got != tt.wantHeader {
				t.Errorf("allow origin: got %q, want %q", got, tt.wantHeader)
			}
		})
	}
}

func TestStaticFiles(t *testing.T) {
	dir := t.TempDir()
	writeFile(t, filepath.Join(dir, "index.html"), "<html>app</html>")
	writeFile(t, filepath.Join(dir, "assets", "app.js"), "console.log('app')")
	server := newTestServer(t, defaultCalculator(), RouterOptions{StaticDir: dir})

	tests := []struct {
		path     string
		wantBody string
	}{
		{"/", "<html>app</html>"},
		{"/assets/app.js", "console.log('app')"},
		{"/some/client/route", "<html>app</html>"},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			resp, err := http.Get(server.URL + tt.path)
			if err != nil {
				t.Fatal(err)
			}
			defer resp.Body.Close()

			body, _ := io.ReadAll(resp.Body)
			if resp.StatusCode != http.StatusOK || string(body) != tt.wantBody {
				t.Errorf("got status %d, body %q", resp.StatusCode, body)
			}
		})
	}

	t.Run("rejects non-GET methods", func(t *testing.T) {
		resp := postJSON(t, server.URL+"/", `{}`)
		if resp.StatusCode != http.StatusMethodNotAllowed {
			t.Errorf("status: got %d", resp.StatusCode)
		}
	})
}

func writeFile(t *testing.T, name, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(name), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(name, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}
