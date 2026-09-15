package api

type CalculationRequest struct {
	Operands []float64 `json:"operands" example:"12,3"`
}

type CalculationResponse struct {
	Operation string    `json:"operation" example:"divide"`
	Operands  []float64 `json:"operands" example:"12,3"`
	Result    float64   `json:"result" example:"4"`
}

type OperationResponse struct {
	Name  string `json:"name" example:"add"`
	Arity int    `json:"arity" example:"2"`
}

type OperationsResponse struct {
	Operations []OperationResponse `json:"operations"`
}

type HealthResponse struct {
	Status string `json:"status" example:"ok"`
}

type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

type ErrorDetail struct {
	Code    string `json:"code" example:"DIVISION_BY_ZERO"`
	Message string `json:"message" example:"division by zero is not allowed"`
}
