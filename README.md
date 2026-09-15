# Calculator

A full-stack calculator with a **React + TypeScript** frontend and a **Go** REST API backend.

The arithmetic operations are executed through the backend API, while the frontend provides a responsive calculator interface with keyboard support, calculation history and validation.

## Features

* **Arithmetic operations:** addition, subtraction, multiplication, division, exponentiation, square root, and percentage.
* **REST API:** every arithmetic operation is executed through the Go backend.
* **Windows Calculator–style behavior:** chained operations, repeated `=`, percentage behavior, and left-to-right evaluation.
* **Keyboard support:** digits, operators, `Enter`, `Escape`, `Delete`, `Backspace`, and `F9`.
* **Calculation history:** the last 20 calculations are persisted in `localStorage`.
* **Validation and error handling:** invalid JSON, incorrect operands, division by zero, negative square roots, overflow, and unavailable services.
* **Responsive UI:** React interface using the project brand colors.
* **Swagger/OpenAPI:** interactive API documentation.
* **Automated tests:** unit tests for both backend and frontend with high coverage.
* **Docker:** multi-stage build that runs tests and packages the application into a single production image.

## Quick Start with Docker

The easiest way to run the complete application is with Docker.

Requirements:

* Docker Desktop
* Docker Compose

From the repository root:

```bash
docker compose up --build
```

Once the container is running:

| URL                                      | Description            |
| ---------------------------------------- | ---------------------- |
| http://localhost:8080                    | Calculator application |
| http://localhost:8080/swagger/index.html | Swagger UI             |
| http://localhost:8080/api/v1/health      | API health check       |

The Docker image builds the React frontend, compiles the Go backend, and runs both from a single container. The Go server serves the API and the generated frontend from the same origin.

To build and run without Docker Compose:

```bash
docker build -t calculator-app .
docker run --rm -p 8080:8080 calculator-app
```

## Local Development

For development, the backend and frontend can be run separately to enable frontend hot reload.

### Backend

Requires Go 1.27.1 or later.

```bash
cd calculator-server
go mod tidy
go run ./cmd/server
```

The API runs by default on:

```text
http://localhost:8080
```

### Frontend

Requires Node.js 22.12 or later.

```bash
cd calculator-client
npm install
npm run dev
```

The development server runs on:

```text
http://localhost:5173
```

The Vite development server proxies `/api` requests to the backend.

## Testing 

### Backend

Run the Go test suite:

```bash
cd calculator-server
go test -cover ./...
```

### Frontend

Run tests:

```bash
cd calculator-client
npm test
```

Generate the coverage report:

```bash
npm run coverage
```

Run ESLint:

```bash
npm run lint
```

### Complete Test and Coverage Build

The Docker coverage stage runs the backend and frontend quality checks and exports both coverage reports:

```bash
docker build --target coverage --output type=local,dest=coverage-report .
```

Generated reports:

```text
coverage-report/
├── backend/
│   ├── coverage.html
│   └── coverage.txt
└── frontend/
    └── index.html
```

The frontend tests cover the calculator engine, API client, history, keyboard handling, and components.

## API

Base path:

```text
/api/v1
```

All API responses use JSON.

Interactive documentation is available through Swagger UI:

```text
http://localhost:8080/swagger/index.html
```

The generated OpenAPI specification is also available at:

```text
calculator-server/docs/swagger.yaml
```

### Endpoints

| Method | Endpoint                         | Description               |
| ------ | -------------------------------- | ------------------------- |
| `GET`  | `/api/v1/health`                 | Health check              |
| `GET`  | `/api/v1/operations`             | List supported operations |
| `POST` | `/api/v1/operations/{operation}` | Perform a calculation     |

### Supported Operations

| Operation    | Operands | Result        |
| ------------ | -------- | ------------- |
| `add`        | `[a, b]` | `a + b`       |
| `subtract`   | `[a, b]` | `a - b`       |
| `multiply`   | `[a, b]` | `a × b`       |
| `divide`     | `[a, b]` | `a ÷ b`       |
| `power`      | `[a, b]` | `a^b`         |
| `sqrt`       | `[a]`    | `√a`          |
| `percentage` | `[a, b]` | `a × b ÷ 100` |

### API Examples

Addition:

```bash
curl -X POST http://localhost:8080/api/v1/operations/add \
  -H "Content-Type: application/json" \
  -d '{"operands":[2,3]}'
```

Response:

```json
{
  "operation": "add",
  "operands": [2, 3],
  "result": 5
}
```

Square root:

```bash
curl -X POST http://localhost:8080/api/v1/operations/sqrt \
  -H "Content-Type: application/json" \
  -d '{"operands":[81]}'
```

Response:

```json
{
  "operation": "sqrt",
  "operands": [81],
  "result": 9
}
```

Percentage:

```bash
curl -X POST http://localhost:8080/api/v1/operations/percentage \
  -H "Content-Type: application/json" \
  -d '{"operands":[200,15]}'
```

Response:

```json
{
  "operation": "percentage",
  "operands": [200, 15],
  "result": 30
}
```

Division by zero:

```bash
curl -X POST http://localhost:8080/api/v1/operations/divide \
  -H "Content-Type: application/json" \
  -d '{"operands":[1,0]}'
```

