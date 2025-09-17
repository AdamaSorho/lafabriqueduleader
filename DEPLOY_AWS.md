AWS deployment guide (S3 + CloudFront + Lambda Function URL + SES)

Overview
- Static site: S3 + CloudFront
- API endpoint: Lambda Function URL (Node.js 20)
- Email sending: Amazon SES (verified domain/sender)
- Optional storage: DynamoDB for excerpt/preorder records
- Pre-order flow: modal posts to `POST /preorder`, emails your team, optional DynamoDB log

Makefile shortcuts and local overrides
- Use `make deploy-skip-build` to deploy quickly. These targets wrap `scripts/deploy-frontend.sh`.
- You can set local, unversioned defaults by creating a `.make.local` file at the repo root:
  - Example `.make.local`:
    - `PROFILE=TerraformMindapax`
    - `SITE_BUCKET=your-unique-bucket`
    - `CLOUDFRONT_DOMAIN=dxxxx.cloudfront.net` (or your custom CNAME)
- Do not commit `.make.local` (it is gitignored). This keeps environment-specific values out of the repo.

Terraform workflow (recommended)
- Prereqs: Terraform ≥1.5, AWS CLI configured, and an S3 bucket name that is globally unique. SES domain should be verified with DKIM (see step 3 below).
- Configure variables:
  1) Copy the example vars file and edit it:
     - `cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars`
     - Set `site_bucket_name`, `site_url`, `cors_origin`, and `from_email`.
     - Set `link_signing_secret` to a long random string (used to sign download links).
     - Ensure `enable_api = true` to provision the Lambda + API.
     - Optionally set `ddb_table` to create a DynamoDB table for excerpt signups (partition key: `email` [S]).
     - Optionally set `preorders_ddb_table` for pre-orders (recommended; prevents key collisions with signups).
     - Optionally set `preorder_to_email` to route pre-order notifications to a specific inbox.
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
- Region: us-east-1 (SES available in many regions; adjust as needed).
- Runtime: Node.js 20.x.
- Packaging: AWS SDK v3 (recommended). The repo bundles the ESM handler with esbuild before zipping.
  - Terraform runs `npm run build:lambda` (via a local-exec) and zips `aws/lambda/subscribe-and-send/dist/index.mjs`.
  - Ensure you have run `npm ci` at the repo root so `esbuild` is available.
- IAM permissions: Attach a policy allowing `ses:SendEmail` for your identity (and optionally `dynamodb:PutItem` if using DynamoDB).
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

5) Lambda Function URL (simpler/cheaper than API Gateway)
- In Terraform, we provision a Function URL with CORS to your site and public auth (NONE).
- Copy the Function URL output (looks like `https://xxxx.lambda-url.us-east-1.on.aws`).

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

Invalidate CloudFront
- After uploading new builds, create an invalidation for `/*` so changes propagate.
Excerpt files (private access)
- Upload your PDFs to the site S3 bucket under private keys (defaults):
  - `private/excerpts/excerpt-fr.pdf`
  - `private/excerpts/excerpt-en.pdf`
- Terraform passes these keys to the Lambda; the Lambda reads via s3:GetObject and returns the bytes. Files are not publicly exposed via CloudFront.
- The frontend deploy excludes any `excerpt*.pdf` from upload to avoid public exposure.

SES production access checklist (recommended)
- Identity
  - Verify your sending domain in SES (DNS): enable Easy DKIM, ensure SPF alignment, and publish a DMARC record (p=none or p=quarantine to start).
  - Use a professional From like `Zonzerigué Leadership International <no-reply@lafabriqueduleader.com>`.
- Website and policy links
  - Public site shows a physical mailing address in the footer.
  - Privacy Policy and Legal/Terms pages are published and linked (emails also link to them).
- Consent and sending practices
  - Only transactional emails triggered by explicit user action (excerpt delivery). Pre-orders notify the team only.
  - Visible unsubscribe link and RFC 8058 one‑click headers included in every email.
  - Bot protection (Cloudflare Turnstile), IP rate limiting, and 5‑minute resend guard.
- Bounce/complaint handling
  - SES configuration set with SNS destination (BOUNCE, COMPLAINT) → Lambda updates DynamoDB status.
  - Suppress future sends to addresses marked bounced/complained/unsubscribed.
- Verification flow
  - Signed links and verification gate the PDF download to reduce fake or mistyped addresses.
- Monitoring
  - Track bounce/complaint rates and CloudWatch logs; warm up volume gradually.

Template answers for SES production request
- Use case: “Transactional emails only (excerpt delivery after user request; internal pre‑order notifications). No marketing campaigns or purchased lists.”
- Recipient acquisition: “Collected exclusively through our website forms with Cloudflare Turnstile. We use signed verification links before delivering the PDF.”
- Sample content: Provide the plain‑text excerpt email with the download link and unsubscribe URL.
- Opt‑out: “Visible unsubscribe link and List‑Unsubscribe/One‑Click headers; unsubscribes persisted immediately in DynamoDB.”
- Bounces/complaints: “SES → SNS → Lambda marks addresses as ‘bounced’/‘complained’ in DynamoDB; subsequent sends are suppressed.”
- Identity & domain: “Domain is verified with Easy DKIM; SPF aligned; DMARC published; From uses our legal organization name.”
- Volume: “Low and gradual, monitored closely (dozens/day initially).”
