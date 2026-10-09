import json
import os
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

class S3EvidenceVault:
    def __init__(self):
        self.bucket = settings.AWS_S3_EVIDENCE_BUCKET
        self.local_vault_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "evidence_vault")
        os.makedirs(self.local_vault_dir, exist_ok=True)
        self.client = None
        self._init_client()

    def _init_client(self):
        if not HAS_BOTO3:
            self.client = None
            return
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            try:
                self.client = boto3.client(
                    "s3",
                    region_name=settings.AWS_REGION,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
                )
            except Exception as e:
                print(f"[WARN] Failed to initialize Boto3 S3 client: {e}. Falling back to local vault.")
                self.client = None
        else:
            self.client = None

    def store_evidence(self, key_name: str, evidence_data: Dict[str, Any]) -> str:
        """
        Stores evidence package in AWS S3, or local vault if AWS credentials are not set.
        Returns the storage URI.
        """
        payload_bytes = json.dumps(evidence_data, indent=2).encode("utf-8")
        s3_key = f"evidence/{key_name}.json"

        # Attempt S3 upload if client is initialized
        if self.client:
            try:
                self.client.put_object(
                    Bucket=self.bucket,
                    Key=s3_key,
                    Body=payload_bytes,
                    ContentType="application/json",
                    Metadata={"sha256": evidence_data.get("seal_hash", "")}
                )
                return f"s3://{self.bucket}/{s3_key}"
            except (ClientError, NoCredentialsError) as e:
                print(f"[WARN] S3 upload error: {e}. Writing to local vault storage.")

        # Local fallback store
        local_path = os.path.join(self.local_vault_dir, f"{key_name}.json")
        with open(local_path, "wb") as f:
            f.write(payload_bytes)
        return f"s3://{self.bucket}/{s3_key}"

    def get_evidence(self, key_name: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves evidence package by key.
        """
        s3_key = f"evidence/{key_name}.json"
        if self.client:
            try:
                resp = self.client.get_object(Bucket=self.bucket, Key=s3_key)
                return json.loads(resp["Body"].read().decode("utf-8"))
            except Exception:
                pass

        local_path = os.path.join(self.local_vault_dir, f"{key_name}.json")
        if os.path.exists(local_path):
            with open(local_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return None

s3_evidence_vault = S3EvidenceVault()
