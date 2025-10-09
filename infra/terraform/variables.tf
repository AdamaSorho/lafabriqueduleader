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
variable "site_url" { 
  type = string
  description = "Public site URL used inside emails (e.g., https://domain or http://<bucket>.s3-website-<region>.amazonaws.com)" 
}
variable "from_email" { 
  type = string
  description = "From address used for emails, e.g., 'La Fabrique <no-reply@domain.com>'" 
}
variable "smtp_host" {
  type        = string
  default     = "smtp.gmail.com"
  description = "SMTP host (e.g., smtp.gmail.com)"
}
variable "smtp_port" {
  type        = number
  default     = 465
  description = "SMTP port (465 for SSL, 587 for STARTTLS)"
}
variable "smtp_user" {
  type        = string
  default     = ""
  description = "SMTP username (full email for Gmail/Workspace; use App Password)"
}
variable "smtp_pass" {
  type        = string
  default     = ""
  description = "SMTP password or App Password"
}
variable "preorder_to_email" {
  type        = string
  default     = ""
  description = "Recipient address for pre-order notifications. Defaults to from_email when empty."
}
variable "cors_origin" { 
  type = string
  description = "Allowed CORS origin for API (e.g., https://domain or the S3 website endpoint)" 
}

variable "link_signing_secret" {
  type        = string
  default     = ""
  description = "Secret used to sign excerpt verification links (HMAC). Set to a long random string."
}

variable "api_shared_secret" {
  type        = string
  default     = ""
  description = "Shared secret for securing POST API calls via HMAC (used by edge proxy/Worker). Leave empty to disable check."
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

# TTL (seconds) for temporary rate-limit IP records stored in DynamoDB
variable "rate_ttl_secs" {
  type        = number
  default     = 3600
  description = "TTL in seconds for ip#<addr> throttle records in DynamoDB. Only applied to those items."
}
