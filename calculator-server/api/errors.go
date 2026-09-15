package api

import (
	"errors"
	"net/http"

	"calculator-api/calculator"
)

const (
	codeInvalidJSON      = "INVALID_JSON"
	codeInvalidOperands  = "INVALID_OPERANDS"
	codeUnknownOperation = "UNKNOWN_OPERATION"
	codeDivisionByZero   = "DIVISION_BY_ZERO"
	codeNegativeSqrt     = "NEGATIVE_SQUARE_ROOT"
	codeUndefinedResult  = "UNDEFINED_RESULT"
	codeNotFound         = "NOT_FOUND"
	codeInternal         = "INTERNAL_ERROR"
)

type apiError struct {
	status int
	code   string
}

var domainErrors = []struct {
	target error
	apiError
}{
	{calculator.ErrUnknownOperation, apiError{http.StatusNotFound, codeUnknownOperation}},
	{calculator.ErrInvalidOperandCount, apiError{http.StatusBadRequest, codeInvalidOperands}},
	{calculator.ErrInvalidOperand, apiError{http.StatusBadRequest, codeInvalidOperands}},
	{calculator.ErrDivisionByZero, apiError{http.StatusUnprocessableEntity, codeDivisionByZero}},
	{calculator.ErrNegativeSquareRoot, apiError{http.StatusUnprocessableEntity, codeNegativeSqrt}},
	{calculator.ErrUndefinedResult, apiError{http.StatusUnprocessableEntity, codeUndefinedResult}},
}

func mapDomainError(err error) (apiError, bool) {
	for _, candidate := range domainErrors {
		if errors.Is(err, candidate.target) {
			return candidate.apiError, true
		}
	}
	return apiError{http.StatusInternalServerError, codeInternal}, false
}
