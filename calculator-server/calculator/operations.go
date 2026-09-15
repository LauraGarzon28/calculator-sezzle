package calculator

import "math"

func Add() Operation {
	return binaryOperation{name: "add", fn: func(a, b float64) (float64, error) {
		return a + b, nil
	}}
}

func Subtract() Operation {
	return binaryOperation{name: "subtract", fn: func(a, b float64) (float64, error) {
		return a - b, nil
	}}
}

func Multiply() Operation {
	return binaryOperation{name: "multiply", fn: func(a, b float64) (float64, error) {
		return a * b, nil
	}}
}

func Divide() Operation {
	return binaryOperation{name: "divide", fn: func(a, b float64) (float64, error) {
		if b == 0 {
			return 0, ErrDivisionByZero
		}
		return a / b, nil
	}}
}

func Power() Operation {
	return binaryOperation{name: "power", fn: func(a, b float64) (float64, error) {
		return math.Pow(a, b), nil
	}}
}

func SquareRoot() Operation {
	return unaryOperation{name: "sqrt", fn: func(a float64) (float64, error) {
		if a < 0 {
			return 0, ErrNegativeSquareRoot
		}
		return math.Sqrt(a), nil
	}}
}

// Percentage returns the second operand as a percentage of the first: a * b / 100.
func Percentage() Operation {
	return binaryOperation{name: "percentage", fn: func(a, b float64) (float64, error) {
		return a * b / 100, nil
	}}
}

func DefaultOperations() []Operation {
	return []Operation{Add(), Subtract(), Multiply(), Divide(), Power(), SquareRoot(), Percentage()}
}
