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
# Static hosting (S3 + CF)
############################

resource "aws_s3_bucket" "site" {
  bucket        = var.site_bucket_name
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = false # bucket policy used for OAC access
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.project}-oac"
  description                       = "OAC for ${var.project}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_iam_policy_document" "site_bucket_policy" {
  statement {
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.cdn.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site_bucket_policy.json
  depends_on = [aws_cloudfront_distribution.cdn]
}

resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  comment             = var.project
  default_root_object = "index.html"
  aliases             = var.acm_certificate_arn != "" ? var.aliases : []

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-site"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-site"
    viewer_protocol_policy = "redirect-to-https"

    # Use AWS managed cache policy (CachingOptimized) to avoid forwarded_values conflicts
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # viewer_certificate must exist exactly once. Use dynamic blocks to switch between default cert and ACM.
  dynamic "viewer_certificate" {
    for_each = var.acm_certificate_arn == "" ? [1] : []
    content {
      cloudfront_default_certificate = true
    }
  }

  dynamic "viewer_certificate" {
    for_each = var.acm_certificate_arn != "" ? [1] : []
    content {
      acm_certificate_arn      = var.acm_certificate_arn
      ssl_support_method       = "sni-only"
      minimum_protocol_version = "TLSv1.2_2021"
    }
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }
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
    command = "cd ../../ && npm run -s build:lambda"
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

resource "aws_iam_policy" "ses_send" {
  count  = var.enable_api ? 1 : 0
  name   = "${var.project}-ses-send"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["ses:SendEmail", "ses:SendRawEmail"],
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ses_attach" {
  count      = var.enable_api ? 1 : 0
  role       = aws_iam_role.lambda_exec[0].name
  policy_arn = aws_iam_policy.ses_send[0].arn
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
}

resource "aws_iam_policy" "ddb_put" {
  count  = var.enable_api && var.ddb_table != "" ? 1 : 0
  name   = "${var.project}-ddb-put"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = ["dynamodb:PutItem", "dynamodb:UpdateItem"],
      Resource = "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/${var.ddb_table}"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ddb_attach" {
  count      = var.enable_api && var.ddb_table != "" ? 1 : 0
  role       = aws_iam_role.lambda_exec[0].name
  policy_arn = aws_iam_policy.ddb_put[0].arn
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
      MAILCHIMP_API_KEY         = var.mailchimp_api_key
      MAILCHIMP_SERVER_PREFIX   = var.mailchimp_server_prefix
      MAILCHIMP_LIST_ID         = var.mailchimp_list_id
      DDB_TABLE                 = var.ddb_table
      CORS_ORIGIN               = var.cors_origin
      LINK_SIGNING_SECRET       = var.link_signing_secret
    }
  }
}

resource "aws_lambda_function_url" "api" {
  count               = var.enable_api ? 1 : 0
  function_name       = aws_lambda_function.api[0].function_name
  authorization_type  = "NONE"
  cors {
    allow_origins = [var.cors_origin]
    allow_methods = ["GET", "POST"]
    allow_headers = ["content-type"]
  }
}

output "api_base_url" {
  value = length(aws_lambda_function_url.api) > 0 ? aws_lambda_function_url.api[0].function_url : ""
}
output "site_bucket" { value = aws_s3_bucket.site.bucket }
output "cloudfront_domain" { value = aws_cloudfront_distribution.cdn.domain_name }
output "cloudfront_distribution_id" { value = aws_cloudfront_distribution.cdn.id }
