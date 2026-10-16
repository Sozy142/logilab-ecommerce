output "db_endpoint" {
  description = "RDS endpoint, including the port"
  value       = aws_db_instance.postgres.endpoint
}

output "db_address" {
  description = "RDS hostname"
  value       = aws_db_instance.postgres.address
}

output "db_port" {
  description = "RDS port"
  value       = aws_db_instance.postgres.port
}

output "db_name" {
  description = "Initial database name"
  value       = aws_db_instance.postgres.db_name
}

output "master_user_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the RDS master credentials"
  value       = aws_db_instance.postgres.master_user_secret[0].secret_arn
}