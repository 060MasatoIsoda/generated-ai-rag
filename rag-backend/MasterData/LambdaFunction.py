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


def fetch_dynamodb_data() -> List[Dict[str, Any]]:
    """
    DynamoDBからデータを取得する関数.
    """

    # 実際のDynamoDB操作
    try:
        table = dynamodb.Table(TABLE_NAME)
        response = table.scan(Limit=100)
        logger.info(response)
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


def create_get_response(data: List[Dict[str, Any]]) -> dict:
    """
    レスポンスを作成する関数.
    """
    return Response(
        status_code=HTTPStatus.OK,
        content_type=content_types.APPLICATION_JSON,
        body=json.dumps({
            "results": data,
            "total": len(data)
        })
    )

def numbering_id(sections: dict) -> dict:
    """
    セクションデータのidを数値に変換する関数.
    """
    # 現在のデータを取得して最大IDを特定
    existing_data = fetch_dynamodb_data()
    existing_ids = [int(item['id']) for item in existing_data if 'id' in item and item['id'].isdigit()]
    max_id = max(existing_ids) if existing_ids else 0

    # 既存のIDのマップを作成（高速検索用）
    existing_id_map = {item['id']: True for item in existing_data if 'id' in item}

    for section in sections:
        # IDが存在するかチェック
        if 'id' not in section or not section['id'] or section['id'] not in existing_id_map:
            # 新規データの場合、新しいIDを採番
            max_id += 1
            section['id'] = str(max_id)
    return sections

def formatting_category_data(categories: dict) -> dict:
    """
    カテゴリデータをフォーマットする関数.
    """
    # categoriesを文字列の配列に変換
    formatted_categories = []
    for category in categories:
        if isinstance(category, dict) and 'categoryName' in category:
            formatted_categories.append(category['categoryName'])
        elif isinstance(category, str):
            formatted_categories.append(category)
    return formatted_categories

def formatting_section_data(sections: dict) -> dict:
    """
    セクションデータをフォーマットする関数.
    id: string;
    sectionName: string;
    categories: Category[];
    """
    now = datetime.now()
    formatted_sections = []
    for section in sections:
        id = section.get('id', '')
        sectionName = section.get('sectionName', '')
        categories = formatting_category_data(section.get('categories', []))
        formatted_sections.append({
            "id": id,
            "update_at": now.isoformat(),
            "sectionName": sectionName,
            "categories": categories
        })

    return formatted_sections


def save_dynamodb_data(formatted_sections) -> None:
    """
    DynamoDBにデータを保存する関数.
    既存のデータの場合は更新し、新規の場合は追加する
    """
    table = dynamodb.Table(TABLE_NAME)
    for section in formatted_sections:
        try:
            # 既存のデータを更新
            table.update_item(
                Key={
                    'id': section['id']
                },
                UpdateExpression='SET sectionName = :sn, categories = :cat, update_at = :ua',
                ExpressionAttributeValues={
                    ':sn': section['sectionName'],
                    ':cat': section['categories'],
                    ':ua': section['update_at']
                }
            )
        except ClientError as e:
            if e.response['Error']['Code'] == 'ValidationException':
                # 新規データの場合は追加
                table.put_item(Item=section)
            else:
                raise e


def create_save_response(data) -> dict:
    """
    DynamoDBにデータを保存した後のレスポンスを作成する関数.
    """
    return Response(
        status_code=HTTPStatus.OK,
        content_type=content_types.APPLICATION_JSON,
        body=json.dumps({
            "total": len(data),
            "message": "Data saved successfully"
        })
    )

def create_non_response() -> dict:
    """
    DynamoDBにデータを保存した後のレスポンスを作成する関数.
    """
    return Response(
        status_code = HTTPStatus.OK,
        content_type = content_types.APPLICATION_JSON,
        body = json.dumps({
            "message": "No data to save"
        })
    )

@app.get('/masterdata/sections-categories')
@tracer.capture_method
def search_dynamodb():
    """
    DynamoDBからデータを検索する関数.
    """
    dynamodb_data = fetch_dynamodb_data()

    if not dynamodb_data:
        return create_get_response([])

    return create_get_response(dynamodb_data)

@app.post('/masterdata/sections-categories')
@tracer.capture_method
def save_categories():
    """
    DynamoDBにデータを保存する関数.
    """
    request_body: dict = app.current_event.json_body

    sections = request_body.get('sections', [])
    if sections:
        numbered_sections = numbering_id(sections)
        formatted_sections = formatting_section_data(numbered_sections)
        save_dynamodb_data(formatted_sections)

    dynamodb_data = fetch_dynamodb_data()

    if not dynamodb_data:
        return create_get_response([])

    return create_get_response(dynamodb_data)

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
