resource "aws_ecr_repository" "app" {
  for_each = var.repository_names

  name                 = "${var.project_name}/${each.value}"
  image_tag_mutability = "IMMUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name      = "${var.project_name}-${each.value}"
    Project   = var.project_name
    ManagedBy = "Terraform"
  }
}

