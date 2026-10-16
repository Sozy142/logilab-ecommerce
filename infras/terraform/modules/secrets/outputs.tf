output "jwt_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the backend JWT secret"
  value       = aws_secretsmanager_secret.jwt.arn
}