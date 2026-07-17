FROM golang:1.22-alpine

WORKDIR /app

COPY go.mod ./
# Only copy go.sum if it exists, otherwise it will fail
RUN go mod download || true

COPY . .

RUN go build -o main .

EXPOSE 4015

CMD ["./main"]
