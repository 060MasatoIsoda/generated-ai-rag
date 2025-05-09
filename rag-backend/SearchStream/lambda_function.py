"""Generateに関連する機能を提供するLambda関数."""
import json
import os
import re
from typing import Any, Generator

import boto3
import uvicorn
from aws_lambda_powertools import Logger
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from langfuse.decorators import langfuse_context, observe

logger = Logger()

# 環境変数の設定
MODEL_VERSION = os.environ.get('MODEL_VERSION')
MODEL_REGION = os.environ.get('MODEL_REGION')
ANTHROPIC_VERSION = os.environ.get('ANTHROPIC_VERSION')
SERVER_HOST = os.environ.get('SERVER_HOST', '127.0.0.1')    # サーバーホストの設定を追加
SERVER_PORT = int(os.environ.get('SERVER_PORT', '8080'))
ALLOW_ORIGIN = os.getenv('ALLOW_ORIGIN')

# AWSクライアントの初期化
bedrock_runtime = boto3.client('bedrock-runtime')
s3_client = boto3.client('s3', region_name=MODEL_REGION)

app = FastAPI()

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
"SourceId": データソースのID,
"DocumentId": "ドキュメントを一意に特定するIDです。",
"DocumentTitle": "ドキュメントのタイトルです。",
"DocumentPage": "ドキュメントのページです。",
"Content": "ドキュメントの内容です。こちらをもとに回答してください。",
}
</参考ドキュメントのJSON形式>

<参考ドキュメント>
"""
MESSAGE_FOOTER = """
</参考ドキュメント>

