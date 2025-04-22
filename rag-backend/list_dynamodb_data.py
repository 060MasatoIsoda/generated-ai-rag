"""
DynamoDBテーブルのデータ一覧を取得するスクリプト
"""

import boto3
import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from botocore.exceptions import ClientError, NoCredentialsError

# 環境変数の読み込み
def load_env_variables():
    current_dir = Path(__file__).parent
    env_path = current_dir / '.env'
    if env_path.exists():
        print(f"環境変数ファイルを読み込んでいます: {env_path}")
        load_dotenv(dotenv_path=env_path)
        return True
    else:
        print(f"警告: .envファイルが見つかりません: {env_path}")
    return False

# テーブル一覧を取得
def list_tables(region_name=None):
    """DynamoDBテーブル一覧を取得"""
    try:
        dynamodb = boto3.client('dynamodb', region_name=region_name)
        tables = dynamodb.list_tables()
        return tables['TableNames']
    except NoCredentialsError:
        print("エラー: AWS認証情報が見つかりません。AWSプロファイルを確認してください。")
        return []
    except Exception as e:
        print(f"テーブル一覧取得中にエラーが発生しました: {e}")
        return []

# テーブルデータを取得
def scan_table(table_name, region_name=None, limit=100):
    """テーブルのスキャンを実行"""
    dynamodb = boto3.resource('dynamodb', region_name=region_name)
    table = dynamodb.Table(table_name)

    try:
        if limit > 0:
            response = table.scan(Limit=limit)
        else:
            response = table.scan()

        items = response['Items']

        # ページネーション処理（limit=0の場合のみ全データ取得）
        if limit == 0:
            while 'LastEvaluatedKey' in response:
                response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                items.extend(response['Items'])

        return {
            'table_name': table_name,
            'count': len(items),
            'items': items,
            'has_more': 'LastEvaluatedKey' in response
        }
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        print(f"DynamoDBエラー ({error_code}): {error_message}")
        return { 'table_name': table_name, 'error': str(e) }
    except Exception as e:
        print(f"予期せぬエラー: {e}")
        return { 'table_name': table_name, 'error': str(e) }

# メイン関数
def main():
    # 環境変数を読み込む
    load_env_variables()

    # 環境変数から設定を取得
    aws_region = os.environ.get('AWS_REGION', 'ap-northeast-1')
    table_name = os.environ.get('TABLE_NAME')

    print(f"AWS リージョン: {aws_region}")
    print(f"デフォルトテーブル: {table_name or '未設定'}")

    # テーブル一覧を取得
    print("\nDynamoDBテーブル一覧を取得中...")
    tables = list_tables(aws_region)

    if not tables:
        print("テーブルが見つかりませんでした。別のリージョンを指定するか、AWS認証情報を確認してください。")
        return

    print(f"{len(tables)}個のテーブルが見つかりました:")
    for i, table in enumerate(tables, 1):
        if table == table_name:
            print(f"{i}. {table} [デフォルト]")
        else:
            print(f"{i}. {table}")

    # テーブル選択
    selected_table = table_name
    if not selected_table or selected_table not in tables:
        while True:
            try:
                selection = input("\n表示するテーブル番号を入力してください (1-{}): ".format(len(tables)))
                index = int(selection) - 1
                if 0 <= index < len(tables):
                    selected_table = tables[index]
                    break
                else:
                    print(f"無効な番号です。1から{len(tables)}の番号を入力してください。")
            except ValueError:
                print("数値を入力してください")

    # データ取得件数
    limit = 10  # デフォルト
    limit_input = input(f"\n取得する最大件数を入力してください (デフォルト: {limit}, 0=全件取得): ")
    if limit_input.strip():
        try:
            limit = int(limit_input)
            if limit < 0:
                print("0以上の値を使用します。デフォルト値を使用します。")
                limit = 10
        except ValueError:
            print("有効な数値ではありません。デフォルト値を使用します。")

    # データ取得
    print(f"\n'{selected_table}'からデータを取得中...")
    result = scan_table(selected_table, aws_region, limit)

    if 'error' in result:
        print(f"エラーが発生しました: {result['error']}")
        return

    # 結果表示
    print(f"\n{result['count']}件のアイテムを取得しました:")

    if result['items']:
        # 結果表示
        for i, item in enumerate(result['items'], 1):
            print(f"\nアイテム {i}:")
            print(json.dumps(item, ensure_ascii=False, indent=2))

        # ファイル保存オプション
        save_option = input("\n結果をJSONファイルに保存しますか？ (y/n): ").lower() == 'y'
        if save_option:
            filename = f"{selected_table}_data.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(result['items'], f, ensure_ascii=False, indent=2)
            print(f"データを{filename}に保存しました")
    else:
        print("データが見つかりませんでした。")

    if result['has_more']:
        print("\n※まだ表示されていないデータがあります。limit=0を指定して全件取得してください。")

if __name__ == "__main__":
    main()
