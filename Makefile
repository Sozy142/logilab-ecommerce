export AWS_PAGER :=

AWS_REGION ?= ap-southeast-1
IMAGE_TAG ?= $(shell date +%Y%m%d%H%M%S)

DB_LOCAL_PORT ?= 15432
DB_NAME ?= logilab

DB_SCHEMA ?= apps/backend/db/schema.sql

.PHONY: infra-init jwt-secret images-push db-init-rds ssm-db-tunnel app-deploy

infra-init:
	@set -eu; \
	account_id="$$(aws sts get-caller-identity --query Account --output text)"; \
	bucket="logilab-terraform-state-$$account_id-apse1"; \
	terraform -chdir=infras/terraform init \
		-reconfigure \
		-backend-config="bucket=$$bucket"

images-push:
	@set -eu; \
	account_id="$$(aws sts get-caller-identity --query Account --output text)"; \
	registry="$$account_id.dkr.ecr.$(AWS_REGION).amazonaws.com"; \
	ecr_urls="$$(terraform -chdir=infras/terraform output -json ecr_repository_urls)"; \
	backend_repo="$$(printf '%s' "$$ecr_urls" | jq -r '.backend')"; \
	frontend_repo="$$(printf '%s' "$$ecr_urls" | jq -r '.frontend')"; \
	alb_dns="$$(terraform -chdir=infras/terraform output -raw alb_dns_name)"; \
	backend_image="$$backend_repo:$(IMAGE_TAG)"; \
	frontend_image="$$frontend_repo:$(IMAGE_TAG)"; \
	aws ecr get-login-password --region "$(AWS_REGION)" | docker login --username AWS --password-stdin "$$registry"; \
	docker build --platform linux/amd64 -f apps/backend/Dockerfile -t "$$backend_image" .; \
	docker push "$$backend_image"; \
	docker build --platform linux/amd64 -f apps/frontend/Dockerfile --build-arg NEXT_PUBLIC_BACKEND_URL="http://$$alb_dns/api" -t "$$frontend_image" .; \
	docker push "$$frontend_image"


db-init-rds:
	@set -eu; \
    test -f "$(DB_SCHEMA)" || { echo "Schema file not found: $(DB_SCHEMA)" >&2; exit 1; }; \
    secret_arn="$$(terraform -chdir=infras/terraform output -raw database_secret_arn)"; \
    secret_json="$$(aws secretsmanager get-secret-value --secret-id "$$secret_arn" --region "$(AWS_REGION)" --query SecretString --output text)"; \
    db_user="$$(printf '%s' "$$secret_json" | jq -er '.username')"; \
    export PGPASSWORD="$$(printf '%s' "$$secret_json" | jq -er '.password')"; \
    unset secret_json; \
	existing="$$(docker run --rm -e PGPASSWORD postgres:18-alpine \
        psql "host=host.docker.internal port=$(DB_LOCAL_PORT) dbname=$(DB_NAME) user=$$db_user sslmode=require" \
        -Atc "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname NOT LIKE 'pg_toast%%' AND c.relkind IN ('r', 'p', 'v', 'm', 'S')")"; \
    if [ "$$existing" != "0" ]; then echo "Database is not empty; refusing to initialize schema." >&2; exit 1; fi; \
    docker run --rm -e PGPASSWORD \
        -v "$(CURDIR)/$(DB_SCHEMA):/schema.sql:ro" \
        postgres:18-alpine \
        psql "host=host.docker.internal port=$(DB_LOCAL_PORT) dbname=$(DB_NAME) user=$$db_user sslmode=require" \
        -v ON_ERROR_STOP=1 -f /schema.sql; \
    unset PGPASSWORD

ssm-db-tunnel:
	@set -eu; \
	asg_name="$$(terraform -chdir=infras/terraform output -raw app_asg_name)"; \
	instance_ids="$$(aws autoscaling describe-auto-scaling-instances --region "$(AWS_REGION)" --query "AutoScalingInstances[?AutoScalingGroupName=='$$asg_name'].InstanceId" --output text)"; \
	if [ -z "$$instance_ids" ] || [ "$$instance_ids" = "None" ]; then \
		echo "Error: No instances found in ASG $$asg_name!" >&2; \
		exit 1; \
	fi; \
	echo "Target instances: $$instance_ids"; \
	db_host="$${endpoint%:*}"; \
	test -n "$$instance_id" && [ "$$instance_id" != "None" ]; \
	test -n "$$db_host"; \
	echo "Forwarding localhost:$(DB_LOCAL_PORT) to RDS through EC2. Press Ctrl-C to stop."; \
		aws ssm start-session \
		--region "$(AWS_REGION)" \
		--target "$$instance_id" \
		--document-name AWS-StartPortForwardingSessionToRemoteHost \
		--parameters "{\"host\":[\"$$db_host\"],\"portNumber\":[\"5432\"],\"localPortNumber\":[\"$(DB_LOCAL_PORT)\"]}"

jwt-secret:
	@set -eu; \
	secret_arn="$$(terraform -chdir=infras/terraform output -raw jwt_secret_arn)"; \
	secret_name="$$(aws secretsmanager describe-secret --secret-id "$$secret_arn" --region "$(AWS_REGION)" --query Name --output text)"; \
	if aws secretsmanager get-secret-value --secret-id "$$secret_arn" --region "$(AWS_REGION)" >/dev/null 2>&1; then \
		echo "Secret $$secret_name already has a value."; \
	else \
		jwt_value="$$(openssl rand -base64 32)"; \
		aws secretsmanager put-secret-value --secret-id "$$secret_arn" --secret-string "json:{\"JWT_SECRET\":\"$$jwt_value\"}" --region "$(AWS_REGION)" || \
		aws secretsmanager update-secret --secret-id "$$secret_arn" --secret-string "{\"JWT_SECRET\":\"$$jwt_value\"}" --region "$(AWS_REGION)"; \
		echo "Updated secret $$secret_name successfully."; \
	fi

