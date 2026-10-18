variable "domain_name" {
  type        = string
  description = "Domain name"
}

variable "origin_domain_name" {
  type        = string
  description = "Origin server domain name"
}

variable "web_acl_arn" {
  type        = string
  description = "AWS WAF Web ACL ARN"
  default     = null
}
