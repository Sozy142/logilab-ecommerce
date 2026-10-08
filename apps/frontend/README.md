# Logilab Storefront

The Logilab storefront is a responsive e-commerce web application for browsing electronics and robotics products. It is built with Next.js and React and uses the Logilab backend API for product, account, and order data.

## Features

- Browse products, categories, and developer boards
- Search and filter the product catalog
- View product details and supporting technical information
- Read blog posts
- Manage a shopping cart and complete checkout
- Sign up, sign in, and view account and order information

## Technology Stack

- Next.js 16 with the App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand for client-side cart state
- Shared API types from `@logilab/shared-types`

## Prerequisites

- Node.js 22 or later
- npm
- The Logilab backend API running locally

For backend and database setup, see the [backend README](../backend/README.md).

## Local Development

Run the following commands from the repository root unless noted otherwise.

### 1. Install dependencies

```bash
npm ci
```

### 2. Configure the backend URL

Create the local environment file from the example:

```bash
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

By default, the storefront connects to the backend at `http://localhost:4000`. Make sure the backend allows the storefront origin `http://localhost:3000` in its `CORS_ORIGIN` setting. See the [backend README](../backend/README.md) for backend configuration and startup instructions.

### 3. Start the storefront

```bash
npm run dev:frontend
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | No | Base URL of the backend API. Defaults to `http://localhost:4000`. This value is exposed to the browser bundle, so it must not contain secrets. |
| `NEXT_PUBLIC_COOKIE_NAME` | No | Session cookie name used by the backend. Defaults to `logilab_session`. Keep it consistent with the backend's `COOKIE_NAME` setting if overridden. |

`NEXT_PUBLIC_*` values are embedded into the frontend during the build. Set the correct backend URL before creating a production build.

## Common Commands

Run these commands from the repository root:

| Command | Description |
|---|---|
| `npm run dev:frontend` | Start the Next.js development server. |
| `npm run lint --workspace=apps/frontend` | Run ESLint. |
| `npm run build --workspace=apps/frontend` | Create a production build. |
| `npm run start --workspace=apps/frontend` | Start the production server after building. |

The production configuration uses Next.js standalone output. The Docker build file is `apps/frontend/Dockerfile`; build it from the repository root so npm workspaces and shared types are available:

```bash
docker build -f apps/frontend/Dockerfile .
```
