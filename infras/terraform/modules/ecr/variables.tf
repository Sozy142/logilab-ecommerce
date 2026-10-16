variable "project_name" {
  description = "Project name prefix for ECR repositories"
  type        = string
}

variable "repository_names" {
  description = "Application image repositories to create"
  type        = set(string)
}
