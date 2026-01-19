# syntax=docker/dockerfile:1.7

FROM golang:1.25-alpine AS base
WORKDIR /app
RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

FROM base AS dev

ARG AIR_VERSION=v1.63.0
RUN go install github.com/air-verse/air@${AIR_VERSION}

COPY . .

EXPOSE 8080

CMD ["/go/bin/air", "-c", ".air.toml"]

FROM base AS builder
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/server ./cmd/server

FROM gcr.io/distroless/base-debian12:nonroot AS prod
WORKDIR /app

ENV PORT=8080

COPY --from=builder /out/server /app/server
EXPOSE 8080
ENTRYPOINT ["/app/server"]
