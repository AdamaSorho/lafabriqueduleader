# Infrastructure options

This repo includes three IaC options to deploy the API and static site on AWS.

- Terraform (CloudFront + S3 + API Gateway + Lambda + SES)
- SAM (Serverless Application Model)
- Serverless Framework (httpApi + SES)

All options assume:
- Static site is built separately (`npm run build`) and uploaded to S3 (served via CloudFront).
- Emails are sent via SES (you must verify a sender and move out of sandbox).
- Optional newsletter subscription via Mailchimp; optional DynamoDB storage of emails.

## Shared prerequisites
- SES: verify domain or sender (e.g., `no-reply@yourdomain.com`), request production access.
- Excerpt file: upload your `public/excerpt.pdf` with the site so it’s available at `https://<site>/excerpt.pdf`.

## 1) Terraform

Files: `infra/terraform/*.tf`

- Variables to set (via `terraform.tfvars` or CLI):
  - `region` (e.g., `us-east-1`)
  - `site_bucket_name` (unique bucket name)
  - `aliases` (optional) — custom domains, e.g. `["lafabriqueduleader.com","www.lafabriqueduleader.com"]`
  - `acm_certificate_arn` (optional) — ACM cert in `us-east-1` if you want HTTPS on those aliases now
  - `site_url` (e.g., `https://lafabriqueduleader.com`)
  - `from_email` (e.g., `La Fabrique <no-reply@yourdomain.com>`) — SES verified
  - `cors_origin` (e.g., your site URL)
  - Optional Mailchimp and `ddb_table`

- Commands:
  - `cd infra/terraform`
  - `terraform init`
  - `terraform plan -out tfplan`
  - `terraform apply tfplan`

Outputs:
- `api_base_url` — use this as `VITE_API_BASE`
- `cloudfront_domain` — your CDN domain
- `site_bucket` — S3 name for uploads

After apply:
- Upload `dist/` to the S3 bucket (or wire CI/CD).
- Point DNS at Namecheap:
  - If you add `aliases` but don’t have Route53:
    - Create a CNAME for `www` to your `cloudfront_domain`.
    - For the apex `lafabriqueduleader.com`, either use your provider’s ALIAS/ANAME pointing to the CloudFront domain or temporarily redirect apex → `www`.
- If you provided an ACM cert (in us-east-1), validate it via DNS in Namecheap before applying aliases.
- Set `SITE_URL` (frontend emails) to your domain and rebuild when you later enable the API.

## 2) AWS SAM

File: `infra/sam/template.yaml`

- Build & deploy:
  - `cd infra/sam`
  - `sam build`
  - `sam deploy --guided` (enter parameters: SiteUrl, FromEmail, etc.)

Output:
- `ApiBaseUrl` parameter — set `VITE_API_BASE` to this.

## 3) Serverless Framework

File: `infra/serverless/serverless.yml`

- Configure environment variables (SITE_URL, FROM_EMAIL, etc.)
- Deploy: `cd infra/serverless && npx serverless deploy`
- Resulting httpApi base URL becomes your `VITE_API_BASE`.

## Frontend config
- Set `VITE_API_BASE` to your deployed API base URL.
- Rebuild: `Vite` uses `import.meta.env.VITE_API_BASE` at build time.

## Notes
- CloudFront + OAC is configured; you may want Route53 + ACM for a custom domain (not included here).
- If you use DynamoDB, create the table and set `DDB_TABLE` (Terraform can be extended to manage the table).
- CORS: the API allows POST/OPTIONS from the configured origin.

