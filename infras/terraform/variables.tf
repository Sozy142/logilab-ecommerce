variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "logilab"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "List of public subnet CIDR blocks"
  type = map(object({
    cidr = string
    az   = string
  }))

  default = {
    public_1 = {
      cidr = "10.0.1.0/24"
      az   = "ap-southeast-1a"
    }
    public_2 = {
      cidr = "10.0.2.0/24"
      az   = "ap-southeast-1b"
    }
  }
}

variable "private_subnets" {
  description = "Private subnets for app and database"
  type = map(object({
    cidr = string
    az   = string
  }))

  default = {
    private_1 = {
      cidr = "10.0.11.0/24"
      az   = "ap-southeast-1a"
    }
    private_2 = {
      cidr = "10.0.12.0/24"
      az   = "ap-southeast-1b"
    }
  }
}

variable "instance_type" {
  description = "EC2 instance type for the application"
  type        = string
  default     = "t3.micro"
}

variable "db_name" {
  description = "Name of the initial PostgreSQL database"
  type        = string
  default     = "logilab"
}

variable "master_username" {
  description = "RDS master username"
  type        = string
  default     = "logilab_admin"
}

variable "engine_version" {
  description = "PostgreSQL engine version supported in the selected AWS region"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_multi_az" {
  description = "Whether to deploy RDS across multiple Availability Zones"
  type        = bool
  default     = false
}

variable "final_snapshot_identifier" {
  description = "Unique snapshot name to use if the database is deleted"
  type        = string
}

variable "github_repo" {
  type        = string
  description = "GitHub repository (owner/repo)"
}

variable "domain_name" {
  type        = string
  description = "Domain name"
}