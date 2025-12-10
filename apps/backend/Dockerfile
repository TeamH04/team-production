# syntax=docker/dockerfile:1.7

FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install build tools
RUN apk add --no-cache git

# Cache modules
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build the server binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/server ./cmd/server

FROM gcr.io/distroless/base-debian12

WORKDIR /app

ENV PORT=8080 \
    DATABASE_URL=postgres://postgres:postgres@db:5432/app?sslmode=disable

COPY --from=builder /out/server /app/server

EXPOSE 8080

ENTRYPOINT ["/app/server"]
