"""
RAG検索バックエンドのローカルテスト用スクリプト
"""

import os
import json
import sys
from pathlib import Path

# 現在のディレクトリをパスに追加
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

try:
    # dotenv をインポート
    from dotenv import load_dotenv

    # .env ファイルを読み込む
    env_path = current_dir / '.env'
    if env_path.exists():
        print(f"Loading environment variables from {env_path}")
        load_dotenv(dotenv_path=env_path)
    else:
        print(f"Warning: .env file not found at {env_path}")
except ImportError:
    print("Warning: python-dotenv not installed. Run 'pip install -r requirements.txt'")

# 環境変数を表示
print("\nEnvironment Variables:")
for key in ['AWS_REGION', 'ALLOW_ORIGINS', 'TABLE_NAME', 'DEBUG']:
    print(f"{key}: {os.environ.get(key, 'Not set')}")

# Lambda関数をインポート
try:
    from SearchLogic.LambdaFunction import lambda_handler

    # テスト用のイベントデータ - API Gateway REST API形式
    test_event = {
        "resource": "/masterdata/sections-categories",
        "path": "/masterdata/sections-categories",
        "httpMethod": "GET",
        "queryStringParameters": {
            "query": "test_query"  # クエリパラメータ名が正確に一致する必要がある
        },
        "multiValueQueryStringParameters": {
            "query": ["test_query"]
        },
        "pathParameters": None,
        "stageVariables": None,
        "requestContext": {
            "authorizer": {
                "claims": {}
            },
            "path": "/masterdata/sections-categories",
            "resourcePath": "/masterdata/sections-categories",
            "httpMethod": "GET"
        },
        "headers": {
            "Accept": "application/json",
            "Host": "localhost:3000"
        },
        "body": None,
        "isBase64Encoded": False
    }

    # ローカルテスト用のコンテキスト
    class TestContext:
        function_name = "local-test"
        memory_limit_in_mb = 128
        invoked_function_arn = "arn:aws:lambda:local:123456789012:function:local-test"
        aws_request_id = "local-test"

    print("\nRunning Lambda function with test event...")
    print(f"Test query: {test_event['queryStringParameters']['query']}")

    # ハンドラーを実行
    result = lambda_handler(test_event, TestContext())

    print("\nTest Result:")
    print(json.dumps(result, indent=2))

except ImportError as e:
    print(f"Error importing Lambda function: {e}")
except Exception as e:
    print(f"Error executing Lambda function: {e}")
    # スタックトレースを表示
    import traceback
    traceback.print_exc()
