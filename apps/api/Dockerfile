# API Dockerfile
FROM node:24-alpine AS base

RUN corepack enable && corepack prepare yarn@4.5.3 --activate
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json yarn.lock* .yarnrc.yml* ./
COPY .yarn ./.yarn
COPY packages ./packages
COPY apps/api/package.json ./apps/api/
RUN yarn install --immutable

# Development stage
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY package.json ./
COPY apps/api ./apps/api
EXPOSE 4000
CMD ["yarn", "workspace", "@mus/api", "start:dev"]

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY package.json ./
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN yarn build

# Production stage
FROM node:24-alpine AS production
RUN corepack enable && corepack prepare yarn@4.5.3 --activate
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY package.json ./

WORKDIR /app/apps/api
EXPOSE 4000

CMD ["yarn", "start:prod"]
