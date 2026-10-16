output "instance_profile_name" {
  description = "Name of the instance profile to attach to the app instance"
  value       = aws_iam_instance_profile.app.name
}

output "github_actions_role_arn" {
  value = aws_iam_role.github_actions.arn
}