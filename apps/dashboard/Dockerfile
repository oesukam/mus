# Dashboard Dockerfile
FROM node:24-alpine AS base

RUN corepack enable && corepack prepare yarn@4.5.3 --activate
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json yarn.lock* .yarnrc.yml* ./
COPY .yarn ./.yarn
COPY packages ./packages
COPY apps/dashboard/package.json ./apps/dashboard/
RUN yarn install --immutable

# Development stage
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY package.json ./
COPY apps/dashboard ./apps/dashboard
EXPOSE 3001
CMD ["yarn", "workspace", "@mus/dashboard", "dev"]

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY package.json ./
COPY apps/dashboard ./apps/dashboard
RUN yarn workspace @mus/dashboard build

# Production stage
FROM node:24-alpine AS production
RUN corepack enable && corepack prepare yarn@4.5.3 --activate
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/dashboard/.next ./apps/dashboard/.next
COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public
COPY --from=builder /app/apps/dashboard/package.json ./apps/dashboard/
COPY --from=builder /app/apps/dashboard/next.config.js ./apps/dashboard/
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

WORKDIR /app/apps/dashboard
EXPOSE 3001

CMD ["yarn", "start"]
