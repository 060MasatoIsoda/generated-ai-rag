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
KNOWLEDGEBASE_ID = os.environ.get('KNOWLEDGEBASE_ID', '')

# CORSの設定
cors_config = CORSConfig(allow_origin=ALLOW_ORIGINS)
app = APIGatewayRestResolver(cors=cors_config)
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
tracer = Tracer()
bedrock_agent_runtime = boto3.client('bedrock-agent-runtime')

def format_documents(documents: list) -> list:
    """
    ドキュメントを整形する関数.
    """
    formatted_documents = []
    logger.info(f"Documents: {documents}")
    for index, document in enumerate(documents):
        formatted_documents.append({
            "id": index,
            'DocumentTitle': document['metadata'].get('x-amz-bedrock-kb-source-uri', '未指定'),
            'DocumentPage': document['metadata'].get('x-amz-bedrock-kb-document-page-number', '未指定'),
            'Content': document['content'].get('text', ''),
            'Score': document['score'],
        })
    return formatted_documents

def generate_retrieve_config(section_name: str, categories: list):
    """
    ベックロックにフィルター有りでデータを渡す設定を生成する関数.
    """
    filters = {}
    if section_name and categories:
                filters['filter'] = {
                'andAll': [
                    {'equals': {'key': 'section', 'value': section_name}},
                    {'in': {'key': 'category', 'value': categories}},
                ],
            }
    elif categories:
        filters['filter']= {'in': {'key': 'category', 'value': categories}}
    elif section_name:
        filters['filter']= {'equals': {'key': 'section', 'value': section_name}}

    return {
        'vectorSearchConfiguration': {
            'numberOfResults': 10,
            'overrideSearchType': 'SEMANTIC',
            **filters,
        },
    }

def generate_retrieval_config_without_filter():
    """
    ベックロックにフィルター無しでデータを渡す設定を生成する関数.
    """
    return {
        'vectorSearchConfiguration': {
            'numberOfResults': 10,
            'overrideSearchType': 'SEMANTIC'
        },
    }

def retrieve_documents_without_filter(search_text: str):
    """
    ベックロックからデータを取得する関数.
    """
    retrieve_config = generate_retrieval_config_without_filter()
    return bedrock_agent_runtime.retrieve(
        knowledgeBaseId=KNOWLEDGEBASE_ID,
        retrievalConfiguration=retrieve_config,
        retrievalQuery={'text': search_text},
    ).get('retrievalResults', [])


def retrieve_documents(search_text: str, section_name: str, categories: list):
    """
    ベックロックからフィルター有りでデータを取得する関数.
    """
    retrieve_config = generate_retrieve_config(section_name, categories)
    return bedrock_agent_runtime.retrieve(
        knowledgeBaseId=KNOWLEDGEBASE_ID,
        retrievalConfiguration=retrieve_config,
        retrievalQuery={'text': search_text},
    ).get('retrievalResults', [])


def get_highest_score_text(documents):
    """
    スコアが最も高いドキュメントのテキストを取得する関数.
    """
    if not documents:
        return ""

    highest_score_doc = max(documents, key=lambda doc: doc.get('score', 0))
    return highest_score_doc.get('content', {}).get('text', "")

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
        })
    )


@app.post('/knowledgebase/search')
@tracer.capture_method
def search_rag():
    """
    入力からRAG検索する関数.
    """
    # data mapping
    retrieved_results = []
    request_body: dict = app.current_event.json_body

    search_text = request_body.get('search_text', '')
    search_target = request_body.get('search_target', '')


    if search_target :
        # search_targetが配列かどうかをチェック
        if isinstance(search_target, list):
            # 配列の場合、従来通りfor文で処理
            for target in search_target:
                section_name = target.get('section_name', '')
                categories = target.get('category', [])
                documents = retrieve_documents(search_text, section_name, categories)
                formatted_documents = format_documents(documents)
                # スコアが最も高いテキストを取得
                highest_score_text = get_highest_score_text(documents)

                retrieved_results.append({
                    'section_name': section_name,
                    'categories': categories,
                    'documents': formatted_documents,
                    'highest_score_text': highest_score_text
                })
        else:
            # オブジェクトの場合、for文を使わずに処理
            section_name = search_target.get('section_name', '')
            categories = search_target.get('category', [])
            documents = retrieve_documents(search_text, section_name, categories)
            formatted_documents = format_documents(documents)
            # スコアが最も高いテキストを取得
            highest_score_text = get_highest_score_text(documents)

            retrieved_results.append({
                'section_name': section_name,
                'categories': categories,
                'documents': formatted_documents,
                'highest_score_text': highest_score_text
            })
    else:
        documents = retrieve_documents_without_filter(search_text)
        formatted_documents = format_documents(documents)
        # スコアが最も高いテキストを取得
        highest_score_text = get_highest_score_text(documents)

        retrieved_results.append({
            'section_name': '',
            'category_name': '',
            'documents': formatted_documents,
            'highest_score_text': highest_score_text
        })
    logger.info(f"Retrieved results: {retrieved_results}")

    return create_response(retrieved_results)

@tracer.capture_lambda_handler
def lambda_handler(event, context: LambdaContext) -> dict:
    """
    検索結果取得のLambdaハンドラ.

    Args:
        event (dict): API Gateway REST APIイベント
        context (LambdaContext): 未使用

    Returns:
        dict: レスポンス
    """
    logger.info(f"Received event: {event}")
    return app.resolve(event, context)
