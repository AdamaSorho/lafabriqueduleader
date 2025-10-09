AWS deployment guide (S3 Website + Lambda Function URL + Email)

Overview
- Static site: S3 static website hosting
- API endpoint: Lambda Function URL (Node.js 20)
- Email sending: SMTP (e.g., Google Workspace/Gmail)
- Optional storage: DynamoDB for excerpt/preorder records
- Pre-order flow: modal posts to `POST /preorder`, emails your team, optional DynamoDB log

Makefile shortcuts and local overrides
- Use `make deploy-skip-build` to deploy quickly. These targets wrap `scripts/deploy-frontend.sh`.
- You can set local, unversioned defaults by creating a `.make.local` file at the repo root:
  - Example `.make.local`:
    - `PROFILE=TerraformMindapax`
    - `SITE_BUCKET=your-unique-bucket`
- Do not commit `.make.local` (it is gitignored). This keeps environment-specific values out of the repo.

Terraform workflow (recommended)
- Prereqs: Terraform ≥1.5, AWS CLI configured, and an S3 bucket name that is globally unique.
- Configure variables:
  1) Copy the example vars file and edit it:
     - `cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars`
     - Set `site_bucket_name`, `site_url`, `cors_origin`, and `from_email`.
     - For Gmail/Workspace SMTP set: `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass` (App Password).
     - Set `link_signing_secret` to a long random string (used to sign download links).
     - Ensure `enable_api = true` to provision the Lambda + API.
     - Optionally set `ddb_table` to create a DynamoDB table for excerpt signups (partition key: `email` [S]).
     - Optionally set `preorders_ddb_table` for pre-orders (recommended; prevents key collisions with signups).
     - Optionally set `preorder_to_email` to route pre-order notifications to a specific inbox.
  2) Initialize/apply:
     - `terraform -chdir=infra/terraform init`
     - `terraform -chdir=infra/terraform apply`
  3) Outputs you will use:
     - `api_base_url` → set frontend `VITE_API_BASE` to this value.
     - `site_bucket` and `site_website_endpoint` → used by `scripts/deploy-frontend.sh`.

DynamoDB option
- If `ddb_table` is set, Terraform will create the table and grant the Lambda permission to `dynamodb:PutItem` on it. The Lambda writes items like `{ email, lang, ts, status, verifiedAt?, source }` when the `DDB_TABLE` env var is present, where `source` is `excerpt` for the excerpt-download flow.

Frontend API base
- After `terraform apply`, set the frontend to call your API:
  - Example: `export VITE_API_BASE=$(terraform -chdir=infra/terraform output -raw api_base_url)`
  - Rebuild and deploy the site so the modal posts to your API.
  - Note: The frontend no longer falls back to a local `/api` route. `VITE_API_BASE` is required.

1) Build and upload the site
- Build: `npm run build`
- Terraform creates an S3 bucket with static website hosting enabled and a bucket policy allowing public read for site assets (excluding `private/`).
- The deploy script uploads `dist/` to the bucket with appropriate cache headers. No CDN invalidation needed.

2) Static website hosting
- S3 serves content from the website endpoint (HTTP only). SPA routing is handled by configuring the error document to `index.html`.

3) Email setup
- Gmail/Workspace SMTP — create an App Password for the `smtp_user` account and set `smtp_*` variables.

Verification/anti-fake emails flow
- The Lambda now includes a signed link in the email that points to `https://yourdomain.com/download.html?e=...&sig=...`.
- The `download.html` page redirects the browser to the API `GET /verify-excerpt` with those parameters and the selected `lang`.
- The Lambda verifies the signature and, if valid, updates DynamoDB (`status=verified`, `verifiedAt=ts`) and streams the PDF directly (no public URL).
- This marks only those who clicked as verified, helping you avoid fake addresses.

