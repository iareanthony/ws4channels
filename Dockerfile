FROM node:24-trixie-slim

ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true

RUN apt-get update && \
    apt-get full-upgrade -y && \
    apt-get install -y --no-install-recommends \
      chromium \
      ffmpeg \
      ca-certificates \
      dumb-init && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

RUN mkdir -p /app/output /app/music /app/logo && \
    chown -R node:node /app

USER node

RUN npm test

EXPOSE 9798

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
