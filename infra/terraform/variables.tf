variable "project" { type = string, default = "lafabrique-leader" }
variable "region" { type = string, default = "us-east-1" }

variable "site_bucket_name" { type = string, description = "S3 bucket name for static site" }
variable "acm_certificate_arn" { type = string, default = "", description = "Optional ACM cert ARN in us-east-1 for custom domain" }
variable "aliases" { type = list(string), default = [], description = "Optional CloudFront aliases (custom domains), e.g. ['lafabriqueduleader.com','www.lafabriqueduleader.com']" }
variable "site_url" { type = string, description = "Public site URL used inside emails (https://domain)" }
variable "from_email" { type = string, description = "Verified SES from address, e.g., 'La Fabrique <no-reply@domain.com>'" }
variable "cors_origin" { type = string, description = "Allowed CORS origin for API (e.g., https://domain)" }

variable "mailchimp_api_key" { type = string, default = "" }
variable "mailchimp_server_prefix" { type = string, default = "" }
variable "mailchimp_list_id" { type = string, default = "" }
variable "ddb_table" { type = string, default = "", description = "Optional DynamoDB table name to store emails" }

# Toggle API resources (Lambda + API Gateway). Default off for cheaper, simpler deploy.
variable "enable_api" { type = bool, default = false }
