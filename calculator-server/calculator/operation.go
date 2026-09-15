package calculator

type Operation interface {
	Name() string
	Arity() int
	Apply(operands []float64) (float64, error)
}

type unaryOperation struct {
	name string
	fn   func(a float64) (float64, error)
}

func (o unaryOperation) Name() string { return o.name }
func (o unaryOperation) Arity() int   { return 1 }
func (o unaryOperation) Apply(operands []float64) (float64, error) {
	return o.fn(operands[0])
}

type binaryOperation struct {
	name string
	fn   func(a, b float64) (float64, error)
}

func (o binaryOperation) Name() string { return o.name }
func (o binaryOperation) Arity() int   { return 2 }
func (o binaryOperation) Apply(operands []float64) (float64, error) {
	return o.fn(operands[0], operands[1])
}
