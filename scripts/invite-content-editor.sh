#!/usr/bin/env bash
set -euo pipefail
# Invoke only when the user has authorized sending the account invitation.
# Example: bash scripts/invite-content-editor.sh editor@example.com
if [[ $# -ne 1 || "$1" != *@* ]]; then
  echo 'Usage: bash scripts/invite-content-editor.sh editor@example.com' >&2
  exit 2
fi
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
POOL_ID=$(terraform -chdir="$ROOT_DIR/infra/content" output -raw editor_user_pool_id)
aws cognito-idp admin-create-user \
  --profile TerraformMindapax --region us-east-1 \
  --user-pool-id "$POOL_ID" --username "$1" \
  --message-action RESEND --desired-delivery-mediums EMAIL \
  --query 'User.{Username:Username,Status:UserStatus}'
