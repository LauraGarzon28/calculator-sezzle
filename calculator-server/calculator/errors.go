package calculator

import "errors"

var (
	ErrUnknownOperation    = errors.New("unknown operation")
	ErrInvalidOperandCount = errors.New("invalid number of operands")
	ErrInvalidOperand      = errors.New("operands must be finite numbers")
	ErrDivisionByZero      = errors.New("division by zero is not allowed")
	ErrNegativeSquareRoot  = errors.New("square root of a negative number is not defined")
	ErrUndefinedResult     = errors.New("result is undefined or out of range")
)
