# Build context PHẢI là gốc monorepo (docker build -f apps/frontend/Dockerfile .)
# vì cần thấy packages/shared-types và package-lock.json gốc (npm workspaces).
#
# NEXT_PUBLIC_BACKEND_URL bị bake cứng vào bundle JS lúc build (Next.js thay
# process.env.NEXT_PUBLIC_* thành literal string ngay khi compile) — phải
# truyền qua --build-arg, đọc lúc container chạy sẽ không có tác dụng.

FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm ci
COPY packages/shared-types packages/shared-types
COPY apps/frontend apps/frontend

ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
RUN npm run build --workspace=apps/frontend

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
WORKDIR /app
# output: "standalone" đóng gói sẵn server.js + node_modules tối giản, nhưng
# KHÔNG kèm static assets / public — phải copy tay 2 thứ đó riêng.
COPY --from=build /repo/apps/frontend/.next/standalone ./
COPY --from=build /repo/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build /repo/apps/frontend/public ./apps/frontend/public

EXPOSE 3000
CMD ["node", "apps/frontend/server.js"]
