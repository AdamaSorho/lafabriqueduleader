.PHONY: help deploy deploy-skip-build deploy-dry-run deploy-skip-build-dry-run report

# Load local overrides (not committed). Create .make.local to set defaults:
#   PROFILE=TerraformMindapax
#   SITE_BUCKET=your-bucket
#   CLOUDFRONT_DOMAIN=dxxxx.cloudfront.net (or your CNAME)
-include .make.local

# Usage examples:
#   make deploy PROFILE=TerraformMindapax
#   make deploy-skip-build PROFILE=TerraformMindapax
#   make deploy-dry-run PROFILE=TerraformMindapax
#   make deploy PROFILE=TerraformMindapax SITE_BUCKET=my-bucket CLOUDFRONT_DIST_ID=E2ABCDEF12345

# Variables you can pass:
#   PROFILE                -> sets AWS_PROFILE for the script (optional)
#   SITE_BUCKET            -> overrides S3 bucket (optional)
#   CLOUDFRONT_DOMAIN      -> CloudFront domain or custom CNAME (optional)
#   ARGS                   -> extra flags, e.g. "--skip-build --dry-run"

help:
	@echo "Targets:"
	@echo "  make deploy [PROFILE=...] [SITE_BUCKET=...] [CLOUDFRONT_DOMAIN=...] [ARGS='--skip-build']"
	@echo "  make deploy-skip-build [PROFILE=...] [SITE_BUCKET=...] [CLOUDFRONT_DOMAIN=...]"
	@echo "  make deploy-dry-run [PROFILE=...] [SITE_BUCKET=...] [CLOUDFRONT_DOMAIN=...]"
	@echo "  make report [PROFILE=...] [TABLE=newsletter_signups] [HOURS=72 | SINCE=ISO] [REGION=us-east-1]"
	@echo
	@echo "Variables: PROFILE, SITE_BUCKET, CLOUDFRONT_DOMAIN, ARGS (or set them in .make.local)"

deploy:
	@AWS_PROFILE=$(PROFILE) \
	SITE_BUCKET=$(SITE_BUCKET) \
	CLOUDFRONT_DOMAIN=$(CLOUDFRONT_DOMAIN) \
	scripts/deploy-frontend.sh $(ARGS)

deploy-skip-build:
	@$(MAKE) deploy ARGS="--skip-build" PROFILE=$(PROFILE) SITE_BUCKET=$(SITE_BUCKET) CLOUDFRONT_DOMAIN=$(CLOUDFRONT_DOMAIN)

deploy-dry-run:
	@$(MAKE) deploy ARGS="--dry-run" PROFILE=$(PROFILE) SITE_BUCKET=$(SITE_BUCKET) CLOUDFRONT_DOMAIN=$(CLOUDFRONT_DOMAIN)

deploy-skip-build-dry-run:
	@$(MAKE) deploy ARGS="--skip-build --dry-run" PROFILE=$(PROFILE) SITE_BUCKET=$(SITE_BUCKET) CLOUDFRONT_DOMAIN=$(CLOUDFRONT_DOMAIN)

# Summarize recent signup records from DynamoDB
# Examples:
#   make report PROFILE=TerraformMindapax TABLE=newsletter_signups HOURS=72
#   make report PROFILE=TerraformMindapax TABLE=newsletter_signups SINCE=2025-09-07T00:00:00Z
report:
	@AWS_PROFILE=$(PROFILE) \
	AWS_REGION=$(REGION) \
	node scripts/report-signups.mjs \
		$(if $(TABLE),--table $(TABLE),) \
		$(if $(HOURS),--hours $(HOURS),) \
		$(if $(SINCE),--since $(SINCE),) \
		$(if $(REGION),--region $(REGION),)
