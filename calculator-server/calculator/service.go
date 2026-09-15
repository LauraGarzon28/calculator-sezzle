package calculator

import (
	"fmt"
	"math"
)

// OperationInfo describes an operation exposed by the Service.
type OperationInfo struct {
	Name  string
	Arity int
}

// Service resolves operations by name and applies the validation shared by all of them.
type Service struct {
	operations map[string]Operation
	order      []string
}

func NewService(operations ...Operation) *Service {
	s := &Service{operations: make(map[string]Operation, len(operations))}
	for _, op := range operations {
		if _, exists := s.operations[op.Name()]; !exists {
			s.order = append(s.order, op.Name())
		}
		s.operations[op.Name()] = op
	}
	return s
}

func (s *Service) Calculate(name string, operands []float64) (float64, error) {
	op, ok := s.operations[name]
	if !ok {
		return 0, fmt.Errorf("%w: %q", ErrUnknownOperation, name)
	}
	if len(operands) != op.Arity() {
		return 0, fmt.Errorf("%w: %s expects %d, got %d", ErrInvalidOperandCount, name, op.Arity(), len(operands))
	}
	for _, v := range operands {
		if !isFinite(v) {
			return 0, ErrInvalidOperand
		}
	}

	result, err := op.Apply(operands)
	if err != nil {
		return 0, err
	}
	if !isFinite(result) {
		return 0, ErrUndefinedResult
	}
	// Adding zero turns -0 into 0 so clients never receive "-0".
	return result + 0, nil
}

func (s *Service) Operations() []OperationInfo {
	infos := make([]OperationInfo, 0, len(s.order))
	for _, name := range s.order {
		infos = append(infos, OperationInfo{Name: name, Arity: s.operations[name].Arity()})
	}
	return infos
}

func isFinite(v float64) bool {
	return !math.IsNaN(v) && !math.IsInf(v, 0)
}
