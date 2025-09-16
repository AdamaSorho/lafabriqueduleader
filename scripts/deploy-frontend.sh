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
  SITE_BUCKET    Override S3 bucket name (skip Terraform for bucket)
  CLOUDFRONT_DOMAIN   CloudFront domain (dxxxx.cloudfront.net) or custom CNAME

This script expects Terraform outputs in $TF_DIR to include:
  - site_bucket (S3 bucket name)
  - cloudfront_domain (CloudFront domain)
  - cloudfront_distribution_id (CloudFront distribution ID) — optional
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

echo "==> Resolving deployment targets"

# Resolve S3 bucket
if [[ -n "${SITE_BUCKET:-}" ]]; then
  BUCKET="$SITE_BUCKET"
else
  BUCKET=$(terraform -chdir="$TF_DIR" output -raw site_bucket)
fi
if [[ -z "${BUCKET:-}" ]]; then
  echo "Missing S3 bucket. Set SITE_BUCKET or ensure Terraform output 'site_bucket' exists." >&2
  exit 1
fi
echo "S3 Bucket: $BUCKET"

# Resolve CloudFront domain
if [[ -n "${CLOUDFRONT_DOMAIN:-}" ]]; then
  DOMAIN="$CLOUDFRONT_DOMAIN"
else
  DOMAIN=$(terraform -chdir="$TF_DIR" output -raw cloudfront_domain || true)
fi
if [[ -n "${DOMAIN:-}" ]]; then
  echo "CloudFront Domain: $DOMAIN"
else
  echo "CloudFront Domain: <not provided>"
fi

# Resolve CloudFront distribution ID (prefer domain, fall back to TF output)
if [[ -n "${DOMAIN:-}" ]]; then
  echo "==> Resolving CloudFront distribution ID from domain"
  DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?DomainName=='$DOMAIN'].Id | [0]" --output text)
  if [[ -z "${DIST_ID:-}" || "$DIST_ID" == "None" || "$DIST_ID" == "null" ]]; then
    echo "==> Trying alias-based lookup for custom domain"
    DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items && contains(Aliases.Items, '$DOMAIN')].Id | [0]" --output text)
  fi
fi

if [[ -z "${DIST_ID:-}" || "$DIST_ID" == "None" || "$DIST_ID" == "null" ]]; then
  # Try Terraform output fallback if resolution by domain failed or domain not provided
  DIST_ID=$(terraform -chdir="$TF_DIR" output -raw cloudfront_distribution_id 2>/dev/null || true)
fi

if [[ -z "${DIST_ID:-}" || "$DIST_ID" == "None" || "$DIST_ID" == "null" ]]; then
  echo "Could not resolve CloudFront distribution ID. Provide CLOUDFRONT_DOMAIN or ensure Terraform outputs are available." >&2
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
  --exclude 'assets/*' --exclude 'index.html' --exclude 'excerpt*.pdf' \
  --cache-control 'public,max-age=300' >/dev/null

echo "==> Uploading index.html (no-cache)"
aws s3 cp "$DIST_DIR/index.html" "s3://$BUCKET/index.html" \
  ${DRY_ARG[@]:-} \
  --cache-control 'no-cache' >/dev/null

echo "==> Creating CloudFront invalidation for HTML entry points"
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/index.html" "/" >/dev/null

if [[ -n "${DOMAIN:-}" ]]; then
  echo "✅ Frontend deployed: https://$DOMAIN/"
else
  echo "✅ Frontend deployed (Dist ID: $DIST_ID)"
fi

popd >/dev/null
