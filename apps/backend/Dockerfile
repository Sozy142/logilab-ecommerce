# Build context PHẢI là gốc monorepo (docker build -f apps/backend/Dockerfile .)
# vì cần thấy packages/shared-types và package-lock.json gốc (npm workspaces).

FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm ci
COPY packages/shared-types packages/shared-types
COPY apps/backend apps/backend
RUN npm run build --workspace=apps/backend

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm ci --omit=dev
COPY packages/shared-types packages/shared-types
COPY --from=build /repo/apps/backend/dist apps/backend/dist
WORKDIR /repo/apps/backend
EXPOSE 4000
CMD ["node", "dist/server.js"]
