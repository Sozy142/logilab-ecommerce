variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "subnet_ids" {
  description = "List of private subnet IDs where the app runs (Multi-AZ)"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group for the EC2 app"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "iam_instance_profile" {
  description = "IAM instance profile attached to the app EC2 instance"
  type        = string
}

variable "target_group_arns" {
  type = list(string)
}