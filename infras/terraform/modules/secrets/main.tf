resource "aws_secretsmanager_secret" "jwt" {
  name                    = "${var.project_name}/app/jwt-secret"
  description             = "JWT signing secret for the Logilab backend"
  recovery_window_in_days = 0

  tags = {
    Project   = var.project_name
    ManagedBy = "Terraform"
  }
}