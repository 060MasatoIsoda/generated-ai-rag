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
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'default-bucket-name')

# CORSの設定
cors_config = CORSConfig(allow_origin=ALLOW_ORIGINS)
app = APIGatewayRestResolver(cors=cors_config)
s3_client = boto3.client('s3', region_name=AWS_REGION)
tracer = Tracer()

def create_get_presigned_url(file_key: str) -> str:
    """
    S3へのアップロード用のpresigned URLを生成する関数.
    """
    return s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': BUCKET_NAME, 'Key': file_key},
        ExpiresIn=600)

def create_presigned_url(file_key: str, content_type: str) -> str:
    """
    S3へのアップロード用のpresigned URLを生成する関数.
    """
    return s3_client.generate_presigned_url(
        'put_object',
        Params={'Bucket': BUCKET_NAME, 'Key': file_key, 'ContentType': content_type},
        ExpiresIn=600)

def upload_file(file_key: str, file_path: str, content_type: str):
    """
    S3にファイルをアップロードする関数.
    """
    s3_client.upload_file(file_path, BUCKET_NAME, file_key, ExtraArgs={'ContentType': content_type})

def upload_metadata_file(file_key: str, section_name: str, category_name: str, file_name: str):
    """
    メタデータJSONファイルを生成してS3にアップロードする関数.
    """
    # メタデータの作成
    metadata = {
        "metadataAttributes": {
            "section": section_name,
            "category": category_name,
            "year": datetime.now().year
        }
    }

    # メタデータJSONを一時ファイルに書き込む
    temp_dir = "/tmp"  # Lambdaで書き込み可能な一時ディレクトリ
    metadata_file_path = f"{temp_dir}/{file_name}.metadata.json"

    try:
        os.makedirs(os.path.dirname(metadata_file_path), exist_ok=True)
        with open(metadata_file_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        # メタデータファイルをS3にアップロード
        metadata_key = f"{file_key}.metadata.json"
        upload_file(metadata_key, metadata_file_path, 'application/json')
        # 一時ファイルの削除
        os.remove(metadata_file_path)

        logger.info(f"メタデータファイルをアップロードしました: {metadata_key}")
        return metadata_key

    except Exception as e:
        logger.error(f"メタデータファイルのアップロードに失敗しました: {str(e)}")
        raise e

@app.post('/document/presigned-url')
@tracer.capture_method
def upload_document():
    """
    S3へのアップロード用のpresigned URLを発行する関数.
    """
    try:
        request_body: dict = app.current_event.json_body
        file_name = request_body.get('fileName')
        content_type = request_body.get('contentType')
        section_name = request_body.get('sectionName')
        category_name = request_body.get('categoryName')

        # 必須パラメータの検証
        if not all([file_name, content_type, section_name, category_name]):
            raise BadRequestError("必須パラメータが不足しています")

        # ファイルパスの構築
        file_key = f"docs/{section_name}/{file_name}"

        # presigned URLの生成（有効期限10分）
        presigned_url = create_presigned_url(file_key, content_type)
        get_presigned_url = create_get_presigned_url(file_key)
        upload_metadata_file(file_key, section_name, category_name, file_name)

        logger.info(f"put presigned URL: {presigned_url}")
        logger.info(f"get presigned URL: {get_presigned_url}")

        return Response(
            status_code=HTTPStatus.OK,
            content_type=content_types.APPLICATION_JSON,
            body=json.dumps({
                "uploadUrl": presigned_url,
                "fileKey": file_key
            })
        )

    except BadRequestError as e:
        logger.error(f"リクエスト検証エラー: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"予期しないエラー: {str(e)}")
        raise InternalServerError(f"presigned URL生成に失敗しました: {str(e)}")

@tracer.capture_lambda_handler
def lambda_handler(event, context: LambdaContext) -> dict:
    """
    データソース関連のLambdaハンドラ.

    Args:
        event (dict): API Gateway REST APIイベント
        context (LambdaContext): 未使用

    Returns:
        dict: レスポンス
    """
    if os.environ.get('DEBUG') == 'True':
        print('Event of lambda_handler:', json.dumps(event, indent=2))
    return app.resolve(event, context)
