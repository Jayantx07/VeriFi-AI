import json
import re
from typing import Dict, Any, Optional
try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
    HAS_BOTO3 = True
except ImportError:
    boto3 = None
    ClientError = Exception
    NoCredentialsError = Exception
    HAS_BOTO3 = False
from app.config import settings

class BedrockClient:
    def __init__(self):
        self.model_id = settings.BEDROCK_MODEL_ID
        self.client = None
        self._init_client()

    def _init_client(self):
        if not HAS_BOTO3:
            self.client = None
            return
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            try:
                self.client = boto3.client(
                    service_name="bedrock-runtime",
                    region_name=settings.AWS_REGION,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
                )
            except Exception as e:
                print(f"[WARN] Failed to initialize Bedrock client: {e}")
                self.client = None
        else:
            self.client = None

    def invoke_claude_json(self, prompt: str, system_prompt: str) -> Optional[Dict[str, Any]]:
        """
        Invokes Claude 3 via Amazon Bedrock runtime and parses structured JSON output.
        """
        if not self.client:
            return None

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "system": system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": [{"type": "text", "text": prompt}]
                }
            ],
            "temperature": 0.1
        })

        try:
            response = self.client.invoke_model(
                modelId=self.model_id,
                contentType="application/json",
                accept="application/json",
                body=body
            )
            response_body = json.loads(response.get("body").read())
            raw_text = response_body["content"][0]["text"]

            # Extract JSON block
            json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            return json.loads(raw_text)
        except (ClientError, NoCredentialsError, Exception) as e:
            print(f"[WARN] Bedrock invocation error: {e}")
            return None

bedrock_client = BedrockClient()
