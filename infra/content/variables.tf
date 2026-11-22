variable "project" {
  type    = string
  default = "lafabrique-leader"
}
variable "region" {
  type    = string
  default = "us-east-1"
}
variable "site_url" {
  type    = string
  default = "https://lafabriqueduleader.com"
  validation {
    condition     = can(regex("^https://[^/]+$", var.site_url))
    error_message = "site_url must be an HTTPS origin without a trailing slash."
  }
}
variable "editor_emails" {
  type        = list(string)
  default     = []
  description = "Invite-only editorial accounts. Send invitations after the portal is deployed."
}
