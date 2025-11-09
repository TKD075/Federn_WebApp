# Build stage: Reactアプリをビルド
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci                          # 依存パッケージをインストール
COPY . .
RUN npm run build                   # Reactを本番ビルドして /app/build 配下に出力

# Serve stage: Nginxで静的ファイルを配信
FROM nginx:alpine
# (オプション) Nginxのデフォルトコンテンツを削除
RUN rm -rf /usr/share/nginx/html/*
# ビルド済みファイルをNginx配信用ディレクトリへコピー
COPY --from=build /app/build /usr/share/nginx/html
# 必要に応じてNginx設定を追加。SPA対応に try_files を設定する例:
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html index.htm; \
             location / { try_files $uri /index.html; } }' \
         > /etc/nginx/conf.d/default.conf