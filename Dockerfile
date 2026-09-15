# syntax=docker/dockerfile:1

# ---------- Frontend ----------
FROM node:22-alpine AS frontend-deps
WORKDIR /app/frontend
COPY calculator-client/package.json calculator-client/package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM frontend-deps AS frontend-test
COPY calculator-client/ ./
RUN npm run lint && npm run coverage

FROM frontend-deps AS frontend-build
COPY calculator-client/ ./
RUN npm run build

# ---------- Backend ----------
FROM golang:1.27-alpine AS backend-deps
WORKDIR /app/backend
COPY calculator-server/go.mod calculator-server/go.sum ./
RUN go mod download

FROM backend-deps AS backend-test
COPY calculator-server/ ./
RUN go vet ./... \
    && go test -coverprofile=coverage.out ./... \
    && go tool cover -func=coverage.out | tee coverage.txt \
    && go tool cover -html=coverage.out -o coverage.html

FROM backend-deps AS backend-build
COPY calculator-server/ ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/calculator-api ./cmd/server

# ---------- Coverage export (docker build --target coverage --output type=local,dest=coverage-report .) ----------
FROM scratch AS coverage
COPY --from=backend-test /app/backend/coverage.out /app/backend/coverage.txt /app/backend/coverage.html /backend/
COPY --from=frontend-test /app/frontend/coverage /frontend/

# ---------- Runtime: Go API serving the built frontend ----------
FROM alpine:3.22 AS runtime
RUN addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=backend-build /out/calculator-api ./calculator-api
COPY --from=frontend-build /app/frontend/dist ./web

ENV PORT=8080 \
    STATIC_DIR=/app/web
EXPOSE 8080
USER app

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["./calculator-api"]
