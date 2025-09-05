AWS deployment guide (S3 + CloudFront + API Gateway + Lambda + SES)

Overview
- Static site: S3 + CloudFront
- API endpoint: API Gateway (HTTP API) + Lambda (Node.js 20)
- Email sending: Amazon SES (verified domain/sender)
- Newsletter storage: Mailchimp (optional) or DynamoDB (optional)

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

4) Lambda API (subscribe-and-send)
- Region: us-east-1 (SES available in many regions; adjust as needed).
- Runtime: Node.js 20.x.
- Create a Lambda with the code from `aws/lambda/subscribe-and-send/index.mjs`.
- IAM permissions: Attach a policy allowing `ses:SendEmail` for your identity (and optionally `dynamodb:PutItem` if using DynamoDB).
- Environment variables:
  - `SITE_URL` e.g. https://yourdomain.com
  - `FROM_EMAIL` e.g. La Fabrique <no-reply@yourdomain.com>
  - Optional Mailchimp: `MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX`, `MAILCHIMP_LIST_ID`

5) API Gateway (HTTP API)
- Create HTTP API and add an integration pointing to the Lambda.
- Route: POST `/subscribe-and-send` -> your Lambda.
- Enable CORS: Allow origin `https://yourdomain.com`, methods POST/OPTIONS, headers `Content-Type`.
- Deploy the API and copy the Invoke URL (e.g., https://abc123.execute-api.us-east-1.amazonaws.com).

6) Frontend configuration
- Set `VITE_API_BASE` to your API base (Invoke URL). Example: `VITE_API_BASE=https://abc123.execute-api.us-east-1.amazonaws.com`.
- Rebuild and redeploy the site so the modal posts to your API.

Optional: Store emails in DynamoDB
- Create a table `newsletter_signups` (partition key: `email` [S])
- Grant Lambda `dynamodb:PutItem` on that table and set env `DDB_TABLE=newsletter_signups`.

Invalidate CloudFront
- After uploading new builds, create an invalidation for `/*` so changes propagate.

