# Logilab Backend

The Logilab backend provides the API used by the storefront and administrative features. It is built with Express and TypeScript and uses PostgreSQL for persistent data.

## Technology Stack

- Node.js 22
- TypeScript
- Express
- PostgreSQL
- Zod for request validation

## Prerequisites

- Node.js 22 or later
- npm
- Docker with Docker Compose

## Local Development

Run the following commands from the repository root unless noted otherwise.

### 1. Install dependencies

```bash
npm ci
```

### 2. Start PostgreSQL

```bash
docker compose -f docker-compose.dev.yml up -d db
```

The development database is available at `localhost:5433`.

### 3. Configure environment variables

Create the backend environment file from the example:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Review the values in `apps/backend/.env` before starting the API. The example values are intended for local development only.

### 4. Initialize the database

For a new, empty development database, apply the SQL schema:

```bash
docker compose -f docker-compose.dev.yml exec -T db \
	psql -U logilab -d logilab < apps/backend/db/schema.sql
```

Run this command only when initializing an empty database. Do not apply the schema to a database that contains data you need to keep.

### 5. Start the API

```bash
npm run dev:backend
```

The API listens on `http://localhost:4000` by default.

Verify that the server is running:

```bash
curl http://localhost:4000/health
```

A healthy server returns:

```json
{"ok":true}
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port. Defaults to `4000`. |
| `CORS_ORIGIN` | Yes | Allowed frontend origins. Separate multiple origins with commas. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `JWT_SECRET` | Yes | Secret used to sign JSON Web Tokens. Use a strong, private value outside local development. |
| `COOKIE_NAME` | No | Session cookie name. Defaults to `logilab_session`. |
| `COOKIE_SECURE` | No | Set to `true` when serving the API over HTTPS. Defaults to `false`. |
| `MEDIA_BUCKET_NAME` | Yes | S3 bucket used for uploaded media. |
| `AWS_REGION` | No | AWS region. Defaults to `ap-southeast-1`. |
| `SENTRY_DSN` | No | Sentry DSN for error reporting. Sentry is disabled when unset. |

The local `MEDIA_BUCKET_NAME` value is only a bucket name; uploading media requires an existing S3 bucket and valid AWS credentials available to the AWS SDK.

## API Route Groups

- `/auth`
- `/categories`
- `/products`
- `/search`
- `/blog`
- `/hero-banners`
- `/checkout`
- `/orders`
- `/addresses`
- `/admin/products`
- `/admin/categories`
- `/admin/blog`
- `/admin/orders`
- `/admin/users`
- `/admin/hero-banners`
- `/admin/uploads`

## Common Commands

Run these commands from the repository root:

| Command | Description |
|---|---|
| `npm run dev:backend` | Start the API in development mode with file watching. |
| `npm test --workspace=apps/backend` | Run backend tests. |
| `npm run typecheck --workspace=apps/backend` | Run the TypeScript type check. |
| `npm run build --workspace=apps/backend` | Compile the backend to `dist/`. |
| `npm run start --workspace=apps/backend` | Start the compiled backend. |

## Granting the First Admin Role

Register an account through the storefront, then run the following command with that account's email address:

```bash
npm run bootstrap-admin --workspace=apps/backend -- <email>
```

Keep environment files and credentials private. Do not commit `apps/backend/.env` or production secrets to source control.