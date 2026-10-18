output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.main.domain_name
  description = "CloudFront default domain (xxxx.cloudfront.net)"
}

output "name_servers" {
  value       = aws_route53_zone.main.name_servers
  description = "Nameservers"
}
