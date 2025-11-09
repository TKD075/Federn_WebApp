# 基本アーキテクチャ構成

開発を行う上で不変となる(であろう)アーキテクチャを記載する。

## 技術スタック

- **フロントエンド**: React(FROM node:18 AS build)
- **バックエンド**: Go(golang:1.19 AS builder)
- **データベース**: PostgreSQL
- **認証**: JWT(検討中)


## デプロイ構成
- AWS(後々自前のRaspberry Pi5に移行予定)
- **AWS**:  EC2: arm64
- **Aurora and RDS**
- Docker化
- GitHubActionsで自動デプロイ