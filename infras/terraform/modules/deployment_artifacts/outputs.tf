output "bucket_name" {
  description = "Private S3 bucket for deployment bundles"
  value       = aws_s3_bucket.deployments.bucket
}

output "bucket_arn" {
  description = "ARN of the deployment bundle bucket"
  value       = aws_s3_bucket.deployments.arn
}