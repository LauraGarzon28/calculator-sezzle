package api

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"

	"calculator-api/calculator"
)

const maxRequestBodyBytes = 1 << 12

type Calculator interface {
	Calculate(operation string, operands []float64) (float64, error)
	Operations() []calculator.OperationInfo
}

type Handler struct {
	calculator Calculator
	logger     *slog.Logger
}

func NewHandler(calc Calculator, logger *slog.Logger) *Handler {
	return &Handler{calculator: calc, logger: logger}
}

func (h *Handler) Health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, HealthResponse{Status: "ok"})
}

func (h *Handler) ListOperations(w http.ResponseWriter, _ *http.Request) {
	infos := h.calculator.Operations()
	operations := make([]OperationResponse, 0, len(infos))
	for _, info := range infos {
		operations = append(operations, OperationResponse{Name: info.Name, Arity: info.Arity})
	}
	writeJSON(w, http.StatusOK, OperationsResponse{Operations: operations})
}

func (h *Handler) Calculate(w http.ResponseWriter, r *http.Request) {
	operation := r.PathValue("operation")

	var req CalculationRequest
	if err := decodeJSON(w, r, &req); err != nil {
		writeError(w, http.StatusBadRequest, codeInvalidJSON, err.Error())
		return
	}

	result, err := h.calculator.Calculate(operation, req.Operands)
	if err != nil {
		apiErr, known := mapDomainError(err)
		if !known {
			h.logger.Error("calculation failed", "operation", operation, "error", err)
			writeError(w, apiErr.status, apiErr.code, "internal server error")
			return
		}
		writeError(w, apiErr.status, apiErr.code, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, CalculationResponse{Operation: operation, Operands: req.Operands, Result: result})
}

func (h *Handler) NotFound(w http.ResponseWriter, _ *http.Request) {
	writeError(w, http.StatusNotFound, codeNotFound, "resource not found")
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxRequestBodyBytes))
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(dst); err != nil {
		if errors.Is(err, io.EOF) {
			return errors.New("request body must not be empty")
		}
		return errors.New("request body must be valid JSON matching the schema: " + err.Error())
	}
	if decoder.More() {
		return errors.New("request body must contain a single JSON object")
	}
	return nil
}
