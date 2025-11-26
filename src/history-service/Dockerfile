FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat dumb-init

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

FROM base AS deps-dev
COPY package*.json ./
RUN npm ci && \
    npm cache clean --force

FROM base AS build
COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

RUN npm run build

RUN rm -rf src tests *.md

FROM base AS development
ENV NODE_ENV=development

COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

FROM node:20-alpine AS production
ENV NODE_ENV=production

WORKDIR /app

RUN apk add --no-cache dumb-init

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/prisma ./prisma
COPY --chown=nodejs:nodejs package*.json ./

RUN npx prisma generate

RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/main.js"]
