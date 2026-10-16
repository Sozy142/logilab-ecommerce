data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_launch_template" "app" {
  name_prefix = "${var.project_name}-template-"
  image_id = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = var.iam_instance_profile
  }

  vpc_security_group_ids = [var.security_group_id]

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size = 30
      volume_type = "gp3"
      encrypted = true
      delete_on_termination = true 
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -euo pipefail

    dnf update -y
    dnf install -y docker awscli-2

    systemctl enable --now docker
    systemctl enable --now amazon-ssm-agent

    usermod -aG docker ec2-user
  EOF
  )
  
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-app-node"
    }
  }
}

resource "aws_autoscaling_group" "app" {
  name_prefix = "${var.project_name}-asg-"
  desired_capacity = 2
  min_size = 1
  max_size = 4

  vpc_zone_identifier = var.subnet_ids

  target_group_arns = var.target_group_arns

  health_check_type = "EC2"
  health_check_grace_period = 300

  launch_template {
    id = aws_launch_template.app.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key = "Name"
    value = "${var.project_name}-app-asg-node"
    propagate_at_launch = true
  }
}



# resource "aws_instance" "app" {
#   ami                    = data.aws_ami.amazon_linux_2023.id
#   iam_instance_profile   = var.iam_instance_profile
#   instance_type          = var.instance_type
#   subnet_id              = var.subnet_id
#   vpc_security_group_ids = [var.security_group_id]

#   root_block_device {
#     volume_size           = 20
#     volume_type           = "gp3"
#     encrypted             = true
#     delete_on_termination = true
#   }

#   user_data = <<-EOF
#     #!/bin/bash
#     set -euo pipefail

#     dnf update -y
#     dnf install -y docker awscli-2

#     systemctl enable --now docker
#     systemctl enable --now amazon-ssm-agent

#     usermod -aG docker ec2-user
#   EOF

#   tags = {
#     Name = "${var.project_name}-app"
#   }
# }

