output "alb_dns_name" {
  description = "DNS name of the ALB"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the ALB"
  value       = aws_lb.main.arn
}

output "app_target_group_arn" {
  description = "Target group ARN for the app (Nginx)"
  value       = aws_lb_target_group.app.arn
}