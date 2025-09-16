variable "project" { 
  type = string
  default = "lafabrique-leader" 
}
variable "region" { 
  type = string
  default = "us-east-1" 
 }

variable "site_bucket_name" { 
  type = string 
  description = "S3 bucket name for static site" 
}
variable "acm_certificate_arn" { 
  type = string
  default = ""
  description = "Optional ACM cert ARN in us-east-1 for custom domain" 
  validation {
    condition     = length(var.aliases) == 0 || var.acm_certificate_arn != ""
    error_message = "When providing CloudFront aliases, you must set a valid us-east-1 ACM certificate ARN in acm_certificate_arn."
  }
}
variable "aliases" { 
  type = list(string)
  default = []
  description = "Optional CloudFront aliases (custom domains), e.g. ['lafabriqueduleader.com','www.lafabriqueduleader.com']" 
}
variable "site_url" { 
  type = string
  description = "Public site URL used inside emails (https://domain)" 
}
variable "from_email" { 
  type = string
  description = "Verified SES from address, e.g., 'La Fabrique <no-reply@domain.com>'" 
}
variable "preorder_to_email" {
  type        = string
  default     = ""
  description = "Recipient address for pre-order notifications. Defaults to from_email when empty."
}
variable "cors_origin" { 
  type = string
  description = "Allowed CORS origin for API (e.g., https://domain)" 
}

variable "link_signing_secret" {
  type        = string
  default     = ""
  description = "Secret used to sign excerpt verification links (HMAC). Set to a long random string."
}

variable "turnstile_secret_key" {
  type        = string
  default     = ""
  description = "Cloudflare Turnstile secret key for server-side verification."
}

variable "excerpt_fr_s3_key" {
  type        = string
  default     = "private/excerpts/excerpt-fr.pdf"
  description = "S3 key for the French excerpt PDF (kept private; Lambda reads it)."
}

variable "excerpt_en_s3_key" {
  type        = string
  default     = "private/excerpts/excerpt-en.pdf"
  description = "S3 key for the English excerpt PDF (kept private; Lambda reads it)."
}

variable "ddb_table" { 
  type = string
  default = ""
  description = "Optional DynamoDB table name to store emails"
}

variable "preorders_ddb_table" {
  type        = string
  default     = ""
  description = "Optional DynamoDB table name to store preorders (recommended to avoid collisions)."
}

# Toggle API resources (Lambda + API Gateway). Default off for cheaper, simpler deploy.
variable "enable_api" { 
  type = bool
  default = false 
}
