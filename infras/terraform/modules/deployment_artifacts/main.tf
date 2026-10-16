data "aws_caller_identity" "current" {

}

data "aws_region" "current" {

}

resource "aws_s3_bucket" "deployments" {
  bucket = "${var.project_name}-deploy-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"

  force_destroy = true

  tags = {
    Name      = "${var.project_name}-deployments"
    Project   = var.project_name
    ManagedBy = "Terraform"
  }
}

resource "aws_s3_bucket_versioning" "deployments" {
  bucket = aws_s3_bucket.deployments.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "deployments" {
  bucket = aws_s3_bucket.deployments.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "deployments" {
  bucket = aws_s3_bucket.deployments.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "deployments_lifecycle" {
  bucket = aws_s3_bucket.deployments.id

  rule {
    id     = "auto-clean-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 1 # Tự động xóa các version cũ sau 1 ngày
    }

    expiration {
      expired_object_delete_marker = true # Tự động dọn dẹp các dấu vết xóa file
    }
  }
}
