terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.4"
    }
    null = {
      source  = "hashicorp/null"
      version = ">= 3.0"
    }
  }
}

provider "aws" {
  region = var.region
}

data "aws_caller_identity" "current" {}

############################
# Static website hosting (S3)
############################

resource "aws_s3_bucket" "site" {
  bucket        = var.site_bucket_name
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Enable S3 static website hosting with SPA-style fallback to index.html
resource "aws_s3_bucket_website_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  index_document {
    suffix = "index.html"
  }

  # For SPAs, serve index.html on 4xx so client routing works
  error_document {
    key = "index.html"
  }
}

# Public read for site content, excluding the private/ prefix
data "aws_iam_policy_document" "site_public_read" {
  statement {
    sid    = "PublicReadGetObject"
    effect = "Allow"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:GetObject"]
    # Allow public reads for all objects in this bucket except under private/
    # Note: This is a bucket policy; it applies only to this bucket.
    not_resources = [
      "${aws_s3_bucket.site.arn}/private/*"
    ]
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site_public_read.json
  depends_on = [aws_s3_bucket_public_access_block.site]
}

############################
# Lambda + HTTP API
############################

resource "null_resource" "build_lambda" {
  count = var.enable_api ? 1 : 0
  # Rebuild when the source changes
  triggers = {
    src_hash = filesha256("../../aws/lambda/subscribe-and-send/index.mjs")
  }
  provisioner "local-exec" {
    command = "cd ../../ && npm ci && npm run -s build:lambda"
  }
}

data "archive_file" "lambda_zip" {
  count       = var.enable_api ? 1 : 0
  type        = "zip"
  source_file = "../../aws/lambda/subscribe-and-send/dist/index.cjs"
  output_path = "./.terraform/${var.project}-lambda.zip"
  depends_on  = [null_resource.build_lambda]
}

resource "aws_iam_role" "lambda_exec" {
  count              = var.enable_api ? 1 : 0
  name               = "${var.project}-lambda-exec"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Principal = { Service = "lambda.amazonaws.com" },
      Effect = "Allow"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  count      = var.enable_api ? 1 : 0
  role       = aws_iam_role.lambda_exec[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


############################
# DynamoDB (optional)
############################

resource "aws_dynamodb_table" "signups" {
  count         = var.ddb_table != "" ? 1 : 0
  name          = var.ddb_table
  billing_mode  = "PAY_PER_REQUEST"
  hash_key      = "email"

  attribute {
    name = "email"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

# Separate table for preorders (optional)
resource "aws_dynamodb_table" "preorders" {
  count         = var.preorders_ddb_table != "" ? 1 : 0
  name          = var.preorders_ddb_table
  billing_mode  = "PAY_PER_REQUEST"
  hash_key      = "email"

  attribute {
    name = "email"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

resource "aws_iam_policy" "ddb_put" {
  count  = var.enable_api && var.ddb_table != "" ? 1 : 0
  name   = "${var.project}-ddb-put"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem"],
      Resource = "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/${var.ddb_table}"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ddb_attach" {
  count      = var.enable_api && var.ddb_table != "" ? 1 : 0
  role       = aws_iam_role.lambda_exec[0].name
  policy_arn = aws_iam_policy.ddb_put[0].arn
}

resource "aws_iam_policy" "ddb_preorders_put" {
  count  = var.enable_api && var.preorders_ddb_table != "" ? 1 : 0
  name   = "${var.project}-ddb-preorders-put"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem"],
      Resource = "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/${var.preorders_ddb_table}"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ddb_preorders_attach" {
  count      = var.enable_api && var.preorders_ddb_table != "" ? 1 : 0
  role       = aws_iam_role.lambda_exec[0].name
  policy_arn = aws_iam_policy.ddb_preorders_put[0].arn
}

resource "aws_iam_policy" "s3_read_site" {
  count  = var.enable_api ? 1 : 0
  name   = "${var.project}-s3-read-site"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["s3:GetObject"],
        Resource = "${aws_s3_bucket.site.arn}/*"
      },
      {
        Effect   = "Allow",
        Action   = ["s3:ListBucket", "s3:HeadBucket", "s3:GetBucketLocation"],
        Resource = "${aws_s3_bucket.site.arn}"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3_read_attach" {
  count      = var.enable_api ? 1 : 0
  role       = aws_iam_role.lambda_exec[0].name
  policy_arn = aws_iam_policy.s3_read_site[0].arn
}

resource "aws_lambda_function" "api" {
  count         = var.enable_api ? 1 : 0
  function_name = "${var.project}-subscribe-and-send"
  filename      = data.archive_file.lambda_zip[0].output_path
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role          = aws_iam_role.lambda_exec[0].arn

  source_code_hash = data.archive_file.lambda_zip[0].output_base64sha256

  environment {
    variables = {
      SITE_URL                  = var.site_url
      FROM_EMAIL                = var.from_email
      SMTP_HOST                 = var.smtp_host
      SMTP_PORT                 = tostring(var.smtp_port)
      SMTP_USER                 = var.smtp_user
      SMTP_PASS                 = var.smtp_pass
      PREORDER_TO_EMAIL         = var.preorder_to_email
      KEYNOTE_TO_EMAIL          = var.keynote_to_email
      COACHING_TO_EMAIL         = var.coaching_to_email
      LEADS_TO_EMAIL            = var.leads_to_email
      DDB_PREORDERS_TABLE       = var.preorders_ddb_table
      DDB_TABLE                 = var.ddb_table
      CORS_ORIGINS              = var.cors_origin
      LINK_SIGNING_SECRET       = var.link_signing_secret
      API_SHARED_SECRET         = var.api_shared_secret
      TURNSTILE_SECRET_KEY      = var.turnstile_secret_key
      RATE_TTL_SECS             = tostring(var.rate_ttl_secs)
      EXCERPT_S3_BUCKET         = aws_s3_bucket.site.bucket
      EXCERPT_FR_S3_KEY         = var.excerpt_fr_s3_key
      EXCERPT_EN_S3_KEY         = var.excerpt_en_s3_key
    }
  }
}

resource "aws_lambda_function_url" "api" {
  count               = var.enable_api ? 1 : 0
  function_name       = aws_lambda_function.api[0].function_name
  authorization_type  = "NONE"
  cors {
    allow_origins = split(",", var.cors_origin)
    allow_methods = ["GET", "POST"]
    allow_headers = ["content-type"]
  }
}

output "api_base_url" {
  value = length(aws_lambda_function_url.api) > 0 ? aws_lambda_function_url.api[0].function_url : ""
}
output "site_bucket" { value = aws_s3_bucket.site.bucket }
output "site_website_endpoint" { value = aws_s3_bucket_website_configuration.site.website_endpoint }
