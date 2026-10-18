provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

resource "aws_route53_zone" "main" {
  name = var.domain_name
}

resource "aws_acm_certificate" "cert" {
  provider = aws.us_east_1
  domain_name = var.domain_name
  validation_method = "DNS"
  subject_alternative_names = ["*.${var.domain_name}"]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
        name = dvo.resource_record_name
        type   = dvo.resource_record_type
        record = dvo.resource_record_value
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "cert" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_cloudfront_distribution" "main" {
  enabled = true
  is_ipv6_enabled = true
  comment = "CDN for Logilab Project"
  default_root_object = ""

  web_acl_id = var.web_acl_arn
  origin {
    domain_name = var.origin_domain_name
    origin_id   = "ALB-Origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id = "ALB-Origin"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods = ["GET", "HEAD"]

    forwarded_values {
        query_string = true

        cookies {
          forward = "all"
        }
    }

    min_ttl     = 0
    default_ttl = 0    # Tạm thời để 0 trong quá trình dev để không bị cache dữ liệu cũ
    max_ttl     = 86400
  }

  aliases = [var.domain_name]

  viewer_certificate {
    cloudfront_default_certificate = false
    acm_certificate_arn            = aws_acm_certificate_validation.cert.certificate_arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}

resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}