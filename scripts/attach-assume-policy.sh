#!/usr/bin/env bash
set -euo pipefail

# Attach the local assume-policy.json to a role
# Usage: ./scripts/attach-assume-policy.sh <LambdaRoleName>

ROLE_NAME="$1"
if [ -z "${ROLE_NAME:-}" ]; then
  echo "Usage: $0 <RoleName>"
  exit 1
fi

aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name AllowAssumeCrossAccountRole --policy-document file://assume-policy.json

echo "Policy 'AllowAssumeCrossAccountRole' attached to role: $ROLE_NAME"
