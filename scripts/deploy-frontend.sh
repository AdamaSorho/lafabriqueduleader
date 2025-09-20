#!/usr/bin/env bash
set -euo pipefail

# Deploys the frontend only: build, upload to S3 with appropriate cache headers.

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

This script expects Terraform outputs in $TF_DIR to include:
  - site_bucket (S3 bucket name)
  - site_website_endpoint (S3 website endpoint)
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

WEBSITE_ENDPOINT=$(terraform -chdir="$TF_DIR" output -raw site_website_endpoint)
if [[ -z "${WEBSITE_ENDPOINT:-}" ]]; then
  echo "Missing website endpoint. Ensure Terraform output 'site_website_endpoint' exists." >&2
  exit 1
fi
echo "Website Endpoint: $WEBSITE_ENDPOINT"

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

echo "✅ Frontend deployed: http://$WEBSITE_ENDPOINT/"

popd >/dev/null
