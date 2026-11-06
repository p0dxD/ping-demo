FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG GIT_SHA=""
ENV GIT_SHA=$GIT_SHA NEXT_TELEMETRY_DISABLED=1
RUN npm run build --if-present && npm prune --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=builder --chown=node:node /app ./
USER node
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["npm", "start"]
