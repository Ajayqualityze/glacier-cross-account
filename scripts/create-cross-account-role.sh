#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <SOURCE_ACCOUNT_ID> <GLACIER_BUCKET_NAME>"
  echo "Example: $0 322736531566 my-glacier-bucket-2026"
  exit 1
fi

SOURCE_ACCOUNT_ID="$1"
BUCKET_NAME="$2"
ROLE_NAME="CrossAccountS3GlacierRole"
TRUST_POLICY_FILE="trust-policy.json"
ROLE_POLICY_FILE="role-policy.json"

cat > "$TRUST_POLICY_FILE" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${SOURCE_ACCOUNT_ID}:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

echo "Creating bucket if missing: $BUCKET_NAME"
aws s3 mb "s3://$BUCKET_NAME" --region us-east-1 || true

cat > "$ROLE_POLICY_FILE" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${BUCKET_NAME}",
        "arn:aws:s3:::${BUCKET_NAME}/*"
      ]
    }
  ]
}
EOF

echo "Creating or updating role $ROLE_NAME in target account"
if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  echo "Role already exists, updating trust policy"
  aws iam update-assume-role-policy --role-name "$ROLE_NAME" --policy-document file://"$TRUST_POLICY_FILE"
else
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document file://"$TRUST_POLICY_FILE"
fi

echo "Attaching bucket policy to $ROLE_NAME"
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name S3GlacierAccess \
  --policy-document file://"$ROLE_POLICY_FILE"

ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)

echo "Cross-account role ready: $ROLE_ARN"
echo "Set CROSS_ACCOUNT_ROLE_ARN to this value in the source Amplify app environment."
