# Platform Dockerfile
FROM node:24-alpine AS base

RUN corepack enable && corepack prepare yarn@4.5.3 --activate
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json yarn.lock* .yarnrc.yml* ./
COPY .yarn ./.yarn
COPY packages ./packages
COPY apps/platform/package.json ./apps/platform/
RUN yarn install --immutable

# Development stage
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY package.json ./
COPY apps/platform ./apps/platform
EXPOSE 3000
CMD ["yarn", "workspace", "@mus/platform", "dev"]

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY package.json ./
COPY apps/platform ./apps/platform
RUN yarn workspace @mus/platform build

# Production stage
FROM node:24-alpine AS production
RUN corepack enable && corepack prepare yarn@4.5.3 --activate
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/platform/.next ./apps/platform/.next
COPY --from=builder /app/apps/platform/public ./apps/platform/public
COPY --from=builder /app/apps/platform/package.json ./apps/platform/
COPY --from=builder /app/apps/platform/next.config.js ./apps/platform/
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

WORKDIR /app/apps/platform
EXPOSE 3000

CMD ["yarn", "start"]
