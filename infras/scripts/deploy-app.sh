#!/usr/bin/env bash
set -euo pipefail

registry="${BACKEND_REPO%%/*}"
aws ecr get-login-password --region "$AWS_REGION" \
    | docker login --username AWS --password-stdin "$registry"

NGINX_CONF="${NGINX_CONF:-/opt/logilab/nginx/default.conf}"
test -f "$NGINX_CONF" || { echo "Missing nginx config: $NGINX_CONF" >&2; exit 1; }

docker network inspect logilab >/dev/null 2>&1 || docker network create logilab

umask 077
env_file="$(mktemp)"
trap 'rm -f "$env_file"' EXIT

DB_SECRET_JSON="$(aws secretsmanager get-secret-value \
  --secret-id "$DB_SECRET_ARN" --region "$AWS_REGION" \
  --query SecretString --output text)" \
python3 - >> "$env_file" <<'PY'
import json, os, urllib.parse
s = json.loads(os.environ["DB_SECRET_JSON"])
user = urllib.parse.quote(s["username"], safe="")
password = urllib.parse.quote(s["password"], safe="")
print(f"DATABASE_URL=postgres://{user}:{password}@{os.environ['DB_ENDPOINT']}/{os.environ['DB_NAME']}?sslmode=no-verify")
PY

JWT_SECRET_JSON="$(aws secretsmanager get-secret-value \
  --secret-id "$JWT_SECRET_ARN" --region "$AWS_REGION" \
  --query SecretString --output text)" \
python3 - >> "$env_file" <<'PY'
import json, os
raw = os.environ["JWT_SECRET_JSON"]
try:
    data = json.loads(raw)
    jwt_val = data.get("JWT_SECRET", raw)
except Exception:
    jwt_val = raw
print(f"JWT_SECRET={jwt_val}")
PY

{
  echo "PORT=4000"
  echo "NODE_ENV=production"
  echo "CORS_ORIGIN=http://${ALB_DNS}"
  echo "COOKIE_SECURE=false"
  echo "MEDIA_BUCKET_NAME=${MEDIA_BUCKET}"
  echo "AWS_REGION=${AWS_REGION}"
} >> "$env_file"

docker pull "${BACKEND_REPO}:${IMAGE_TAG}"
docker pull "${FRONTEND_REPO}:${IMAGE_TAG}"

docker pull nginx:alpine

docker rm -f logilab-nginx logilab-backend logilab-frontend 2>/dev/null || true

docker run -d --name logilab-backend --restart unless-stopped \
  --network logilab --env-file "$env_file" "${BACKEND_REPO}:${IMAGE_TAG}"
docker run -d --name logilab-frontend --restart unless-stopped \
  --network logilab "${FRONTEND_REPO}:${IMAGE_TAG}"
docker run -d --name logilab-nginx --restart unless-stopped \
  --network logilab -p 80:80 \
  -v "$NGINX_CONF:/etc/nginx/conf.d/default.conf:ro" \
  nginx:alpine


echo "Waiting for Nginx & Backend to accept connections..."
sleep 3

for _ in $(seq 1 30); do
  if docker exec logilab-backend node -e "fetch('http://localhost:4000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"; then
    echo "App is healthy"
    exit 0
  fi
  sleep 2
done

echo "App failed health check" >&2
docker logs --tail 30 logilab-nginx >&2
docker logs --tail 50 logilab-backend >&2
exit 1