Unsubscribe
- Every excerpt email now includes:
  - A visible unsubscribe link in the body.
  - Standard headers `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
- The API handles both:
  - `GET /unsubscribe?e=..&sig=..` → marks `status=unsubscribed` and redirects to `/unsubscribed.html`.
  - `GET|POST /one-click-unsubscribe?e=..&sig=..` → marks `status=unsubscribed` and returns 200.
- Suppression: Subsequent submissions from unsubscribed emails are rejected.

4) Lambda API (subscribe-and-send)
- Region: us-east-1.
- Runtime: Node.js 20.x.
- Packaging: AWS SDK v3 (recommended). The repo bundles the ESM handler with esbuild before zipping.
  - Terraform runs `npm run build:lambda` (via a local-exec) and zips `aws/lambda/subscribe-and-send/dist/index.mjs`.
  - Ensure you have run `npm ci` at the repo root so `esbuild` is available.
- IAM permissions: Lambda uses SMTP (no SES permissions required). Optionally grant DynamoDB `PutItem` if you enable persistence.
- Environment variables set in Terraform:
  - `SITE_URL` e.g. https://yourdomain.com
  - `FROM_EMAIL` e.g. Zonzerigué Leadership International <no-reply@yourdomain.com>
    - Tip: use your legal org name as display name to match website/legal pages.
  - `PREORDER_TO_EMAIL` optional recipient for pre-order notifications
  - `LINK_SIGNING_SECRET` for signed download links
  - `TURNSTILE_SECRET_KEY` for server-side bot verification (Cloudflare Turnstile)
  - Optional DynamoDB:
    - `DDB_TABLE` (excerpt signups)
    - `DDB_PREORDERS_TABLE` (pre-orders)

5) API access (recommend: Cloudflare Worker proxy)
- The Lambda Function URL is public by default. For stronger protection:
  - Set `api_shared_secret` in `infra/terraform/terraform.tfvars` (long random string) and `make infra-apply`.
  - Deploy `cloudflare/worker-proxy.js` as a Cloudflare Worker with two secrets:
    - `API_SHARED_SECRET` (same value)
    - `UPSTREAM_URL` = your Function URL (e.g., `https://xxxx.lambda-url.us-east-1.on.aws`)
  - Route `https://lafabriqueduleader.com/api/*` to the Worker.
  - Set the frontend `VITE_API_BASE=https://lafabriqueduleader.com/api` and redeploy the site.
- The Worker signs POST requests (subscribe and preorder) with an HMAC header; the Lambda verifies it. GET verify/unsubscribe remain public.

6) Frontend configuration
- Set `VITE_API_BASE` to your Function URL. Example: `VITE_API_BASE=https://xxxx.lambda-url.us-east-1.on.aws`.
- Rebuild and redeploy the site so the modal posts to your API.

Optional: Store emails in DynamoDB
- Excerpt: create a table `newsletter_signups` (PK: `email` [S]); set `DDB_TABLE=newsletter_signups`.
- Pre-orders: create a separate table (e.g., `book_preorders`) and set `DDB_PREORDERS_TABLE=book_preorders` to avoid overwriting by PK.
- Note: current schema uses only the hash key `email`. If you prefer a single-table design, switch to a composite key (e.g., add `sk` and use `email#timestamp`).

Pre-order endpoint
- The same Lambda handles `POST /preorder` with payload:
  - `{ name, email, phone?, format: 'print'|'digital', quantity, country?, notes?, lang? }`
- On success, it emails your team and optionally logs to `DDB_PREORDERS_TABLE` (or `DDB_TABLE` if the former is unset).

Bot protection and rate limiting
- Frontend loads Turnstile and sends a token with each submission.
- Backend verifies the token via `TURNSTILE_SECRET_KEY`. If verification fails, it rejects.
- Basic per-email throttling: rejects repeated requests within 5 minutes when a DynamoDB record exists.
- Suppression: if a previous record has `status` of `bounced` or `complained`, requests are rejected.

CloudFront invalidation
- Not applicable; the site is served directly from S3.
Excerpt files (private access)
- Upload your PDFs to the site S3 bucket under private keys (defaults):
  - `private/excerpts/excerpt-fr.pdf`
  - `private/excerpts/excerpt-en.pdf`
- Terraform passes these keys to the Lambda; the Lambda reads via s3:GetObject and returns the bytes. The bucket policy allows public read to all objects except under `private/`, so these PDFs remain non-public.
- The frontend deploy excludes any `excerpt*.pdf` from upload to avoid public exposure.

Notes on deliverability
- Use a professional From like `Zonzerigué Leadership International <no-reply@lafabriqueduleader.com>`.
- Publish SPF and DMARC records for your domain; enable DKIM if using Google Workspace.
- Emails include List‑Unsubscribe headers and a visible unsubscribe link; unsubscribes are honored by the API.
