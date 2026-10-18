terraform {
  required_version = ">= 1.10.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # bucket       = "logilab-terraform-state-581695528319-apse1"
    key          = "logilab/terraform.tfstate"
    region       = "ap-southeast-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region
}

module "network" {
  source = "./modules/network"

  project_name    = var.project_name
  vpc_cidr        = var.vpc_cidr
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets
}

module "security" {
  source = "./modules/security"

  project_name       = var.project_name
  vpc_id             = module.network.vpc_id
  public_subnet_ids  = module.network.public_subnet_ids
  private_subnet_ids = module.network.private_subnet_ids
}

module "alb" {
  source = "./modules/alb"

  project_name      = var.project_name
  vpc_id            = module.network.vpc_id
  subnet_ids        = module.network.public_subnet_ids
  security_group_id = module.security.alb_security_group_id
}

module "app" {
  source = "./modules/app"

  project_name         = var.project_name
  subnet_ids           = module.network.private_subnet_ids
  security_group_id    = module.security.app_security_group_id
  instance_type        = var.instance_type
  iam_instance_profile = module.iam.instance_profile_name

  target_group_arns = [module.alb.app_target_group_arn]
}

module "database" {
  source = "./modules/database"

  project_name              = var.project_name
  db_name                   = var.db_name
  master_username           = var.master_username
  engine_version            = var.engine_version
  instance_class            = var.db_instance_class
  subnet_ids                = module.network.private_subnet_ids
  security_group_id         = module.security.db_security_group_id
  multi_az                  = var.db_multi_az
  final_snapshot_identifier = var.final_snapshot_identifier
}

module "iam" {
  source = "./modules/iam"

  project_name          = var.project_name
  github_repo           = var.github_repo
  database_secret_arn   = module.database.master_user_secret_arn
  ecr_repository_arns   = values(module.ecr.repository_arns)
  media_bucket_arn      = module.media.media_bucket_arn
  jwt_secret_arn        = module.secrets.jwt_secret_arn
  deployment_bucket_arn = module.deployment_artifacts.bucket_arn

  depends_on = [module.secrets]
}

module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  repository_names = toset([
    "frontend",
    "backend",
  ])
}

module "media" {
  source = "./modules/media"

  project_name = var.project_name
}

module "deployment_artifacts" {
  source = "./modules/deployment_artifacts"

  project_name = var.project_name
}

module "secrets" {
  source = "./modules/secrets"

  project_name = var.project_name
}

module "waf" {
  source = "./modules/waf"
}

module "cdn" {
  source = "./modules/cdn"

  domain_name        = var.domain_name
  origin_domain_name = module.alb.alb_dns_name
  web_acl_arn        = module.waf.web_acl_arn
}