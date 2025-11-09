FROM golang:1.19 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download                 # 依存モジュールを取得
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server  # 静的リンクでバイナリ生成

# Final stage: 実行用イメージ (AlpineやDistrolessなどを推奨)
FROM alpine:latest
RUN apk add --no-cache ca-certificates  # SSL証明書（必要に応じて）
WORKDIR /root/
COPY --from=builder /app/server /usr/local/bin/server
EXPOSE 8080
CMD ["server"]
