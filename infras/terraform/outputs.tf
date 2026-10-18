output "alb_dns_name" {
  description = "Public DNS name of the application load balancer"
  value       = module.alb.alb_dns_name
}

output "database_endpoint" {
  description = "RDS endpoint used by the application"
  value       = module.database.db_endpoint
}

output "database_secret_arn" {
  description = "Secret Manager ARN for the RDS master credentials"
  value       = module.database.master_user_secret_arn
}

output "ecr_repository_urls" {
  description = "Map of application names to ECR repository URLs"
  value       = module.ecr.repository_urls
}

output "media_bucket_name" {
  description = "S3 bucket name used by the backend for media uploads"
  value       = module.media.media_bucket_name
}

output "jwt_secret_arn" {
  description = "ARN of the Secrets Manager secret for the backend JWT key"
  value       = module.secrets.jwt_secret_arn
}

output "deployment_bucket_name" {
  description = "S3 bucket name for deployment bundles"
  value       = module.deployment_artifacts.bucket_name
}

output "app_asg_name" {
  description = "Name of the Application Auto Scaling Group"
  value       = module.app.app_asg_name
}

output "github_actions_role_arn" {
  description = "ARN of the IAM Role for GitHub Actions OIDC"
  value       = module.iam.github_actions_role_arn
}

output "domain_name_servers" {
  value       = module.cdn.name_servers
  description = "4 Nameservers Route 53"
}
