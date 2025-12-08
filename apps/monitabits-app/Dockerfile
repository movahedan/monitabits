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
RUN turbo prune --scope=monitabits-app --docker

FROM turbo AS installer
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/json/ .
RUN bun install --ignore-scripts

FROM turbo AS build
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/ .
RUN bun run build --filter=monitabits-app

FROM oven/bun:1.3.3-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 runner-group && adduser --system --uid 1001 runner-user

ARG MODE=755
ARG OWNER_MODE=765
COPY --from=pruner --chown=runner-user:runner-group /app/out/json/ .
COPY --from=installer --chown=runner-user:runner-group /app/node_modules ./node_modules
COPY --from=build --chown=runner-user:runner-group --chmod=${MODE} /app/packages/ui ./packages/ui
COPY --from=build --chown=runner-user:runner-group --chmod=${MODE} /app/packages/utils ./packages/utils
COPY --from=build --chown=runner-user:runner-group --chmod=${OWNER_MODE} /app/apps/monitabits-app/.next ./apps/monitabits-app/.next
COPY --from=build --chown=runner-user:runner-group --chmod=${MODE} /app/apps/monitabits-app/public ./apps/monitabits-app/public
COPY --from=build --chown=runner-user:runner-group --chmod=${MODE} /app/apps/monitabits-app/next.config.ts ./apps/monitabits-app/next.config.ts
COPY --from=build --chown=runner-user:runner-group --chmod=${MODE} /app/packages/monitabits-kubb ./packages/monitabits-kubb

USER runner-user
WORKDIR /app/apps/monitabits-app
CMD ["bun", "run", "../../node_modules/.bin/next", "start"]