from http import HTTPStatus
import os
import json
import boto3
import boto3.dynamodb
import sys
import logger
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any
from aws_lambda_powertools.event_handler import content_types
from aws_lambda_powertools.event_handler.api_gateway import APIGatewayRestResolver, CORSConfig, Response
from aws_lambda_powertools.event_handler.exceptions import BadRequestError, InternalServerError
from aws_lambda_powertools.tracing import Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
from botocore.exceptions import ClientError

# 環境変数の取得
AWS_REGION = os.environ.get('AWS_REGION', 'ap-northeast-1')  # デフォルト値を設定
ALLOW_ORIGINS = os.environ.get("ALLOW_ORIGINS", "*")
TABLE_NAME = os.environ.get('TABLE_NAME', 'default-table-name')

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

    # 実際のDynamoDB操作
    try:
        table = dynamodb.Table(TABLE_NAME)
        response = table.scan(Limit=100)
        logger.info(response)
        # key_condition = boto3.dynamodb.conditions.Key('group_name').eq(query)
        # response = table.query(KeyConditionExpression=key_condition)
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
            "query": data[0]["groupName"] if data else ""
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
