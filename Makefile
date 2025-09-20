.PHONY: help deploy deploy-skip-build deploy-dry-run deploy-skip-build-dry-run infra-apply redeploy report

# Load local overrides (not committed). Create .make.local to set defaults:
#   PROFILE=TerraformMindapax
#   SITE_BUCKET=your-bucket
#   (no CloudFront needed)
-include .make.local

# Usage examples:
#   make deploy PROFILE=TerraformMindapax
#   make deploy-skip-build PROFILE=TerraformMindapax
#   make deploy-dry-run PROFILE=TerraformMindapax
#   make deploy PROFILE=TerraformMindapax SITE_BUCKET=my-bucket CLOUDFRONT_DIST_ID=E2ABCDEF12345

# Variables you can pass:
#   PROFILE                -> sets AWS_PROFILE for the script (optional)
#   SITE_BUCKET            -> overrides S3 bucket (optional)
#   ARGS                   -> extra flags, e.g. "--skip-build --dry-run"

help:
	@echo "Targets:"
	@echo "  make deploy [PROFILE=...] [SITE_BUCKET=...] [ARGS='--skip-build']"
	@echo "  make deploy-skip-build [PROFILE=...] [SITE_BUCKET=...]"
	@echo "  make deploy-dry-run [PROFILE=...] [SITE_BUCKET=...]"
	@echo "  make infra-apply [PROFILE=...]   # terraform init/apply for infra"
	@echo "  make redeploy [PROFILE=...] [SITE_BUCKET=...]  # infra apply + deploy-skip-build"
	@echo "  make report [PROFILE=...] [TABLE=newsletter_signups] [HOURS=72 | SINCE=ISO] [REGION=us-east-1]"
	@echo
	@echo "Variables: PROFILE, SITE_BUCKET, ARGS (or set them in .make.local)"

deploy:
	@AWS_PROFILE=$(PROFILE) \
	SITE_BUCKET=$(SITE_BUCKET) \
	scripts/deploy-frontend.sh $(ARGS)

deploy-skip-build:
	@$(MAKE) deploy ARGS="--skip-build" PROFILE=$(PROFILE) SITE_BUCKET=$(SITE_BUCKET)

deploy-dry-run:
	@$(MAKE) deploy ARGS="--dry-run" PROFILE=$(PROFILE) SITE_BUCKET=$(SITE_BUCKET)

deploy-skip-build-dry-run:
	@$(MAKE) deploy ARGS="--skip-build --dry-run" PROFILE=$(PROFILE) SITE_BUCKET=$(SITE_BUCKET)

# Terraform init/apply for infra
infra-apply:
	@cd infra/terraform && AWS_PROFILE=$(PROFILE) terraform init -upgrade
	@AWS_PROFILE=$(PROFILE) terraform -chdir=infra/terraform apply -auto-approve

# Apply infra changes then deploy frontend (skip build for speed)
redeploy:
	@$(MAKE) infra-apply PROFILE=$(PROFILE)
	@AWS_PROFILE=$(PROFILE) SITE_BUCKET= scripts/deploy-frontend.sh --skip-build

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