app-deploy:
	@set -eu; \
	tag="$(if $(filter command line environment,$(origin IMAGE_TAG)),$(IMAGE_TAG),)"; \
    if [ -z "$$tag" ]; then \
        tag="$$(aws ecr describe-images --region "$(AWS_REGION)" --repository-name logilab/backend \
            --query 'sort_by(imageDetails,&imagePushedAt)[-1].imageTags[0]' --output text)"; \
        echo "No IMAGE_TAG given, using latest pushed: $$tag"; \
    fi; \
	backend_repo="$$(terraform -chdir=infras/terraform output -json ecr_repository_urls | jq -er '.backend')"; \
	frontend_repo="$$(terraform -chdir=infras/terraform output -json ecr_repository_urls | jq -er '.frontend')"; \
	asg_name="$$(terraform -chdir=infras/terraform output -raw app_asg_name)"; \
	instance_id="$$(aws autoscaling describe-auto-scaling-instances --region "$(AWS_REGION)" --query "AutoScalingInstances[?AutoScalingGroupName=='$$asg_name'].InstanceId | [0]" --output text)"; \
	test -n "$$instance_id" && [ "$$instance_id" != "None" ]; \
	deploy_bucket="$$(terraform -chdir=infras/terraform output -raw deployment_bucket_name)"; \
	media_bucket="$$(terraform -chdir=infras/terraform output -raw media_bucket_name)"; \
	db_endpoint="$$(terraform -chdir=infras/terraform output -raw database_endpoint)"; \
	db_secret_arn="$$(terraform -chdir=infras/terraform output -raw database_secret_arn)"; \
	jwt_secret_arn="$$(terraform -chdir=infras/terraform output -raw jwt_secret_arn)"; \
	alb_dns="$$(terraform -chdir=infras/terraform output -raw alb_dns_name)"; \
	for repo in logilab/backend logilab/frontend; do \
		aws ecr describe-images --region "$(AWS_REGION)" --repository-name "$$repo" \
			--image-ids imageTag="$$tag" >/dev/null \
			|| { echo "Image $$repo:$$tag not found. Run make images-push first." >&2; exit 1; }; \
	done; \
	aws s3 cp infras/scripts/deploy-app.sh "s3://$$deploy_bucket/deploy/deploy-app.sh" --region "$(AWS_REGION)"; \
	aws s3 cp infras/nginx/default.conf "s3://$$deploy_bucket/deploy/nginx/default.conf" --region "$(AWS_REGION)"; \
	commands="$$(jq -n \
		--arg bucket "$$deploy_bucket" --arg region "$(AWS_REGION)" --arg tag "$$tag" \
		--arg brepo "$$backend_repo" --arg frepo "$$frontend_repo" \
		--arg dbsecret "$$db_secret_arn" --arg jwtsecret "$$jwt_secret_arn" \
		--arg dbendpoint "$$db_endpoint" --arg dbname "$(DB_NAME)" \
		--arg media "$$media_bucket" --arg alb "$$alb_dns" \
		'{commands: [ \
			"mkdir -p /opt/logilab/nginx", \
			("aws s3 cp s3://" + $$bucket + "/deploy/nginx/default.conf /opt/logilab/nginx/default.conf --region " + $$region), \
			("aws s3 cp s3://" + $$bucket + "/deploy/deploy-app.sh /tmp/deploy-app.sh --region " + $$region), \
			("AWS_REGION=" + ($$region|@sh) + " IMAGE_TAG=" + ($$tag|@sh) \
			+ " BACKEND_REPO=" + ($$brepo|@sh) + " FRONTEND_REPO=" + ($$frepo|@sh) \
			+ " DB_SECRET_ARN=" + ($$dbsecret|@sh) + " JWT_SECRET_ARN=" + ($$jwtsecret|@sh) \
			+ " DB_ENDPOINT=" + ($$dbendpoint|@sh) + " DB_NAME=" + ($$dbname|@sh) \
			+ " MEDIA_BUCKET=" + ($$media|@sh) + " ALB_DNS=" + ($$alb|@sh) \
			+ " bash /tmp/deploy-app.sh") \
		]}')"; \
	command_id="$$(aws ssm send-command --region "$(AWS_REGION)" \
		--instance-ids "$$instance_id" --document-name AWS-RunShellScript \
		--parameters "$$commands" --query Command.CommandId --output text)"; \
	echo "SSM command: $$command_id"; \
	echo "Waiting for deployment to complete..."; \
	while : ; do \
		status="$$(aws ssm get-command-invocation --region "$(AWS_REGION)" --command-id "$$command_id" --instance-id "$$instance_id" --query Status --output text)"; \
		if [ "$$status" = "Success" ] || [ "$$status" = "Failed" ] || [ "$$status" = "Cancelled" ] || [ "$$status" = "TimedOut" ]; then \
			break; \
		fi; \
		sleep 5; \
	done; \
	echo "Deploy status: $$status"; \
	aws ssm get-command-invocation --region "$(AWS_REGION)" \
		--command-id "$$command_id" --instance-id "$$instance_id" \
		--query StandardOutputContent --output text; \
	aws ssm get-command-invocation --region "$(AWS_REGION)" \
		--command-id "$$command_id" --instance-id "$$instance_id" \
		--query StandardErrorContent --output text >&2; \
	test "$$status" = "Success"