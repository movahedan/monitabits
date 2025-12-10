FROM oven/bun:1.3.3-alpine AS turbo
RUN bun install -g turbo@2.5.8

FROM turbo AS pruner
WORKDIR /app
COPY ./apps ./apps
COPY ./packages ./packages
COPY ./package.json ./bun.lock ./
COPY ./bunfig.toml ./bunfig.toml
COPY ./turbo.json ./turbo.json
RUN turbo prune --scope=monitabits-api --docker

FROM turbo AS installer
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/bunfig.toml ./bunfig.toml

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
RUN bun install

FROM turbo AS build
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/ .

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
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
COPY --from=build --chown=runner-user:runner-group /app/node_modules ./node_modules
COPY --from=build --chown=runner-user:runner-group /app/packages/utils ./packages/utils
COPY --from=build --chown=runner-user:runner-group /app/packages/typescript-config ./packages/typescript-config
COPY --from=build --chown=runner-user:runner-group /app/packages/monitabits-kubb ./packages/monitabits-kubb
COPY --from=build --chown=runner-user:runner-group /app/apps/monitabits-api ./apps/monitabits-api
COPY --from=build --chown=runner-user:runner-group /app/apps/monitabits-api/prisma ./apps/monitabits-api/prisma

USER runner-user
CMD ["bun", "run", "./apps/monitabits-api/dist/index.js"]