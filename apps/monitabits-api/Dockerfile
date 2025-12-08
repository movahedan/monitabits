FROM oven/bun:1.3.3-alpine AS base
RUN bun install -g turbo@2.5.8

FROM base AS turbo
WORKDIR /app
COPY ./turbo.json ./turbo.json

FROM turbo AS pruner
WORKDIR /app
COPY ./apps ./apps
COPY ./packages ./packages
COPY ./package.json ./bun.lock ./
RUN turbo prune --scope=monitabits-api --docker

FROM turbo AS installer
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/json/ .
# Don't ignore scripts - Prisma needs postinstall to set up runtime
RUN bun install

FROM turbo AS build
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/ .

# Install Prisma runtime utils explicitly (required for Prisma 7.x with Bun)
RUN cd /app/apps/monitabits-api && bun add @prisma/client-runtime-utils

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN cd /app/apps/monitabits-api && bunx --bun prisma generate
RUN bun run build --filter=monitabits-api

FROM oven/bun:1.3.3-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 runner-group
RUN adduser --system --uid 1001 runner-user
RUN chown -R runner-user:runner-group /app

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

COPY --from=pruner --chown=runner-user:runner-group /app/out/json/ .
# Copy entire node_modules from build stage (includes generated .prisma client and all @prisma runtime deps)
COPY --from=build --chown=runner-user:runner-group /app/node_modules ./node_modules
COPY --from=build --chown=runner-user:runner-group /app/packages/utils ./packages/utils
COPY --from=build --chown=runner-user:runner-group /app/packages/monitabits-kubb ./packages/monitabits-kubb
COPY --from=build --chown=runner-user:runner-group /app/apps/monitabits-api ./apps/monitabits-api
COPY --from=build --chown=runner-user:runner-group /app/apps/monitabits-api/prisma ./apps/monitabits-api/prisma

USER runner-user
CMD ["bun", "run", "./apps/monitabits-api/dist/index.js"]