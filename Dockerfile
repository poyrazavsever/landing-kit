# syntax=docker/dockerfile:1
# landing-kit: one container, all customers. Data lives in /data (SQLite + uploads + guides).

FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Build tools only in this stage (fallback if no better-sqlite3 prebuild matches).
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Builds the React admin panel (admin/ -> public/admin) with the dev dependencies.
FROM node:22-bookworm-slim AS admin
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm cache clean --force
COPY admin ./admin
RUN npm run build:admin

FROM node:22-bookworm-slim
# Set WITH_PDF=false for a smaller image without the PDF guide generator.
ARG WITH_PDF=true
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
RUN if [ "$WITH_PDF" = "true" ]; then \
      npx playwright install --with-deps --only-shell chromium \
      && apt-get update && apt-get install -y --no-install-recommends fonts-dejavu-core fonts-liberation \
      && rm -rf /var/lib/apt/lists/*; \
    fi

COPY . .
COPY --from=admin /app/public/admin ./public/admin
RUN chmod +x deploy/docker-entrypoint.sh && mkdir -p /data && chown -R node:node /data

EXPOSE 3000
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["deploy/docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
