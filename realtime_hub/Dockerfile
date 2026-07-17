# Stage 1: Build the Go binary
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go mod files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code
COPY . .

# Build a statically linked binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o realtime_hub cmd/server/main.go

# Stage 2: Create a minimal runner image
FROM alpine:latest

# Add tzdata and ca-certificates just in case
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/realtime_hub .

# Run as an unprivileged user for security
RUN adduser -D -g '' appuser
USER appuser

EXPOSE 3001

CMD ["./realtime_hub"]
