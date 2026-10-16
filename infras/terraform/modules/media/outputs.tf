output "media_bucket_name" {
  description = "Name of the S3 bucket for public media objects"
  value       = aws_s3_bucket.media.bucket
}

output "media_bucket_arn" {
  description = "ARN of the S3 bucket for public media objects"
  value       = aws_s3_bucket.media.arn
}