<回答のルール>
* 雑談や挨拶には応じないでください。「私は雑談はできません。通常のチャット機能をご利用ください。」とだけ出力してください。他の文言は一切出力しないでください。例外はありません。
* 必ず<参考ドキュメント></参考ドキュメント>をもとに回答してください。<参考ドキュメント></参考ドキュメント>から読み取れないことは、絶対に回答しないでください。
* 回答の文末ごとに、参照した全てのドキュメントの SourceId を [^<SourceId>] 形式で文末に追加してください。
* <参考ドキュメント></参考ドキュメント>から読み取れない場合は、「回答に必要な情報が見つかりませんでした。」とだけ出力してください。例外はありません。
* 質問に具体性がなく回答できない場合は、質問の仕方をアドバイスしてください。
* 回答文以外の文字列は一切出力しないで下さい。回答はJSON形式ではなく、テキストで出力してください。見出しやタイトル等も必要ありません。
</回答のルール>
"""


def generate_payload_for_bedrock_runtime(documents: str, search_text: str):
    """bedrock-runtime検索用の設定情報と文字列を生成します.

    Args:
        documents (str): 検索対象ドキュメントです.
        search_text (str): 検索テキストです.

    Returns:
        dict: 生成された設定情報です.
    """
    query = MESSAGE_HEADER + documents + MESSAGE_FOOTER

    messages = [
        {'role': 'user', 'content': [{'type': 'text', 'text': search_text}]},
    ]
    return {
        'anthropic_version': ANTHROPIC_VERSION,
        'max_tokens': 1000,
        'system': query,
        'messages': messages,
    }


def generate_signed_url(s3_uri, expiration=3600):
    """指定されたS3 URIに基づき署名付きURLを生成します.

    Args:
        s3_uri (str): S3のURI（例: s3://bucket-name/key）です.
        expiration (int): 署名付きURLの有効期限です.

    Returns:
        str: 署名付きURLです.
    """
    bucket_name, key = s3_uri.replace('s3://', '').split('/', 1)
    return s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket_name, 'Key': key},
        ExpiresIn=expiration,
    )


def format_documents_for_result(documents: list) -> list:
    """結果返却のためにドキュメントを整形します.

    Args:
        documents (list): 検索で取得したドキュメントのリストです.

    Returns:
        list: 整形されたドキュメントのリストです.
    """
    formatted_docs = []
    url_data = {}  # S3 URIごとのデータを管理する辞書
    for doc in documents:
        s3_uri = doc['location']['s3Location']['uri']
        page_number = doc['metadata'].get('x-amz-bedrock-kb-document-page-number', 1)

        # URLデータが初めての場合は初期化
        if s3_uri not in url_data:
            url_data[s3_uri] = {
                'signedUrl': generate_signed_url(s3_uri),
                'pageNumbers': set(),  # ページ番号を集合で管理
            }

        # ページ番号が未登録の場合のみ処理
        if page_number not in url_data[s3_uri]['pageNumbers']:
            formatted_docs.append({
                'documentUrl': url_data[s3_uri]['signedUrl'],
                'pageNumber': page_number,
                'score': doc.get('score', 0),
            })
            url_data[s3_uri]['pageNumbers'].add(page_number)  # ページ番号を登録
    return formatted_docs


def format_documents_for_generate(retrieved_documents: list) -> list:
    """LLMモデルでGenereteのためにドキュメントを整形します.

    Args:
        retrieved_documents (list): Retrieveで取得したドキュメントのリストです.

    Returns:
        list: 整形されたドキュメントのリストです.
    """
    formatted_docs = []
    for idx, doc in enumerate(retrieved_documents):
        formatted_docs.append({
            'SourceId': str(idx),
            'DocumentId': str(idx),
            'DocumentTitle': doc['metadata'].get('x-amz-bedrock-kb-source-uri', '未指定'),
            'DocumentPage': doc['metadata'].get('x-amz-bedrock-kb-document-page-number', '未指定'),
            'Content': doc['content'].get('text', ''),
        })
    return formatted_docs


def process_model_response(response, section) -> Generator[str, Any, None]:
    """モデルのレスポンスを処理します.

    Args:
        response: bedrock-runtimeからのレスポンスです.
        section: 処理対象のセクションです.

    Yields:
        str: ストリーミングデータです.
    """
    current_response = ''
    document_sent = False
    section_name = section.get('sectionName', '')
    documents = section.get('documents', [])

    for event in response.get('body'):
        chunk = json.loads(event['chunk']['bytes'].decode())
        if chunk.get('type') == 'content_block_delta':
            delta = chunk.get('delta', {})
            if delta.get('type') == 'text_delta':
                chunk_text = delta.get('text', '')
                current_response += chunk_text
                yield json.dumps({
                    'type': 'resultText',
                    'sectionName': section_name,
                    'content': chunk_text,
                })

    # 引用ドキュメントの処理
    if not document_sent:
        cited_docs = re.findall(r'\[\^(\d+)]', current_response)
        if cited_docs:
            result_docs = format_documents_for_result(documents)
            yield from (
                json.dumps({
                    'type': 'documents',
                    'sectionName': section_name,
                    'content': doc,
                })
                for doc in result_docs
            )


@observe()
async def generate_stream(search_text: str, documents: list, section_name: str):
    """ストリーミングレスポンスを生成します.

    Args:
        search_text (str): 検索テキストです。
        documents (list): 検索で取得したドキュメントのリストです。
        section_name (str): セクション名です。

    Yields:
        str: ストリーミングデータです。
    """
    try:
        # ドキュメントの処理とモデル呼び出し
        formatted_docs = format_documents_for_generate(documents)
        request_body = generate_payload_for_bedrock_runtime(
            json.dumps(formatted_docs, ensure_ascii=False),
            search_text,
        )

        response = bedrock_runtime.invoke_model_with_response_stream(
            modelId=MODEL_VERSION,
            contentType='application/json',
            accept='application/json',
            body=json.dumps(request_body),
        )

        # レスポンスの処理
        for model_response_chunk in process_model_response(response, {
            'sectionName': section_name,
            'documents': documents
        }):
            yield 'data: {0}\n\n'.format(model_response_chunk)
        langfuse_context.flush()

    except Exception as ex:
        logger.error('ストリーム生成エラー: {0}'.format(str(ex)))
        yield 'data: {0}\n\n'.format(
            json.dumps({
                'type': 'error',
                'content': str(ex),
            }),
        )


@observe()
@app.post('/search')
async def search(request: Request):
    """検索リクエストを処理します.

    Args:
        request (Request): リクエストオブジェクトです。

    Returns:
        dict: 検索結果を含むレスポンスです。
    """
    body = await request.json()
    search_text = body.get('searchText', '')
    search_target = body.get('searchTarget', None)

    if not search_text:
        return {'error': 'searchText is required'}, 400

    try:
        retrieved_results = []

        if search_target:
            if isinstance(search_target, list):
                for target in search_target:
                    section_name = target.get('section_name', '')
                    categories = target.get('category', [])
                    documents = retrieve_documents(search_text, section_name, categories)
                    retrieved_results.append({
                        'sectionName': section_name,
                        'documents': format_documents_for_result(documents)
                    })
            else:
                section_name = search_target.get('section_name', '')
                categories = search_target.get('category', [])
                documents = retrieve_documents(search_text, section_name, categories)
                retrieved_results.append({
                    'sectionName': section_name,
                    'documents': format_documents_for_result(documents)
                })
        else:
            documents = retrieve_documents_without_filter(search_text)
            retrieved_results.append({
                'sectionName': '',
                'documents': format_documents_for_result(documents)
            })

        return {
            'statusCode': 200,
            'body': {
                'results': retrieved_results,
                'total': len(retrieved_results)
            }
        }

    except Exception as ex:
        logger.error('検索エラー: {0}'.format(str(ex)))
        return {'error': str(ex)}, 500


@observe()
@app.post('/generate')
async def generate(request: Request):
    """生成リクエストを処理します.

    Args:
        request (Request): リクエストオブジェクトです。

    Returns:
        StreamingResponse: ストリーミングレスポンスです。
    """
    body = await request.json()
    search_text = body.get('searchText', '')
    documents = body.get('documents', [])
    section_name = body.get('sectionName', '')

    if not search_text:
        return {'error': 'searchText is required'}, 400
    if not documents:
        return {'error': 'documents is required'}, 400

    return StreamingResponse(
        generate_stream(search_text, documents, section_name),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    )


@app.options('/{path:path}')
async def preflight(path: str):
    """OPTIONSリクエストの処理.

    Args:
        path (str): Request Path.

    Returns:
        dict: 生成されたCORS情報です.
    """
    allow_headers = 'authorization, content-type, range, x-amz-date, x-amz-security-token, x-api-key, x-service-name'
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': ALLOW_ORIGIN,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': allow_headers,
        },
        'body': '',
    }


@app.get('/')
async def chat_access(request: Request):
    """チャットリクエストを処理します.

    Args:
        request (Request): リクエストオブジェクトです.

    Returns:
        StreamingResponse: ストリーミングレスポンスです.
    """
    return {
        'statusCode': 200,
        'message': 'success',
    }


@observe()
@app.post('/')
async def chat(request: Request):
    """チャットリクエストを処理します.

    Args:
        request (Request): リクエストオブジェクトです.

    Returns:
        StreamingResponse: ストリーミングレスポンスです.
    """
    body = await request.json()
    try:
        return process_chat_request(
            body.get('retrievedResults', []),
            body.get('searchText', ''),
        )
    except Exception as ex:
        logger.error('チャットエンドポイントエラー: {0}'.format(str(ex)))
        return {'error': str(ex)}


@app.on_event('shutdown')
async def shutdown_event():
    langfuse_context.flush()

if __name__ == '__main__':
    uvicorn.run(app, host=SERVER_HOST, port=SERVER_PORT)
