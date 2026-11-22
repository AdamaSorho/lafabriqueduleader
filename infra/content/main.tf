terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws     = { source = "hashicorp/aws", version = ">= 5.0, < 7.0" }
    archive = { source = "hashicorp/archive", version = ">= 2.4, < 3.0" }
  }
}

provider "aws" {
  profile = "TerraformMindapax"
  region  = var.region
  default_tags { tags = { Project = "lafabriqueduleader", Component = "content" } }
}

data "aws_caller_identity" "current" {}

resource "aws_dynamodb_table" "content" {
  name                        = "${var.project}-content"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "id"
  deletion_protection_enabled = true
  attribute {
    name = "id"
    type = "S"
  }
  point_in_time_recovery { enabled = true }
}

resource "aws_cognito_user_pool" "editors" {
  name                     = "${var.project}-editors"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  deletion_protection      = "ACTIVE"
  admin_create_user_config { allow_admin_create_user_only = true }
  username_configuration { case_sensitive = false }
  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

resource "aws_cognito_user_pool_domain" "editors" {
  domain       = "${var.project}-${data.aws_caller_identity.current.account_id}-editors"
  user_pool_id = aws_cognito_user_pool.editors.id
}

resource "aws_cognito_resource_server" "content" {
  identifier   = "content"
  name         = "La Fabrique editorial access"
  user_pool_id = aws_cognito_user_pool.editors.id
  scope {
    scope_name        = "write"
    scope_description = "Manage editorial content"
  }
}

resource "aws_cognito_user_pool_client" "portal" {
  name                                 = "${var.project}-admin-portal"
  user_pool_id                         = aws_cognito_user_pool.editors.id
  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "${aws_cognito_resource_server.content.identifier}/write"]
  supported_identity_providers         = ["COGNITO"]
  callback_urls                        = ["${var.site_url}/admin/", "${var.site_url}/en/admin/"]
  logout_urls                          = ["${var.site_url}/admin/", "${var.site_url}/en/admin/"]
  prevent_user_existence_errors        = "ENABLED"
  enable_token_revocation              = true
  access_token_validity                = 30
  id_token_validity                    = 30
  token_validity_units {
    access_token = "minutes"
    id_token     = "minutes"
  }
}

resource "aws_cognito_user_group" "editors" {
  name         = "editors"
  user_pool_id = aws_cognito_user_pool.editors.id
  description  = "Editors allowed to publish website content"
}

# Accounts are created without sending mail during infrastructure provisioning.
# scripts/invite-content-editor.sh sends the invitation after the portal is live.
resource "aws_cognito_user" "editors" {
  for_each       = toset(var.editor_emails)
  user_pool_id   = aws_cognito_user_pool.editors.id
  username       = each.value
  message_action = "SUPPRESS"
  attributes     = { email = each.value }
}

resource "aws_cognito_user_in_group" "editors" {
  for_each     = toset(var.editor_emails)
  user_pool_id = aws_cognito_user_pool.editors.id
  username     = aws_cognito_user.editors[each.key].username
  group_name   = aws_cognito_user_group.editors.name
}

resource "aws_iam_role" "content" {
  name = "${var.project}-content-lambda"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy_attachment" "logs" {
  role       = aws_iam_role.content.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "content" {
  role = aws_iam_role.content.id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = ["dynamodb:Scan", "dynamodb:PutItem"], Resource = aws_dynamodb_table.content.arn }]
  })
}

data "archive_file" "content" {
  type        = "zip"
  source_file = "${path.module}/../../aws/lambda/content/dist/index.cjs"
  output_path = "${path.module}/.terraform/content-lambda.zip"
}

resource "aws_cloudwatch_log_group" "content" {
  name              = "/aws/lambda/${var.project}-content"
  retention_in_days = 30
}

resource "aws_lambda_function" "content" {
  function_name    = "${var.project}-content"
  role             = aws_iam_role.content.arn
  filename         = data.archive_file.content.output_path
  source_code_hash = data.archive_file.content.output_base64sha256
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  timeout          = 15
  memory_size      = 256
  environment { variables = { CONTENT_TABLE = aws_dynamodb_table.content.name } }
  depends_on = [aws_cloudwatch_log_group.content, aws_iam_role_policy_attachment.logs, aws_iam_role_policy.content]
}

resource "aws_apigatewayv2_api" "content" {
  name          = "${var.project}-content"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = [var.site_url]
    allow_methods = ["GET", "PUT", "OPTIONS"]
    allow_headers = ["authorization", "content-type"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_authorizer" "editors" {
  api_id           = aws_apigatewayv2_api.content.id
  authorizer_type  = "JWT"
  name             = "editors"
  identity_sources = ["$request.header.Authorization"]
  jwt_configuration {
    audience = [aws_cognito_user_pool_client.portal.id]
    issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.editors.id}"
  }
}

resource "aws_apigatewayv2_integration" "content" {
  api_id                 = aws_apigatewayv2_api.content.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.content.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "public" {
  api_id    = aws_apigatewayv2_api.content.id
  route_key = "GET /content"
  target    = "integrations/${aws_apigatewayv2_integration.content.id}"
}

resource "aws_apigatewayv2_route" "editor" {
  for_each             = toset(["GET /admin/content", "PUT /admin/content/{id}"])
  api_id               = aws_apigatewayv2_api.content.id
  route_key            = each.value
  target               = "integrations/${aws_apigatewayv2_integration.content.id}"
  authorization_type   = "JWT"
  authorizer_id        = aws_apigatewayv2_authorizer.editors.id
  authorization_scopes = ["content/write"]
}

resource "aws_apigatewayv2_stage" "content" {
  api_id      = aws_apigatewayv2_api.content.id
  name        = "$default"
  auto_deploy = true
  default_route_settings {
    throttling_burst_limit = 30
    throttling_rate_limit  = 15
  }
}

resource "aws_lambda_permission" "gateway" {
  statement_id  = "AllowContentApi"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.content.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.content.execution_arn}/*/*"
}

output "api_base_url" { value = aws_apigatewayv2_api.content.api_endpoint }
output "admin_auth_domain" { value = "https://${aws_cognito_user_pool_domain.editors.domain}.auth.${var.region}.amazoncognito.com" }
output "admin_client_id" { value = aws_cognito_user_pool_client.portal.id }
output "editor_user_pool_id" { value = aws_cognito_user_pool.editors.id }
output "content_table" { value = aws_dynamodb_table.content.name }
