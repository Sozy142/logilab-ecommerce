# Logilab E-commerce

Logilab is an e-commerce platform for electronics, robotics, and developer hardware. This repository is an npm-workspaces monorepo containing the customer-facing storefront, backend API, and shared TypeScript types.

## Features

- Product catalog with categories, search, and filtering
- Product details, technical specifications, and related content
- Shopping cart, checkout, and order history
- Customer accounts and authentication
- Blog and configurable storefront banners
- Backend routes for administrative product, category, order, user, and content management

## Project Structure

```text
apps/
	backend/       Express API and PostgreSQL schema
	frontend/      Next.js storefront
packages/
	shared-types/  TypeScript types shared across workspaces
```

## Technology Stack

- Frontend: Next.js 16, React 19, TypeScript, and Tailwind CSS 4
- Backend: Node.js 22, Express, TypeScript, and PostgreSQL
- Shared package: `@logilab/shared-types`
- Local database: PostgreSQL 16 via Docker Compose

## Prerequisites

- Node.js 22 or later
- npm
- Docker with Docker Compose

## Quick Start

Run commands from the repository root.

### 1. Install dependencies

```bash
npm ci
```

### 2. Start PostgreSQL

```bash
docker compose -f docker-compose.dev.yml up -d db
```

The local database is available at `localhost:5433`.

### 3. Configure local environment files

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

The example files contain local development settings. Review them before use; do not commit secrets or production credentials.

### 4. Initialize a new database

For a new, empty local database, apply the backend schema:

```bash
docker compose -f docker-compose.dev.yml exec -T db \
	psql -U logilab -d logilab < apps/backend/db/schema.sql
```

Run this only when initializing an empty database. Do not apply the schema to a database containing data you need to preserve.

### 5. Start the application

```bash
npm run dev
```

The storefront is available at [http://localhost:3000](http://localhost:3000), and the backend API is available at [http://localhost:4000](http://localhost:4000). Check the API health endpoint at [http://localhost:4000/health](http://localhost:4000/health).

Media upload requires an S3 bucket and valid AWS credentials. The storefront and API can be developed locally without configuring uploads, but upload operations will not work until S3 is configured.

## Workspace Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the backend and storefront in development mode. |
| `npm run dev:backend` | Start only the backend API. |
| `npm run dev:frontend` | Start only the storefront. |
| `npm test` | Run tests defined by workspaces. |
| `npm run typecheck --workspace=apps/backend` | Type-check the backend. |
| `npm run lint --workspace=apps/frontend` | Lint the frontend. |

## Application Documentation

- [Backend README](apps/backend/README.md): API configuration, database setup, route groups, testing, and admin bootstrap.
- [Frontend README](apps/frontend/README.md): storefront development, frontend configuration, and build commands.
