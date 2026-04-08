FROM golang:1.22-alpine AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o /app/main ./cmd/server

FROM alpine:latest

RUN apk --no-cache add ca-certificates
COPY --from=builder /app/main /app/main

EXPOSE 8080
CMD ["/app/main"]
