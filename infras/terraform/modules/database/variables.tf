variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "db_name" {
  description = "Name of the initial PostgreSQL database"
  type        = string
}

variable "master_username" {
  description = "RDS master username"
  type        = string
}

variable "engine_version" {
  description = "PostgreSQL engine version supported in the selected AWS region"
  type        = string
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "subnet_ids" {
  description = "Private subnet IDs for the RDS subnet group"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group that allows app-tier access to PostgreSQL"
  type        = string
}

variable "multi_az" {
  description = "Whether to deploy RDS across multiple Availability Zone"
  type        = bool
  default     = false
}

variable "final_snapshot_identifier" {
  description = "Unique identifier for the final snapshot when deleteing the database"
  type        = string
}


