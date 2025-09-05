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
  }
}

provider "aws" {
  region = var.region
}

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
  rule { object_ownership = "BucketOwnerEnforced" }
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
  aliases             = var.aliases

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

  restrictions { geo_restriction { restriction_type = "none" } }

  # Default cert unless ACM provided (must be in us-east-1)
  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == "" ? true : false
    acm_certificate_arn            = var.acm_certificate_arn == "" ? null : var.acm_certificate_arn
    ssl_support_method             = var.acm_certificate_arn == "" ? null : "sni-only"
    minimum_protocol_version       = var.acm_certificate_arn == "" ? null : "TLSv1.2_2021"
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

data "archive_file" "lambda_zip" {
  count       = var.enable_api ? 1 : 0
  type        = "zip"
  source_dir  = "../../aws/lambda/subscribe-and-send"
  output_path = "./.terraform/${var.project}-lambda.zip"
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
    }
  }
}

resource "aws_apigatewayv2_api" "http" {
  count         = var.enable_api ? 1 : 0
  name          = "${var.project}-http-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = [var.cors_origin]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["Content-Type"]
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  count                  = var.enable_api ? 1 : 0
  api_id                 = aws_apigatewayv2_api.http[0].id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api[0].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "post_subscribe" {
  count     = var.enable_api ? 1 : 0
  api_id    = aws_apigatewayv2_api.http[0].id
  route_key = "POST /subscribe-and-send"
  target    = "integrations/${aws_apigatewayv2_integration.lambda[0].id}"
}

resource "aws_apigatewayv2_stage" "default" {
  count       = var.enable_api ? 1 : 0
  api_id      = aws_apigatewayv2_api.http[0].id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "apigw" {
  count        = var.enable_api ? 1 : 0
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api[0].arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http[0].execution_arn}/*/*/subscribe-and-send"
}

output "api_base_url" {
  value = length(aws_apigatewayv2_api.http) > 0 ? aws_apigatewayv2_api.http[0].api_endpoint : ""
}
output "site_bucket" { value = aws_s3_bucket.site.bucket }
output "cloudfront_domain" { value = aws_cloudfront_distribution.cdn.domain_name }
