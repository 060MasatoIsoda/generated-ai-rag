"""ログ出力のユーティリティモジュール."""
import copy
from typing import Union
from urllib.parse import unquote

from aws_lambda_powertools.logging import Logger
from aws_lambda_powertools.tracing import Tracer

logger = Logger()
tracer = Tracer()


@tracer.capture_method
def decode(log_data: dict) -> None:
    """日本語内容をデコードしてログに設定する.

    Args:
        log_data (dict) : ログのデータ
    """
    path_data = log_data.get('path')
    if path_data is not None:
        log_data['path'] = unquote(str(path_data))

    if 'pathParameters' in log_data and log_data['pathParameters']:
        path_parameters = log_data['pathParameters']
        for key in path_parameters.keys():
            path_parameters[key] = unquote(str(path_parameters[key]))


@tracer.capture_method
def info(log_message: str, extra: Union[dict, None] = None) -> None:  # noqa: WPS110
    """INFOログ出力.

    Args:
        log_message (str): メッセージ内容
        extra (dict) : 関連のデータ
    """
    if extra:
        # extraから要らない項目を削除
        extra_data = copy.deepcopy(extra)
        extra_data.pop('headers', None)
        extra_data.pop('multiValueHeaders', None)

        # 日本語内容をデコードしてログに設定する
        decode(extra_data)

        logger.info(log_message, extra=extra_data)
    else:
        logger.info(log_message)


@tracer.capture_method
def warning(log_message: str, extra: Union[dict, None] = None) -> None:
    """Warningログ出力.

    Args:
        log_message (str): メッセージ内容
        extra (dict) : 関連のデータ
    """
    if extra:
        logger.warning(log_message, extra=extra)
    else:
        logger.warning(log_message)


@tracer.capture_method
def error(log_message: str, extra: Union[dict, None] = None) -> None:
    """ERRORログ出力.

    Args:
        log_message (str): メッセージ内容
        extra (dict) : 関連のデータ
    """
    if extra:
        logger.error(log_message, extra=extra)
    else:
        logger.error(log_message)


@tracer.capture_method
def exception(log_message: str) -> None:
    """例外ログ出力.

    Args:
        log_message (str): メッセージ内容
    """
    logger.exception(log_message)
