package calculator

import (
	"errors"
	"math"
	"testing"
)

func TestService_Calculate(t *testing.T) {
	service := NewService(DefaultOperations()...)

	tests := []struct {
		name      string
		operation string
		operands  []float64
		want      float64
		wantErr   error
	}{
		{name: "add integers", operation: "add", operands: []float64{2, 3}, want: 5},
		{name: "add negatives and decimals", operation: "add", operands: []float64{-1.5, 0.25}, want: -1.25},
		{name: "subtract", operation: "subtract", operands: []float64{10, 4}, want: 6},
		{name: "subtract to negative", operation: "subtract", operands: []float64{4, 10}, want: -6},
		{name: "multiply", operation: "multiply", operands: []float64{6, 7}, want: 42},
		{name: "multiply by zero normalizes negative zero", operation: "multiply", operands: []float64{-5, 0}, want: 0},
		{name: "divide", operation: "divide", operands: []float64{10, 4}, want: 2.5},
		{name: "divide by zero", operation: "divide", operands: []float64{1, 0}, wantErr: ErrDivisionByZero},
		{name: "zero divided by zero", operation: "divide", operands: []float64{0, 0}, wantErr: ErrDivisionByZero},
		{name: "power", operation: "power", operands: []float64{2, 10}, want: 1024},
		{name: "power with negative exponent", operation: "power", operands: []float64{2, -2}, want: 0.25},
		{name: "power of zero to negative exponent", operation: "power", operands: []float64{0, -1}, wantErr: ErrUndefinedResult},
		{name: "power with non-real result", operation: "power", operands: []float64{-8, 0.5}, wantErr: ErrUndefinedResult},
		{name: "power overflow", operation: "power", operands: []float64{10, 400}, wantErr: ErrUndefinedResult},
		{name: "square root", operation: "sqrt", operands: []float64{81}, want: 9},
		{name: "square root of zero", operation: "sqrt", operands: []float64{0}, want: 0},
		{name: "square root of negative", operation: "sqrt", operands: []float64{-4}, wantErr: ErrNegativeSquareRoot},
		{name: "percentage", operation: "percentage", operands: []float64{200, 15}, want: 30},
		{name: "multiply overflow", operation: "multiply", operands: []float64{math.MaxFloat64, 10}, wantErr: ErrUndefinedResult},
		{name: "unknown operation", operation: "modulo", operands: []float64{1, 2}, wantErr: ErrUnknownOperation},
		{name: "too few operands", operation: "add", operands: []float64{1}, wantErr: ErrInvalidOperandCount},
		{name: "too many operands", operation: "sqrt", operands: []float64{1, 2}, wantErr: ErrInvalidOperandCount},
		{name: "missing operands", operation: "add", operands: nil, wantErr: ErrInvalidOperandCount},
		{name: "NaN operand", operation: "add", operands: []float64{math.NaN(), 1}, wantErr: ErrInvalidOperand},
		{name: "infinite operand", operation: "add", operands: []float64{math.Inf(1), 1}, wantErr: ErrInvalidOperand},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := service.Calculate(tt.operation, tt.operands)

			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("expected error %v, got %v", tt.wantErr, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.want || math.Signbit(got) != math.Signbit(tt.want) {
				t.Errorf("got %v, want %v", got, tt.want)
			}
		})
	}
}

func TestService_Operations(t *testing.T) {
	service := NewService(Add(), SquareRoot(), Add())

	got := service.Operations()

	want := []OperationInfo{{Name: "add", Arity: 2}, {Name: "sqrt", Arity: 1}}
	if len(got) != len(want) {
		t.Fatalf("got %d operations, want %d", len(got), len(want))
	}
	for i := range want {
		if got[i] != want[i] {
			t.Errorf("operation %d: got %+v, want %+v", i, got[i], want[i])
		}
	}
}

type constantOperation struct{}

func (constantOperation) Name() string                     { return "answer" }
func (constantOperation) Arity() int                       { return 0 }
func (constantOperation) Apply([]float64) (float64, error) { return 42, nil }

func TestService_AcceptsCustomOperations(t *testing.T) {
	service := NewService(constantOperation{})

	got, err := service.Calculate("answer", nil)

	if err != nil || got != 42 {
		t.Fatalf("got (%v, %v), want (42, nil)", got, err)
	}
}
