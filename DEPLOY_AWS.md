AWS deployment guide (S3 + CloudFront + Lambda Function URL + SES)

Overview
- Static site: S3 + CloudFront
- API endpoint: Lambda Function URL (Node.js 20)
- Email sending: Amazon SES (verified domain/sender)
- Newsletter storage: Mailchimp (optional) or DynamoDB (optional)

Terraform workflow (recommended)
- Prereqs: Terraform ≥1.5, AWS CLI configured, and an S3 bucket name that is globally unique. SES domain should be verified with DKIM (see step 3 below).
- Configure variables:
  1) Copy the example vars file and edit it:
     - `cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars`
     - Set `site_bucket_name`, `site_url`, `cors_origin`, and `from_email`.
     - Set `link_signing_secret` to a long random string (used to sign download links).
     - Ensure `enable_api = true` to provision the Lambda + API.
     - Optionally set `ddb_table` to create a DynamoDB table for signups (partition key: `email` [S]).
     - Optionally set `aliases` and `acm_certificate_arn` (must be us-east-1) to use your own domain on CloudFront.
  2) Initialize/apply:
     - `terraform -chdir=infra/terraform init`
     - `terraform -chdir=infra/terraform apply`
  3) Outputs you will use:
     - `api_base_url` → set frontend `VITE_API_BASE` to this value.
     - `site_bucket` and `cloudfront_domain` → used by `scripts/deploy-frontend.sh`.

DynamoDB option
- If `ddb_table` is set, Terraform will create the table and grant the Lambda permission to `dynamodb:PutItem` on it. The Lambda writes items like `{ email, lang, ts, status, verifiedAt?, source }` when the `DDB_TABLE` env var is present, where `source` is `excerpt` for the excerpt-download flow.

Frontend API base
- After `terraform apply`, set the frontend to call your API:
  - Example: `export VITE_API_BASE=$(terraform -chdir=infra/terraform output -raw api_base_url)`
  - Rebuild and deploy the site so the modal posts to your API.
  - Note: The frontend no longer falls back to a local `/api` route. `VITE_API_BASE` is required.

1) Build and upload the site
- Build: `npm run build`
- Create S3 bucket (no public ACLs). Enable static website hosting or serve via CloudFront only.
- Upload `dist/` contents to the bucket.
- Set `index.html` as default index document.

2) CloudFront distribution
- Origin: your S3 bucket (Origin Access Control recommended).
- Default behavior: GET/HEAD. Cache based on headers as needed.
- SPA routing: Set 404/403 to return `/index.html` with 200 to support client routing.

3) SES setup (email sending)
- In SES, verify your domain or sender address (e.g., no-reply@yourdomain.com).
- Move out of the SES sandbox (request production access) so you can email unverified recipients.

Verification/anti-fake emails flow
- The Lambda now includes a signed link in the email that points to `https://yourdomain.com/download.html?e=...&sig=...`.
- The `download.html` page redirects the browser to the API `GET /verify-excerpt` with those parameters.
- The Lambda verifies the signature and, if valid, updates DynamoDB (`status=verified`, `verifiedAt=ts`) and responds with a redirect to `/excerpt.pdf`.
- This marks only those who clicked as verified, helping you avoid fake addresses.

4) Lambda API (subscribe-and-send)
- Region: us-east-1 (SES available in many regions; adjust as needed).
- Runtime: Node.js 20.x.
- Packaging: AWS SDK v3 (recommended). The repo bundles the ESM handler with esbuild before zipping.
  - Terraform runs `npm run build:lambda` (via a local-exec) and zips `aws/lambda/subscribe-and-send/dist/index.mjs`.
  - Ensure you have run `npm ci` at the repo root so `esbuild` is available.
- IAM permissions: Attach a policy allowing `ses:SendEmail` for your identity (and optionally `dynamodb:PutItem` if using DynamoDB).
- Environment variables set in Terraform:
  - `SITE_URL` e.g. https://yourdomain.com
  - `FROM_EMAIL` e.g. La Fabrique <no-reply@yourdomain.com>
  - `LINK_SIGNING_SECRET` for signed download links
  - Optional Mailchimp: `MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX`, `MAILCHIMP_LIST_ID`

5) Lambda Function URL (simpler/cheaper than API Gateway)
- In Terraform, we provision a Function URL with CORS to your site and public auth (NONE).
- Copy the Function URL output (looks like `https://xxxx.lambda-url.us-east-1.on.aws`).

6) Frontend configuration
- Set `VITE_API_BASE` to your Function URL. Example: `VITE_API_BASE=https://xxxx.lambda-url.us-east-1.on.aws`.
- Rebuild and redeploy the site so the modal posts to your API.

Optional: Store emails in DynamoDB
- Create a table `newsletter_signups` (partition key: `email` [S])
- Grant Lambda `dynamodb:PutItem` on that table and set env `DDB_TABLE=newsletter_signups`.

Invalidate CloudFront
- After uploading new builds, create an invalidation for `/*` so changes propagate.
