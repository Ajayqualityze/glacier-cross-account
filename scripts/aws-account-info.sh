#!/usr/bin/env bash
set -euo pipefail

echo "Active AWS account:"
aws sts get-caller-identity --query Account --output text

echo
if aws iam get-role --role-name CrossAccountS3GlacierRole >/dev/null 2>&1; then
  echo "Target role exists in this account: CrossAccountS3GlacierRole"
else
  echo "Target role CrossAccountS3GlacierRole does not exist in this account."
fi

echo
echo "Amplify roles in this account containing 'glaciercrossaccou' or 'amplify-d1uayzli2ilhs7':"
aws iam list-roles --query "Roles[?contains(RoleName, 'glaciercrossaccou') || contains(RoleName, 'amplify-d1uayzli2ilhs7')].RoleName" --output text | tr '\t' '\n' || true