Response:

```json
{
  "error": {
    "code": "DIVISION_BY_ZERO",
    "message": "division by zero is not allowed"
  }
}
```

## Error Handling

API errors use a consistent response structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

Clients should rely on the `code` field for programmatic error handling.

| Status | Code                   | Description                            |
| ------ | ---------------------- | -------------------------------------- |
| `400`  | `INVALID_JSON`         | Malformed request body or invalid JSON |
| `400`  | `INVALID_OPERANDS`     | Incorrect number of operands           |
| `404`  | `UNKNOWN_OPERATION`    | Operation does not exist               |
| `404`  | `NOT_FOUND`            | Unknown API route                      |
| `422`  | `DIVISION_BY_ZERO`     | Division by zero                       |
| `422`  | `NEGATIVE_SQUARE_ROOT` | Square root of a negative number       |
| `422`  | `UNDEFINED_RESULT`     | Non-finite mathematical result         |
| `500`  | `INTERNAL_ERROR`       | Unexpected server error                |

The API also protects against oversized request bodies and invalid numeric values.

## Calculator Behavior

The calculator is intentionally modeled after the standard Windows Calculator.

### Basic input

* `0–9`: enter digits
* `.` or `,`: decimal separator
* `+`, `-`, `*`, `/`, `^`: binary operations
* `Enter` or `=`: calculate result
* `Backspace`: delete the last digit
* `Delete`: clear the current entry (`CE`)
* `Escape`: clear the calculator (`C`)
* `F9`: toggle the sign (`±`)
* `%`: percentage
* `@`: square root

### Examples

Operations are evaluated immediately and left to right.

```text
2 + 3 ×
```

evaluates `2 + 3` immediately, displays `5`, and waits for the next operand.

Repeated equals repeat the last operation:

```text
2 + 3 = =
```

produces:

```text
5 → 8
```

Percentage behavior follows the Windows Calculator model:

```text
200 + 10 %
```

produces:

```text
200 + 20
```

while:

```text
50 × 10 %
```

uses:

```text
50 × 0.1
```

After an error, the calculator can be reset using digits, `C`, `CE`, or backspace.

## Design Decisions

### Backend

**Layered architecture**

The calculator domain is independent of HTTP. `calculator-server/calculator` contains the arithmetic rules, while `calculator-server/api` handles HTTP concerns.

The handlers depend on a small `Calculator` interface, allowing them to be tested with stubs without depending on the concrete calculator implementation.

**Extensible operations**

Each operation implements a common interface containing its name, arity, and calculation logic.

Adding a new operation requires implementing the operation and registering it in the default operation set without modifying routing or general validation logic.

**Centralized validation**

The service validates:

* Operation existence
* Operand count
* Finite input values
* Finite calculation results

Individual operations handle their own mathematical constraints, such as division by zero and negative square roots.

**REST API design**

A single endpoint is used for calculations:

```text
POST /operations/{operation}
```

with a consistent request body:

```json
{
  "operands": [2, 3]
}
```

This supports both unary and binary operations while keeping the API contract simple.

**Explicit HTTP status codes**

* `400` — malformed or invalid requests
* `404` — unknown routes or operations
* `422` — mathematically invalid operations
* `500` — unexpected server errors

**Standard library first**

The backend primarily uses the Go standard library, including:

* `net/http`
* `log/slog`
* Go 1.22+ `http.ServeMux`
* Graceful shutdown and server timeouts

Swaggo is used for OpenAPI documentation.

### Frontend

**API-driven calculations**

Every arithmetic operation is performed by the backend API, as required by the assessment. Local state is used only for input editing and UI behavior.

**Pure calculator state machine**

The calculator engine is independent of React. It receives the current state and an action and communicates with an injected API client.

This makes the calculation rules independently testable.

**Thin React components**

React components focus on rendering and user interaction. Calculator behavior is handled by hooks and the state machine. Keyboard input and keypad buttons use the same action model.

**Replaceable dependencies**

The calculator receives its API client and history storage as dependencies, allowing tests to use in-memory fakes.

**Persistent history**

The last 20 completed calculations are stored in `localStorage`. Stored entries are validated when loaded, and storage failures do not prevent the calculator from working.

**CSS Modules**

The UI uses CSS Modules and reusable design tokens without an external component library.

### Deployment

The project uses a multi-stage Docker build.

The build stages:

1. Run backend tests and static checks.
2. Run frontend linting and tests.
3. Build the React application.
4. Compile the Go binary.
5. Package the application into a small Alpine-based runtime image.

The production server serves both the API and the frontend from the same origin, avoiding the need for CORS configuration in the deployed application.

The runtime container also uses a non-root user and includes a health check.

## Assumptions

* Calculations use `float64` on both frontend and backend.
* The UI displays results rounded to 15 significant digits to reduce visible floating-point artifacts.
* The API returns the calculated floating-point value.
* Input entries are limited to 16 digits, matching the Windows Calculator behavior.
* Operations are evaluated immediately and left to right rather than using mathematical operator precedence.

## AI Usage

This project was developed with assistance from Claude.

The prompts used during development are documented in [`PROMPTS.md`](PROMPTS.md).
