variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "database_secret_arn" {
  description = "ARN of the Secrets Manager secret containing RDS credentials"
  type        = string
}

variable "ecr_repository_arns" {
  description = "ARNs of ECR repositories the app instance can pull images from"
  type        = list(string)
}

variable "media_bucket_arn" {
  description = "ARN of the S3 media bucket used by the backend"
  type        = string
}

variable "jwt_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the backend JWT secret"
  type        = string
}

variable "deployment_bucket_arn" {
  description = "ARN of the private bucket cintainung deployment bundles"
  type        = string
}

variable "github_repo" {
  type = string
  description = "github repo name owner/repo"
}
