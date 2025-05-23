from http import HTTPStatus
import os
import json
import boto3
import boto3.dynamodb
import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any
from aws_lambda_powertools.event_handler import content_types
from aws_lambda_powertools.event_handler.api_gateway import APIGatewayRestResolver, CORSConfig, Response
from aws_lambda_powertools.event_handler.exceptions import BadRequestError, InternalServerError
from aws_lambda_powertools.tracing import Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
from botocore.exceptions import ClientError

# .envファイルからの環境変数読み込み（ローカルテスト時のみ）
def load_env_variables():
    try:
        # LambdaFunction.pyの親ディレクトリのパスを取得
        root_path = Path(__file__).parent.parent
        # Lambdaではないローカル環境の場合のみ.envを読み込む
        if not os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
            env_path = root_path / '.env'
            if env_path.exists():
                # python-dotenvは初回実行時にのみimportする（Lambdaデプロイサイズ削減のため）
                from dotenv import load_dotenv
                print(f"Loading environment variables from {env_path}")
                load_dotenv(dotenv_path=env_path)
                return True
    except Exception as e:
        print(f"Error loading .env file: {e}")
    return False

# 環境変数の読み込み
load_env_variables()

# 環境変数の取得
AWS_REGION = os.environ.get('AWS_REGION', 'ap-northeast-1')  # デフォルト値を設定
ALLOW_ORIGINS = os.environ.get("ALLOW_ORIGINS", "*")
TABLE_NAME = os.environ.get('TABLE_NAME', 'default-table-name')

# デバッグ情報（ローカルテスト時のみ表示）
if os.environ.get('DEBUG') == 'True':
    print(f"AWS_REGION: {AWS_REGION}")
    print(f"ALLOW_ORIGINS: {ALLOW_ORIGINS}")
    print(f"TABLE_NAME: {TABLE_NAME}")

# CORSの設定
cors_config = CORSConfig(allow_origin=ALLOW_ORIGINS)
app = APIGatewayRestResolver(cors=cors_config)
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
tracer = Tracer()

def fetch_dynamodb_data(query: str) -> List[Dict[str, Any]]:
    """
    DynamoDBからデータを取得する関数.
    """
    print(f"Fetching data for query: {query}")
    # ローカルテストでDynamoDBがない場合にモックデータを返す
    if os.environ.get('DEBUG') == 'True' and not os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
        print("Using mock data for local testing")
        # モックデータの例
        return [
            {
                "id": "1",
                "group_name": query,
                "title": f"Sample Result 1 for {query}",
                "content": "This is a sample content for testing.",
                "score": 0.95,
                "url": "https://example.com/doc1"
            },
            {
                "id": "2",
                "group_name": query,
                "title": f"Sample Result 2 for {query}",
                "content": "Another sample content for local testing.",
                "score": 0.85,
                "url": "https://example.com/doc2"
            }
        ]

    # 実際のDynamoDB操作
    try:
        table = dynamodb.Table(TABLE_NAME)
        key_condition = boto3.dynamodb.conditions.Key('group_name').eq(query)
        response = table.query(KeyConditionExpression=key_condition)
        items = response.get('Items', [])
        print(f"Found {len(items)} items in DynamoDB")
        return items
    except ClientError as e:
        error_msg = f"Error fetching data from DynamoDB: {e}"
        print(error_msg)
        raise InternalServerError(error_msg)
    except Exception as e:
        error_msg = f"Unexpected error: {e}"
        print(error_msg)
        raise InternalServerError(error_msg)

def create_response(data: List[Dict[str, Any]]) -> dict:
    """
    レスポンスを作成する関数.
    """
    return Response(
        status_code = HTTPStatus.OK,
        content_type = content_types.APPLICATION_JSON,
        body = json.dumps({
            "results": data,
            "total": len(data),
            "query": data[0]["group_name"] if data else ""
        })
    )

@app.get('/masterdata/sections-categories')
@tracer.capture_method
def search_dynamodb():
    """
    DynamoDBからデータを検索する関数.
    """
    # クエリパラメータを取得
    query_params = app.current_event.query_string_parameters or {}
    query = query_params.get('query', '')

    if not query:
        print("No query parameter provided")
        return create_response([])

    print(f"Searching with query: {query}")
    claims = app.current_event.request_context.authorizer.get('claims', {})
    dynamodb_data = fetch_dynamodb_data(query)

    if not dynamodb_data:
        return create_response([])

    return create_response(dynamodb_data)

@tracer.capture_lambda_handler
def lambda_handler(event, context: LambdaContext) -> dict:
    """
    マスターデータ取得のLambdaハンドラ.

    Args:
        event (dict): API Gateway REST APIイベント
        context (LambdaContext): 未使用

    Returns:
        dict: レスポンス
    """
    if os.environ.get('DEBUG') == 'True':
        print('Event of lambda_handler:', json.dumps(event, indent=2))
    return app.resolve(event, context)

# ローカルでテスト実行する場合のエントリーポイント
if __name__ == "__main__":
    # テスト用のイベントデータ
    test_event = {
        "resource": "/masterdata/sections-categories",
        "path": "/masterdata/sections-categories",
        "httpMethod": "GET",
        "queryStringParameters": {
            "query": "test_query"
        },
        "multiValueQueryStringParameters": {
            "query": ["test_query"]
        },
        "pathParameters": None,
        "requestContext": {
            "authorizer": {
                "claims": {}
            },
            "path": "/masterdata/sections-categories",
            "resourcePath": "/masterdata/sections-categories",
            "httpMethod": "GET"
        }
    }

    # ローカルテスト用のコンテキスト
    class TestContext:
        function_name = "local-test"
        memory_limit_in_mb = 128
        invoked_function_arn = "arn:aws:lambda:local:123456789012:function:local-test"
        aws_request_id = "local-test"

    # ハンドラーを実行
    result = lambda_handler(test_event, TestContext())
    print("\nTest Result:")
    print(json.dumps(result, indent=2))
