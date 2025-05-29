from http import HTTPStatus
import os
import json
import boto3
import boto3.dynamodb
import sys
import base64
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
MODEL_VERSION = os.environ.get('MODEL_VERSION', 'anthropic.claude-3-5-sonnet-20240620-v1:0')
ANTHROPIC_VERSION = os.environ.get('ANTHROPIC_VERSION', 'bedrock-2023-05-31')
# CORSの設定
cors_config = CORSConfig(allow_origin=ALLOW_ORIGINS)
app = APIGatewayRestResolver(cors=cors_config)
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
s3_client = boto3.client('s3', region_name=AWS_REGION)
tracer = Tracer()
bedrock_agent_runtime = boto3.client('bedrock-agent-runtime')
bedrock_runtime = boto3.client('bedrock-runtime')

MESSAGE_HEADER = """
あなたは社内ユーザーからの質問を応えるAIアシスタントです。
以下の手順で社員の質問に答えてください。手順以外のことは絶対にしないでください。

<回答手順>
* <参考ドキュメント></参考ドキュメント>に回答の参考となるドキュメントを設定しているので、それを全て理解してください。
    なお、この<参考ドキュメント></参考ドキュメント>は<参考ドキュメントのJSON形式></参考ドキュメントのJSON形式>のフォーマットで設定されています。ドキュメントが複数個存在する可能性があります。そのすべてを理解してください。
* <回答のルール></回答のルール>を理解してください。このルールは絶対に守ってください。ルール以外のことは一切してはいけません。例外は一切ありません。
* チャットでユーザから質問が入力されるので、あなたは<参考ドキュメント></参考ドキュメント>の内容をもとに<回答のルール></回答のルール>に従って回答を行なってください。
</回答手順>

<参考ドキュメントのJSON形式>
{
"id": "ドキュメントを一意に特定するIDです。",
"DocumentTitle": "ドキュメントのタイトルです。",
"DocumentUrl": "ドキュメントのURLです。",
"DocumentPage": "ドキュメントのページです。",
"Content": "ドキュメントの内容です。こちらをもとに回答してください。",
"Score": "ドキュメントのスコアです。"
}
</参考ドキュメントのJSON形式>

<参考ドキュメント>
"""

MESSAGE_FOOTER = """
</参考ドキュメント>

<回答のルール>
* 雑談や挨拶には応じないでください。「私は雑談はできません。通常のチャット機能をご利用ください。」とだけ出力してください。他の文言は一切出力しないでください。例外はありません。
* 必ず<参考ドキュメント></参考ドキュメント>をもとに回答してください。<参考ドキュメント></参考ドキュメント>から読み取れないことは、絶対に回答しないでください。
* <参考ドキュメント></参考ドキュメント>から読み取れない場合は、「回答に必要な情報が見つかりませんでした。」とだけ出力してください。例外はありません。
* 質問に具体性がなく回答できない場合は、質問の仕方をアドバイスしてください。
* 回答文以外の文字列は一切出力しないで下さい。回答はJSON形式ではなく、テキストで出力してください。見出しやタイトル等も必要ありません。
</回答のルール>
"""

def format_documents(documents: list) -> list:
    """
    ドキュメントを整形する関数.
    """
    formatted_documents = []
    for index, document in enumerate(documents):
        formatted_documents.append({
            "id": index,
            'DocumentTitle': document['metadata'].get('x-amz-bedrock-kb-source-uri', '未指定'),
            'DocumentUrl': get_presigned_url(document['metadata'].get('x-amz-bedrock-kb-source-uri', '')),
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

def get_presigned_url(s3_uri: str):
    """
    プレサインURLを取得する関数.
    """
    bucket = s3_uri.split('/')[2]
    key = '/'.join(s3_uri.split('/')[3:])
    return s3_client.generate_presigned_url(
        'get_object', Params={'Bucket': bucket, 'Key': key}, ExpiresIn=3600)



def generate_summary_prompt(documents: list, search_text: str):
    """
    要約のプロンプトを生成する関数.
    """
    query = MESSAGE_HEADER + documents + MESSAGE_FOOTER

    message = [
        {
            "role": "user",
            "content": [{
                "type": "text",
                "text": search_text
            }]
        }
    ]

    return {
        'anthropic_version': ANTHROPIC_VERSION,
        'max_tokens': 1000,
        'system': query,
        'messages': message
    }

def generate_summary(documents: list, search_text: str):
    """
    検索結果の要約を生成する関数.
    """
    response = bedrock_runtime.invoke_model(
        modelId=MODEL_VERSION,
        accept="application/json",
        body=json.dumps(generate_summary_prompt(documents, search_text)),
        contentType="application/json",
    )
    response_body = json.loads(response.get('body').read())
    return response_body.get('content')[0].get('text')

def generate_retrieval_result(retrieved_results: list, search_text: str, section_name: str, categories: list):
    """
    検索結果を生成する関数.
    """
    if section_name and categories:
        documents = retrieve_documents(search_text, section_name, categories)
    else:
        documents = retrieve_documents_without_filter(search_text)
    formatted_documents = format_documents(documents)
    result_message = generate_summary(json.dumps(formatted_documents), search_text)
    highest_score_text = get_highest_score_text(documents)
    retrieved_results.append({
        'section_name': section_name,
        'categories': categories,
        'documents': formatted_documents,
        'highest_score_text': highest_score_text,
        'result_message': result_message
    })


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
                generate_retrieval_result(retrieved_results, search_text, section_name, categories)
        else:
            # オブジェクトの場合、for文を使わずに処理
            section_name = search_target.get('section_name', '')
            categories = search_target.get('category', [])
            generate_retrieval_result(retrieved_results, search_text, section_name, categories)

    else:
        generate_retrieval_result(retrieved_results, search_text, '', [])

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
