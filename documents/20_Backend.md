
# Backend

## 構成
- Go
  - golang
    -  `golang: 1.19`
- PostgreSQL
  - 接続先: AWS Aurora / RDS (PostgreSQL 互換クラスタ)
  - パスワード: `環境によって可変`
  - ポート: `5432` (Aurora / RDS の設定に同期)

## 接続と環境変数
- docker-compose.yml にはDBコンテナを含めず、バックエンドが外部のAurora / RDSに直接接続する。
- 以下の環境変数を `.env` などで定義してから `docker compose up` を実行する。
  - `DB_HOST`: Aurora / RDS のエンドポイント
  - `DB_PORT`: 接続ポート (未設定時は `5432` を利用)
  - `DB_USER`: 接続ユーザー
  - `DB_PASSWORD`: 接続パスワード
  - `DB_NAME`: 接続先データベース名
  - `DB_SSLMODE`: SSLモード。デフォルトは `require` で運用し、Aurora / RDS の方針に合わせて調整する


## テーブル設計
- 更新・運用がしやすいように設計する
- 機能を落としやすいように設計する。
- idは用いず、uidを用いる。
- できる限りnull: falseを用いる。
- 基本的に物理削除を用いるが、必要に応じてステータス管理による論理削除も併用する。
