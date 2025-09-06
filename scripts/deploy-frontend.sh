#!/usr/bin/env bash
set -euo pipefail

# Deploys the frontend only: build, upload to S3 with appropriate cache headers,
# and invalidate CloudFront for HTML entry points.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="$ROOT_DIR/infra/terraform"
DIST_DIR="$ROOT_DIR/dist"

SKIP_BUILD=0
DRY_RUN=0

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  --skip-build   Skip npm install/build step
  --dry-run      Show what would be done without making changes (S3/CF)
  -h, --help     Show this help

Env:
  AWS_PROFILE    Optional, AWS CLI profile to use

This script expects Terraform outputs in $TF_DIR to include:
  - site_bucket (S3 bucket name)
  - cloudfront_domain (CloudFront domain)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build) SKIP_BUILD=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 2 ;;
  esac
done

need_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1" >&2; exit 1; }; }

need_cmd terraform
need_cmd aws
need_cmd npm

pushd "$ROOT_DIR" >/dev/null

if [[ "$SKIP_BUILD" -ne 1 ]]; then
  echo "==> Installing deps and building (frontend)"
  npm ci
  npm run build
else
  echo "==> Skipping build as requested"
fi

if [[ ! -d "$DIST_DIR" ]]; then
  echo "Build output not found at $DIST_DIR" >&2
  exit 1
fi

echo "==> Reading Terraform outputs"
BUCKET=$(terraform -chdir="$TF_DIR" output -raw site_bucket)
DOMAIN=$(terraform -chdir="$TF_DIR" output -raw cloudfront_domain)

if [[ -z "${BUCKET:-}" || -z "${DOMAIN:-}" ]]; then
  echo "Could not get required outputs (site_bucket, cloudfront_domain)" >&2
  exit 1
fi

echo "S3 Bucket: $BUCKET"
echo "CloudFront Domain: $DOMAIN"

echo "==> Resolving CloudFront distribution ID"
DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?DomainName=='$DOMAIN'].Id | [0]" --output text)
if [[ -z "${DIST_ID:-}" || "$DIST_ID" == "None" || "$DIST_ID" == "null" ]]; then
  echo "Could not resolve CloudFront distribution ID for domain: $DOMAIN" >&2
  exit 1
fi
echo "CloudFront Distribution ID: $DIST_ID"

DRY_ARG=()
if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "==> Dry run enabled"
  DRY_ARG=(--dryrun)
fi

if [[ -d "$DIST_DIR/assets" ]]; then
  echo "==> Syncing assets (immutable cache)"
  aws s3 sync "$DIST_DIR/assets" "s3://$BUCKET/assets" \
    ${DRY_ARG[@]:-} \
    --cache-control 'public,max-age=31536000,immutable' \
    --exclude '*' --include '*' >/dev/null
else
  echo "==> No assets directory found; skipping assets sync"
fi

echo "==> Syncing other static files (short cache)"
aws s3 sync "$DIST_DIR" "s3://$BUCKET" \
  ${DRY_ARG[@]:-} \
  --delete \
  --exclude 'assets/*' --exclude 'index.html' \
  --cache-control 'public,max-age=300' >/dev/null

echo "==> Uploading index.html (no-cache)"
aws s3 cp "$DIST_DIR/index.html" "s3://$BUCKET/index.html" \
  ${DRY_ARG[@]:-} \
  --cache-control 'no-cache' >/dev/null

echo "==> Creating CloudFront invalidation for HTML entry points"
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/index.html" "/" >/dev/null

echo "✅ Frontend deployed: https://$DOMAIN/"

popd >/dev/null
