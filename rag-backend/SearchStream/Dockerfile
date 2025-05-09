FROM public.ecr.aws/lambda/python:3.12

COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /app

ADD . .

RUN pip install -r requirements.txt

ENV AWS_LWA_INVOKE_MODE=RESPONSE_STREAM
