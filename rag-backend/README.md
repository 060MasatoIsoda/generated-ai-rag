# RAG バックエンド

RAG（Retrieval-Augmented Generation）検索アプリケーションのバックエンドサービスです。

## 環境構成

- Python 3.9+
- AWS Lambda
- AWS DynamoDB
- API Gateway

## ローカルでのテスト方法

### 1. 依存パッケージのインストール

```bash
pip install -r requirements.txt
```

### 2. 環境変数の設定

`.env`ファイルを作成して環境変数を設定します。

```bash
# .envファイルの例
AWS_REGION=ap-northeast-1
ALLOW_ORIGINS=http://localhost:5173,http://localhost:3000
TABLE_NAME=rag-search-results-table
DEBUG=True
```

### 3. ローカルでの実行

以下のコマンドでLambda関数をローカルで実行できます。

```bash
python run_local_test.py
```

または、Lambda関数を直接実行することもできます。

```bash
python SearchLogic/LambdaFunction.py
```

## ディレクトリ構造

```
rag-backend/
├── .env                  # 環境変数設定ファイル（ローカルテスト用）
├── requirements.txt      # 依存パッケージリスト
├── run_local_test.py     # ローカルテスト用スクリプト
└── SearchLogic/          # Lambda関数のロジック
    └── LambdaFunction.py # メインの関数コード
```

## デプロイ方法

本番環境へのデプロイは、AWSコンソールまたはCLIを使用して行います。

```bash
# AWSプロファイルが設定されていることを確認
aws configure list

# zipファイルを作成
zip -r function.zip SearchLogic requirements.txt

# Lambda関数のデプロイ
aws lambda update-function-code --function-name your-function-name --zip-file fileb://function.zip
```

## 環境変数

Lambda関数は以下の環境変数を使用します：

- `AWS_REGION`: AWS リージョン（例: ap-northeast-1）
- `ALLOW_ORIGINS`: CORSで許可するオリジン
- `TABLE_NAME`: DynamoDBのテーブル名
- `DEBUG`: デバッグモード（True/False）

ローカルでテストする場合は、これらの環境変数を`.env`ファイルに設定します。
